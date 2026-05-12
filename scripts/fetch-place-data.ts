import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const BRANCH_ID = '6f5ccd78-3bce-4914-ae0b-c300d20a8a2c'
const PLACE_ID  = 'ChIJp4q6Qz_BdkARrVJl4rw0NgQ'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Idempotency check
  const { data: branch, error: fetchErr } = await supabase
    .from('branches')
    .select('id, google_maps_url')
    .eq('id', BRANCH_ID)
    .single()

  if (fetchErr) throw new Error(`Branch fetch failed: ${fetchErr.message}`)

  if (branch?.google_maps_url) {
    console.log('Veriler zaten mevcut, işlem yapılmadı.')
    process.exit(0)
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is not set in .env.local')

  // Places API (New) — v1
  const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=tr`
  const fields = [
    'displayName',
    'regularOpeningHours',
    'formattedAddress',
    'nationalPhoneNumber',
    'googleMapsUri',
    'rating',
  ].join(',')

  console.log('Places API (New) çağrılıyor...')
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fields,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Places API HTTP ${res.status}: ${body}`)
  }

  const r = await res.json()

  // Normalize opening_hours to match legacy shape used by the UI
  const opening_hours = r.regularOpeningHours
    ? {
        open_now:     r.regularOpeningHours.openNow      ?? null,
        weekday_text: r.regularOpeningHours.weekdayDescriptions ?? [],
        periods:      r.regularOpeningHours.periods       ?? [],
      }
    : null

  const updateData = {
    address:         r.formattedAddress      ?? null,
    phone:           r.nationalPhoneNumber   ?? null,
    google_maps_url: r.googleMapsUri         ?? null,
    google_rating:   r.rating                ?? null,
    opening_hours,
  }

  const { error: updateErr } = await supabase
    .from('branches')
    .update(updateData)
    .eq('id', BRANCH_ID)

  if (updateErr) throw new Error(`Güncelleme hatası: ${updateErr.message}`)

  console.log('\n✅ Veriler kaydedildi:')
  console.log('  Adres        :', updateData.address)
  console.log('  Telefon      :', updateData.phone)
  console.log('  Rating       :', updateData.google_rating)
  console.log('  Google Maps  :', updateData.google_maps_url)
  console.log('  Çalışma saat.:', opening_hours?.weekday_text?.length
    ? `${opening_hours.weekday_text.length} gün`
    : 'yok')
}

main().catch(err => {
  console.error('❌ Hata:', err.message)
  process.exit(1)
})

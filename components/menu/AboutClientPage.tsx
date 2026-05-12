'use client'

import { useLang, T } from '@/lib/menu/LanguageContext'
import MenuHeader from './MenuHeader'

const PLACE_ID = 'ChIJp4q6Qz_BdkARrVJl4rw0NgQ'
const LOGO_URL = 'https://tdzfbxxzbnvsknsoeukw.supabase.co/storage/v1/object/public/logos/niyokki-logo.png'

interface OpeningHours {
  open_now: boolean | null
  weekday_text: string[]
}

interface Props {
  restaurantSlug: string
  branchSlug: string
  branchId: string
  restaurantName: string
  branchName: string
  address: string | null
  phone: string | null
  google_maps_url: string | null
  google_rating: number | null
  opening_hours: OpeningHours | null
}

function todayIndex() { return (new Date().getDay() + 6) % 7 }

export default function AboutClientPage({
  restaurantSlug, branchSlug, branchId,
  restaurantName, branchName,
  address, phone, google_maps_url, opening_hours,
}: Props) {
  const { lang } = useLang()
  const t = T[lang]
  const todayIdx = todayIndex()
  const isOpen = opening_hours?.open_now

  const directionsUrl = address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&destination_place_id=${PLACE_ID}`
    : google_maps_url ?? '#'

  const mapEmbedUrl = address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&hl=${lang}`
    : null

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <MenuHeader
        mode="back"
        restaurantSlug={restaurantSlug}
        branchSlug={branchSlug}
        branchId={branchId}
        backHref={`/${restaurantSlug}/${branchSlug}`}
      />

      <div style={{ paddingTop: 52 }}>

        {/* ── Hero banner ── */}
        <div
          style={{
            height: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt="Niyokki"
            style={{
              width: 100,
              height: 'auto',
              objectFit: 'contain',
              filter: 'var(--logo-filter)',
            }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
            Doğal Makarna Evi
          </p>
        </div>

        {/* ── Content: mobile single-col, desktop 2-col ── */}
        <div
          style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 32px' }}
          className="md:max-w-none"
        >
          {/* Outer wrapper switches to 2-col on desktop */}
          <div className="md:grid md:grid-cols-2 md:gap-6 md:max-w-4xl md:mx-auto">

            {/* ── Left: cards ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {address && (
                <Card title={t.address}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{address}</p>
                  {google_maps_url && (
                    <a
                      href={google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 12, fontWeight: 600, color: 'var(--niyokki-red)', textDecoration: 'none' }}
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t.openInMaps}
                    </a>
                  )}
                </Card>
              )}

              {phone && (
                <Card title={t.phone}>
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none' }}
                  >
                    {phone}
                  </a>
                </Card>
              )}

              {opening_hours?.weekday_text?.length ? (
                <Card
                  title={t.workingHours}
                  badge={
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: isOpen ? 'rgba(45,122,45,0.22)' : 'rgba(196,30,42,0.22)',
                      color: isOpen ? '#4ade80' : '#f87171',
                    }}>
                      {isOpen ? t.openNow : t.closedNow}
                    </span>
                  }
                >
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {opening_hours.weekday_text.map((line, i) => {
                      const colonIdx = line.indexOf(': ')
                      const day   = colonIdx > -1 ? line.slice(0, colonIdx) : line
                      const hours = colonIdx > -1 ? line.slice(colonIdx + 2) : ''
                      const isToday = i === todayIdx
                      return (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13,
                          color: isToday ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontWeight: isToday ? 600 : 400 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 108 }}>
                            {isToday && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--niyokki-red)', flexShrink: 0 }} />}
                            {day}
                          </span>
                          <span>{hours}</span>
                        </li>
                      )
                    })}
                  </ul>
                </Card>
              ) : null}

              {/* Directions button — full width on mobile, max 300px on desktop */}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="md:max-w-[300px]"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 4,
                  width: '100%',
                  height: 52,
                  background: 'var(--niyokki-red)',
                  borderRadius: 12,
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 16l4.553-2.276A1 1 0 0021 19.882V9.118a1 1 0 00-.553-.894L15 6m0 17V6m0 0L9 3" />
                </svg>
                {t.getDirections}
              </a>
            </div>

            {/* ── Right: map (desktop side-by-side, mobile below) ── */}
            {mapEmbedUrl && (
              <div
                className="mt-3 md:mt-0"
                style={{ borderRadius: 12, overflow: 'hidden', height: 'min(420px, 70vw)', minHeight: 220 }}
              >
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block', filter: 'invert(90%) hue-rotate(180deg)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 12,
      padding: 16,
      borderLeft: '3px solid var(--niyokki-green)',  /* green, not red */
      border: '1px solid var(--border)',
      borderLeftWidth: 3,
      borderLeftColor: 'var(--niyokki-green)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--niyokki-green)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </p>
        {badge}
      </div>
      {children}
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { askMenuAssistant } from '@/lib/ai/menuAssistant'
import { publicDb } from '@/lib/supabase/public'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ restaurant: string; branch: string }> }
) {
  const { restaurant: restaurantSlug, branch: branchSlug } = await params

  let message: string
  let lang: 'tr' | 'en' = 'tr'
  try {
    const body = await req.json()
    message = body?.message
    if (body?.lang === 'en') lang = 'en'
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const { data: restaurant } = await publicDb
    .from('restaurants')
    .select('id, name')
    .eq('slug', restaurantSlug)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const { data: branch } = await publicDb
    .from('branches')
    .select('id')
    .eq('restaurant_id', restaurant.id)
    .eq('slug', branchSlug)
    .single()

  if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 })

  // Subcategories for this branch — include category_id for product→category mapping
  const { data: subcats } = await publicDb
    .from('subcategories')
    .select('id, category_id, categories!inner(branch_id)')
    .eq('categories.branch_id', branch.id)

  const subcatIds = (subcats ?? []).map((s: any) => s.id) as string[]

  if (!subcatIds.length) {
    return NextResponse.json({ products: [], message: 'Menüde henüz ürün bulunmuyor.' })
  }

  // Map: subcategory_id → category_id
  const subcatToCat = new Map<string, string>(
    (subcats ?? []).map((s: any) => [s.id as string, s.category_id as string])
  )

  // Products — include subcategory_id so we can resolve category_id after Gemini responds
  const { data: products } = await publicDb
    .from('products')
    .select('id, name_tr, name_en, description_tr, price, currency, image_url, tags, subcategory_id')
    .in('subcategory_id', subcatIds)
    .eq('is_active', true)

  // Map: product_id → subcategory_id (for enrichment below)
  const productToSubcat = new Map<string, string>(
    (products ?? []).map((p: any) => [p.id as string, p.subcategory_id as string])
  )

  try {
    const response = await askMenuAssistant(message.trim(), products ?? [], restaurant.name, lang)

    // Enrich each returned product with category_id
    const enriched = response.products.map(p => ({
      ...p,
      category_id: subcatToCat.get(productToSubcat.get(p.id) ?? '') ?? null,
    }))

    return NextResponse.json({ ...response, products: enriched })
  } catch (err: any) {
    const msg: string = err?.message ?? String(err)
    console.error('[AI route] error:', msg)

    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
      return NextResponse.json(
        { products: [], message: 'AI asistan şu an yoğun, lütfen birkaç saniye sonra tekrar deneyin.' },
        { status: 429 }
      )
    }
    return NextResponse.json(
      { products: [], message: 'AI asistan şu an yanıt veremiyor. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}

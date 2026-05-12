import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

interface PardonProduct {
  category_id: number
  category_title: string
  subcategory_title: string
  product_id: number
  product_title: string
  price: number
  currency: string
  description_plain: string
  description_html: string
  image_url: string
  product_url: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const dataDir = path.join(__dirname, '../data')
  const trData: PardonProduct[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'pardon_menu_niyokki-elazig_tr.json'), 'utf-8')
  )
  const enData: PardonProduct[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'pardon_menu_niyokki-elazig_en.json'), 'utf-8')
  )

  // Build EN lookup by product_id
  const enMap = new Map<number, PardonProduct>()
  for (const item of enData) {
    enMap.set(item.product_id, item)
  }

  // ── 1. Upsert restaurant ──
  const { data: restaurant, error: rErr } = await supabase
    .from('restaurants')
    .upsert({ name: 'Niyokki', slug: 'niyokki' }, { onConflict: 'slug' })
    .select()
    .single()
  if (rErr) throw new Error(`Restaurant upsert failed: ${rErr.message}`)
  console.log('✓ Restaurant:', restaurant.id)

  // ── 2. Upsert branch ──
  const { data: branch, error: bErr } = await supabase
    .from('branches')
    .upsert(
      {
        restaurant_id: restaurant.id,
        name: 'Elazığ',
        slug: 'elazig',
        address: 'Elazığ, Türkiye',
        is_active: true,
      },
      { onConflict: 'restaurant_id,slug' }
    )
    .select()
    .single()
  if (bErr) throw new Error(`Branch upsert failed: ${bErr.message}`)
  console.log('✓ Branch:', branch.id)

  // ── 3. Group by category ──
  const categoryMap = new Map<number, { tr: PardonProduct; en: PardonProduct | undefined; products: PardonProduct[] }>()
  for (const item of trData) {
    if (!categoryMap.has(item.category_id)) {
      categoryMap.set(item.category_id, {
        tr: item,
        en: enMap.get(item.product_id),
        products: [],
      })
    }
    categoryMap.get(item.category_id)!.products.push(item)
  }

  let categoryOrder = 0
  for (const [catId, catData] of categoryMap.entries()) {
    // Find EN category title via first product in this category from EN data
    const firstEnProduct = enData.find(p => p.category_id === catId)

    // ── 4. Upsert category ──
    const { data: category, error: cErr } = await supabase
      .from('categories')
      .upsert(
        {
          branch_id: branch.id,
          name_tr: catData.tr.category_title,
          name_en: firstEnProduct?.category_title ?? catData.tr.category_title,
          display_order: categoryOrder++,
          is_active: true,
          cover_type: 'image',
        },
        { onConflict: 'branch_id,name_tr' }
      )
      .select()
      .single()
    if (cErr) throw new Error(`Category upsert failed (${catData.tr.category_title}): ${cErr.message}`)
    console.log(`  ✓ Category: ${category.name_tr}`)

    // ── 5. Group by subcategory within category ──
    const subcatMap = new Map<string, PardonProduct[]>()
    for (const product of catData.products) {
      if (!subcatMap.has(product.subcategory_title)) {
        subcatMap.set(product.subcategory_title, [])
      }
      subcatMap.get(product.subcategory_title)!.push(product)
    }

    let subcatOrder = 0
    for (const [subcatTitleTr, subcatProducts] of subcatMap.entries()) {
      const firstSubcatEn = enData.find(
        p => p.category_id === catId && p.subcategory_title !== subcatTitleTr
          ? false
          : p.category_id === catId
      )
      const enSubcatTitle = enData.find(
        p => p.category_id === catId && p.subcategory_title === subcatTitleTr
      )

      // ── 6. Upsert subcategory ──
      const { data: subcategory, error: scErr } = await supabase
        .from('subcategories')
        .upsert(
          {
            category_id: category.id,
            name_tr: subcatTitleTr,
            name_en: enSubcatTitle
              ? enData.find(p => p.product_id === subcatProducts[0].product_id)?.subcategory_title ?? subcatTitleTr
              : subcatTitleTr,
            display_order: subcatOrder++,
          },
          { onConflict: 'category_id,name_tr' }
        )
        .select()
        .single()
      if (scErr) throw new Error(`Subcategory upsert failed (${subcatTitleTr}): ${scErr.message}`)

      // ── 7. Upsert products ──
      const productRows = subcatProducts.map((p, idx) => {
        const enProduct = enMap.get(p.product_id)
        return {
          subcategory_id: subcategory.id,
          external_id: p.product_id,
          name_tr: p.product_title,
          name_en: enProduct?.product_title ?? p.product_title,
          description_tr: p.description_plain || null,
          description_en: enProduct?.description_plain || null,
          price: p.price,
          currency: p.currency || '₺',
          image_url: p.image_url || null,
          is_active: true,
          is_featured: false,
          display_order: idx,
          tags: [],
        }
      })

      const { error: pErr } = await supabase
        .from('products')
        .upsert(productRows, { onConflict: 'subcategory_id,external_id' })
      if (pErr) throw new Error(`Products upsert failed: ${pErr.message}`)
    }
  }

  console.log('\n✅ Import complete!')
}

main().catch(err => {
  console.error('❌ Import failed:', err.message)
  process.exit(1)
})

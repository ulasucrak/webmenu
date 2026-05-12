import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { publicDb } from './public'
import { createClient } from './server'

const _cachedGetRestaurant = unstable_cache(
  async (slug: string) => {
    const { data } = await publicDb
      .from('restaurants')
      .select('id, name, slug, logo_url, primary_color')
      .eq('slug', slug)
      .single()
    return data
  },
  ['restaurant'],
  { revalidate: 300, tags: ['restaurant'] }
)

const _cachedGetBranch = unstable_cache(
  async (restaurantId: string, slug: string) => {
    const { data } = await publicDb
      .from('branches')
      .select('id, name, slug, address, phone, google_maps_url, google_rating, opening_hours')
      .eq('restaurant_id', restaurantId)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    return data
  },
  ['branch'],
  { revalidate: 300, tags: ['restaurant'] }
)

// cache() wraps the already-cross-cached fn for within-request deduplication
export const getRestaurant = cache(_cachedGetRestaurant)
export const getBranch = cache(_cachedGetBranch)

// Cross-request cache — results stored in Next.js cache for 60s
// publicDb has no cookies dependency so unstable_cache works correctly here
export const getCachedCategories = unstable_cache(
  async (branchId: string) => {
    const { data } = await publicDb
      .from('categories')
      .select(`
        id, name_tr, name_en, description_tr, cover_url, cover_type,
        subcategories ( products ( id ) )
      `)
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    return (data ?? []).map((c: any) => ({
      id: c.id as string,
      name_tr: c.name_tr as string,
      name_en: c.name_en as string | null,
      description_tr: c.description_tr as string | null,
      cover_url: c.cover_url as string | null,
      cover_type: c.cover_type as string,
      productCount: (c.subcategories ?? []).reduce(
        (sum: number, s: any) => sum + (s.products?.length ?? 0),
        0
      ) as number,
    }))
  },
  ['categories'],
  { revalidate: 60, tags: ['menu'] }
)

export const getCachedCategory = unstable_cache(
  async (categoryId: string) => {
    const { data } = await publicDb
      .from('categories')
      .select('id, name_tr, name_en, description_tr, cover_url, cover_type, branch_id')
      .eq('id', categoryId)
      .single()
    return data
  },
  ['category'],
  { revalidate: 60, tags: ['menu'] }
)

export const getCachedCategoryWithProducts = unstable_cache(
  async (categoryId: string) => {
    const { data } = await publicDb
      .from('subcategories')
      .select(`
        id, name_tr, name_en, display_order,
        products (
          id, name_tr, name_en, description_tr, description_en,
          price, currency, image_url, tags, is_featured, display_order
        )
      `)
      .eq('category_id', categoryId)
      .eq('products.is_active', true)
      .order('display_order', { ascending: true })

    return (data ?? []).map(s => ({
      ...s,
      products: ((s.products ?? []) as any[]).sort(
        (a, b) => a.display_order - b.display_order
      ),
    }))
  },
  ['category-products'],
  { revalidate: 60, tags: ['menu'] }
)

// Auth-sensitive version for admin reads — uses cookie-based client, no cross-request cache
export async function getAuthedClient() {
  return createClient()
}

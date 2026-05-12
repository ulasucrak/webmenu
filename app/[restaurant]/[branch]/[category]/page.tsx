import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ProductList from '@/components/menu/ProductList'
import {
  getRestaurant,
  getBranch,
  getCachedCategory,
  getCachedCategoryWithProducts,
} from '@/lib/supabase/queries'

interface PageProps {
  params: Promise<{ restaurant: string; branch: string; category: string }>
}

export default async function CategoryPage({ params }: PageProps) {
  const { restaurant: restaurantSlug, branch: branchSlug, category: categoryId } = await params

  // All independent lookups fire in parallel
  const [restaurant, category, subcategories] = await Promise.all([
    getRestaurant(restaurantSlug),
    getCachedCategory(categoryId),
    getCachedCategoryWithProducts(categoryId),
  ])

  if (!restaurant) notFound()
  if (!category) notFound()

  // Verify category belongs to this restaurant's branch (security check)
  const branch = await getBranch(restaurant.id, branchSlug)
  if (!branch || category.branch_id !== branch.id) notFound()

  return (
    <div className="min-h-screen bg-black">
      {/* Category banner */}
      <div className="relative h-40 md:h-52 bg-zinc-900">
        {category.cover_url && (
          category.cover_type === 'video' ? (
            <video
              src={category.cover_url}
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={category.cover_url}
              alt={category.name_tr}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          )
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <Link
          href={`/${restaurantSlug}/${branchSlug}`}
          className="absolute top-4 left-4 flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Geri
        </Link>

        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-white text-2xl font-bold uppercase tracking-wide">
            {category.name_tr}
          </h1>
          {category.description_tr && (
            <p className="text-white/60 text-sm mt-1">{category.description_tr}</p>
          )}
        </div>
      </div>

      <ProductList subcategories={subcategories as any} />
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { restaurant: restaurantSlug, category: categoryId } = await params
  const [restaurant, category] = await Promise.all([
    getRestaurant(restaurantSlug),
    getCachedCategory(categoryId),
  ])
  return {
    title: category ? `${category.name_tr} — ${restaurant?.name ?? ''}` : 'Menü',
  }
}

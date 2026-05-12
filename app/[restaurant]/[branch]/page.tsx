import { notFound } from 'next/navigation'
import { getRestaurant, getBranch, getCachedCategories } from '@/lib/supabase/queries'
import MenuClientPage from '@/components/menu/MenuClientPage'

interface PageProps {
  params: Promise<{ restaurant: string; branch: string }>
}

export default async function BranchPage({ params }: PageProps) {
  const { restaurant: restaurantSlug, branch: branchSlug } = await params

  const restaurant = await getRestaurant(restaurantSlug)
  if (!restaurant) notFound()

  const branch = await getBranch(restaurant.id, branchSlug)
  if (!branch) notFound()

  const categories = await getCachedCategories(branch.id)

  return (
    <MenuClientPage
      restaurant={{ name: restaurant.name }}
      branch={{
        id:             branch.id,
        name:           branch.name,
        slug:           branch.slug,
        address:        (branch as any).address         ?? null,
        phone:          (branch as any).phone           ?? null,
        google_maps_url:(branch as any).google_maps_url ?? null,
        google_rating:  (branch as any).google_rating   ?? null,
        opening_hours:  (branch as any).opening_hours   ?? null,
      }}
      categories={categories}
      restaurantSlug={restaurantSlug}
      branchSlug={branchSlug}
    />
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { restaurant: restaurantSlug } = await params
  const restaurant = await getRestaurant(restaurantSlug)
  return { title: restaurant ? `${restaurant.name} Menü` : 'Menü' }
}

import { notFound } from 'next/navigation'
import { getRestaurant, getBranch } from '@/lib/supabase/queries'
import AboutClientPage from '@/components/menu/AboutClientPage'

interface PageProps {
  params: Promise<{ restaurant: string; branch: string }>
}

export default async function AboutPage({ params }: PageProps) {
  const { restaurant: restaurantSlug, branch: branchSlug } = await params

  const restaurant = await getRestaurant(restaurantSlug)
  if (!restaurant) notFound()

  const branch = await getBranch(restaurant.id, branchSlug)
  if (!branch) notFound()

  return (
    <AboutClientPage
      restaurantSlug={restaurantSlug}
      branchSlug={branchSlug}
      branchId={branch.id}
      restaurantName={restaurant.name}
      branchName={branch.name}
      address={(branch as any).address ?? null}
      phone={(branch as any).phone ?? null}
      google_maps_url={(branch as any).google_maps_url ?? null}
      google_rating={(branch as any).google_rating ?? null}
      opening_hours={(branch as any).opening_hours ?? null}
    />
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { restaurant: restaurantSlug } = await params
  const restaurant = await getRestaurant(restaurantSlug)
  return { title: restaurant ? `${restaurant.name} — Hakkımızda` : 'Hakkımızda' }
}

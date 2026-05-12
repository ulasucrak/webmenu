import { createClient } from '@/lib/supabase/server'
import RestaurantsClient from './RestaurantsClient'

export default async function RestaurantsPage() {
  const supabase = await createClient()

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select(`
      id, name, slug, logo_url, primary_color, created_at,
      branches ( id, name, slug, is_active )
    `)
    .order('created_at', { ascending: false })

  const { data: adminUsers } = await supabase
    .from('admin_users')
    .select('id, restaurant_id, role')

  return <RestaurantsClient restaurants={restaurants ?? []} adminUsers={adminUsers ?? []} />
}

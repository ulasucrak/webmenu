import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('restaurant_id')
    .eq('id', user!.id)
    .single()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, primary_color')
    .eq('id', adminUser?.restaurant_id)
    .single()

  return <SettingsClient restaurant={restaurant} />
}

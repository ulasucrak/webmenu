import { createClient } from '@/lib/supabase/server'
import BranchesClient from './BranchesClient'

export default async function BranchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('restaurant_id')
    .eq('id', user!.id)
    .single()

  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, slug, address, phone, is_active')
    .eq('restaurant_id', adminUser?.restaurant_id)
    .order('name')

  return <BranchesClient branches={branches ?? []} restaurantId={adminUser?.restaurant_id} />
}

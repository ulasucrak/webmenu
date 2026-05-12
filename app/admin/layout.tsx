import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import AdminClientLayout from './AdminClientLayout'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  const [restaurantRes, branchesRes] = await Promise.all([
    supabase
      .from('restaurants')
      .select('id, name, slug')
      .eq('id', adminUser?.restaurant_id)
      .single(),
    supabase
      .from('branches')
      .select('id, name, slug, is_active')
      .eq('restaurant_id', adminUser?.restaurant_id)
      .order('name'),
  ])

  return (
    <Suspense>
      <AdminClientLayout
        branches={branchesRes.data ?? []}
        userEmail={user.email ?? ''}
        restaurantName={restaurantRes.data?.name ?? ''}
        restaurantSlug={restaurantRes.data?.slug ?? ''}
      >
        {children}
      </AdminClientLayout>
    </Suspense>
  )
}

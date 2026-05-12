import { createClient } from '@/lib/supabase/server'

export default async function SuperAdminDashboard() {
  const supabase = await createClient()

  const [restaurants, branches, products, admins] = await Promise.all([
    supabase.from('restaurants').select('id', { count: 'exact', head: true }),
    supabase.from('branches').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('admin_users').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Restoranlar', value: restaurants.count ?? 0 },
    { label: 'Şubeler', value: branches.count ?? 0 },
    { label: 'Ürünler', value: products.count ?? 0 },
    { label: 'Admin Kullanıcılar', value: admins.count ?? 0 },
  ]

  return (
    <div className="p-8">
      <h1 className="text-white text-2xl font-bold mb-8">Superadmin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-zinc-900 rounded-xl p-6 border border-white/10">
            <p className="text-white/50 text-sm">{s.label}</p>
            <p className="text-white text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

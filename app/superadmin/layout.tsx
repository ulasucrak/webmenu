import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'superadmin') redirect('/admin')

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <aside className="w-56 bg-zinc-900 border-r border-white/10 flex flex-col">
        <div className="px-4 py-5 border-b border-white/10">
          <p className="text-amber-400 font-bold text-sm">Superadmin</p>
          <p className="text-white/40 text-xs truncate mt-0.5">{user.email}</p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <Link href="/superadmin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            Dashboard
          </Link>
          <Link href="/superadmin/restaurants" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            Restoranlar
          </Link>
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            Admin Panel
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

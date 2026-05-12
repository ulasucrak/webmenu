'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BranchProvider, useBranch, type Branch } from '@/lib/admin/BranchContext'

interface Props {
  children: React.ReactNode
  branches: Branch[]
  userEmail: string
  restaurantName: string
  restaurantSlug: string
}

const NAV = [
  { href: '/admin', label: 'Dashboard', shortLabel: 'Home', exact: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/products', label: 'Ürünler', shortLabel: 'Ürünler', exact: false, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/admin/categories', label: 'Kategoriler', shortLabel: 'Kateg.', exact: false, icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { href: '/admin/branches', label: 'Şubeler', shortLabel: 'Şubeler', exact: false, icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { href: '/admin/settings', label: 'Ayarlar', shortLabel: 'Ayarlar', exact: false, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
]

function BranchSelector({ fullWidth = false }: { fullWidth?: boolean }) {
  const { branches, branchId, setBranchId } = useBranch()
  if (!branches.length) return null
  return (
    <select
      value={branchId ?? ''}
      onChange={e => setBranchId(e.target.value)}
      className={`bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-white/40 cursor-pointer ${fullWidth ? 'w-full' : 'min-w-32'}`}
    >
      {!branchId && <option value="" disabled>Seçin...</option>}
      {branches.map(b => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  )
}

function SidebarNavLink({ href, label, icon, exact }: { href: string; label: string; icon: string; exact: boolean }) {
  const pathname = usePathname()
  const { branchId } = useBranch()
  const active = exact ? pathname === href : pathname.startsWith(href)
  const fullHref = branchId ? `${href}?branch=${branchId}` : href

  return (
    <Link
      href={fullHref}
      title={label}
      className={`group relative flex items-center gap-3 py-2.5 rounded-lg text-sm transition-colors
        px-3 justify-start lg:justify-start
        md:px-0 md:justify-center lg:px-3
        ${active ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
    >
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d={icon} />
      </svg>
      {/* Label: visible always on mobile/desktop sidebar, hidden on tablet */}
      <span className="block md:hidden lg:block">{label}</span>

      {/* Tablet tooltip */}
      <span className="
        absolute left-full ml-3 px-2 py-1 rounded bg-zinc-700 text-white text-xs whitespace-nowrap
        opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50
        hidden md:block lg:hidden
      ">
        {label}
      </span>
    </Link>
  )
}

function BottomNav() {
  const pathname = usePathname()
  const { branchId } = useBranch()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-zinc-900 border-t border-white/10 flex md:hidden safe-bottom">
      {NAV.map(({ href, shortLabel, icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        const fullHref = branchId ? `${href}?branch=${branchId}` : href
        return (
          <Link
            key={href}
            href={fullHref}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors
              ${active ? 'text-[#c41e2a]' : 'text-white/35 hover:text-white/60'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.2 : 1.5} d={icon} />
            </svg>
            <span className="text-[10px] leading-none tracking-wide">{shortLabel}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function NoBranchGuard({ children }: { children: React.ReactNode }) {
  const { branchId, branches } = useBranch()
  if (branches.length > 0 && !branchId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
          <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        </div>
        <div>
          <p className="text-white font-medium">Lütfen bir şube seçin</p>
          <p className="text-white/40 text-sm mt-1">Verileri görmek için yukarıdan şube seçin.</p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

function AdminShell({ children, userEmail, restaurantName, restaurantSlug }: Omit<Props, 'branches'>) {
  const { branch } = useBranch()

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">

      {/* ── Top bar ── */}
      <header className="flex-shrink-0 bg-zinc-900 border-b border-white/10">
        {/* Mobile header */}
        <div className="flex md:hidden items-center gap-2 px-4 h-12">
          <span className="text-white font-bold text-sm tracking-wide flex-1 truncate">{restaurantName}</span>
          <BranchSelector />
          <form action="/api/auth/signout" method="POST">
            <button type="submit" title="Çıkış" className="p-1.5 text-white/40 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>

        {/* Desktop / tablet header */}
        <div className="hidden md:flex items-center gap-4 px-4 h-12">
          <span className="text-white font-bold text-sm tracking-wide">{restaurantName}</span>
          <div className="flex-1" />
          <span className="text-white/30 text-xs">Şube</span>
          <BranchSelector />
          {branch && (
            <a href={`/${restaurantSlug}/${branch.slug}`} target="_blank" rel="noreferrer"
              className="text-xs text-white/30 hover:text-white/60 transition-colors hidden md:block">
              Menüyü Gör →
            </a>
          )}
          <span className="text-white/20 text-xs hidden lg:block truncate max-w-40">{userEmail}</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — hidden on mobile, icon-only on tablet, full on desktop */}
        <aside className="hidden md:flex md:w-12 lg:w-48 bg-zinc-900 border-r border-white/10 flex-col flex-shrink-0 transition-all duration-200">
          <nav className="flex-1 px-1 py-3 space-y-0.5 lg:px-2">
            {NAV.map(item => (
              <SidebarNavLink key={item.href} {...item} />
            ))}
          </nav>

          <div className="px-1 pb-4 border-t border-white/10 pt-2 lg:px-2">
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                title="Çıkış"
                className="w-full flex items-center gap-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors
                  px-0 justify-center md:justify-center lg:px-3 lg:justify-start"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden lg:block">Çıkış</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-auto flex flex-col pb-16 md:pb-0 min-w-0">
          <NoBranchGuard>
            {children}
          </NoBranchGuard>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}

export default function AdminClientLayout({ children, branches, userEmail, restaurantName, restaurantSlug }: Props) {
  return (
    <BranchProvider branches={branches}>
      <AdminShell userEmail={userEmail} restaurantName={restaurantName} restaurantSlug={restaurantSlug}>
        {children}
      </AdminShell>
    </BranchProvider>
  )
}

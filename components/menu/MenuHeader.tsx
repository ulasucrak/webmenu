'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/menu/LanguageContext'
import { useTheme } from '@/lib/menu/ThemeContext'
import MenuDrawer from './MenuDrawer'

const LOGO_URL =
  'https://tdzfbxxzbnvsknsoeukw.supabase.co/storage/v1/object/public/logos/niyokki-logo.png'

interface Props {
  mode: 'drawer' | 'back'
  restaurantSlug: string
  branchSlug: string
  branchId: string
  backHref?: string
}

function MoonIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  )
}

export default function MenuHeader({ mode, restaurantSlug, branchSlug, branchId, backHref }: Props) {
  const { lang, setLang } = useLang()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isDark = theme === 'dark'

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{
          height: 52,
          background: 'var(--header-bg)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--header-border)',
          color: 'var(--header-text)',
        }}
      >
        {/* Left */}
        {mode === 'drawer' ? (
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-black/10"
            style={{ color: 'var(--header-text)' }}
            aria-label="Menüyü Aç"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => backHref ? router.push(backHref) : router.back()}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--header-text)' }}
            aria-label="Geri"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">{lang === 'tr' ? 'Geri' : 'Back'}</span>
          </button>
        )}

        {/* Center: logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_URL}
          alt="Niyokki"
          className="absolute left-1/2 -translate-x-1/2 h-8 w-auto object-contain md:h-9"
          style={{ filter: isDark ? 'brightness(0) invert(1)' : 'none' }}
        />

        {/* Right: lang toggle + theme toggle + search */}
        <div className="flex items-center gap-1.5">
          {/* TR / EN */}
          <div
            className="flex rounded-full overflow-hidden border"
            style={{ borderColor: 'var(--border)' }}
          >
            {(['tr', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors"
                style={{
                  background: lang === l ? 'var(--niyokki-red)' : 'transparent',
                  color: lang === l ? '#fff' : 'var(--header-text)',
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-black/10"
            style={{ color: 'var(--header-text)' }}
            aria-label={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

        </div>
      </header>

      {mode === 'drawer' && (
        <MenuDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          restaurantSlug={restaurantSlug}
          branchSlug={branchSlug}
          branchId={branchId}
        />
      )}
    </>
  )
}

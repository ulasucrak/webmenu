'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { publicDb } from '@/lib/supabase/public'
import { useLang, T } from '@/lib/menu/LanguageContext'
import { useTheme } from '@/lib/menu/ThemeContext'

const LOGO_URL =
  'https://tdzfbxxzbnvsknsoeukw.supabase.co/storage/v1/object/public/logos/niyokki-logo.png'

interface Category { id: string; name_tr: string; name_en: string | null }

interface Props {
  open: boolean
  onClose: () => void
  restaurantSlug: string
  branchSlug: string
  branchId: string
}

export default function MenuDrawer({ open, onClose, restaurantSlug, branchSlug, branchId }: Props) {
  const { lang } = useLang()
  const { theme, toggleTheme } = useTheme()
  const t = T[lang]
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loaded, setLoaded] = useState(false)
  const [hoveredCat, setHoveredCat] = useState<string | null>(null)
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!open || loaded) return
    publicDb
      .from('categories')
      .select('id, name_tr, name_en')
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        setCategories(data ?? [])
        setLoaded(true)
      })
  }, [open, loaded, branchId])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function navigate(href: string) {
    onClose()
    router.push(href)
  }

  const panelBg = isDark ? '#111111' : '#faf9f7'
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textPrimary = isDark ? '#ffffff' : '#1a1a1a'
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.6)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className="fixed top-0 left-0 z-[70] h-full flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: 'min(300px, 82vw)',
          background: panelBg,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: open ? '8px 0 40px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Header row: logo + theme toggle + close */}
        <div
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{ height: 52, borderBottom: `1px solid ${borderColor}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt="Niyokki"
            style={{
              height: 30,
              width: 'auto',
              objectFit: 'contain',
              filter: isDark ? 'brightness(0) invert(1)' : 'none',
            }}
          />
          <div className="flex items-center gap-1">
            {/* Theme toggle inside drawer */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: textSecondary }}
              aria-label="Tema değiştir"
            >
              {isDark ? (
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: textSecondary }}
              aria-label="Kapat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto py-2">

          {/* Hakkımızda — white text, info icon */}
          <button
            onClick={() => navigate(`/${restaurantSlug}/${branchSlug}/about`)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
            style={{ color: textPrimary }}
            onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-sm">{t.about}</span>
          </button>

          {/* Divider */}
          <div className="mx-4 my-1.5" style={{ borderBottom: `1px solid ${borderColor}` }} />

          {/* KATEGORİLER heading — green */}
          <p
            className="px-4 pt-3 pb-2 text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--niyokki-green)' }}
          >
            {t.categories}
          </p>

          {/* Category list */}
          {categories.map(cat => {
            const isHov = hoveredCat === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/${restaurantSlug}/${branchSlug}/${cat.id}`)}
                onMouseEnter={() => setHoveredCat(cat.id)}
                onMouseLeave={() => setHoveredCat(null)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-all text-sm"
                style={{
                  color: isHov ? textPrimary : textSecondary,
                  background: isHov ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') : 'transparent',
                  borderLeft: isHov ? '3px solid var(--niyokki-red)' : '3px solid transparent',
                  paddingLeft: isHov ? 13 : 16,
                }}
              >
                <span>{lang === 'en' ? (cat.name_en ?? cat.name_tr) : cat.name_tr}</span>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })}

          {!loaded && <p className="px-4 py-3 text-xs" style={{ color: textSecondary }}>Yükleniyor...</p>}
        </div>
      </div>
    </>
  )
}

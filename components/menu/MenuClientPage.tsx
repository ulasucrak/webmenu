'use client'

import { useLang, T } from '@/lib/menu/LanguageContext'
import CategoryCard from './CategoryCard'
import MenuHeader from './MenuHeader'

const HERO_VIDEO =
  'https://tdzfbxxzbnvsknsoeukw.supabase.co/storage/v1/object/public/categories/niyokki_main.mp4'

interface Category {
  id: string
  name_tr: string
  name_en: string | null
  description_tr: string | null
  cover_url: string | null
  cover_type: string
  productCount?: number
}

interface Props {
  restaurant: { name: string }
  branch: {
    id: string
    name: string
    slug: string
    address: string | null
    phone: string | null
    google_maps_url: string | null
    google_rating: number | null
    opening_hours: { open_now: boolean | null; weekday_text: string[] } | null
  }
  categories: Category[]
  restaurantSlug: string
  branchSlug: string
}

type Row =
  | { type: 'full'; items: [Category] }
  | { type: 'pair-6040' | 'pair-4060'; items: Category[] }

function buildRows(cats: Category[]): Row[] {
  const rows: Row[] = []
  let i = 0
  while (i < cats.length) {
    const pos = i % 6
    if (pos === 0 || pos === 3) {
      rows.push({ type: 'full', items: [cats[i]] })
      i++
    } else {
      const slice = cats.slice(i, Math.min(i + 2, cats.length))
      if (slice.length === 1) {
        rows.push({ type: 'full', items: [slice[0]] })
        i++
      } else {
        rows.push({ type: pos === 1 ? 'pair-6040' : 'pair-4060', items: slice })
        i += 2
      }
    }
  }
  return rows
}

export default function MenuClientPage({ branch, categories, restaurantSlug, branchSlug }: Props) {
  const { lang } = useLang()
  const t = T[lang]

  return (
    <>
      <MenuHeader
        mode="drawer"
        restaurantSlug={restaurantSlug}
        branchSlug={branchSlug}
        branchId={branch.id}
      />

      {/* ── HERO ── full viewport */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        <video
          src={HERO_VIDEO}
          autoPlay muted loop playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.52)' }} />

        {/* Centered text block */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 text-center"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
        >
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '4px',
            color: '#c41e2a',
            marginBottom: 16,
          }}>
            {t.tagline}
          </p>

          <p style={{
            fontSize: 'clamp(52px, 12vw, 72px)',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '6px',
            lineHeight: 1,
          }}>
            NİYOKKİ
          </p>

          <p style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '2px',
            marginTop: 8,
          }}>
            Doğal Makarna Evi
          </p>

          <p style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
            marginTop: 4,
          }}>
            {branch.name}
          </p>
        </div>

        {/* Bottom button */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 flex justify-center px-5"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 36px, 52px)' }}
        >
          <a
            href="#menu-categories"
            className="inline-flex items-center gap-2 text-white transition-transform active:scale-95"
            style={{
              background: 'var(--niyokki-red)',
              borderRadius: 24,
              padding: '12px 24px',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            {t.explore}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── CATEGORY GRID ── */}
      <section
        id="menu-categories"
        className="px-3 pt-14 pb-24 md:px-6 lg:px-8"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Section header */}
        <div style={{ maxWidth: 1200, margin: '0 auto 28px', textAlign: 'center' }}>
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}>
            <span style={{ display: 'block', width: 28, height: 1, background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
            {t.menuSection}
            <span style={{ display: 'block', width: 28, height: 1, background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          </p>
        </div>

        {categories.length > 0 ? (
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {buildRows(categories).map((row, rowIdx) => {
              if (row.type === 'full') {
                return (
                  <div key={rowIdx} className="mb-3">
                    <CategoryCard
                      category={row.items[0]}
                      href={`/${restaurantSlug}/${branchSlug}/${row.items[0].id}`}
                      lang={lang}
                      height={280}
                    />
                  </div>
                )
              }
              const cols = row.type === 'pair-6040' ? 'grid-cols-2 md:grid-cols-[3fr_2fr]' : 'grid-cols-2 md:grid-cols-[2fr_3fr]'
              return (
                <div key={rowIdx} className={`grid gap-3 mb-3 ${cols}`}>
                  {row.items.map(cat => (
                    <CategoryCard
                      key={cat.id}
                      category={cat}
                      href={`/${restaurantSlug}/${branchSlug}/${cat.id}`}
                      lang={lang}
                      height={220}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center py-24 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t.noCategories}
          </p>
        )}
      </section>
    </>
  )
}

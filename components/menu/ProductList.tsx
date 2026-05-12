'use client'

import { useState } from 'react'
import ProductCard from './ProductCard'
import { useLang } from '@/lib/menu/LanguageContext'

interface Subcategory {
  id: string
  name_tr: string
  name_en: string | null
  display_order: number
  products: Product[]
}

interface Product {
  id: string
  name_tr: string
  name_en: string | null
  description_tr: string | null
  description_en: string | null
  price: number
  currency: string
  image_url: string | null
  tags: string[]
  is_featured: boolean
}

interface ProductListProps {
  subcategories: Subcategory[]
}

export default function ProductList({ subcategories }: ProductListProps) {
  const { lang } = useLang()
  const [activeSubcat, setActiveSubcat] = useState(subcategories[0]?.id ?? '')
  const active = subcategories.find(s => s.id === activeSubcat) ?? subcategories[0]

  if (!subcategories.length) {
    return <p className="text-center py-16 text-sm" style={{ color: 'var(--text-secondary)' }}>Ürün bulunamadı.</p>
  }

  const label = (s: Subcategory) => lang === 'en' ? (s.name_en ?? s.name_tr) : s.name_tr

  return (
    <>
      {/* ── MOBILE: horizontal tabs ── */}
      {subcategories.length > 1 && (
        <div
          className="md:hidden sticky top-[52px] z-40 border-b"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
        >
          <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2">
            {subcategories.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSubcat(s.id)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  background: s.id === activeSubcat ? 'var(--text-primary)' : 'var(--border)',
                  color:      s.id === activeSubcat ? 'var(--bg-primary)' : 'var(--text-secondary)',
                }}
              >
                {label(s)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MOBILE: vertical product list ── */}
      <div className="md:hidden max-w-2xl mx-auto px-4 py-4 space-y-3">
        {active?.products.map(p => <ProductCard key={p.id} product={p} variant="list" />)}
        {!active?.products.length && (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {lang === 'en' ? 'No products in this category.' : 'Bu kategoride ürün bulunmuyor.'}
          </p>
        )}
      </div>

      {/* ── DESKTOP: sidebar + 2-col grid ── */}
      <div className="hidden md:flex gap-0 max-w-6xl mx-auto">
        {/* Subcategory sidebar */}
        {subcategories.length > 1 && (
          <aside
            className="w-52 flex-shrink-0 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto"
            style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-primary)' }}
          >
            <div className="px-4 py-4">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: 'var(--niyokki-green)' }}
              >
                {lang === 'en' ? 'Categories' : 'Alt Kategoriler'}
              </p>
              {subcategories.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSubcat(s.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5"
                  style={{
                    background:  s.id === activeSubcat ? 'var(--bg-secondary)' : 'transparent',
                    color:       s.id === activeSubcat ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight:  s.id === activeSubcat ? 600 : 400,
                    borderLeft:  s.id === activeSubcat ? '3px solid var(--niyokki-red)' : '3px solid transparent',
                    paddingLeft: s.id === activeSubcat ? 9 : 12,
                  }}
                >
                  {label(s)}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* 2-col product grid */}
        <div className="flex-1 px-6 py-6">
          {active?.products.length ? (
            <div className="grid grid-cols-2 gap-4">
              {active.products.map(p => <ProductCard key={p.id} product={p} variant="grid" />)}
            </div>
          ) : (
            <p className="text-center py-16 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {lang === 'en' ? 'No products in this category.' : 'Bu kategoride ürün bulunmuyor.'}
            </p>
          )}
        </div>
      </div>
    </>
  )
}

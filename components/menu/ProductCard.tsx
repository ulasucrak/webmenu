'use client'

import Image from 'next/image'
import { useLang } from '@/lib/menu/LanguageContext'

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

interface ProductCardProps {
  product: Product
  /** grid = desktop vertical card, list = mobile horizontal row */
  variant?: 'list' | 'grid'
}

export default function ProductCard({ product, variant = 'list' }: ProductCardProps) {
  const { lang } = useLang()
  const name        = lang === 'en' ? (product.name_en ?? product.name_tr) : product.name_tr
  const description = lang === 'en'
    ? (product.description_en ?? product.description_tr)
    : product.description_tr

  /* ── Grid variant (desktop) ── */
  if (variant === 'grid') {
    return (
      <div
        className="flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}
      >
        {/* Image */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/3', background: 'var(--bg-secondary)' }}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10" style={{ color: 'var(--border)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
              </svg>
            </div>
          )}
          {product.is_featured && (
            <div className="absolute top-2 left-2 text-black text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#fbbf24' }}>★</div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>{name}</h3>
          {description && (
            <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{description}</p>
          )}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {product.tags.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>{tag}</span>
              ))}
            </div>
          )}
          <p className="text-sm font-bold mt-1" style={{ color: 'var(--niyokki-red)' }}>
            {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} {product.currency}
          </p>
        </div>
      </div>
    )
  }

  /* ── List variant (mobile / default) ── */
  return (
    <div
      className="flex gap-3 p-3"
      style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}
    >
      {/* Image */}
      <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden" style={{ borderRadius: 8, background: 'var(--bg-secondary)' }}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={name}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8" style={{ color: 'var(--border)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
        )}
        {product.is_featured && (
          <div className="absolute top-1 left-1 text-black text-[10px] font-bold px-1 rounded" style={{ background: '#fbbf24' }}>★</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>{name}</h3>
          {description && (
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{description}</p>
          )}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {product.tags.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
        <p className="text-sm font-bold mt-1" style={{ color: 'var(--niyokki-red)' }}>
          {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} {product.currency}
        </p>
      </div>
    </div>
  )
}

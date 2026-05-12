'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Category {
  id: string
  name_tr: string
  name_en: string | null
  description_tr: string | null
  cover_url: string | null
  cover_type: string
  productCount?: number
}

interface CategoryCardProps {
  category: Category
  href: string
  lang?: 'tr' | 'en'
  tall?: boolean
  height?: number
}

const TEXTURE =
  'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,0.025) 24px,rgba(255,255,255,0.025) 25px),' +
  'repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,0.025) 24px,rgba(255,255,255,0.025) 25px)'

export default function CategoryCard({ category, href, lang = 'tr', tall = false, height }: CategoryCardProps) {
  const [hovered, setHovered] = useState(false)
  const name = lang === 'en' ? (category.name_en ?? category.name_tr) : category.name_tr
  const hasImage = !!category.cover_url && category.cover_type !== 'video'
  const hasVideo = !!category.cover_url && category.cover_type === 'video'

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex overflow-hidden w-full"
      style={{
        height: height !== undefined ? height : undefined,
        minHeight: height !== undefined ? undefined : (tall ? 'clamp(180px, 30vw, 260px)' : 'clamp(160px, 22vw, 220px)'),
        borderRadius: 16,
        backgroundColor: 'var(--bg-secondary)',
        backgroundImage: !category.cover_url ? TEXTURE : undefined,
        boxShadow: hovered ? '0 0 0 2px var(--niyokki-red)' : '0 0 0 2px transparent',
        transition: 'box-shadow 0.25s ease',
      }}
    >
      {/* Image layer (scales on hover) */}
      {hasImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${category.cover_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: hovered ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.35s ease-out',
          }}
        />
      )}

      {/* Video */}
      {hasVideo && (
        <video
          src={category.cover_url!}
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: hovered ? 'scale(1.03)' : 'scale(1)', transition: 'transform 0.35s ease-out' }}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: category.cover_url
            ? `linear-gradient(to top, var(--card-overlay) 0%, var(--card-overlay-mid) 55%, transparent 100%)`
            : 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 100%)',
        }}
      />

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Green accent line */}
        <div
          style={{
            width: 24,
            height: 2,
            background: 'var(--niyokki-green)',
            marginBottom: 6,
            borderRadius: 1,
          }}
        />

        <h2
          className="text-white font-bold leading-tight"
          style={{
            fontSize: tall ? 'clamp(1rem, 3.5vw, 1.35rem)' : 'clamp(0.85rem, 2.8vw, 1.05rem)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
          }}
        >
          {name}
        </h2>

        {category.productCount !== undefined && (
          <p className="text-white/50 text-xs mt-1">
            {category.productCount} {lang === 'en' ? 'items' : 'ürün'}
          </p>
        )}
      </div>
    </Link>
  )
}

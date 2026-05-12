'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from './ImageUpload'

interface Product {
  id?: string
  subcategory_id: string
  name_tr: string
  name_en: string | null
  description_tr: string | null
  description_en: string | null
  price: number
  currency: string
  image_url: string | null
  is_active: boolean
  is_featured: boolean
  tags: string[]
}

interface Subcategory {
  id: string
  name_tr: string
  category: { name_tr: string }
}

interface ProductFormProps {
  product?: Partial<Product>
  subcategories: Subcategory[]
  onSave?: () => void
  onCancel?: () => void
}

export default function ProductForm({ product, subcategories, onSave, onCancel }: ProductFormProps) {
  const [form, setForm] = useState({
    subcategory_id: product?.subcategory_id ?? subcategories[0]?.id ?? '',
    name_tr: product?.name_tr ?? '',
    name_en: product?.name_en ?? '',
    description_tr: product?.description_tr ?? '',
    description_en: product?.description_en ?? '',
    price: product?.price ?? 0,
    currency: product?.currency ?? '₺',
    image_url: product?.image_url ?? null as string | null,
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    tags: product?.tags ?? [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof Product, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const payload = { ...form, price: Number(form.price) }

    const { error } = product?.id
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload)

    if (error) {
      setError(error.message)
    } else {
      onSave?.()
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-white/60 text-xs mb-1 block">İsim (TR) *</label>
          <input
            required
            value={form.name_tr}
            onChange={e => set('name_tr', e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-white/30"
          />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">İsim (EN)</label>
          <input
            value={form.name_en}
            onChange={e => set('name_en', e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-white/30"
          />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">Açıklama (TR)</label>
          <textarea
            rows={2}
            value={form.description_tr}
            onChange={e => set('description_tr', e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-white/30 resize-none"
          />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">Açıklama (EN)</label>
          <textarea
            rows={2}
            value={form.description_en}
            onChange={e => set('description_en', e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-white/30 resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="text-white/60 text-xs mb-1 block">Fiyat *</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={e => set('price', e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-white/30"
          />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">Para Birimi</label>
          <input
            value={form.currency}
            onChange={e => set('currency', e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none"
          />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">Alt Kategori *</label>
          <select
            value={form.subcategory_id}
            onChange={e => set('subcategory_id', e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none"
          >
            {subcategories.map(s => (
              <option key={s.id} value={s.id}>
                {s.category.name_tr} / {s.name_tr}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-white/60 text-xs mb-1 block">Görsel</label>
        <ImageUpload
          currentUrl={form.image_url}
          onUpload={url => set('image_url', url)}
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => set('is_active', e.target.checked)}
            className="accent-white"
          />
          <span className="text-white/70 text-sm">Aktif</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={e => set('is_featured', e.target.checked)}
            className="accent-white"
          />
          <span className="text-white/70 text-sm">Öne Çıkan</span>
        </label>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors">
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBranch } from '@/lib/admin/BranchContext'
import ImageUpload from '@/components/admin/ImageUpload'

interface Category {
  id: string
  name_tr: string
  name_en: string | null
  cover_url: string | null
  cover_type: string
  is_active: boolean
  display_order: number
  productCount?: number
}

const supabase = createClient()

export default function CategoriesPage() {
  const { branchId } = useBranch()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Category>>({})

  useEffect(() => {
    if (!branchId) return
    loadCategories(branchId)
  }, [branchId])

  async function loadCategories(bid: string) {
    setLoading(true)

    // Categories + product counts via nested select
    const { data: cats } = await supabase
      .from('categories')
      .select(`
        id, name_tr, name_en, cover_url, cover_type, is_active, display_order,
        subcategories (
          products ( id )
        )
      `)
      .eq('branch_id', bid)
      .order('display_order')

    const withCounts = (cats ?? []).map((c: any) => ({
      ...c,
      productCount: (c.subcategories ?? []).reduce(
        (sum: number, s: any) => sum + (s.products?.length ?? 0),
        0
      ),
    }))

    setCategories(withCounts)
    setLoading(false)
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setForm({ ...cat })
  }

  async function saveEdit() {
    if (!editingId) return
    const { error } = await supabase.from('categories').update({
      name_tr: form.name_tr,
      name_en: form.name_en,
      cover_url: form.cover_url,
      cover_type: form.cover_type,
      is_active: form.is_active,
    }).eq('id', editingId)

    if (!error) {
      setCategories(prev =>
        prev.map(c => c.id === editingId ? { ...c, ...form } as Category : c)
      )
      setEditingId(null)
    }
  }

  async function moveOrder(id: string, dir: 'up' | 'down') {
    const idx = categories.findIndex(c => c.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === categories.length - 1) return

    const next = [...categories]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]

    const updated = next.map((c, i) => ({ ...c, display_order: i }))
    setCategories(updated)
    await supabase.from('categories').upsert(
      updated.map(c => ({ id: c.id, display_order: c.display_order })),
      { onConflict: 'id' }
    )
  }

  async function toggleActive(id: string, current: boolean) {
    const next = !current
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: next } : c))
    await supabase.from('categories').update({ is_active: next }).eq('id', id)
  }

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-bold">Kategoriler</h1>
        <span className="text-white/30 text-sm">{categories.length} kategori</span>
      </div>

      {loading ? (
        <p className="text-white/30 text-sm">Yükleniyor...</p>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`bg-zinc-900 border border-white/10 rounded-xl overflow-hidden transition-opacity ${!cat.is_active ? 'opacity-60' : ''}`}
            >
              {editingId === cat.id ? (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs mb-1 block">İsim (TR)</label>
                      <input
                        value={form.name_tr ?? ''}
                        onChange={e => setForm(f => ({ ...f, name_tr: e.target.value }))}
                        className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-1 block">İsim (EN)</label>
                      <input
                        value={form.name_en ?? ''}
                        onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                        className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-1 block">Kapak Görseli</label>
                    <ImageUpload
                      currentUrl={form.cover_url}
                      onUpload={url => setForm(f => ({ ...f, cover_url: url }))}
                      bucket="categories"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active ?? true}
                        onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                        className="accent-white"
                      />
                      <span className="text-white/60 text-sm">Aktif</span>
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(null)} className="text-sm text-white/40 hover:text-white px-3 py-1.5 transition-colors">
                        İptal
                      </button>
                      <button onClick={saveEdit} className="text-sm bg-white text-black px-4 py-1.5 rounded-lg font-semibold hover:bg-white/90 transition-colors">
                        Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-0">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 flex-shrink-0 bg-zinc-800 overflow-hidden">
                    {cat.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cat.cover_url}
                        alt={cat.name_tr}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 px-4 min-w-0">
                    <p className="text-white font-medium text-sm leading-tight">{cat.name_tr}</p>
                    {cat.name_en && (
                      <p className="text-white/30 text-xs mt-0.5">{cat.name_en}</p>
                    )}
                    <p className="text-white/30 text-xs mt-1">
                      {cat.productCount ?? 0} ürün
                    </p>
                  </div>

                  {/* Active badge */}
                  <button
                    onClick={() => toggleActive(cat.id, cat.is_active)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 transition-colors ${
                      cat.is_active
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-white/10 text-white/40 hover:bg-white/15'
                    }`}
                  >
                    {cat.is_active ? 'Aktif' : 'Pasif'}
                  </button>

                  {/* Order controls */}
                  <div className="flex flex-col gap-0.5 mx-2">
                    <button
                      onClick={() => moveOrder(cat.id, 'up')}
                      className="p-1 text-white/20 hover:text-white/60 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveOrder(cat.id, 'down')}
                      className="p-1 text-white/20 hover:text-white/60 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => startEdit(cat)}
                    className="px-4 py-2 text-white/30 hover:text-white text-sm transition-colors border-l border-white/10 h-16 flex-shrink-0"
                  >
                    Düzenle
                  </button>
                </div>
              )}
            </div>
          ))}

          {!categories.length && (
            <p className="text-center text-white/20 py-12 text-sm">Bu şubede kategori bulunamadı.</p>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBranch } from '@/lib/admin/BranchContext'

interface Category {
  id: string
  name_tr: string
  display_order: number
}

interface Product {
  id: string
  name_tr: string
  name_en: string | null
  price: number
  currency: string
  image_url: string | null
  is_active: boolean
  is_featured: boolean
  subcategory_id: string
  tags: string[]
}

interface Subcategory {
  id: string
  name_tr: string
  category_id: string
}

type EditField = 'price' | 'name'
interface EditState { id: string; field: EditField; value: string }

const supabase = createClient()

export default function ProductsPage() {
  const { branchId } = useBranch()
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<EditState | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!branchId) return
    loadBranchData(branchId)
  }, [branchId])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing?.id, editing?.field])

  async function loadBranchData(bid: string) {
    setLoading(true)
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name_tr, display_order')
      .eq('branch_id', bid)
      .order('display_order')

    const catList = cats ?? []
    setCategories(catList)

    const firstCat = catList[0]?.id ?? null
    setSelectedCatId(firstCat)
    if (firstCat) await loadCategoryProducts(firstCat)
    setLoading(false)
  }

  async function loadCategoryProducts(catId: string) {
    setLoading(true)
    const { data: subcats } = await supabase
      .from('subcategories')
      .select('id, name_tr, category_id')
      .eq('category_id', catId)
      .order('display_order')

    const subcatList = subcats ?? []
    setSubcategories(subcatList)

    if (!subcatList.length) { setProducts([]); setLoading(false); return }

    const { data: prods } = await supabase
      .from('products')
      .select('id, name_tr, name_en, price, currency, image_url, is_active, is_featured, subcategory_id, tags')
      .in('subcategory_id', subcatList.map(s => s.id))
      .order('display_order')

    setProducts(prods ?? [])
    setLoading(false)
  }

  async function selectCategory(catId: string) {
    setSelectedCatId(catId)
    setSearch('')
    setEditing(null)
    await loadCategoryProducts(catId)
  }

  async function toggleActive(id: string, current: boolean) {
    const next = !current
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: next } : p))
    await supabase.from('products').update({ is_active: next }).eq('id', id)
  }

  function startEdit(product: Product, field: EditField) {
    setEditing({ id: product.id, field, value: field === 'price' ? String(product.price) : product.name_tr })
  }

  async function commitEdit() {
    if (!editing) return
    const { id, field, value } = editing
    setEditing(null)
    if (field === 'price') {
      const val = parseFloat(value)
      if (isNaN(val) || val < 0) return
      setProducts(prev => prev.map(p => p.id === id ? { ...p, price: val } : p))
      await supabase.from('products').update({ price: val }).eq('id', id)
    } else {
      const val = value.trim()
      if (!val) return
      setProducts(prev => prev.map(p => p.id === id ? { ...p, name_tr: val } : p))
      await supabase.from('products').update({ name_tr: val }).eq('id', id)
    }
  }

  function cancelEdit() { setEditing(null) }

  const selectedCat = categories.find(c => c.id === selectedCatId)
  const filteredProducts = products.filter(p =>
    !search || p.name_tr.toLowerCase().includes(search.toLowerCase())
  )
  const grouped = subcategories
    .map(s => ({ subcat: s, products: filteredProducts.filter(p => p.subcategory_id === s.id) }))
    .filter(g => g.products.length > 0)

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0">

      {/* ── Category sidebar (desktop) / Horizontal tabs (mobile) ── */}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-44 bg-zinc-900/60 border-r border-white/10 flex-shrink-0 flex-col overflow-y-auto">
        <div className="px-3 py-3 border-b border-white/10">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Kategoriler</p>
        </div>
        <nav className="py-1 flex-1 overflow-y-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors leading-tight ${
                cat.id === selectedCatId
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.name_tr}
            </button>
          ))}
          {!categories.length && <p className="px-3 py-3 text-white/20 text-xs">Kategori yok</p>}
        </nav>
      </aside>

      {/* Mobile category tabs */}
      <div className="flex md:hidden overflow-x-auto border-b border-white/10 bg-zinc-900/60 flex-shrink-0 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => selectCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-3 text-sm transition-colors whitespace-nowrap border-b-2 ${
              cat.id === selectedCatId
                ? 'text-white font-medium border-[#c41e2a]'
                : 'text-white/50 border-transparent'
            }`}
          >
            {cat.name_tr}
          </button>
        ))}
      </div>

      {/* ── Product panel ── */}
      <div className="flex-1 overflow-auto flex flex-col min-w-0">

        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-zinc-950 border-b border-white/10 px-4 py-3 flex items-center gap-2 flex-wrap">
          <h1 className="text-white font-semibold text-sm truncate">
            {selectedCat?.name_tr ?? 'Ürünler'}
          </h1>
          <span className="text-white/30 text-xs flex-shrink-0">{filteredProducts.length} ürün</span>
          <div className="flex-1" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-zinc-900 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-white/30 w-36 md:w-44"
          />
          <Link
            href={branchId ? `/admin/bulk-price?branch=${branchId}` : '/admin/bulk-price'}
            className="flex-shrink-0 text-xs bg-white/10 text-white/70 hover:bg-white/15 hover:text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Toplu Fiyat
          </Link>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Yükleniyor...</div>
        ) : !grouped.length ? (
          <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
            {selectedCat ? 'Bu kategoride ürün bulunamadı.' : 'Kategori seçin.'}
          </div>
        ) : (
          <div className="px-4 py-4 space-y-6">
            {grouped.map(({ subcat, products: subcatProducts }) => (
              <div key={subcat.id}>
                <h2 className="text-white/30 text-xs font-medium uppercase tracking-wider mb-2 px-1">
                  {subcat.name_tr}
                </h2>

                {/* ── Desktop table ── */}
                <div className="hidden md:block bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-white/5">
                      {subcatProducts.map(product => {
                        const editingThis = editing?.id === product.id
                        return (
                          <tr key={product.id} className={!product.is_active ? 'opacity-50' : ''}>
                            <td className="pl-3 py-2.5 w-10">
                              {product.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.image_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-zinc-800" />
                              )}
                            </td>

                            <td className="px-3 py-2.5">
                              {editingThis && editing.field === 'name' ? (
                                <input
                                  ref={inputRef}
                                  value={editing.value}
                                  onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                                  onBlur={commitEdit}
                                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                                  className="w-full bg-zinc-800 border border-white/30 text-white rounded px-2 py-1 text-sm outline-none"
                                />
                              ) : (
                                <div onDoubleClick={() => startEdit(product, 'name')} title="Çift tıklayarak düzenle" className="cursor-text group">
                                  <p className="text-white font-medium leading-tight group-hover:text-amber-200 transition-colors">{product.name_tr}</p>
                                  {product.name_en && <p className="text-white/30 text-xs mt-0.5">{product.name_en}</p>}
                                </div>
                              )}
                            </td>

                            <td className="px-3 py-2.5 w-28">
                              {editingThis && editing.field === 'price' ? (
                                <input
                                  ref={inputRef}
                                  type="number"
                                  step="0.01"
                                  value={editing.value}
                                  onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                                  onBlur={commitEdit}
                                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                                  className="w-full bg-zinc-800 border border-white/30 text-white rounded px-2 py-1 text-sm outline-none"
                                />
                              ) : (
                                <button
                                  onDoubleClick={() => startEdit(product, 'price')}
                                  title="Çift tıklayarak düzenle"
                                  className="text-white font-semibold tabular-nums text-left w-full hover:text-amber-300 transition-colors cursor-text"
                                >
                                  {product.price.toLocaleString('tr-TR')} {product.currency}
                                </button>
                              )}
                            </td>

                            <td className="pr-4 py-2.5 w-20 text-right">
                              <button
                                onClick={() => toggleActive(product.id, product.is_active)}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                  product.is_active
                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                    : 'bg-white/10 text-white/40 hover:bg-white/15'
                                }`}
                              >
                                {product.is_active ? 'Aktif' : 'Pasif'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile cards ── */}
                <div className="flex md:hidden flex-col gap-2">
                  {subcatProducts.map(product => (
                    <div
                      key={product.id}
                      className={`bg-zinc-900 border border-white/10 rounded-xl p-3 flex items-center gap-3 ${!product.is_active ? 'opacity-50' : ''}`}
                    >
                      {/* Thumbnail */}
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex-shrink-0" />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm leading-tight truncate">{product.name_tr}</p>
                        <p className="text-white/50 text-sm mt-0.5 tabular-nums">
                          {product.price.toLocaleString('tr-TR')} {product.currency}
                        </p>
                      </div>

                      {/* Status toggle */}
                      <button
                        onClick={() => toggleActive(product.id, product.is_active)}
                        className={`flex-shrink-0 text-xs px-2.5 py-1.5 rounded-full font-medium transition-colors ${
                          product.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-white/10 text-white/40'
                        }`}
                      >
                        {product.is_active ? 'Aktif' : 'Pasif'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBranch } from '@/lib/admin/BranchContext'

const supabase = createClient()

// ── Types ─────────────────────────────────────────────────
interface Category {
  id: string
  name_tr: string
  productCount: number
}

interface Product {
  id: string
  name_tr: string
  price: number
  currency: string
  categoryId: string
  categoryName: string
}

interface PreviewRow extends Product {
  newPrice: number
  diff: number
}

type ScopeMode = 'categories' | 'products'
type UpdateMethod = 'percent' | 'fixed'
type Step = 1 | 2 | 3

// ── Helpers ───────────────────────────────────────────────
function Toggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex bg-zinc-800 rounded-lg p-0.5 w-fit">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-[#c41e2a] text-white'
              : 'text-white/50 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'Kapsam' },
    { n: 2, label: 'Güncelleme' },
    { n: 3, label: 'Önizleme' },
  ]
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            s.n < current ? 'bg-green-600 text-white'
            : s.n === current ? 'bg-[#c41e2a] text-white'
            : 'bg-zinc-800 text-white/30'
          }`}>
            {s.n < current ? '✓' : s.n}
          </div>
          <span className={`text-xs hidden sm:block ${s.n === current ? 'text-white' : 'text-white/30'}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && <div className="w-6 h-px bg-white/10 hidden sm:block" />}
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function BulkPricePage() {
  const { branchId } = useBranch()

  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Step state
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [scopeMode, setScopeMode] = useState<ScopeMode>('categories')
  const [selectedCatIds, setSelectedCatIds] = useState<Set<string>>(new Set())
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [productSearch, setProductSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')

  // Step 2
  const [updateMethod, setUpdateMethod] = useState<UpdateMethod>('percent')
  const [updateValue, setUpdateValue] = useState('')

  // Apply
  const [applying, setApplying] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [done, setDone] = useState<number | null>(null)

  useEffect(() => {
    if (branchId) loadData(branchId)
  }, [branchId])

  async function loadData(bid: string) {
    setLoading(true)
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name_tr, subcategories(id, products(id, name_tr, price, currency))')
      .eq('branch_id', bid)
      .order('display_order')

    if (!cats) { setLoading(false); return }

    const catList: Category[] = []
    const prodList: Product[] = []

    for (const cat of cats) {
      let count = 0
      for (const sub of (cat.subcategories as any[]) ?? []) {
        for (const p of (sub.products as any[]) ?? []) {
          count++
          prodList.push({
            id: p.id,
            name_tr: p.name_tr,
            price: p.price,
            currency: p.currency,
            categoryId: cat.id,
            categoryName: cat.name_tr,
          })
        }
      }
      catList.push({ id: cat.id, name_tr: cat.name_tr, productCount: count })
    }

    setCategories(catList)
    setProducts(prodList)
    setLoading(false)
  }

  // ── Derived ─────────────────────────────────────────────
  const selectedProducts: Product[] = scopeMode === 'categories'
    ? products.filter(p => selectedCatIds.has(p.categoryId))
    : products.filter(p => selectedProductIds.has(p.id))

  function computePreview(): PreviewRow[] {
    const val = parseFloat(updateValue)
    if (isNaN(val)) return []
    return selectedProducts.map(p => {
      const newPrice = Math.round(
        updateMethod === 'percent'
          ? p.price * (1 + val / 100)
          : p.price + val
      )
      return { ...p, newPrice: Math.max(0, newPrice), diff: Math.max(0, newPrice) - p.price }
    })
  }

  const preview = step === 3 ? computePreview() : []
  const val = parseFloat(updateValue)
  const step2Valid = !isNaN(val) && updateValue.trim() !== ''
  const step1Valid = scopeMode === 'categories' ? selectedCatIds.size > 0 : selectedProductIds.size > 0

  // ── Apply ────────────────────────────────────────────────
  async function apply() {
    if (!preview.length) return
    setApplying(true)
    setConfirmOpen(false)
    const updates = preview.map(p => ({ id: p.id, price: p.newPrice }))
    await supabase.from('products').upsert(updates, { onConflict: 'id' })
    setDone(updates.length)
    setApplying(false)
    if (branchId) loadData(branchId)
  }

  function reset() {
    setDone(null)
    setStep(1)
    setSelectedCatIds(new Set())
    setSelectedProductIds(new Set())
    setUpdateValue('')
    setProductSearch('')
    setCatFilter('')
  }

  // ── Render: done ──────────────────────────────────────────
  if (done !== null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
        <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-xl">{done} ürün güncellendi</p>
          <p className="text-white/40 text-sm mt-1">{new Date().toLocaleString('tr-TR')}</p>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={reset} className="px-5 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/15 transition-colors">
            Yeni İşlem
          </button>
          <Link href={branchId ? `/admin/products?branch=${branchId}` : '/admin/products'}
            className="px-5 py-2 text-white/50 text-sm hover:text-white transition-colors">
            ← Ürünler
          </Link>
        </div>
      </div>
    )
  }

  // ── Render: loading ────────────────────────────────────────
  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Yükleniyor...</div>
  }

  // ── Filtered lists for step 1 ──────────────────────────────
  const filteredProducts = products.filter(p =>
    (!productSearch || p.name_tr.toLowerCase().includes(productSearch.toLowerCase())) &&
    (!catFilter || p.categoryId === catFilter)
  )

  // Group filtered products by category
  const groupedProducts = categories
    .map(cat => ({ cat, items: filteredProducts.filter(p => p.categoryId === cat.id) }))
    .filter(g => g.items.length > 0)

  // ── Render: page ───────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-white/10 px-5 py-3 flex items-center gap-4">
        <Link
          href={branchId ? `/admin/products?branch=${branchId}` : '/admin/products'}
          className="text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-white font-semibold text-sm flex-1">Toplu Fiyat Güncelle</h1>
        <StepIndicator current={step} />
      </div>

      <div className="flex-1 px-4 md:px-8 py-6 max-w-3xl w-full mx-auto">

        {/* ════ STEP 1 — Scope ════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Güncelleme kapsamı</p>
              <Toggle
                options={[
                  { value: 'categories', label: 'Kategoriye Göre' },
                  { value: 'products', label: 'Ürünlere Göre' },
                ]}
                value={scopeMode}
                onChange={v => {
                  setScopeMode(v as ScopeMode)
                  setSelectedCatIds(new Set())
                  setSelectedProductIds(new Set())
                }}
              />
            </div>

            {/* Categories scope */}
            {scopeMode === 'categories' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-xs">{selectedCatIds.size} kategori seçildi</p>
                  <button
                    onClick={() => {
                      if (selectedCatIds.size === categories.length) {
                        setSelectedCatIds(new Set())
                      } else {
                        setSelectedCatIds(new Set(categories.map(c => c.id)))
                      }
                    }}
                    className="text-xs text-[#c41e2a] hover:text-red-400 transition-colors"
                  >
                    {selectedCatIds.size === categories.length ? 'Temizle' : 'Tümünü Seç'}
                  </button>
                </div>

                <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
                  {categories.map(cat => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCatIds.has(cat.id)}
                        onChange={e => {
                          const next = new Set(selectedCatIds)
                          e.target.checked ? next.add(cat.id) : next.delete(cat.id)
                          setSelectedCatIds(next)
                        }}
                        className="accent-[#c41e2a] w-4 h-4"
                      />
                      <span className="text-white text-sm flex-1">{cat.name_tr}</span>
                      <span className="text-white/30 text-xs">{cat.productCount} ürün</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Products scope */}
            {scopeMode === 'products' && (
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Ürün ara..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="flex-1 min-w-0 bg-zinc-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-white/30"
                  />
                  <select
                    value={catFilter}
                    onChange={e => setCatFilter(e.target.value)}
                    className="bg-zinc-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="">Tüm kategoriler</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name_tr}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between px-1">
                  <p className="text-white/40 text-xs">{selectedProductIds.size} ürün seçildi</p>
                  <button
                    onClick={() => {
                      if (selectedProductIds.size === filteredProducts.length) {
                        setSelectedProductIds(new Set())
                      } else {
                        setSelectedProductIds(new Set(filteredProducts.map(p => p.id)))
                      }
                    }}
                    className="text-xs text-[#c41e2a] hover:text-red-400 transition-colors"
                  >
                    {selectedProductIds.size === filteredProducts.length ? 'Temizle' : 'Tümünü Seç'}
                  </button>
                </div>

                <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden max-h-96 overflow-y-auto">
                  {groupedProducts.map(({ cat, items }) => (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-white/5">
                        <p className="text-white/50 text-xs font-medium uppercase tracking-wider">{cat.name_tr}</p>
                        <button
                          onClick={() => {
                            const next = new Set(selectedProductIds)
                            const allSelected = items.every(p => next.has(p.id))
                            items.forEach(p => allSelected ? next.delete(p.id) : next.add(p.id))
                            setSelectedProductIds(next)
                          }}
                          className="text-[10px] text-[#c41e2a] hover:text-red-400 transition-colors"
                        >
                          {items.every(p => selectedProductIds.has(p.id)) ? 'Temizle' : 'Tümünü Seç'}
                        </button>
                      </div>
                      <div className="divide-y divide-white/5">
                        {items.map(p => (
                          <label key={p.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/5 transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.has(p.id)}
                              onChange={e => {
                                const next = new Set(selectedProductIds)
                                e.target.checked ? next.add(p.id) : next.delete(p.id)
                                setSelectedProductIds(next)
                              }}
                              className="accent-[#c41e2a] w-4 h-4 flex-shrink-0"
                            />
                            <span className="text-white text-sm flex-1 truncate">{p.name_tr}</span>
                            <span className="text-white/40 text-sm tabular-nums flex-shrink-0">{p.price.toLocaleString('tr-TR')} {p.currency}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!groupedProducts.length && (
                    <p className="text-white/20 text-sm text-center py-8">Ürün bulunamadı</p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-30
                bg-[#c41e2a] text-white hover:bg-red-700 disabled:cursor-not-allowed"
            >
              Devam → ({selectedProducts.length} ürün)
            </button>
          </div>
        )}

        {/* ════ STEP 2 — Update method ════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <button onClick={() => setStep(1)} className="text-white/40 hover:text-white text-sm transition-colors flex items-center gap-1">
              ← Geri
            </button>

            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Güncelleme yöntemi</p>
              <Toggle
                options={[
                  { value: 'percent', label: 'Yüzde (%)' },
                  { value: 'fixed', label: 'Sabit Tutar (₺)' },
                ]}
                value={updateMethod}
                onChange={v => { setUpdateMethod(v as UpdateMethod); setUpdateValue('') }}
              />
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 space-y-3">
              <label className="block text-white/60 text-sm">
                {updateMethod === 'percent' ? 'Yüzde değeri (eksi = indirim)' : 'Tutar (eksi = indirim)'}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-lg font-bold">
                  {updateMethod === 'percent' ? '%' : '₺'}
                </span>
                <input
                  type="number"
                  step={updateMethod === 'percent' ? '0.1' : '1'}
                  value={updateValue}
                  onChange={e => setUpdateValue(e.target.value)}
                  placeholder={updateMethod === 'percent' ? 'örn: 10 veya -5' : 'örn: 50 veya -25'}
                  className="flex-1 bg-zinc-800 border border-white/20 text-white text-xl font-semibold rounded-lg px-4 py-3 outline-none focus:border-[#c41e2a] transition-colors"
                />
              </div>

              {step2Valid && (
                <div className="text-xs text-white/40 pt-1 space-y-1">
                  {updateMethod === 'percent' ? (
                    <>
                      <p>• Pozitif değer → fiyat artışı ({val > 0 ? '+' : ''}{val}%)</p>
                      <p>• Örnek: 100₺ ürün → {Math.round(100 * (1 + val / 100))}₺</p>
                    </>
                  ) : (
                    <>
                      <p>• Her ürüne {val >= 0 ? '+' : ''}{val}₺ eklenir</p>
                      <p>• Örnek: 100₺ ürün → {Math.round(100 + val)}₺</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-zinc-800/50 rounded-lg px-4 py-2.5 text-xs text-white/40">
              <span className="text-white/60 font-medium">{selectedProducts.length} ürün</span> etkilenecek
              &nbsp;·&nbsp; Fiyatlar en yakın tam sayıya yuvarlanır
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!step2Valid}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-30
                bg-[#c41e2a] text-white hover:bg-red-700 disabled:cursor-not-allowed"
            >
              Önizlemeye Geç →
            </button>
          </div>
        )}

        {/* ════ STEP 3 — Preview ══════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-5">
            <button onClick={() => setStep(2)} className="text-white/40 hover:text-white text-sm transition-colors flex items-center gap-1">
              ← Geri
            </button>

            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">{preview.length} ürün güncellenecek</p>
              <span className="text-white/40 text-xs bg-zinc-800 px-2 py-1 rounded">
                {updateMethod === 'percent' ? `${val > 0 ? '+' : ''}${val}%` : `${val >= 0 ? '+' : ''}${val}₺`}
              </span>
            </div>

            {/* Preview table */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
              {/* Desktop table */}
              <table className="w-full text-sm hidden sm:table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-2.5 text-white/40 text-xs font-medium">Ürün</th>
                    <th className="text-right px-4 py-2.5 text-white/40 text-xs font-medium">Eski Fiyat</th>
                    <th className="text-right px-4 py-2.5 text-white/40 text-xs font-medium">Yeni Fiyat</th>
                    <th className="text-right px-4 py-2.5 text-white/40 text-xs font-medium">Fark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {preview.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5">
                        <p className="text-white text-sm truncate max-w-xs">{p.name_tr}</p>
                        <p className="text-white/30 text-xs">{p.categoryName}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right text-white/50 tabular-nums">
                        {p.price.toLocaleString('tr-TR')} {p.currency}
                      </td>
                      <td className="px-4 py-2.5 text-right text-white font-semibold tabular-nums">
                        {p.newPrice.toLocaleString('tr-TR')} {p.currency}
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums text-xs font-medium ${p.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {p.diff >= 0 ? '+' : ''}{p.diff.toLocaleString('tr-TR')} {p.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-white/5">
                {preview.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{p.name_tr}</p>
                      <p className="text-white/30 text-xs">{p.categoryName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white/40 text-xs tabular-nums line-through">
                        {p.price.toLocaleString('tr-TR')}
                      </p>
                      <p className="text-white text-sm font-semibold tabular-nums">
                        {p.newPrice.toLocaleString('tr-TR')} {p.currency}
                      </p>
                      <p className={`text-xs tabular-nums ${p.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {p.diff >= 0 ? '+' : ''}{p.diff.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setConfirmOpen(true)}
              disabled={applying}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-colors
                bg-[#c41e2a] text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {applying ? 'Uygulanıyor...' : 'Onayla ve Uygula'}
            </button>
          </div>
        )}
      </div>

      {/* ── Confirm dialog ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-2">Emin misiniz?</h3>
            <p className="text-white/50 text-sm mb-5">
              <span className="text-white font-medium">{preview.length} ürünün</span> fiyatı güncellecek.
              Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/60 bg-white/10 hover:bg-white/15 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={apply}
                className="flex-1 py-2.5 rounded-xl text-sm text-white font-semibold bg-[#c41e2a] hover:bg-red-700 transition-colors"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

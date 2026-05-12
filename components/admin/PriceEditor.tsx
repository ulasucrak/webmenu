'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name_tr: string
}

interface PriceEditorProps {
  categories: Category[]
  onDone?: () => void
}

export default function PriceEditor({ categories, onDone }: PriceEditorProps) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id ?? '')
  const [percent, setPercent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function apply() {
    const pct = parseFloat(percent)
    if (!selectedCategory || isNaN(pct)) return

    setLoading(true)
    setResult(null)

    const supabase = createClient()

    // Fetch products in this category via subcategories
    const { data: subcats } = await supabase
      .from('subcategories')
      .select('id')
      .eq('category_id', selectedCategory)

    if (!subcats?.length) {
      setResult('Bu kategoride ürün bulunamadı.')
      setLoading(false)
      return
    }

    const subcatIds = subcats.map(s => s.id)

    const { data: products } = await supabase
      .from('products')
      .select('id, price')
      .in('subcategory_id', subcatIds)

    if (!products?.length) {
      setResult('Bu kategoride ürün bulunamadı.')
      setLoading(false)
      return
    }

    const multiplier = 1 + pct / 100
    const updates = products.map(p => ({
      id: p.id,
      price: Math.round(p.price * multiplier * 100) / 100,
    }))

    const { error } = await supabase.from('products').upsert(updates, { onConflict: 'id' })

    if (error) {
      setResult('Hata: ' + error.message)
    } else {
      setResult(`${products.length} ürün güncellendi. (${pct > 0 ? '+' : ''}${pct}%)`)
      onDone?.()
    }
    setLoading(false)
  }

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 space-y-3">
      <h3 className="text-white font-semibold text-sm">Toplu Fiyat Düzenleme</h3>

      <div className="flex gap-3 flex-wrap">
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="flex-1 min-w-40 bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none"
        >
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name_tr}</option>
          ))}
        </select>

        <input
          type="number"
          value={percent}
          onChange={e => setPercent(e.target.value)}
          placeholder="% değişim (örn: 10 veya -5)"
          className="flex-1 min-w-40 bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none"
        />

        <button
          onClick={apply}
          disabled={loading || !percent}
          className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/90 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Uygulanıyor...' : 'Uygula'}
        </button>
      </div>

      {result && (
        <p className="text-sm text-white/60">{result}</p>
      )}
    </div>
  )
}

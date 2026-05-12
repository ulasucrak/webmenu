'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBranch } from '@/lib/admin/BranchContext'

interface Stats {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  categories: number
  featuredProducts: number
}

interface Product {
  id: string
  name_tr: string
  price: number
  currency: string
  image_url: string | null
}

const supabase = createClient()

export default function AdminDashboard() {
  const { branchId, branch } = useBranch()
  const [stats, setStats] = useState<Stats | null>(null)
  const [expensive, setExpensive] = useState<Product[]>([])
  const [cheap, setCheap] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!branchId) return
    setLoading(true)
    fetchStats(branchId)
  }, [branchId])

  async function fetchStats(bid: string) {
    // Get subcategory ids for this branch
    const { data: subcats } = await supabase
      .from('subcategories')
      .select('id, categories!inner(branch_id)')
      .eq('categories.branch_id', bid)

    const subcatIds = (subcats ?? []).map((s: any) => s.id)

    if (!subcatIds.length) {
      setStats({ totalProducts: 0, activeProducts: 0, inactiveProducts: 0, categories: 0, featuredProducts: 0 })
      setExpensive([])
      setCheap([])
      setLoading(false)
      return
    }

    const [allProducts, catsRes, expRes, cheapRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, is_active, is_featured')
        .in('subcategory_id', subcatIds),
      supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', bid)
        .eq('is_active', true),
      supabase
        .from('products')
        .select('id, name_tr, price, currency, image_url')
        .in('subcategory_id', subcatIds)
        .eq('is_active', true)
        .order('price', { ascending: false })
        .limit(5),
      supabase
        .from('products')
        .select('id, name_tr, price, currency, image_url')
        .in('subcategory_id', subcatIds)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(5),
    ])

    const products = allProducts.data ?? []
    setStats({
      totalProducts: products.length,
      activeProducts: products.filter(p => p.is_active).length,
      inactiveProducts: products.filter(p => !p.is_active).length,
      categories: catsRes.count ?? 0,
      featuredProducts: products.filter(p => p.is_featured).length,
    })
    setExpensive(expRes.data ?? [])
    setCheap(cheapRes.data ?? [])
    setLoading(false)
  }

  if (!branchId) {
    return <div className="p-8 text-white/40">Şube seçin.</div>
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-white text-xl font-bold">Dashboard</h1>
        {branch && <p className="text-white/40 text-sm mt-0.5">{branch.name}</p>}
      </div>

      {loading ? (
        <div className="text-white/30 text-sm">Yükleniyor...</div>
      ) : (
        <>
          {/* Inactive warning */}
          {(stats?.inactiveProducts ?? 0) > 0 && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-amber-300 text-sm">
                <strong>{stats?.inactiveProducts}</strong> ürün pasif durumda ve menüde görünmüyor.
              </span>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Toplam Ürün', value: stats?.totalProducts ?? 0, color: 'text-white' },
              { label: 'Aktif Ürün', value: stats?.activeProducts ?? 0, color: 'text-green-400' },
              { label: 'Pasif Ürün', value: stats?.inactiveProducts ?? 0, color: (stats?.inactiveProducts ?? 0) > 0 ? 'text-amber-400' : 'text-white/40' },
              { label: 'Öne Çıkan', value: stats?.featuredProducts ?? 0, color: 'text-blue-400' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 rounded-xl p-4 border border-white/10">
                <p className="text-white/40 text-xs">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Top products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProductRankCard title="En Pahalı 5 Ürün" products={expensive} accent="text-red-400" />
            <ProductRankCard title="En Ucuz 5 Ürün" products={cheap} accent="text-green-400" />
          </div>
        </>
      )}
    </div>
  )
}

function ProductRankCard({ title, products, accent }: { title: string; products: Product[]; accent: string }) {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-white text-sm font-semibold">{title}</h2>
      </div>
      <div className="divide-y divide-white/5">
        {products.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-white/20 text-xs w-4 text-right flex-shrink-0">{i + 1}</span>
            {p.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt={p.name_tr} className="w-8 h-8 rounded object-cover flex-shrink-0" />
            )}
            <span className="text-white/70 text-sm flex-1 truncate">{p.name_tr}</span>
            <span className={`text-sm font-semibold flex-shrink-0 ${accent}`}>
              {p.price.toLocaleString('tr-TR')} {p.currency}
            </span>
          </div>
        ))}
        {!products.length && (
          <p className="px-4 py-3 text-white/30 text-sm">Ürün bulunamadı.</p>
        )}
      </div>
    </div>
  )
}

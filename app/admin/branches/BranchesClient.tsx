'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Branch {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  is_active: boolean
}

export default function BranchesClient({
  branches: initial,
  restaurantId,
}: {
  branches: Branch[]
  restaurantId: string
}) {
  const [branches, setBranches] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', address: '', phone: '' })
  const supabase = createClient()

  async function addBranch(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase
      .from('branches')
      .insert({ ...form, restaurant_id: restaurantId, is_active: true })
      .select()
      .single()

    if (!error && data) {
      setBranches(prev => [...prev, data])
      setAdding(false)
      setForm({ name: '', slug: '', address: '', phone: '' })
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('branches').update({ is_active: !current }).eq('id', id)
    setBranches(prev => prev.map(b => b.id === id ? { ...b, is_active: !current } : b))
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">Şubeler</h1>
        <button
          onClick={() => setAdding(!adding)}
          className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/90"
        >
          + Yeni Şube
        </button>
      </div>

      {adding && (
        <form onSubmit={addBranch} className="bg-zinc-900 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs mb-1 block">Şube Adı *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">URL Slug * (örn: elazig)</label>
              <input required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Adres</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Telefon</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setAdding(false)} className="text-sm text-white/40 hover:text-white px-3 py-1.5">İptal</button>
            <button type="submit" className="text-sm bg-white text-black px-4 py-1.5 rounded-lg font-semibold">Ekle</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {branches.map(branch => (
          <div key={branch.id} className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-medium">{branch.name}</p>
              <p className="text-white/40 text-xs">/{branch.slug}{branch.address ? ` · ${branch.address}` : ''}</p>
            </div>
            <button
              onClick={() => toggleActive(branch.id, branch.is_active)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                branch.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
              }`}
            >
              {branch.is_active ? 'Aktif' : 'Pasif'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

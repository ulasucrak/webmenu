'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Branch {
  id: string
  name: string
  slug: string
  is_active: boolean
}

interface Restaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  created_at: string
  branches: Branch[]
}

interface AdminUser {
  id: string
  restaurant_id: string | null
  role: string
}

export default function RestaurantsClient({
  restaurants: initial,
  adminUsers,
}: {
  restaurants: Restaurant[]
  adminUsers: AdminUser[]
}) {
  const [restaurants, setRestaurants] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '' })
  const [newAdminEmail, setNewAdminEmail] = useState<{ [restaurantId: string]: string }>({})
  const supabase = createClient()

  async function addRestaurant(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase
      .from('restaurants')
      .insert({ name: form.name, slug: form.slug })
      .select()
      .single()

    if (!error && data) {
      setRestaurants(prev => [{ ...data, branches: [] }, ...prev])
      setAdding(false)
      setForm({ name: '', slug: '' })
    }
  }

  async function addBranch(restaurantId: string) {
    const name = prompt('Şube adı:')
    const slug = prompt('Şube URL slug (örn: elazig):')
    if (!name || !slug) return

    const { data, error } = await supabase
      .from('branches')
      .insert({ restaurant_id: restaurantId, name, slug, is_active: true })
      .select()
      .single()

    if (!error && data) {
      setRestaurants(prev =>
        prev.map(r => r.id === restaurantId
          ? { ...r, branches: [...r.branches, data] }
          : r
        )
      )
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">Restoranlar</h1>
        <button
          onClick={() => setAdding(!adding)}
          className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/90"
        >
          + Yeni Restoran
        </button>
      </div>

      {adding && (
        <form onSubmit={addRestaurant} className="bg-zinc-900 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs mb-1 block">Restoran Adı *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none" placeholder="Niyokki" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">URL Slug * (örn: niyokki)</label>
              <input required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                className="w-full bg-zinc-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none" placeholder="niyokki" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setAdding(false)} className="text-sm text-white/40 hover:text-white px-3 py-1.5">İptal</button>
            <button type="submit" className="text-sm bg-white text-black px-4 py-1.5 rounded-lg font-semibold">Oluştur</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {restaurants.map(restaurant => (
          <div key={restaurant.id} className="bg-zinc-900 border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-semibold">{restaurant.name}</p>
                <p className="text-white/40 text-xs">/{restaurant.slug}</p>
              </div>
              <button
                onClick={() => addBranch(restaurant.id)}
                className="text-xs bg-white/10 text-white/60 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                + Şube Ekle
              </button>
            </div>

            {/* Branches */}
            {restaurant.branches.length > 0 && (
              <div className="space-y-1.5 pl-3 border-l border-white/10">
                {restaurant.branches.map(branch => (
                  <div key={branch.id} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${branch.is_active ? 'bg-green-400' : 'bg-white/20'}`} />
                    <span className="text-white/60 text-xs">{branch.name}</span>
                    <span className="text-white/30 text-xs">/{branch.slug}</span>
                    <a
                      href={`/${restaurant.slug}/${branch.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400/60 hover:text-blue-400 ml-auto"
                    >
                      Görüntüle →
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Admins for this restaurant */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-white/30 text-xs mb-1">
                Admin sayısı: {adminUsers.filter(a => a.restaurant_id === restaurant.id).length}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

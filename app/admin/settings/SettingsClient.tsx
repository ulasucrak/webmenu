'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/admin/ImageUpload'

interface Restaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
}

export default function SettingsClient({ restaurant }: { restaurant: Restaurant | null }) {
  const [form, setForm] = useState({
    name: restaurant?.name ?? '',
    primary_color: restaurant?.primary_color ?? '#000000',
    logo_url: restaurant?.logo_url ?? null as string | null,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurant?.id) return
    setSaving(true)
    await supabase.from('restaurants').update(form).eq('id', restaurant.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!restaurant) return <div className="p-8 text-white/40">Restoran bulunamadı.</div>

  return (
    <div className="p-8 max-w-lg space-y-6">
      <h1 className="text-white text-2xl font-bold">Restoran Ayarları</h1>

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="text-white/60 text-xs mb-1 block">Restoran Adı</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-zinc-900 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-white/30"
          />
        </div>

        <div>
          <label className="text-white/60 text-xs mb-1 block">Tema Rengi</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primary_color}
              onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
              className="w-10 h-10 rounded cursor-pointer bg-transparent"
            />
            <span className="text-white/50 text-sm">{form.primary_color}</span>
          </div>
        </div>

        <div>
          <label className="text-white/60 text-xs mb-1 block">Logo</label>
          <ImageUpload
            currentUrl={form.logo_url}
            onUpload={url => setForm(f => ({ ...f, logo_url: url }))}
            bucket="logos"
          />
        </div>

        <div className="pt-2">
          <p className="text-white/30 text-xs mb-3">Menü URL: <span className="text-white/50">/{restaurant.slug}/[şube]</span></p>
          <button
            type="submit"
            disabled={saving}
            className="bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}

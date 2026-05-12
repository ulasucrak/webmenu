'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-white/60 text-sm mb-1.5">E-posta</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full bg-zinc-900 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-white/40 transition-colors"
          placeholder="admin@example.com"
        />
      </div>

      <div>
        <label className="block text-white/60 text-sm mb-1.5">Şifre</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full bg-zinc-900 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-white/40 transition-colors"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-semibold rounded-xl py-3 text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
    </form>
  )
}

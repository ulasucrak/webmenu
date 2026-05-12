'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang, T } from '@/lib/menu/LanguageContext'

interface Product {
  id: string
  name_tr: string
  price: number
  currency: string
  image_url: string | null
  category_id: string | null
}

interface Message {
  role: 'user' | 'assistant'
  text: string
  products?: Product[]
}

// Quick prompts are now sourced from T[lang].quickPrompts

interface AiAssistantProps {
  restaurantSlug: string
  branchSlug: string
  restaurantName: string
}

export default function AiAssistant({ restaurantSlug, branchSlug, restaurantName }: AiAssistantProps) {
  const router = useRouter()
  const { lang } = useLang()
  const t = T[lang]
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`/${restaurantSlug}/${branchSlug}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, lang }),
      })
      const data = await res.json()
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: data.message, products: data.products },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function goToCategory(categoryId: string | null) {
    if (!categoryId) return
    setOpen(false)
    router.push(`/${restaurantSlug}/${branchSlug}/${categoryId}`)
  }

  return (
    <>
      {/* Bubble button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        style={{ background: 'var(--niyokki-green)' }}
        aria-label="AI Asistan"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Panel overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-end md:pr-6 md:pb-6">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

          <div className="relative w-full md:w-96 h-[75vh] md:h-[600px] bg-zinc-900 rounded-t-3xl md:rounded-2xl flex flex-col shadow-2xl border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div>
                <p className="text-white font-semibold text-sm">AI Menü Asistan</p>
                <p className="text-white/40 text-xs">{restaurantName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-white/50 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-white/30 text-sm text-center py-8">{t.aiWelcome}</p>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-white text-black' : 'bg-zinc-800 text-white'} rounded-2xl px-3 py-2 text-sm`}>
                    <p>{msg.text}</p>

                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.products.map(p => (
                          <button
                            key={p.id}
                            onClick={() => goToCategory(p.category_id)}
                            disabled={!p.category_id}
                            className="w-full flex items-center gap-2 bg-black/30 rounded-lg p-2 text-left transition-colors hover:bg-black/50 disabled:cursor-default group"
                          >
                            {p.image_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.image_url}
                                alt={p.name_tr}
                                className="w-10 h-10 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white leading-tight truncate">
                                {p.name_tr}
                              </p>
                              <p className="text-xs text-white/60">
                                {p.price} {p.currency}
                              </p>
                            </div>
                            {p.category_id && (
                              <svg
                                className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 flex-shrink-0 transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 rounded-2xl px-4 py-2">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length === 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {t.quickPrompts.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="text-xs bg-white/10 text-white/70 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-white/10">
              <form
                onSubmit={e => { e.preventDefault(); send(input) }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={t.aiPlaceholder}
                  className="flex-1 bg-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 outline-none placeholder-white/30 border border-white/10 focus:border-white/30"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="bg-white text-black rounded-xl px-3 py-2.5 disabled:opacity-40 hover:bg-white/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

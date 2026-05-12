'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  currentUrl?: string | null
  onUpload: (url: string) => void
  bucket?: string
}

export default function ImageUpload({ currentUrl, onUpload, bucket = 'products' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) {
      alert('Yükleme hatası: ' + error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    setPreview(data.publicUrl)
    onUpload(data.publicUrl)
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className="relative cursor-pointer border-2 border-dashed border-white/20 rounded-xl overflow-hidden hover:border-white/40 transition-colors"
      style={{ minHeight: 100 }}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Preview" className="w-full h-32 object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-white/40">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm">Görsel yükle veya sürükle</span>
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <p className="text-white text-sm">Yükleniyor...</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
      }} />
    </div>
  )
}

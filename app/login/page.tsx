import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-white text-2xl font-bold text-center mb-8">Admin Girişi</h1>
        <Suspense fallback={<div className="text-white/40 text-center">Yükleniyor...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

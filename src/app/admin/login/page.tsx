'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/admin/pm-agent')
    } else {
      // 429 seit 03.10.2026 (Rate-Limit im Login): Wer gesperrt ist, soll nicht
      // „Falsches Passwort“ lesen und am richtigen Passwort zweifeln.
      setError(res.status === 429 ? 'Zu viele Versuche — bitte in 15 Minuten erneut versuchen.' : 'Falsches Passwort')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0805] flex items-center justify-center">
      <div className="border border-[#2a2416] p-8 w-80">
        <div className="text-[#c8621a] font-mono text-sm tracking-widest mb-6">
          🥩 STEAKAKADEMIE · ADMIN
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="Passwort"
          className="w-full bg-[#16130a] border border-[#2a2416] text-[#e8dcc8]
                     font-mono text-sm p-3 mb-3
                     focus:border-[#c8621a] transition-colors"
        />
        {error && (
          <p className="text-red-400 text-xs font-mono mb-3">{error}</p>
        )}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#c8621a] text-white font-mono text-sm
                     py-3 tracking-widest hover:bg-[#d97422] transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'PRÜFE...' : 'EINLOGGEN →'}
        </button>
      </div>
    </div>
  )
}

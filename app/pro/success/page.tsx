'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { theme, btn } from '@/lib/theme'

export default function ProSuccessPage() {
  const router  = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Mark Pro in localStorage — persists across sessions
    localStorage.setItem('kwizzo_pro', '1')
    setReady(true)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl font-extrabold text-white mb-3">
        Welcome to <span className={theme.gradientText}>Kwizzo Pro!</span>
      </h1>
      <p className="text-white/50 mb-2 max-w-sm">
        Unlimited questions, custom topics, and no ads — for every quiz, forever.
      </p>
      {ready && (
        <p className="text-green-400 text-sm font-semibold mb-8">✓ Pro access activated on this device</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.push('/play')}
          className={btn.primary + ' px-10 py-4 text-base'}
        >
          Start a Pro Quiz →
        </button>
      </div>
      <p className="text-white/20 text-xs mt-8 max-w-xs">
        Your subscription is managed through Stripe. To cancel, email us or use the customer portal link in your receipt email.
      </p>
    </div>
  )
}

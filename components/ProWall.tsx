'use client'
import { useState } from 'react'
import { theme, btn } from '@/lib/theme'
import { startCheckout } from '@/lib/pro'
import { Zap, CheckCircle, RotateCcw, Home } from 'lucide-react'

interface ProWallProps {
  questionsAnswered: number
  playerName:        string
  score:             number
  onContinueFree:   () => void  // let them replay from Q1 on free
  onNewGame:        () => void
}

const PRO_FEATURES = [
  'Unlimited questions per quiz',
  'Type any custom topic',
  'No ads during games',
  'Per-player question banks',
  'Priority AI (faster questions)',
]

export default function ProWall({ questionsAnswered, playerName, score, onContinueFree, onNewGame }: ProWallProps) {
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  async function upgrade() {
    setLoading(true)
    setErr('')
    try {
      await startCheckout()
    } catch {
      setErr('Could not open checkout — try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Score recap */}
        <div className={`${theme.card} p-5 mb-5 text-center`}>
          <div className="text-3xl mb-2">🧠</div>
          <p className="text-white/50 text-sm mb-1">Nice work, <span className="text-white font-bold">{playerName}</span>!</p>
          <p className={`text-4xl font-extrabold ${theme.textAccentBold}`}>{score}<span className="text-white/30 text-2xl">/{questionsAnswered}</span></p>
          <p className="text-white/30 text-xs mt-1">Free round complete · {questionsAnswered} questions</p>
        </div>

        {/* Pro pitch */}
        <div className={`rounded-2xl p-5 mb-4 bg-gradient-to-br ${theme.gradient} bg-opacity-10`}
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.35)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className={theme.textAccent} />
            <h2 className="text-white font-extrabold text-lg">Unlock Kwizzo Pro</h2>
            <span className={`ml-auto text-xs font-black px-2.5 py-1 rounded-full bg-gradient-to-r ${theme.gradient} text-white`}>
              £3.99/mo
            </span>
          </div>
          <ul className="space-y-2 mb-4">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                <CheckCircle size={13} className="text-green-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={upgrade}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r ${theme.gradient} text-white shadow-lg hover:opacity-90 disabled:opacity-50 transition-all`}
          >
            {loading ? <span className="animate-spin inline-block">⟳</span> : <Zap size={15} />}
            {loading ? 'Opening checkout…' : 'Get Pro — £3.99/month'}
          </button>
          {err && <p className="text-red-400 text-xs text-center mt-2">{err}</p>}
          <p className="text-white/25 text-[10px] text-center mt-2">Cancel anytime · Secure payment via Stripe</p>
        </div>

        {/* Free fallback actions */}
        <div className="flex gap-2">
          <button onClick={onContinueFree} className={btn.secondary + ' flex-1 justify-center py-3 text-sm'}>
            <RotateCcw size={14} /> Play again (free)
          </button>
          <button onClick={onNewGame} className={`flex-1 justify-center py-3 text-sm flex items-center gap-1.5 rounded-xl border border-white/[0.08] text-white/40 hover:text-white/70 transition-colors`}>
            <Home size={14} /> New game
          </button>
        </div>
      </div>
    </div>
  )
}

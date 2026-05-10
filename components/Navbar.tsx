'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useMagicAuth } from '@/lib/shared/useMagicAuth'
import MagicAuthModal from '@/lib/shared/MagicAuthModal'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const { user, logout, onSuccess } = useMagicAuth()

  return (
    <>
      <nav className="sticky top-0 z-50" style={{ background: 'rgba(13,6,24,0.60)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
        {/* Animated gradient line at top */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #7c3aed, #d946ef, #7c3aed, transparent)', animation: 'shimmer 3s linear infinite', backgroundSize: '200% 100%' }} />

        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>⚡</span>
            <span className="font-black text-lg uppercase tracking-wider text-white">KWIZZO</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/#how-it-works" className="px-3 py-1 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-violet-500/40 transition-all">How it works</Link>
            <Link href="/#subjects"     className="px-3 py-1 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-violet-500/40 transition-all">Topics</Link>
            <Link href="/#leaderboard"  className="px-3 py-1 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-violet-500/40 transition-all">🏆 Leaderboard</Link>
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/play?mode=solo"   className="px-4 py-2 rounded-full text-sm text-white/70 border border-white/10 hover:border-violet-500/40 hover:text-white transition-all">Solo</Link>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/70">Hi, {user.username || user.email.split('@')[0]}</span>
                <button onClick={logout} className="px-3 py-1.5 rounded-full text-xs text-white/50 border border-white/10 hover:text-white hover:border-violet-500/40 transition-all">Sign out</button>
              </div>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="px-4 py-2 rounded-full text-sm font-bold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                Sign in free ⚡
              </button>
            )}
            <Link href="/play?mode=create" className="relative px-4 py-2 rounded-full text-sm font-bold text-white overflow-hidden transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              Play Free ⚡
            </Link>
          </div>

          <button className="md:hidden p-2 text-white/60 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-white/[0.06] px-6 py-4 flex flex-col gap-3 text-sm">
            <Link href="/#how-it-works"    className="text-white/70 hover:text-white" onClick={() => setOpen(false)}>How it works</Link>
            <Link href="/#subjects"        className="text-white/70 hover:text-white" onClick={() => setOpen(false)}>Topics</Link>
            <Link href="/#leaderboard"     className="text-white/70 hover:text-white" onClick={() => setOpen(false)}>🏆 Leaderboard</Link>
            <Link href="/play?mode=solo"   className="text-center py-2 rounded-full border border-white/10 text-white/70" onClick={() => setOpen(false)}>Solo</Link>
            {user ? (
              <>
                <span className="text-center text-white/50 text-xs">Signed in as {user.email}</span>
                <button onClick={() => { logout(); setOpen(false) }} className="text-center py-2 rounded-full border border-white/10 text-white/50">Sign out</button>
              </>
            ) : (
              <button onClick={() => { setAuthOpen(true); setOpen(false) }} className="text-center py-2 rounded-full font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                Sign in free ⚡
              </button>
            )}
            <Link href="/play?mode=create" className="text-center py-2 rounded-full font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }} onClick={() => setOpen(false)}>Play Free ⚡</Link>
          </div>
        )}
      </nav>

      <MagicAuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={u => { onSuccess(u); setAuthOpen(false) }}
        site="kwizzo"
        accentColor="#7c3aed"
      />
    </>
  )
}

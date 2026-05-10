'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Zap, Users, Star, Trophy, Sparkles, Crown, CheckCircle2, XCircle } from 'lucide-react'
import config from '@/vertical.config'
import { theme, btn } from '@/lib/theme'
import { isAiTool } from '@/vertical.config'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { AnimatedList } from '@/components/magicui/animated-list'

/* ── helpers ─────────────────────────────────────────────── */
const PRO_KEY = 'kwizzo-pro'

/* ── static data ─────────────────────────────────────────── */
const FEATURES = [
  { icon: '🎲', title: 'Never the same quiz twice', desc: 'AI generates fresh questions every round — even on the same topic.' },
  { icon: '👨‍👩‍👧‍👦', title: 'Any age plays together', desc: 'Kids get easy questions, adults get hard — one game, everyone wins.' },
  { icon: '⚡', title: 'Ready in 30 seconds', desc: 'No downloads, no accounts. Pick a topic and start immediately.' },
  { icon: '🏆', title: 'Live leaderboard', desc: 'Rankings update after every question. Watch the drama unfold.' },
]

const PRO_FEATURES = [
  'Unlimited quiz categories',
  'Custom quiz creation',
  'Family leaderboard',
  'No ads — ever',
  'Priority AI responses',
  'Export results & scorecards',
]

const FREE_FEATURES = [
  '3 free rounds per session',
  '10 standard categories',
  'Solo & group modes',
  'Basic leaderboard',
]

const LEADERBOARD = [
  { name: 'Dad', score: 4820, emoji: '🥇', streak: 12, badge: '🔥' },
  { name: 'Maya', score: 3950, emoji: '🥈', streak: 7, badge: '⚡' },
  { name: 'Tom',  score: 3120, emoji: '🥉', streak: 4, badge: '🎯' },
  { name: 'Lily', score: 2540, emoji: '4️⃣', streak: 2, badge: '🌟' },
]

const STATS = [
  { target: 10000, suffix: '+', l: 'Families play weekly' },
  { target: 50,    suffix: '+', l: 'Topics' },
  { target: 30,    suffix: 's', l: 'To start' },
  { target: 100,   suffix: '%', l: 'Free to try' },
]

const XP_BADGES = [
  { label: 'Quiz Master', xp: '5000 XP', icon: '👑', color: '#a855f7' },
  { label: 'Speed Demon', xp: '2500 XP', icon: '⚡', color: '#d946ef' },
  { label: 'Family Hero', xp: '1000 XP', icon: '🦸', color: '#f59e0b' },
]

/* ── confetti particle positions — fixed to avoid hydration mismatch ── */
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  left: `${(i * 3.8 + 2) % 97}%`,
  top:  `${(i * 6.7 + 3) % 92}%`,
  size: i % 4 === 0 ? 12 : i % 4 === 1 ? 8 : i % 4 === 2 ? 6 : 4,
  delay: `${(i * 0.31).toFixed(2)}s`,
  dur:   `${2.8 + (i % 5) * 0.45}s`,
  color: ['#a855f7','#d946ef','#f59e0b','#7c3aed','#ec4899','#fbbf24','#c084fc','#f0abfc'][i % 8],
  rotate: i % 3 === 0 ? 45 : 0,
}))


/* ── stat item with count-up ─────────────────────────────── */
function StatItem({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="text-center">
      <div className={`text-2xl sm:text-3xl font-black ${theme.gradientText} tabular-nums`}>
        {visible ? (
          <NumberTicker value={target} suffix={suffix} className="font-bold text-3xl text-white" />
        ) : (
          <span>0{suffix}</span>
        )}
      </div>
      <div className="text-white/40 text-xs mt-1">{label}</div>
    </div>
  )
}

/* ── component ───────────────────────────────────────────── */
export default function HomePage() {
  const subjects  = isAiTool(config) ? config.subjects : []
  const [isPro, setIsPro]         = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [streakCount, setStreakCount] = useState(0)
  const [lbVisible, setLbVisible] = useState(false)

  /* handle ?upgraded=1 — set pro flag in localStorage */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === '1') {
      localStorage.setItem(PRO_KEY, '1')
      window.history.replaceState({}, '', window.location.pathname)
    }
    setIsPro(localStorage.getItem(PRO_KEY) === '1')
  }, [])

  /* animated streak counter */
  useEffect(() => {
    let n = 0
    const target = 12
    const timer = setInterval(() => {
      n += 1
      setStreakCount(n)
      if (n >= target) clearInterval(timer)
    }, 80)
    return () => clearInterval(timer)
  }, [])

  /* leaderboard XP bar entrance */
  useEffect(() => {
    const timer = setTimeout(() => setLbVisible(true), 600)
    return () => clearTimeout(timer)
  }, [])

  /* Stripe checkout */
  const handleUpgrade = useCallback(async () => {
    setUpgrading(true)
    try {
      const res  = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Could not start checkout. Please try again.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setUpgrading(false)
    }
  }, [])

  return (
    <div className="overflow-hidden">

      {/* ── ANIMATED BACKGROUND ──────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Confetti particles */}
        {CONFETTI.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              borderRadius: p.rotate ? '2px' : '50%',
              background: p.color,
              opacity: 0.22,
              transform: p.rotate ? `rotate(${p.rotate}deg)` : undefined,
              animation: `float ${p.dur} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
        {/* Neon pulsing rings */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 700, borderRadius: '50%',
          border: '1.5px solid rgba(139,92,246,0.14)',
          animation: 'pulseGlow 4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)',
          width: 460, height: 460, borderRadius: '50%',
          border: '1px solid rgba(217,70,239,0.12)',
          animation: 'pulseGlow 5.5s ease-in-out 1.2s infinite',
        }} />
        <div style={{
          position: 'absolute', top: '26%', left: '50%', transform: 'translateX(-50%)',
          width: 260, height: 260, borderRadius: '50%',
          border: '1px solid rgba(168,85,247,0.10)',
          animation: 'pulseGlow 3.5s ease-in-out 0.6s infinite',
        }} />
        {/* Spotlight beam */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 400, height: 500,
          background: 'radial-gradient(ellipse at top, rgba(139,92,246,0.22) 0%, transparent 70%)',
        }} />
        {/* Left/right neon accents */}
        <div style={{
          position: 'absolute', top: '30%', left: '-80px',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,70,239,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: '-80px',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        }} />
      </div>

      {/* ── PRO BANNER ───────────────────────────────────────── */}
      {isPro && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-amber-400/20 border-b border-yellow-500/30 py-2 px-4 text-center text-sm font-bold text-yellow-300">
          <Crown size={14} className="inline mr-1" /> You&apos;re on Kwizzo PRO — enjoy unlimited everything!
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 pt-10 sm:pt-16 pb-10 sm:pb-16 max-w-5xl mx-auto">
        {/* neon grid overlay */}
        <div className="absolute inset-0 -z-10 opacity-[0.035]"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="text-center">
          {/* Live badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${theme.badge} text-xs font-black mb-5 border border-violet-500/40 uppercase tracking-widest`}
            style={{ boxShadow: '0 0 20px rgba(139,92,246,0.25)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            10,000+ families playing now · Free · No sign-up
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-[5.5rem] font-black leading-[0.88] tracking-tighter mb-5">
            <span className="text-white block">THE AI QUIZ GAME</span>
            <span className={`${theme.gradientText} block`} style={{ filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.6))' }}>
              YOUR WHOLE FAMILY
            </span>
            <span className="text-white block">WILL LOVE.</span>
          </h1>

          <p className="text-white/55 text-base sm:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
            Age-perfect AI questions for every player. Pick a topic, add names,{' '}
            <strong className="text-white/85">let the battle begin.</strong>{' '}
            Trusted by <strong className="text-violet-300">10,000+ families</strong> worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-7">
            <Link href="/play?mode=solo">
              <ShimmerButton background="rgba(124, 58, 237, 1)" shimmerColor="#e9d5ff" className="px-8 py-4 text-lg font-semibold">
                ⚡ Start Playing Free →
              </ShimmerButton>
            </Link>
            <Link href="/play?mode=group" className={btn.secondary + ' text-base px-9 py-4 font-black tracking-wide text-lg'}>
              <Users size={16} /> Family Mode
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-center mb-2">
            {['✓ No account needed', '✓ Any device', '✓ Fresh AI questions every game', '✓ All ages welcome'].map(f => (
              <span key={f} className="text-xs text-violet-300/75 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">{f}</span>
            ))}
          </div>
        </div>

        {/* ── STREAK + XP BADGES ──── */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {/* Live streak counter */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-orange-500/40 bg-orange-500/10"
            style={{ boxShadow: '0 0 20px rgba(249,115,22,0.15)' }}>
            <span className="text-3xl">🔥</span>
            <div>
              <div className="text-orange-400 font-black text-2xl tabular-nums">{streakCount}-day streak</div>
              <div className="text-white/40 text-xs">Keep it going!</div>
            </div>
          </div>

          {XP_BADGES.map(b => (
            <div key={b.label}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10"
              style={{ background: `${b.color}18`, borderColor: `${b.color}30` }}>
              <span className="text-2xl">{b.icon}</span>
              <div>
                <div className="text-white font-bold text-sm">{b.label}</div>
                <div className="text-xs font-black" style={{ color: b.color }}>{b.xp}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS BAR — animated count-up ────────────────────── */}
      <section className="border-y border-white/[0.06] py-7 glass">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <StatItem key={s.l} target={s.target} suffix={s.suffix} label={s.l} />
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────── */}
      <section className="py-8 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { q: '"Kids AND adults love it — finally a game everyone enjoys"', name: 'Sarah M.', stars: 5 },
            { q: '"Friday nights are now Kwizzo nights. 100% recommend."', name: 'James T.', stars: 5 },
            { q: '"Our 7-year-old beats us every time. The AI is brilliant."', name: 'Priya K.', stars: 5 },
          ].map(r => (
            <div key={r.name} className="flex-1 min-w-[220px] max-w-xs p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <div className="stars text-sm mb-2">{'★'.repeat(r.stars)}</div>
              <p className="text-white/65 text-sm leading-relaxed italic mb-2">{r.q}</p>
              <p className="text-violet-400 text-xs font-bold">— {r.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEADERBOARD PREVIEW ──────────────────────────────── */}
      <section id="leaderboard" className="py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${theme.textAccent} mb-3`}>
            <Trophy size={12} /> Live Leaderboard Preview
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">Who&apos;s top of the family?</h2>
          <p className="text-white/40 text-sm mt-2">Rankings update live after every question — no mercy</p>
        </div>

        <AnimatedList delay={800} className="w-full max-w-lg mx-auto">
          {LEADERBOARD.map((p, i) => (
            <div key={p.name}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-700 ${i === 0 ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-amber-400/5' : 'border-white/10 bg-white/[0.04]'}`}
              style={{ boxShadow: i === 0 ? '0 0 25px rgba(234,179,8,0.12)' : undefined }}
            >
              <span className="text-2xl w-8 text-center">{p.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-white font-bold">{p.name}</span>
                  <span className="text-sm">{p.badge}</span>
                  {p.streak > 5 && (
                    <span className="text-xs text-orange-400 font-bold bg-orange-500/15 px-2 py-0.5 rounded-full">
                      🔥 {p.streak}-day streak
                    </span>
                  )}
                </div>
                {/* XP progress bar */}
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`}
                    style={{
                      width: lbVisible ? `${(p.score / 5000) * 100}%` : '0%',
                      transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </div>
              <div className={`text-right font-black tabular-nums ${i === 0 ? 'text-yellow-400' : theme.textAccent}`}>
                {p.score.toLocaleString()} pts
              </div>
            </div>
          ))}
        </AnimatedList>

        <p className="text-center text-white/30 text-xs mt-4">
          Sample leaderboard — your family&apos;s scores will appear here in real time
        </p>
      </section>

      {/* ── TOPIC GRID ───────────────────────────────────────── */}
      {subjects.length > 0 && (
        <section id="subjects" className="py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${theme.textAccent} mb-3`}>
              <Zap size={12} /> Pick your topic
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Choose your arena</h2>
            <p className="text-white/40 text-sm mt-2">Fresh AI questions every game — never the same twice</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {subjects.map(subject => (
              <Link
                key={subject.id}
                href={`/play?mode=solo&subject=${subject.id}`}
                className={`group ${theme.card} ${theme.cardHover} p-4 flex flex-col gap-2 text-center items-center rounded-2xl transition-all border border-white/[0.08] hover:border-violet-500/40 hover:scale-105`}
              >
                <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{subject.icon}</span>
                <span className="font-bold text-white text-xs">{subject.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── WHY KWIZZO PRO ───────────────────────────────────── */}
      <section id="why-pro" className="py-12 sm:py-16 px-4 sm:px-6 glass border-y border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${theme.textAccent} mb-3`}>
              <Crown size={12} /> Why Go PRO?
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">
              Everything your family needs
            </h2>
            <p className="text-white/40 text-sm">For less than the price of one coffee per month</p>
          </div>

          {/* WHY PRO highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: '♾️', title: 'Unlimited Categories', desc: '50+ topics — science, sport, pop culture, history & more.' },
              { icon: '✏️', title: 'Custom Quiz Creator', desc: 'Build your own quizzes. Use them every game night.' },
              { icon: '🏆', title: 'Family Leaderboard', desc: 'Track scores over time. Crown the family champion.' },
              { icon: '🚫', title: 'Zero Ads', desc: 'Clean, distraction-free gameplay. Always.' },
            ].map(f => (
              <div key={f.title}
                className="p-5 rounded-2xl border border-violet-500/20 text-center"
                style={{ background: 'rgba(139,92,246,0.06)' }}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-black text-white text-sm mb-1">{f.title}</h3>
                <p className="text-white/45 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="flex gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <div className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'rgba(139,92,246,0.15)' }}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-white/45 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING — FREE vs PRO ────────────────────────────── */}
      <section id="pro" className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${theme.textAccent} mb-3`}>
            <Star size={12} /> Pricing
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-2">Free vs PRO</h2>
          <p className="text-white/40 text-base">Upgrade your whole family for less than a coffee ☕</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* FREE */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 flex flex-col gap-5">
            <div>
              <div className="text-white/50 text-xs font-black uppercase tracking-widest mb-1">Free</div>
              <div className="text-4xl font-black text-white">$0</div>
              <div className="text-white/30 text-xs mt-0.5">Forever free · no card needed</div>
            </div>
            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                  <CheckCircle2 size={16} className="text-white/30 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/play?mode=solo" className={btn.secondary + ' justify-center font-black'}>
              Play Free Now
            </Link>
          </div>

          {/* PRO */}
          <div className="rounded-3xl border-2 border-violet-500/60 bg-gradient-to-b from-violet-900/35 to-purple-900/20 p-7 flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: 'inset 0 0 60px rgba(139,92,246,0.14), 0 0 40px rgba(139,92,246,0.15)' }} />
            <div className="absolute top-4 right-4">
              <span className="text-xs font-black text-yellow-300 bg-yellow-500/20 border border-yellow-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ✨ Most popular
              </span>
            </div>
            <div className="relative">
              <div className={`text-xs font-black uppercase tracking-widest mb-1 ${theme.textAccent}`}>PRO Family</div>
              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-black text-white">$5</span>
                <span className="text-white/40 text-base mb-1.5">/month</span>
              </div>
              <div className="text-white/30 text-xs">Billed monthly · cancel anytime · no hidden fees</div>
            </div>
            <ul className="space-y-3 flex-1 relative">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/85">
                  <CheckCircle2 size={16} className="text-violet-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-2.5 text-sm text-green-400/80 font-bold">
                <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                No ads — ever
              </li>
            </ul>
            {isPro ? (
              <div className="relative flex items-center justify-center gap-2 py-3 rounded-xl font-black text-yellow-300 bg-yellow-500/15 border border-yellow-500/30">
                <Crown size={16} /> You&apos;re PRO!
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className={`relative ${btn.primary} justify-center font-black text-base py-4 w-full disabled:opacity-70`}
                style={{ boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
              >
                {upgrading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </span>
                ) : (
                  <><Crown size={16} /> Upgrade to PRO — $5/mo</>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-white/25 text-xs mt-6 flex items-center justify-center gap-2">
          <span>🔒 Secure payment via Stripe</span>
          <span>·</span>
          <span>Cancel anytime</span>
          <span>·</span>
          <span>No hidden fees</span>
        </p>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-white/[0.05]">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Start playing in 4 steps</h2>
          <p className="text-white/40 text-sm">Under a minute from landing to playing, guaranteed</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: '🎯', step: '01', title: 'Pick a topic', desc: 'Choose from 50+ categories.' },
            { icon: '👤', step: '02', title: 'Add players', desc: 'Solo or up to 6 — names & ages.' },
            { icon: '🤖', step: '03', title: 'AI generates', desc: 'Age-perfect questions instantly.' },
            { icon: '🏆', step: '04', title: 'Play & win', desc: 'Answer, score, dominate the leaderboard.' },
          ].map(step => (
            <div key={step.step} className="text-center group">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 border border-white/10 group-hover:scale-110 transition-transform duration-200"
                style={{ background: 'rgba(139,92,246,0.14)', boxShadow: '0 0 20px rgba(139,92,246,0.15)' }}>
                {step.icon}
              </div>
              <div className={`text-[11px] font-black ${theme.textAccent} mb-1 uppercase tracking-widest`}>{step.step}</div>
              <h3 className="font-bold text-white text-sm mb-1">{step.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FOOTER ───────────────────────────────────────── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 glass border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-5 animate-bounce">🎮</div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Ready to play?</h2>
          <p className="text-white/45 mb-7 text-base">No account needed. Game night starts in 30 seconds.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/play?mode=solo"
              className={btn.primary + ' text-base px-10 py-4 font-black text-lg'}
              style={{ boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}>
              ⚡ Play Solo
            </Link>
            <Link href="/play?mode=group" className={btn.secondary + ' text-base px-10 py-4 font-black text-lg'}>
              👨‍👩‍👧‍👦 Play with Family
            </Link>
          </div>
          {!isPro && (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="mt-5 text-sm text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors disabled:opacity-50 font-bold"
            >
              {upgrading ? 'Redirecting to checkout...' : '✨ Upgrade to PRO — $5/mo →'}
            </button>
          )}
          <div className="flex flex-col items-center gap-1 text-xs opacity-45 mt-5">
            <span>✓ 3 free rounds — no account needed</span>
            <span>✓ Register free for unlimited access</span>
            <span>✓ PRO Family Plan: full access for $5/mo</span>
          </div>
        </div>
      </section>

    </div>
  )
}

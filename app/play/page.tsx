'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowRight, Users, Zap, Pencil, Crown, ChevronRight } from 'lucide-react'
import config from '@/vertical.config'
import { isAiTool } from '@/vertical.config'
import { theme, btn } from '@/lib/theme'
import { isProUser, startCheckout } from '@/lib/pro'
import { useGate } from '@/lib/shared/useGate'
import RegisterGate from '@/lib/shared/RegisterGate'

function getParam(key: string): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get(key) ?? ''
}

type Member   = { name: string; age: string }
type GameType = 'quiz' | 'draw'
type Mode     = 'solo' | 'group' | 'join'

const SUBJECTS = isAiTool(config) ? config.subjects : []

// Split subjects into two rows for the pill grid
const ROW1 = SUBJECTS.slice(0, Math.ceil(SUBJECTS.length / 2))
const ROW2 = SUBJECTS.slice(Math.ceil(SUBJECTS.length / 2))

function PlayContent() {
  const router = useRouter()

  const modeParam      = getParam('mode') || 'solo'
  const defaultSubject = getParam('subject')
  const defaultGame    = (getParam('game') as GameType) || 'quiz'

  const [gameType,    setGameType]    = useState<GameType>(defaultGame)
  const [mode,        setMode]        = useState<Mode>(
    defaultGame === 'draw' ? 'group' :
    modeParam === 'group'  ? 'group' :
    modeParam === 'join'   ? 'join'  : 'solo'
  )
  const [members,     setMembers]     = useState<Member[]>([{ name: '', age: '' }])
  const [subject,     setSubject]     = useState(defaultSubject)
  const [creating,    setCreating]    = useState(false)
  const [error,       setError]       = useState('')
  const [roomCode,    setRoomCode]    = useState('')
  const [joinError,   setJoinError]   = useState('')
  const [isPro,       setIsPro]       = useState(false)
  const [customTopic, setCustomTopic] = useState('')
  const [proLoading,  setProLoading]  = useState(false)
  const [step,        setStep]        = useState<'topic' | 'players'>(defaultSubject ? 'players' : 'topic')

  const { count: gateCount, showGate, increment: gateIncrement, onRegistered, dismissGate } = useGate('kwizzo', 3)

  useEffect(() => { setIsPro(isProUser()) }, [])

  const joinInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kwizzo_family')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.members?.length) {
          const clean: Member[] = data.members.map((m: Member) => ({
            name: /^\d+$/.test((m.name ?? '').trim()) ? '' : (m.name ?? ''),
            age:  m.age ?? '',
          }))
          setMembers(clean)
        }
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (mode === 'join') setTimeout(() => joinInputRef.current?.focus(), 100)
  }, [mode])

  function selectGameType(g: GameType) {
    setGameType(g)
    if (g === 'draw') {
      setMode('group')
      setMembers(prev => prev.length < 2 ? [...prev, { name: '', age: '' }] : prev)
    }
  }

  function addMember()                                   { setMembers(prev => [...prev, { name: '', age: '' }]) }
  function removeMember(i: number)                       { setMembers(prev => prev.filter((_, idx) => idx !== i)) }
  function updateMember(i: number, f: keyof Member, v: string) {
    setMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [f]: v } : m))
  }

  function selectSubject(id: string) {
    setSubject(id)
    setError('')
    // Auto-advance to players step after topic picked
    setTimeout(() => setStep('players'), 180)
  }

  async function handleStart() {
    setError('')
    if (gameType === 'quiz' && !subject) { setError('Pick a topic first.'); setStep('topic'); return }
    const valid = members.filter(m => m.name.trim() && m.age)
    if (!valid.length) { setError('Add at least one player with a name and age.'); return }
    if (valid.find(m => /^\d+$/.test(m.name.trim()))) {
      setError('Player name cannot be a number.'); return
    }
    if (gameType === 'draw' && valid.length < 2) {
      setError('Draw & Guess needs at least 2 players.'); return
    }
    const allowed = await gateIncrement()
    if (!allowed) return
    setCreating(true)
    try {
      const code = String(Math.floor(1000 + Math.random() * 9000))
      localStorage.setItem('kwizzo_family', JSON.stringify({ members: valid }))
      localStorage.setItem(`kwizzo_room_${code}`, JSON.stringify({
        familyName: valid.map(m => m.name).join(' & '),
        members: valid, subject, code,
      }))
      router.push(gameType === 'draw' ? `/draw/${code}` : `/quiz/${code}?subject=${subject}`)
    } catch {
      setError('Something went wrong. Try again.')
      setCreating(false)
    }
  }

  function handleJoin() {
    setJoinError('')
    const code = roomCode.trim()
    if (!/^\d{4}$/.test(code)) { setJoinError('Enter a valid 4-digit room code.'); return }
    router.push(gameType === 'draw' ? `/draw/${code}` : `/quiz/${code}`)
  }

  const isSetup = mode === 'solo' || mode === 'group'

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Hero top bar ───────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${theme.gradient} px-4 pt-10 pb-8`}>
        <div className="max-w-lg mx-auto text-center">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-3xl font-black text-white mb-1">Kwizzo</h1>
          <p className="text-white/70 text-sm">AI-powered quizzes for any age, any topic</p>

          {/* Game type toggle */}
          <div className="flex gap-2 justify-center mt-5">
            {([
              { id: 'quiz' as const, icon: '🧠', label: 'Quiz' },
              { id: 'draw' as const, icon: '🎨', label: 'Draw & Guess' },
            ]).map(g => (
              <button
                key={g.id}
                onClick={() => selectGameType(g.id)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  gameType === g.id
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 -mt-4 pb-8 space-y-3">

        {/* ── Mode tabs ── */}
        <div className="bg-[#0d0d1a] rounded-2xl border border-white/[0.07] p-1 flex gap-1">
          {([
            { id: 'solo'  as const, label: 'Solo',         icon: <Zap size={14} />,   disabled: gameType === 'draw' },
            { id: 'group' as const, label: 'Play Together', icon: <Users size={14} />, disabled: false },
            { id: 'join'  as const, label: 'Join Room',     icon: <span className="text-sm">🔑</span>, disabled: false },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => !t.disabled && setMode(t.id)}
              disabled={t.disabled}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                t.disabled    ? 'text-white/15 cursor-not-allowed' :
                mode === t.id ? `bg-gradient-to-r ${theme.gradient} text-white shadow` :
                'text-white/40 hover:text-white/70'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Join room ── */}
        {mode === 'join' && (
          <div className="bg-[#0d0d1a] border border-white/[0.08] rounded-2xl p-5">
            <p className="text-white font-bold mb-1">Join a game</p>
            <p className="text-white/35 text-xs mb-4">Enter the 4-digit code from the host</p>
            <input
              ref={joinInputRef}
              className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl text-center text-3xl font-black tracking-[0.3em] text-white py-3 mb-3 outline-none focus:border-white/30 transition-colors"
              placeholder="0000"
              maxLength={4}
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              inputMode="numeric"
            />
            {joinError && <p className="text-red-400 text-xs mb-3">{joinError}</p>}
            <button onClick={handleJoin} className={btn.primary + ' w-full justify-center py-3'}>
              Join Room <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── Setup flow ── */}
        {isSetup && (
          <>
            {/* Step indicator — only for quiz */}
            {gameType === 'quiz' && (
              <div className="flex items-center gap-2 px-1">
                <button
                  onClick={() => setStep('topic')}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${step === 'topic' ? 'text-white' : 'text-white/30'}`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === 'topic' ? `bg-gradient-to-br ${theme.gradient} text-white` : subject ? 'bg-green-500 text-white' : 'bg-white/10 text-white/30'}`}>
                    {subject ? '✓' : '1'}
                  </span>
                  Topic
                </button>
                <ChevronRight size={12} className="text-white/20" />
                <button
                  onClick={() => subject && setStep('players')}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${step === 'players' ? 'text-white' : 'text-white/30'}`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === 'players' ? `bg-gradient-to-br ${theme.gradient} text-white` : 'bg-white/10 text-white/30'}`}>2</span>
                  Players
                </button>
              </div>
            )}

            {/* ── STEP 1: Topic ── */}
            {(gameType === 'quiz' && step === 'topic') && (
              <div className="bg-[#0d0d1a] border border-white/[0.08] rounded-2xl p-4">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
                  Choose a topic
                </p>

                {/* Pill grid — two scrollable rows */}
                <div className="space-y-2 mb-3">
                  {[ROW1, ROW2].map((row, ri) => (
                    <div key={ri} className="flex gap-2 flex-wrap">
                      {row.map(s => (
                        <button
                          key={s.id}
                          onClick={() => selectSubject(s.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                            subject === s.id
                              ? `bg-gradient-to-r ${theme.gradient} text-white shadow-lg scale-105`
                              : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/60 border border-white/[0.08]'
                          }`}
                        >
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Pro: custom topic */}
                {isPro ? (
                  <div className="pt-3 border-t border-white/[0.07]">
                    <p className="text-amber-400/70 text-xs mb-2 flex items-center gap-1.5">
                      <Crown size={11} /> Pro — type any topic
                    </p>
                    <input
                      className="w-full bg-white/[0.06] border border-white/[0.12] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/30 transition-colors"
                      placeholder="e.g. Ancient Egypt, Premier League, Taylor Swift…"
                      value={customTopic}
                      onChange={e => {
                        setCustomTopic(e.target.value)
                        if (e.target.value.trim()) { setSubject('custom:' + e.target.value.trim()); setError('') }
                        else setSubject('')
                      }}
                    />
                    {customTopic && (
                      <button onClick={() => setStep('players')} className={btn.primary + ' w-full justify-center mt-2 py-2.5'}>
                        Use "{customTopic}" <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={async () => { setProLoading(true); try { await startCheckout() } catch { setProLoading(false) } }}
                    disabled={proLoading}
                    className="mt-2 w-full py-2 rounded-xl border border-amber-500/25 text-amber-400/70 hover:text-amber-400 hover:border-amber-500/50 transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Crown size={11} /> {proLoading ? 'Opening…' : 'Pro: any topic — £3.99/mo'}
                  </button>
                )}
              </div>
            )}

            {/* ── STEP 2: Players ── */}
            {(gameType === 'draw' || step === 'players') && (
              <>
                {/* Draw info card */}
                {gameType === 'draw' && (
                  <div className="bg-[#0d0d1a] border border-white/[0.08] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🎨</span>
                      <div>
                        <p className="text-white font-bold text-sm">Draw & Guess</p>
                        <p className="text-white/30 text-xs">2+ players · take turns drawing</p>
                      </div>
                    </div>
                    <ul className="space-y-1 text-xs text-white/40 mt-2">
                      {[
                        'AI picks a word tailored to each age',
                        'Draw on paper — others guess in the app',
                        'AI checks if your guess is close enough',
                        'Hint unlocks after 30s',
                      ].map((t, i) => <li key={i} className="flex gap-2"><span>·</span>{t}</li>)}
                    </ul>
                  </div>
                )}

                {/* Selected topic recap — quiz only */}
                {gameType === 'quiz' && subject && (
                  <button
                    onClick={() => setStep('topic')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r ${theme.gradient} bg-opacity-10 border border-white/[0.08] text-left`}
                  >
                    <span className="text-xl">{SUBJECTS.find(s => s.id === subject)?.icon ?? '🎯'}</span>
                    <div className="flex-1">
                      <div className="text-white/40 text-[10px] uppercase tracking-wider">Topic</div>
                      <div className="text-white font-bold text-sm capitalize">{subject.startsWith('custom:') ? subject.slice(7) : subject.replace(/-/g, ' ')}</div>
                    </div>
                    <span className="text-white/30 text-xs">Change</span>
                  </button>
                )}

                {/* Players */}
                <div className="bg-[#0d0d1a] border border-white/[0.08] rounded-2xl p-4">
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
                    Who&apos;s playing?
                  </p>
                  <div className="space-y-2">
                    {members.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5">
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                          {m.name.trim() ? m.name.trim()[0].toUpperCase() : String(i + 1)}
                        </div>
                        <input
                          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 outline-none min-w-0"
                          placeholder={`Player ${i + 1} name`}
                          value={m.name}
                          autoComplete="off"
                          onChange={e => updateMember(i, 'name', e.target.value)}
                        />
                        <div className="w-px h-4 bg-white/[0.10] shrink-0" />
                        <input
                          className="w-10 bg-transparent text-white/60 text-sm text-center font-semibold placeholder:text-white/20 outline-none shrink-0"
                          type="number"
                          placeholder="Age"
                          min="3" max="110"
                          inputMode="numeric"
                          value={m.age}
                          onChange={e => updateMember(i, 'age', e.target.value)}
                        />
                        <span className="text-white/20 text-xs shrink-0">yrs</span>
                        {members.length > 1 && (
                          <button onClick={() => removeMember(i)} className="text-white/15 hover:text-red-400 transition-colors shrink-0">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addMember}
                    className="mt-2.5 w-full py-2.5 rounded-xl border border-dashed border-white/[0.12] text-white/35 hover:text-white/60 hover:border-white/25 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={13} /> Add player
                  </button>
                </div>

                {mode === 'group' && gameType !== 'draw' && (
                  <p className="text-white/25 text-xs text-center px-4">
                    💡 A room code will be generated — share it so others can join
                  </p>
                )}

                {error && (
                  <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                    {error}
                  </p>
                )}

                {/* Start button */}
                <button
                  onClick={handleStart}
                  disabled={creating}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all bg-gradient-to-r ${theme.gradient} text-white shadow-lg hover:opacity-90 active:scale-[0.98] disabled:opacity-50`}
                >
                  {creating
                    ? <><span className="inline-block animate-spin">⟳</span> Setting up…</>
                    : gameType === 'draw'
                    ? <><Pencil size={18} /> Start Drawing!</>
                    : <>{mode === 'solo' ? 'Start Quiz' : 'Start Game'} <ArrowRight size={18} /></>
                  }
                </button>
              </>
            )}
          </>
        )}
      </div>

      {showGate && (
        <RegisterGate
          freeUsed={gateCount}
          freeLimit={3}
          freeFeature="game rounds"
          lockedFeature="unlimited games, tournaments & leaderboards"
          accentColor="#7c3aed"
          site="kwizzo"
          onSuccess={onRegistered}
          onDismiss={dismissGate}
        />
      )}
    </div>
  )
}

export default function PlayPage() {
  return <PlayContent />
}

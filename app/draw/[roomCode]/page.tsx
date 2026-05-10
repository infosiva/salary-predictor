'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, Trophy, RotateCcw, Home, Eye, EyeOff, Lightbulb, CheckCircle, XCircle } from 'lucide-react'
import { theme, btn } from '@/lib/theme'
import { Suspense } from 'react'
import type { DrawPrompt } from '@/app/api/draw/generate/route'

type Member    = { name: string; age: string }
type DrawState = 'loading' | 'drawer-reveal' | 'drawing' | 'guessing' | 'round-end' | 'finished'
type PlayerScore = { name: string; age: string; score: number; rounds: boolean[] }

const DRAW_SECONDS = 90   // seconds to draw
const HINT_AFTER   = 30   // show hint after N seconds

function DrawContent() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string

  const [gameState,      setGameState]      = useState<DrawState>('loading')
  const [playerPrompts,  setPlayerPrompts]  = useState<Record<string, DrawPrompt[]>>({})
  const [members,        setMembers]        = useState<Member[]>([])
  const [scores,         setScores]         = useState<PlayerScore[]>([])
  const [drawerIdx,      setDrawerIdx]      = useState(0)   // who is drawing this round
  const [promptIdx,      setPromptIdx]      = useState(0)   // which prompt for this drawer
  const [showWord,       setShowWord]       = useState(false)
  const [guess,          setGuess]          = useState('')
  const [guessResult,    setGuessResult]    = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft,       setTimeLeft]       = useState(DRAW_SECONDS)
  const [showHint,       setShowHint]       = useState(false)
  const [loadError,      setLoadError]      = useState('')
  const [guessCount,     setGuessCount]     = useState(0)   // total guesses this round
  const MAX_GUESSES = 5
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load prompts
  const loadPrompts = useCallback(async (ms: Member[]) => {
    setGameState('loading')
    setLoadError('')
    try {
      const res  = await fetch('/api/draw/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ members: ms.map(m => ({ name: m.name, age: Number(m.age) })) }),
      })
      const data = await res.json()
      if (data?.playerPrompts) {
        setPlayerPrompts(data.playerPrompts)
        setGameState('drawer-reveal')
      } else {
        setLoadError('Could not load drawing prompts.')
      }
    } catch {
      setLoadError('Network error. Please try again.')
    }
  }, [])

  useEffect(() => {
    try {
      const roomData = localStorage.getItem(`kwizzo_room_${roomCode}`)
      if (roomData) {
        const data = JSON.parse(roomData)
        const ms: Member[] = data.members ?? []
        setMembers(ms)
        setScores(ms.map(m => ({ name: m.name, age: m.age, score: 0, rounds: [] })))
        loadPrompts(ms)
      } else {
        const family = localStorage.getItem('kwizzo_family')
        const ms: Member[] = family ? (JSON.parse(family).members ?? []) : [{ name: 'Player', age: '18' }]
        setMembers(ms)
        setScores(ms.map(m => ({ name: m.name, age: m.age, score: 0, rounds: [] })))
        loadPrompts(ms)
      }
    } catch {
      const ms = [{ name: 'Player', age: '18' }]
      setMembers(ms)
      setScores(ms.map(m => ({ name: m.name, age: m.age, score: 0, rounds: [] })))
      loadPrompts(ms)
    }
  }, [roomCode, loadPrompts])

  // Timer during drawing phase
  useEffect(() => {
    if (gameState === 'drawing') {
      setTimeLeft(DRAW_SECONDS)
      setShowHint(false)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setGameState('round-end')
            return 0
          }
          if (prev === DRAW_SECONDS - HINT_AFTER) setShowHint(true)
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameState])

  const drawer        = members[drawerIdx]
  const drawerName    = drawer?.name ?? 'Player'
  const currentPrompt = playerPrompts[drawerName]?.[promptIdx] ?? null
  const guessers      = members.filter((_, i) => i !== drawerIdx)
  const totalRoundsPerPlayer = Math.min(
    ...members.map(m => playerPrompts[m.name]?.length ?? 0).filter(n => n > 0),
  ) || 5

  function getWarmCold(attempt: string, word: string): { label: string; color: string } | null {
    if (!attempt) return null
    const dist = levenshtein(attempt.toLowerCase(), word.toLowerCase())
    const overlap = attempt.toLowerCase().split('').filter(c => word.toLowerCase().includes(c)).length
    const warmScore = (overlap / word.length) * 100 - dist * 10
    if (dist === 0 || attempt.toLowerCase() === word.toLowerCase()) return null // correct — handled separately
    if (dist <= 1 || warmScore >= 80) return { label: '🔥 SO close!', color: 'text-orange-400' }
    if (dist <= 3 || warmScore >= 50) return { label: '♨️ Warm!', color: 'text-amber-400' }
    if (warmScore >= 20) return { label: '🌡️ Getting warmer', color: 'text-yellow-600' }
    return { label: '🧊 Cold…', color: 'text-blue-400' }
  }

  function handleGuess() {
    if (!currentPrompt || !guess.trim()) return
    const word    = currentPrompt.word.toLowerCase().trim()
    const attempt = guess.toLowerCase().trim()
    const newCount = guessCount + 1
    setGuessCount(newCount)
    // Fuzzy: exact or within 1 edit distance
    const correct = attempt === word ||
      attempt.includes(word) || word.includes(attempt) ||
      levenshtein(attempt, word) <= 1
    setGuessResult(correct ? 'correct' : 'wrong')
    if (correct) {
      clearInterval(timerRef.current!)
      setScores(prev => prev.map(s =>
        s.name !== drawerName ? { ...s, score: s.score + 1, rounds: [...s.rounds, true] } : s
      ))
      setGameState('round-end')
    } else if (newCount >= MAX_GUESSES) {
      // Out of guesses — reveal and move on
      clearInterval(timerRef.current!)
      setGameState('round-end')
    } else {
      setGuess('') // clear for next attempt
    }
  }

  function nextRound() {
    const nextDrawerIdx = drawerIdx + 1
    if (nextDrawerIdx >= members.length) {
      // Completed one full rotation — check if more prompts available
      const nextPromptIdx = promptIdx + 1
      if (nextPromptIdx >= totalRoundsPerPlayer) {
        setGameState('finished')
        return
      }
      setPromptIdx(nextPromptIdx)
      setDrawerIdx(0)
    } else {
      setDrawerIdx(nextDrawerIdx)
    }
    setGuess('')
    setGuessCount(0)
    setGuessResult(null)
    setShowWord(false)
    setGameState('drawer-reveal')
  }

  function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
    for (let j = 0; j <= n; j++) dp[0][j] = j
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]
  }

  const timerPct = (timeLeft / DRAW_SECONDS) * 100
  const timerColor = timeLeft > 30 ? theme.gradient : timeLeft > 10 ? 'from-amber-500 to-amber-400' : 'from-red-500 to-red-400'
  const sortedScores = [...scores].sort((a, b) => b.score - a.score)

  // ── Loading ────────────────────────────────────────────
  if (gameState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-5 float">🎨</div>
        <h2 className="text-xl font-bold text-white mb-2">Picking drawing prompts…</h2>
        <p className="text-white/30 text-sm mb-8">AI is choosing age-perfect words for each player</p>
        {loadError ? (
          <div className="space-y-3">
            <p className="text-red-400 text-sm px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">{loadError}</p>
            <button onClick={() => router.push('/play')} className={btn.secondary}>← Back</button>
          </div>
        ) : (
          <div className="flex gap-2 justify-center">
            {[0, 150, 300].map(d => (
              <div key={d} className={`w-2 h-2 rounded-full ${theme.solid} animate-bounce`} style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Finished ───────────────────────────────────────────
  if (gameState === 'finished') {
    const medals = ['🥇', '🥈', '🥉']
    return (
      <div className="min-h-screen px-3 sm:px-4 py-10 max-w-xl mx-auto">
        <div className="text-center mb-8 fade-up">
          <div className="text-6xl mb-4">🎨</div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Draw & Guess Complete!</h1>
          <p className="text-white/40 text-sm">See who was the best guesser</p>
        </div>
        <div className={`${theme.card} p-6 mb-6 fade-up`}>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy size={20} className={theme.textAccent} /> Leaderboard
          </h2>
          <div className="space-y-3">
            {sortedScores.map((s, i) => (
              <div key={s.name} className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? `bg-gradient-to-r ${theme.gradient} bg-opacity-20` : 'glass'}`}>
                <span className="text-2xl w-8">{medals[i] ?? `${i+1}`}</span>
                <div className="flex-1">
                  <div className="font-semibold text-white">{s.name}</div>
                  <div className="text-white/40 text-xs">Age {s.age}</div>
                </div>
                <div className={`text-xl font-extrabold ${i === 0 ? 'text-white' : theme.textAccent}`}>{s.score}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 fade-up">
          <button onClick={() => router.push('/play')} className={btn.primary + ' flex-1 justify-center py-4'}>
            <RotateCcw size={18} /> Play Again
          </button>
          <button onClick={() => router.push('/')} className={btn.secondary + ' flex-1 justify-center py-4'}>
            <Home size={18} /> Home
          </button>
        </div>
      </div>
    )
  }

  // ── Drawer reveal — show word to drawer privately ──────
  if (gameState === 'drawer-reveal') {
    const nextPrompt = playerPrompts[drawerName]?.[promptIdx]
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center max-w-md mx-auto">
        <div className="text-6xl mb-5">🎨</div>
        <p className="text-white/40 text-sm mb-2 uppercase tracking-widest">Draw & Guess</p>
        <h2 className="text-3xl font-extrabold text-white mb-1">
          <span className={theme.gradientText}>{drawerName}</span>'s turn to draw!
        </h2>
        <p className="text-white/40 text-sm mb-8">
          {guessers.length > 0
            ? `${guessers.map(g => g.name).join(' & ')} will guess`
            : 'Guess the word when ready'}
        </p>

        {/* Word reveal box */}
        <div className={`w-full ${theme.card} p-6 mb-6`}>
          <p className="text-white/40 text-xs mb-3 uppercase tracking-wider">Your word to draw</p>
          <div className="relative">
            {showWord ? (
              <div>
                <div className={`text-4xl font-extrabold ${theme.gradientText} mb-2`}>
                  {nextPrompt?.word ?? '—'}
                </div>
                <div className="text-white/30 text-xs">{nextPrompt?.category}</div>
              </div>
            ) : (
              <div className="text-4xl font-extrabold text-white/10 tracking-widest select-none">
                {'•'.repeat(nextPrompt?.word?.length ?? 5)}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowWord(!showWord)}
            className={`mt-4 flex items-center gap-2 mx-auto text-sm ${theme.textAccent} hover:opacity-70 transition-opacity`}
          >
            {showWord ? <><EyeOff size={15} /> Hide word</> : <><Eye size={15} /> Tap to see your word</>}
          </button>
        </div>

        <p className="text-white/30 text-xs mb-6">Make sure others aren't looking at your screen!</p>

        <button
          onClick={() => { setShowWord(false); setGameState('drawing') }}
          className={btn.primary + ' text-base px-10 py-4'}
        >
          Everyone's ready — Start! <ArrowRight size={18} />
        </button>

        {scores.some(s => s.rounds.length > 0) && (
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {sortedScores.map(s => (
              <div key={s.name} className={`${theme.card} px-3 py-1.5 rounded-xl flex items-center gap-1.5`}>
                <span className="text-white/60 text-xs">{s.name}</span>
                <span className={`${theme.textAccent} font-bold text-sm`}>{s.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!currentPrompt) return null

  // ── Drawing / Guessing in progress ────────────────────
  return (
    <div className="min-h-screen px-3 sm:px-4 py-5 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {drawerName?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{drawerName} is drawing</div>
            <div className="text-white/35 text-xs">{currentPrompt.difficulty} · round {promptIdx + 1}</div>
          </div>
        </div>
        <div className={`text-xl font-bold tabular-nums ${timeLeft <= 10 ? 'text-red-400' : timeLeft <= 30 ? 'text-amber-400' : theme.textAccentBold}`}>
          {timeLeft}s
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 bg-white/20 rounded-full mb-6 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${timerColor} transition-all duration-1000`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Drawer's view — they see the word */}
      <div className={`${theme.card} p-5 mb-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-[10px] font-bold ${theme.textAccent} uppercase tracking-widest mb-1`}>Draw this!</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{currentPrompt.word}</p>
            <p className="text-white/30 text-xs mt-1">{currentPrompt.category}</p>
          </div>
          {showHint && (
            <div className="text-right shrink-0 max-w-[45%]">
              <div className="flex items-center gap-1 text-amber-400 text-xs mb-1 justify-end">
                <Lightbulb size={12} /> Hint
              </div>
              <p className="text-white/50 text-xs leading-snug">{currentPrompt.hint}</p>
            </div>
          )}
        </div>
        {!showHint && (
          <p className="text-white/20 text-xs mt-3">💡 Hint appears in {Math.max(0, timeLeft - (DRAW_SECONDS - HINT_AFTER))}s</p>
        )}
      </div>

      {/* Drawing area reminder */}
      <div className="glass rounded-2xl p-5 mb-5 text-center border border-dashed border-white/[0.10]">
        <div className="text-5xl mb-2">✏️</div>
        <p className="text-white/50 text-sm">Draw on paper, whiteboard, or anything nearby!</p>
        <p className="text-white/25 text-xs mt-1">No app needed — just grab a pen</p>
      </div>

      {/* Guessers type their answer */}
      <div className={`${theme.card} p-5`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-bold ${theme.textAccent} uppercase tracking-widest`}>
            {guessers.length > 0 ? `${guessers.map(g => g.name).join(' / ')} — guess:` : 'Type your guess:'}
          </p>
          {guessCount > 0 && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              MAX_GUESSES - guessCount <= 1 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/50'
            }`}>
              {MAX_GUESSES - guessCount} left
            </span>
          )}
        </div>
        {gameState === 'guessing' || gameState === 'drawing' ? (
          <>
            <div className="flex gap-2">
              <input
                className="input-dark flex-1 py-3 text-base font-semibold"
                placeholder="What is it?"
                value={guess}
                onChange={e => setGuess(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuess()}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                onClick={handleGuess}
                disabled={!guess.trim()}
                className={btn.primary + ' py-3 px-5 disabled:opacity-40'}
              >
                Guess
              </button>
            </div>
            {/* Warm/cold feedback */}
            {guessResult === 'wrong' && guess.trim() && (() => {
              const wc = getWarmCold(guess, currentPrompt?.word ?? '')
              return wc ? (
                <div className={`flex items-center gap-2 mt-3 text-sm font-semibold ${wc.color} fade-up`}>
                  {wc.label}
                </div>
              ) : null
            })()}
            {guessResult === 'wrong' && !guess.trim() && (
              <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
                <XCircle size={16} /> Not quite — keep trying!
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Round end */}
      {gameState === 'round-end' && (
        <div className={`${theme.card} p-6 mt-5 border ${guessResult === 'correct' ? 'border-green-500/30' : 'border-white/10'}`}>
          <div className={`flex items-center gap-2 font-bold text-lg mb-2 ${guessResult === 'correct' ? 'text-green-400' : 'text-white/60'}`}>
            {guessResult === 'correct'
              ? <><CheckCircle size={20} /> Correct guess! +1 for guessers 🎉</>
              : <><XCircle size={18} /> Time's up! The answer was:</>
            }
          </div>
          {guessResult !== 'correct' && (
            <div className={`text-3xl font-extrabold ${theme.gradientText} mb-2`}>{currentPrompt.word}</div>
          )}
          <p className="text-white/50 text-sm mb-5">{currentPrompt.funFact}</p>
          <button onClick={nextRound} className={btn.primary + ' w-full justify-center py-4'}>
            {drawerIdx + 1 >= members.length && promptIdx + 1 >= totalRoundsPerPlayer
              ? <><Trophy size={18} /> See Leaderboard</>
              : <><ArrowRight size={18} /> Next round — {members[(drawerIdx + 1) % members.length]?.name} draws</>
            }
          </button>
        </div>
      )}

      {/* Score strip */}
      {scores.length > 1 && (
        <div className="mt-8 pt-5 border-t border-white/[0.06]">
          <div className="text-xs text-white/30 mb-2 uppercase tracking-widest">Scores</div>
          <div className="flex flex-wrap gap-2">
            {sortedScores.map(s => (
              <div key={s.name} className={`${theme.card} px-3 py-2 rounded-xl flex items-center gap-2`}>
                <span className="text-white/70 text-xs">{s.name}</span>
                <span className={`${theme.textAccent} font-bold text-sm`}>{s.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DrawPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/50">Loading…</div>
      </div>
    }>
      <DrawContent />
    </Suspense>
  )
}

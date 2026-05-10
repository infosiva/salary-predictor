'use client'
import { useEffect, useRef, useState } from 'react'

interface AdUnitProps {
  size?: 'banner' | 'rectangle'
  className?: string
  slot?: string    // forward-compat with AdSense slot IDs (unused internally)
  format?: string  // forward-compat (unused internally)
}

// ── Adsterra keys for kwizzo.app (approved 2026-05-04) ───────────────────────
const ADSTERRA_KEY_RECT   = '9a40a58b1898e8a5fce935ff449fbdbb'  // 300×250
const ADSTERRA_KEY_BANNER = '54177a1fe29737ce46c5992d808519b1'  // 728×90
const ADSTERRA_KEY_NATIVE = 'bd0a0dcfebb3aec68d5c6c609f785492'  // Native Banner
const ADSTERRA_SOCIAL_BAR = '7a6e14140c287c0d036b05b87774ad4d'  // Social Bar

// ── Affiliate fallback banners — rotate every 8s ──────────────────────────────
const AFFILIATE_BANNERS = [
  {
    label: 'Hostinger',
    bg: 'from-[#673DE6]/20 to-[#4B2DB5]/10',
    border: 'border-[#673DE6]/30',
    icon: '🚀',
    headline: 'Web Hosting from $1.99/mo',
    sub: 'Blazing fast • Free domain • 99.9% uptime',
    cta: 'Get Started →',
    ctaColor: 'bg-[#673DE6]',
    url: 'https://www.hostinger.com/web-hosting?REFERRALCODE=1SIVA54',
  },
  {
    label: 'Namecheap',
    bg: 'from-[#DE3C21]/20 to-[#E8630A]/10',
    border: 'border-[#DE3C21]/30',
    icon: '🌐',
    headline: 'Domains from $0.99',
    sub: 'Free WhoisGuard • Easy DNS • SSL included',
    cta: 'Find Your Domain →',
    ctaColor: 'bg-[#DE3C21]',
    url: 'https://www.namecheap.com/?aff=137589',
  },
  {
    label: 'Coursera',
    bg: 'from-[#0056D2]/20 to-[#003594]/10',
    border: 'border-[#0056D2]/30',
    icon: '🎓',
    headline: 'Learn from Top Universities',
    sub: 'AI • Data Science • Business — Free trials available',
    cta: 'Explore Courses →',
    ctaColor: 'bg-[#0056D2]',
    url: 'https://www.coursera.org/?utm_source=kwizzo&utm_medium=referral',
  },
  {
    label: 'Amazon',
    bg: 'from-[#FF9900]/20 to-[#E47911]/10',
    border: 'border-[#FF9900]/30',
    icon: '📦',
    headline: 'Amazon Prime — 30 Days Free',
    sub: 'Movies • Music • Fast delivery • Unlimited reading',
    cta: 'Start Free Trial →',
    ctaColor: 'bg-[#FF9900] text-black',
    url: 'https://www.amazon.com/prime?tag=kwizzo-20',
  },
]

function AffiliateBanner({ size }: { size: 'banner' | 'rectangle' }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % AFFILIATE_BANNERS.length), 8000)
    return () => clearInterval(t)
  }, [])
  const b = AFFILIATE_BANNERS[idx]
  if (size === 'banner') {
    return (
      <a href={b.url} target="_blank" rel="noopener noreferrer sponsored"
        className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl bg-gradient-to-r ${b.bg} border ${b.border} hover:opacity-90 transition-opacity`}
        style={{ minHeight: 60 }}>
        <span className="text-2xl">{b.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm truncate">{b.headline}</div>
          <div className="text-white/50 text-xs truncate">{b.sub}</div>
        </div>
        <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg text-white ${b.ctaColor}`}>{b.cta}</span>
      </a>
    )
  }
  return (
    <a href={b.url} target="_blank" rel="noopener noreferrer sponsored"
      className={`flex flex-col gap-2 w-full px-5 py-4 rounded-xl bg-gradient-to-br ${b.bg} border ${b.border} hover:opacity-90 transition-opacity`}
      style={{ minHeight: 180 }}>
      <span className="text-3xl">{b.icon}</span>
      <div className="text-white font-bold text-base">{b.headline}</div>
      <div className="text-white/50 text-sm">{b.sub}</div>
      <span className={`mt-auto self-start text-xs font-bold px-3 py-1.5 rounded-lg text-white ${b.ctaColor}`}>{b.cta}</span>
    </a>
  )
}

// Social Bar — injected once into <body>, shows as sticky bottom bar
function SocialBar() {
  const loaded = useRef(false)
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    const s = document.createElement('script')
    s.async = true
    s.setAttribute('data-cfasync', 'false')
    s.src = `//pl29336976.profitablecpmratenetwork.com/7a/6e/14/7a6e14140c287c0d036b05b87774ad4d.js`
    document.body.appendChild(s)
  }, [])
  return null
}

export { SocialBar }

export default function AdUnit({ size = 'rectangle', className = '' }: AdUnitProps) {
  const key    = size === 'banner' ? ADSTERRA_KEY_BANNER : ADSTERRA_KEY_RECT
  const width  = size === 'banner' ? 728 : 300
  const height = size === 'banner' ? 90  : 250
  const ref    = useRef<HTMLDivElement>(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current || !ref.current) return
    loaded.current = true
    const s = document.createElement('script')
    s.type = 'text/javascript'
    s.setAttribute('data-cfasync', 'false')
    s.text = `(function(){var o={key:'${key}',format:'iframe',height:${height},width:${width},params:{}};var d=document.createElement('script');d.type='text/javascript';d.setAttribute('data-cfasync','false');d.src='//www.highperformanceformat.com/${key}/invoke.js';var c=document.currentScript||document.scripts[document.scripts.length-1];c.parentNode.insertBefore(d,c.nextSibling);window.atOptions=o;})();`
    ref.current.appendChild(s)
  }, [key, height, width])

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div className="text-[9px] text-white/10 text-center mb-0.5 uppercase tracking-widest">Sponsored</div>
      <div ref={ref} style={{ width, maxWidth: '100%', minHeight: height }} />
    </div>
  )
}

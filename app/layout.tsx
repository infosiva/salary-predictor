import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import config from '@/vertical.config'
import { getMeshStyle, getScrollbarColor, COLOR_MAP } from '@/lib/themeColors'
import Navbar from '@/components/Navbar'
import ChatBot from '@/components/ChatBot'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       config.metaTitle,
  description: 'Play AI-generated quizzes for all ages - no sign-up needed! Join 10,000+ players and start your quiz journey today!',
  keywords:    config.keywords,
}

// Derive CSS custom properties from vertical theme at build time
const colors   = COLOR_MAP[config.themeColor] ?? COLOR_MAP['violet']
const meshStyle = getMeshStyle(config.themeColor)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full"
      style={{
        // CSS vars consumed by globals.css animations and scrollbar
        '--theme-primary':   colors.primary,
        '--theme-secondary': colors.secondary,
        '--theme-base':      colors.base,
        '--scrollbar-color': getScrollbarColor(config.themeColor),
      } as React.CSSProperties}
      suppressHydrationWarning
    >
      <body className={`${inter.className} min-h-full flex flex-col text-white`}
        style={{ background: colors.base }}
      >
        {/* Dynamic mesh gradient bg — changes per vertical */}
        <div style={meshStyle} />

        <Navbar />

        <Providers>
          <main className="flex-1">
            {children}
          </main>
        </Providers>

        <ChatBot />

        <footer className="border-t border-white/[0.06] py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-white/40 text-sm">
            <span>© {new Date().getFullYear()} {config.name}. All rights reserved.</span>
            <div className="flex gap-6">
              <a href="/privacy" className="hover:text-white/70 transition-colors">Privacy</a>
              <a href="/terms"   className="hover:text-white/70 transition-colors">Terms</a>
              <a href="/contact" className="hover:text-white/70 transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

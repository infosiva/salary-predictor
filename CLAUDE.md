@AGENTS.md

# AI Platform Template

## What This Is
A config-driven platform template that supports TWO modes from a single codebase:
- `marketplace` — AI-matched provider/booking platform (ElderCare, TuneUp, MechFix, etc.)
- `ai-tool` — AI-powered product (tutor, quiz game, coach, classifier, generator, etc.)

**The only file that changes per deployment: `vertical.config.ts`**

## Two Modes

### mode: 'marketplace'
Provider/consumer booking platform. Uses: categories, pricing, booking flow, provider terminology, Supabase, Stripe.

### mode: 'ai-tool'
Pure AI product. Uses: subjects, age groups, tool type, feature flags. No booking, no providers, no payments.
AI tool types: `tutor` | `quiz` | `coach` | `game` | `analyzer` | `generator`

## Type Guards (use in components)
```ts
import { isMarketplace, isAiTool } from '@/vertical.config'

if (isAiTool(config)) {
  // config.subjects, config.features.quiz, config.ageGroups etc.
}
if (isMarketplace(config)) {
  // config.categories, config.pricingModel, config.providerLabel etc.
}
```

## AI Tool Feature Flags
| Flag | Description |
|------|-------------|
| `aiTutor` | AI explains topics conversationally |
| `quiz` | Dynamic AI-generated quizzes |
| `learningPath` | AI builds personalised topic progression |
| `multiplayer` | Multiple players in same session |
| `leaderboard` | Scores & rankings |
| `streaks` | Daily streak tracking |
| `ageAdaptive` | AI adapts language/difficulty to user age |
| `progressTrack` | Track completed topics & quiz scores |
| `familyMode` | Register a family, play together |
| `exportResults` | Download scores / certificate |

## Presets in vertical.config.ts

### AI Tool Presets (`AI_TOOL_PRESETS`)
| Key | Name | Type | Theme | Audience | Domain |
|-----|------|------|-------|----------|--------|
| `kwizzo` | Kwizzo | game | violet | family | kwizzo.ai |
| `nudge` | Nudge | tutor | emerald | kids/teens/adults | nudgeai.com |
| `questly` | Questly | quiz | blue | all ages | questly.ai |

### Marketplace Presets (`MARKETPLACE_PRESETS`)
| Key | Name | Theme |
|-----|------|-------|
| `eldercare` | ElderCare+ | violet |
| `mechanics` | MechFix | orange |
| `music` | TuneUp | indigo |

## To Deploy a New Product
1. Open `vertical.config.ts`
2. Copy the relevant preset from `AI_TOOL_PRESETS` or `MARKETPLACE_PRESETS`
3. Paste it as the `const config` export at the top
4. Rename `name`, `domain`, `themeColor`, tweak `aiSystemPrompt`
5. Create Vercel project → set env vars → deploy
6. Done

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4 — dark mesh background, glass cards
- **Theme**: `themeColor` in config → all accents via `lib/theme.ts`
- **AI**: Groq → Gemini → Anthropic fallback chain (`lib/ai.ts`)
- **DB**: Supabase (marketplace mode) — not needed for simple ai-tool mode
- **Payments**: Stripe Connect (marketplace mode only)

## Key Files
| File | Purpose |
|------|---------|
| `vertical.config.ts` | **THE ONLY FILE TO CHANGE** per deployment |
| `lib/theme.ts` | Derives all Tailwind class strings from `themeColor` |
| `lib/ai.ts` | Groq → Gemini → Claude fallback AI chain |
| `lib/supabase.ts` | Supabase client (marketplace mode) |
| `app/page.tsx` | Homepage — adapts hero/CTA copy from config |
| `app/chat/page.tsx` | AI chat UI (marketplace: matching / ai-tool: tutor/quiz) |
| `components/Navbar.tsx` | Sticky glass navbar |

## Design System
- Background: `#080712` (deep dark)
- Glass cards: `rgba(255,255,255,0.03)` + `backdrop-filter: blur`
- All accent colors: derived from `themeColor` via `lib/theme.ts`
- Mesh gradient: radial-gradient blobs, fixed position

## What NOT to Change
- `lib/theme.ts` class derivation pattern — adding inline styles breaks SSR
- AI fallback order in `lib/ai.ts`
- `globals.css` animation names — used throughout
- Type union pattern in `vertical.config.ts` — components rely on type guards

import { NextRequest, NextResponse } from 'next/server'
import { aiChat } from '@/lib/ai'
import config from '@/vertical.config'
import { isAiTool } from '@/vertical.config'

export interface DrawPrompt {
  word:        string   // the thing to draw
  category:    string   // "animal", "action", "place", etc.
  difficulty:  'easy' | 'medium' | 'hard'
  hint:        string   // hint shown after 30s
  funFact:     string   // shown after round
  forPlayer?:  string
}

function ageToDifficulty(age: number): 'easy' | 'medium' | 'hard' {
  if (age <= 12) return 'easy'
  if (age <= 17) return 'medium'
  return 'hard'
}

// Fallback prompts if AI fails
const FALLBACK_PROMPTS: DrawPrompt[] = [
  { word: 'cat',        category: 'animal',  difficulty: 'easy',   hint: 'It says meow!',         funFact: 'Cats spend 70% of their lives sleeping.' },
  { word: 'pizza',      category: 'food',    difficulty: 'easy',   hint: 'It\'s round and cheesy', funFact: 'Over 3 billion pizzas are sold in the US each year.' },
  { word: 'rainbow',    category: 'nature',  difficulty: 'easy',   hint: 'It appears after rain',  funFact: 'Rainbows are actually full circles, not arcs.' },
  { word: 'skateboard', category: 'sport',   difficulty: 'medium', hint: 'Wheels under a board',   funFact: 'Skateboarding became an Olympic sport in 2021.' },
  { word: 'lighthouse', category: 'place',   difficulty: 'medium', hint: 'It guides ships at sea', funFact: 'The oldest working lighthouse is in Spain, built in 110 AD.' },
  { word: 'telescope',  category: 'object',  difficulty: 'hard',   hint: 'Used to see far away',   funFact: 'Galileo\'s first telescope magnified only 8-9 times.' },
  { word: 'penguin',    category: 'animal',  difficulty: 'easy',   hint: 'A flightless bird that swims', funFact: 'Penguins propose to their partners with pebbles.' },
  { word: 'volcano',    category: 'nature',  difficulty: 'medium', hint: 'A mountain that erupts', funFact: 'There are about 1,500 potentially active volcanoes on Earth.' },
  { word: 'robot',      category: 'object',  difficulty: 'easy',   hint: 'Made of metal, does tasks', funFact: 'The word robot comes from a Czech word meaning forced labour.' },
  { word: 'black hole', category: 'science', difficulty: 'hard',   hint: 'Not even light escapes it', funFact: 'The first image of a black hole was captured in 2019.' },
]

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]
  return text.trim()
}

async function generateForPlayer(
  player: { name: string; age: number },
  systemPrompt: string,
  count: number = 8,
): Promise<DrawPrompt[]> {
  const difficulty = ageToDifficulty(player.age)
  const ageLabel   = player.age <= 12 ? 'child' : player.age <= 17 ? 'teenager' : 'adult'

  const diffGuide =
    difficulty === 'easy'
      ? `EASY (child age ${player.age}): Simple, drawable objects — animals 🐱, food 🍕, vehicles, toys.
         Words should be drawable in 60s by any child. Think: cat, pizza, rainbow, elephant, robot.
         Avoid: abstract ideas, emotions, verbs alone.`
      : difficulty === 'medium'
      ? `MEDIUM (teenager age ${player.age}): Recognisable but trickier — movie characters, sports, tech gadgets.
         Examples: lightsaber, WiFi symbol, Instagram icon, skateboard, selfie, meme face.
         Can include pop culture references from 2020-2025.`
      : `HARD (adult age ${player.age}): Abstract or complex — concepts, compound ideas, tricky visuals.
         Examples: inflation, jet lag, déjà vu, NFT, conspiracy theory, social media algorithm.
         Must be drawable but genuinely challenging.`

  const userMessage = `Generate exactly ${count} drawing prompts for ${player.name} (age ${player.age}).

${diffGuide}

Each prompt: a single word or short phrase to draw, a category, a 1-sentence hint (revealed after 30s),
and a 1-sentence fun fact shown after the round.

Return ONLY valid JSON:
{
  "prompts": [
    {
      "word": "cat",
      "category": "animal",
      "difficulty": "${difficulty}",
      "hint": "It says meow and has whiskers",
      "funFact": "Cats can rotate their ears 180 degrees."
    }
  ]
}`

  const raw    = await aiChat([{ role: 'user', content: userMessage }], systemPrompt)
  const parsed = JSON.parse(extractJSON(raw))

  if (!Array.isArray(parsed?.prompts) || parsed.prompts.length < 3) {
    throw new Error('Invalid prompts structure')
  }

  return parsed.prompts
    .filter((p: Partial<DrawPrompt>) => p.word && p.hint)
    .slice(0, count)
    .map((p: DrawPrompt) => ({ ...p, forPlayer: player.name }))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { members } = body as { members: { name: string; age: number }[] }

    const systemPrompt = isAiTool(config) ? config.aiSystemPrompt : ''
    const players      = members?.length ? members : [{ name: 'Player', age: 18 }]

    const results = await Promise.allSettled(
      players.map(p => generateForPlayer(p, systemPrompt))
    )

    const playerPrompts: Record<string, DrawPrompt[]> = {}
    results.forEach((r, i) => {
      const name = players[i].name
      if (r.status === 'fulfilled') {
        playerPrompts[name] = r.value
      } else {
        console.error(`[kwizzo/draw] AI failed for ${name}:`, r.reason)
        playerPrompts[name] = FALLBACK_PROMPTS.map(p => ({ ...p, forPlayer: name }))
      }
    })

    return NextResponse.json({ playerPrompts })
  } catch (err) {
    console.error('[kwizzo/draw] generate error:', err)
    const fallbackMap: Record<string, DrawPrompt[]> = { Player: FALLBACK_PROMPTS }
    return NextResponse.json({ playerPrompts: fallbackMap }, { status: 200 })
  }
}

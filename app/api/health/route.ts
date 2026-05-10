/**
 * GET /api/health
 * Checks: AI keys (Groq/Gemini/Anthropic), Edge Config reachability.
 */
import { NextResponse } from 'next/server'

async function checkEdgeConfig(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const connStr = process.env.EDGE_CONFIG
  if (!connStr) return { ok: false, error: 'EDGE_CONFIG not set' }
  try {
    const match = connStr.match(/ecfg_([^?]+)/)
    const ecId = match ? `ecfg_${match[1]}` : null
    if (!ecId) return { ok: false, error: 'Could not parse Edge Config ID' }
    const token = process.env.VERCEL_ACCESS_TOKEN ?? process.env.EDGE_CONFIG_TOKEN
    if (!token) return { ok: false, error: 'No Vercel token for Edge Config check' }
    const start = Date.now()
    const res = await fetch(`https://api.vercel.com/v1/edge-config/${ecId}/items`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4000),
    })
    return { ok: res.ok, latencyMs: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'unreachable' }
  }
}

function checkAIKeys(): { ok: boolean; providers: string[]; error?: string } {
  const providers = [
    process.env.GROQ_API_KEY && 'groq',
    process.env.GEMINI_API_KEY && 'gemini',
    process.env.ANTHROPIC_API_KEY && 'anthropic',
  ].filter(Boolean) as string[]
  return providers.length > 0
    ? { ok: true, providers }
    : { ok: false, providers: [], error: 'No AI API keys configured' }
}

export async function GET() {
  const [edgeConfig, ai] = await Promise.all([
    checkEdgeConfig(),
    Promise.resolve(checkAIKeys()),
  ])

  const services = { edgeConfig, ai }
  const allOk = Object.values(services).every(s => s.ok)

  return NextResponse.json(
    { ok: allOk, services, ts: new Date().toISOString() },
    { status: allOk ? 200 : 207 }
  )
}

// Pro status helpers — localStorage-backed, no server needed for basic gate

export const FREE_QUESTION_LIMIT = 5  // questions per quiz in free tier

export function isProUser(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('kwizzo_pro') === '1'
}

export async function startCheckout(): Promise<void> {
  const res  = await fetch('/api/checkout', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ plan: 'monthly' }),
  })
  const data = await res.json()
  if (data.url) {
    window.location.href = data.url
  } else {
    throw new Error(data.error ?? 'Checkout unavailable')
  }
}

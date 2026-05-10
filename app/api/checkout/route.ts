import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://kwizzo.app'

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()  // 'monthly' | 'lifetime'

    const secretKey = process.env.STRIPE_SECRET_KEY
    const priceId   = process.env.STRIPE_PRICE_ID

    if (!secretKey || !priceId) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2026-04-22.dahlia' })

    const session = await stripe.checkout.sessions.create({
      mode:                'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${BASE_URL}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${BASE_URL}/play`,
      metadata:    { plan: plan ?? 'monthly' },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

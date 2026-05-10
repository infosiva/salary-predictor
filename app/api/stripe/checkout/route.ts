import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY
    const priceId   = process.env.STRIPE_PRICE_ID

    if (!secretKey || !priceId) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const origin = req.headers.get('origin') ?? 'https://kwizzo.app'

    const stripe = new Stripe(secretKey, { apiVersion: '2026-04-22.dahlia' })

    const session = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items:           [{ price: priceId, quantity: 1 }],
      success_url:          `${origin}/?upgraded=1`,
      cancel_url:           `${origin}`,
      allow_promotion_codes: true,
      metadata:             { plan: 'family-pro' },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

'use client';
import { useState } from 'react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: connect to your email provider (Mailchimp, ConvertKit, etc.)
    // For now, log to console and show success
    console.log('Newsletter signup:', email);
    setDone(true);
  }

  return (
    <section className="my-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
      <h3 className="mb-2 text-xl font-bold">Get weekly AI tips</h3>
      <p className="mb-6 text-sm text-gray-400">No spam. Unsubscribe anytime.</p>
      {done ? (
        <p className="font-semibold text-green-400">You are on the list!</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full max-w-xs rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm outline-none focus:border-violet-500 sm:w-auto"
          />
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-6 py-2 text-sm font-bold text-white hover:bg-violet-500 transition-colors"
          >
            Subscribe Free
          </button>
        </form>
      )}
    </section>
  );
}

'use client';
import { useEffect } from 'react';

declare global {
  interface Window { adsbygoogle: unknown[] }
}

export default function AdBanner() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div className="flex justify-center my-4 min-h-[90px]">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', maxWidth: '728px', height: '90px' }}
        data-ad-client="ca-pub-4237294630161176"
        data-ad-slot="1234567890"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

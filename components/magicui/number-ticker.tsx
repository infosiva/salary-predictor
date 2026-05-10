'use client';

import { useEffect, useRef, useState } from 'react';

interface NumberTickerProps {
  value: number;
  direction?: 'up' | 'down';
  delay?: number;
  decimalPlaces?: number;
  suffix?: string;
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  decimalPlaces = 0,
  suffix = '',
  className = '',
}: NumberTickerProps) {
  const [display, setDisplay] = useState(direction === 'down' ? value : 0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const DURATION = 2000;

  useEffect(() => {
    const startValue = direction === 'down' ? value : 0;
    const endValue = direction === 'down' ? 0 : value;

    const timeoutId = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (startRef.current === null) startRef.current = timestamp;
        const elapsed = timestamp - startRef.current;
        const progress = Math.min(elapsed / DURATION, 1);
        const eased = easeOutCubic(progress);
        setDisplay(startValue + (endValue - startValue) * eased);
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeoutId);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [value, direction, delay]);

  return (
    <span className={className}>
      {display.toFixed(decimalPlaces)}
      {suffix}
    </span>
  );
}

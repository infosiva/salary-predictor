'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export function AnimatedList({ className = '', children, delay = 1000 }: AnimatedListProps) {
  const [index, setIndex] = useState(0);
  const childrenArray = useMemo(() => React.Children.toArray(children), [children]);

  useEffect(() => {
    if (index < childrenArray.length - 1) {
      const id = setTimeout(() => setIndex((i) => i + 1), delay);
      return () => clearTimeout(id);
    }
  }, [index, childrenArray.length, delay]);

  const visibleItems = childrenArray.slice(0, index + 1).reverse();

  return (
    <div className={['flex flex-col-reverse items-center gap-2', className].join(' ')}>
      {visibleItems.map((item, i) => (
        <AnimatedListItem key={(item as React.ReactElement).key ?? i}>
          {item}
        </AnimatedListItem>
      ))}
    </div>
  );
}

function AnimatedListItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full animate-in slide-in-from-top-4 fade-in duration-300">
      {children}
    </div>
  );
}

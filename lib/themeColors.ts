/**
 * Maps Tailwind color names → actual hex values for inline styles.
 * Used to make the mesh background gradient dynamic per vertical.
 * Add more colours as needed when adding new presets.
 */
export const COLOR_MAP: Record<string, { primary: string; secondary: string; base: string }> = {
  violet:  { primary: '#7c3aed', secondary: '#3b82f6', base: '#080712' },
  indigo:  { primary: '#4f46e5', secondary: '#7c3aed', base: '#070812' },
  blue:    { primary: '#2563eb', secondary: '#0ea5e9', base: '#07101a' },
  cyan:    { primary: '#0891b2', secondary: '#2563eb', base: '#051215' },
  teal:    { primary: '#0d9488', secondary: '#0891b2', base: '#051210' },
  green:   { primary: '#16a34a', secondary: '#0d9488', base: '#051208' },
  emerald: { primary: '#059669', secondary: '#16a34a', base: '#05120a' },
  orange:  { primary: '#ea580c', secondary: '#d97706', base: '#130a02' },
  amber:   { primary: '#d97706', secondary: '#ea580c', base: '#120e02' },
  red:     { primary: '#dc2626', secondary: '#ea580c', base: '#130305' },
  rose:    { primary: '#e11d48', secondary: '#dc2626', base: '#130208' },
  pink:    { primary: '#db2777', secondary: '#e11d48', base: '#120208' },
  fuchsia: { primary: '#a21caf', secondary: '#7c3aed', base: '#0f0510' },
  purple:  { primary: '#9333ea', secondary: '#a21caf', base: '#0a0712' },
}

export function getMeshStyle(themeColor: string): React.CSSProperties {
  const c = COLOR_MAP[themeColor] ?? COLOR_MAP['violet']
  return {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    background: [
      `radial-gradient(ellipse 80% 50% at 20% -10%, ${c.primary}30 0%, transparent 60%)`,
      `radial-gradient(ellipse 60% 40% at 80% 110%, ${c.secondary}20 0%, transparent 60%)`,
      `radial-gradient(ellipse 50% 60% at 50% 50%, ${c.base}f5 0%, ${c.base} 100%)`,
    ].join(', '),
  }
}

export function getScrollbarColor(themeColor: string): string {
  const c = COLOR_MAP[themeColor] ?? COLOR_MAP['violet']
  return c.primary
}

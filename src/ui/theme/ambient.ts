/**
 * Nature palettes for the ambient background, chosen by the local time of day. Pure
 * TypeScript (no React Native) so it can be unit-tested and reused by widgets later.
 */
export type AmbientPhase = 'dawn' | 'day' | 'dusk';

export interface AmbientPalette {
  phase: AmbientPhase;
  /** Four muted colors; each drives one drifting blob. */
  colors: readonly [string, string, string, string];
}

export const AMBIENT_PALETTES: Record<AmbientPhase, AmbientPalette> = {
  // Amber, clay rose, sand, sky haze.
  dawn: { phase: 'dawn', colors: ['#C08848', '#A8636A', '#C9B288', '#7A9BB8'] },
  // Pine, moss, lake teal, mist sage.
  day: { phase: 'day', colors: ['#2E6B50', '#6F8F4E', '#2F7C7A', '#93AE9D'] },
  // Deep teal, slate blue, violet haze, sea glass.
  dusk: { phase: 'dusk', colors: ['#22656E', '#40568A', '#685A92', '#6FA6A1'] },
};

/** Dawn 5:00–10:59, day 11:00–16:59, dusk and night 17:00–4:59. */
export function phaseForHour(hour: number): AmbientPhase {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  if (h >= 5 && h < 11) return 'dawn';
  if (h >= 11 && h < 17) return 'day';
  return 'dusk';
}

export function paletteForHour(hour: number): AmbientPalette {
  return AMBIENT_PALETTES[phaseForHour(hour)];
}

/** `#RRGGBB` → `rgba(r, g, b, alpha)`. */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * The glow: the one place color lives in the app. A frosted slab lit from inside — deep umber
 * at the top, burnt orange along the edge, a cream glow at the bottom and a cool blue-grey
 * highlight — in three time-of-day moods that all stay within that warm family.
 *
 * Pure TypeScript (no React Native) so it can be unit-tested and reused by widgets later.
 */
export type GlowPhase = 'dawn' | 'day' | 'dusk';

export interface GlowPalette {
  phase: GlowPhase;
  /** Vertical base light of the slab, top → bottom. */
  base: readonly [string, string, string];
  /** The four drifting lights, painted in this order. */
  umber: string;
  ember: string;
  haze: string;
  cream: string;
  /** Warm light the slab spills onto its surroundings. */
  halo: string;
}

export const GLOW_PALETTES: Record<GlowPhase, GlowPalette> = {
  // Softer and lighter: more cream, a rosier ember, clearer sky.
  dawn: {
    phase: 'dawn',
    base: ['#5A3A2C', '#D9925A', '#FBE9D2'],
    umber: '#3B2219',
    ember: '#E0864F',
    haze: '#A9C0CC',
    cream: '#FFF0DC',
    halo: '#F4B98A',
  },
  // The reference balance: umber core, burnt-orange edge, cream glow, blue-grey highlight.
  day: {
    phase: 'day',
    base: ['#3A2216', '#C9762F', '#F8E2C2'],
    umber: '#1F120C',
    ember: '#D46F1F',
    haze: '#8FA9B6',
    cream: '#FCE6C8',
    halo: '#EFA764',
  },
  // Deeper: darker core, red-orange ember, slate highlight, apricot glow.
  dusk: {
    phase: 'dusk',
    base: ['#24140E', '#A9551F', '#EBC59B'],
    umber: '#140B07',
    ember: '#C2531A',
    haze: '#6E8796',
    cream: '#F2CFA2',
    halo: '#D98745',
  },
};

/** Text and glyphs drawn on the glow. */
export const ON_GLOW = '#FFF8EF';
export const ON_GLOW_SECONDARY = 'rgba(255, 248, 239, 0.62)';

/** Dawn 5:00–10:59, day 11:00–16:59, dusk and night 17:00–4:59. */
export function phaseForHour(hour: number): GlowPhase {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  if (h >= 5 && h < 11) return 'dawn';
  if (h >= 11 && h < 17) return 'day';
  return 'dusk';
}

export function paletteForHour(hour: number): GlowPalette {
  return GLOW_PALETTES[phaseForHour(hour)];
}

/** `#RRGGBB` → `rgba(r, g, b, alpha)`. */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

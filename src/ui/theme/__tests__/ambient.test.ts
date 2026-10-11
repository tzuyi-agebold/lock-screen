import { GLOW_PALETTES, paletteForHour, phaseForHour, withAlpha } from '../ambient';

describe('glow palette by time of day', () => {
  it('maps hours to dawn, day and dusk', () => {
    expect(phaseForHour(4)).toBe('dusk');
    expect(phaseForHour(5)).toBe('dawn');
    expect(phaseForHour(10)).toBe('dawn');
    expect(phaseForHour(11)).toBe('day');
    expect(phaseForHour(16)).toBe('day');
    expect(phaseForHour(17)).toBe('dusk');
    expect(phaseForHour(23)).toBe('dusk');
    expect(phaseForHour(0)).toBe('dusk');
  });

  it('wraps out-of-range hours', () => {
    expect(phaseForHour(29)).toBe('dawn');
    expect(phaseForHour(-1)).toBe('dusk');
  });

  it('defines every light as a hex color', () => {
    expect(paletteForHour(13)).toBe(GLOW_PALETTES.day);
    Object.values(GLOW_PALETTES).forEach(({ phase, base, ...lights }) => {
      expect(base).toHaveLength(3);
      [...base, ...Object.values(lights)].forEach((color) =>
        expect(color).toMatch(/^#[0-9A-F]{6}$/i),
      );
      expect(['dawn', 'day', 'dusk']).toContain(phase);
    });
  });

  it('converts hex to rgba', () => {
    expect(withAlpha('#D46F1F', 0.5)).toBe('rgba(212, 111, 31, 0.5)');
  });
});

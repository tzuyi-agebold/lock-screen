import { formatCountdown, formatDuration, spokenDuration } from '../duration';

describe('duration formatting', () => {
  it('formats countdowns like the iOS Timer', () => {
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(4 * 60_000 + 5_000)).toBe('4:05');
    expect(formatCountdown(4 * 60_000 + 4_001)).toBe('4:05');
    expect(formatCountdown(3_723_000)).toBe('1:02:03');
    expect(formatCountdown(-5)).toBe('0:00');
  });

  it('formats human durations', () => {
    expect(formatDuration(30_000)).toBe('<1 min');
    expect(formatDuration(12 * 60_000)).toBe('12 min');
    expect(formatDuration(60 * 60_000)).toBe('1 hr');
    expect(formatDuration(65 * 60_000)).toBe('1 hr 5 min');
  });

  it('spells durations out for VoiceOver', () => {
    expect(spokenDuration(61_000)).toBe('1 minute 1 second');
    expect(spokenDuration(120_000)).toBe('2 minutes');
    expect(spokenDuration(0)).toBe('0 seconds');
  });
});

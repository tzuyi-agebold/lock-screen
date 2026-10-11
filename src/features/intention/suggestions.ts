import type { SessionRecord } from '@/domain/session';

export const DEFAULT_SUGGESTIONS = [
  'Reply to messages',
  'Check my calendar',
  'Look up directions',
  'Pay a bill',
  'Take a photo',
  'Set an alarm',
] as const;

/** Recent intentions first (people repeat themselves), then sensible defaults. */
export function buildSuggestions(history: readonly SessionRecord[], limit = 6): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const add = (value: string) => {
    const key = value.toLocaleLowerCase();
    if (seen.has(key) || result.length >= limit) return;
    seen.add(key);
    result.push(value);
  };
  history.slice(0, 20).forEach((record) => add(record.intention));
  DEFAULT_SUGGESTIONS.forEach(add);
  return result;
}

/** Appends dictated text to what was already typed. */
export function joinDictation(typed: string, dictated: string): string {
  const base = typed.trimEnd();
  return base.length === 0 ? dictated : `${base} ${dictated}`;
}

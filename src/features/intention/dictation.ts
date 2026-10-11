/** Appends dictated text to what was already typed. */
export function joinDictation(typed: string, dictated: string): string {
  const base = typed.trimEnd();
  return base.length === 0 ? dictated : `${base} ${dictated}`;
}

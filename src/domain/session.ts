/**
 * Session domain model.
 *
 * Pure TypeScript with no React Native imports, so every rule here is unit-testable and
 * shareable with future native targets (widgets, Live Activities) through a JSON contract.
 */

export const MINUTE = 60_000;

export const REMINDER_INTERVALS = [5, 10, 15] as const;
export type ReminderInterval = (typeof REMINDER_INTERVALS)[number];

export const TIME_LIMITS = [15, 30, 45, 60] as const;
export type TimeLimit = (typeof TIME_LIMITS)[number];

export const INTENTION_MAX_LENGTH = 120;

/** "Five more minutes" is allowed once per session — a release valve, not a loophole. */
export const EXTENSION_MINUTES = 5;
export const MAX_EXTENSIONS = 1;

/** Without a time limit, reminders stop after this horizon so we never nag indefinitely. */
export const REMINDER_HORIZON_MINUTES = 120;

export type SessionStatus = 'active' | 'timesUp';
export type SessionOutcome = 'completed' | 'abandoned' | 'timedOut';

export interface Session {
  id: string;
  intention: string;
  /** Epoch milliseconds. */
  startedAt: number;
  reminderMinutes: ReminderInterval;
  timeLimitMinutes: TimeLimit | null;
  /** Epoch milliseconds when the time limit hits, or `null` when there is no limit. */
  endsAt: number | null;
  extensions: number;
  status: SessionStatus;
}

export interface SessionRecord {
  id: string;
  intention: string;
  startedAt: number;
  endedAt: number;
  outcome: SessionOutcome;
  reminderMinutes: ReminderInterval;
  timeLimitMinutes: TimeLimit | null;
}

export interface SessionInput {
  intention: string;
  reminderMinutes: ReminderInterval;
  timeLimitMinutes: TimeLimit | null;
}

export type IntentionValidation =
  { ok: true; value: string } | { ok: false; reason: 'empty' | 'tooLong' };

/** Trims and collapses whitespace (including newlines from dictation) into single spaces. */
export function normalizeIntention(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

export function validateIntention(raw: string): IntentionValidation {
  const value = normalizeIntention(raw);
  if (value.length === 0) return { ok: false, reason: 'empty' };
  if (value.length > INTENTION_MAX_LENGTH) return { ok: false, reason: 'tooLong' };
  return { ok: true, value };
}

export function isReminderInterval(value: unknown): value is ReminderInterval {
  return (REMINDER_INTERVALS as readonly unknown[]).includes(value);
}

export function isTimeLimit(value: unknown): value is TimeLimit {
  return (TIME_LIMITS as readonly unknown[]).includes(value);
}

export function createSession(input: SessionInput, now: number, id: string): Session {
  const validation = validateIntention(input.intention);
  if (!validation.ok) {
    throw new Error(`Invalid intention: ${validation.reason}`);
  }
  if (!isReminderInterval(input.reminderMinutes)) {
    throw new Error(`Invalid reminder interval: ${String(input.reminderMinutes)}`);
  }
  if (input.timeLimitMinutes !== null && !isTimeLimit(input.timeLimitMinutes)) {
    throw new Error(`Invalid time limit: ${String(input.timeLimitMinutes)}`);
  }
  return {
    id,
    intention: validation.value,
    startedAt: now,
    reminderMinutes: input.reminderMinutes,
    timeLimitMinutes: input.timeLimitMinutes,
    endsAt: input.timeLimitMinutes === null ? null : now + input.timeLimitMinutes * MINUTE,
    extensions: 0,
    status: 'active',
  };
}

export function elapsedMs(session: Session, now: number): number {
  return Math.max(0, now - session.startedAt);
}

/** Milliseconds left before the time limit, or `null` when the session has no limit. */
export function remainingMs(session: Session, now: number): number | null {
  if (session.endsAt === null) return null;
  return Math.max(0, session.endsAt - now);
}

export function isExpired(session: Session, now: number): boolean {
  return session.endsAt !== null && now >= session.endsAt;
}

/** Fraction of the time limit used, from 0 to 1. `null` when there is no limit. */
export function limitProgress(session: Session, now: number): number | null {
  if (session.endsAt === null) return null;
  const total = session.endsAt - session.startedAt;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now - session.startedAt) / total));
}

/**
 * Next reminder time on the session's fixed grid (startedAt + k × interval).
 * Reminders never coincide with or follow the time limit — "time's up" replaces them.
 */
export function nextReminderAt(session: Session, now: number): number | null {
  if (session.status !== 'active') return null;
  const interval = session.reminderMinutes * MINUTE;
  const k = Math.floor(elapsedMs(session, now) / interval) + 1;
  const at = session.startedAt + k * interval;
  if (session.endsAt !== null && at >= session.endsAt) return null;
  if (at - session.startedAt > REMINDER_HORIZON_MINUTES * MINUTE) return null;
  return at;
}

export function canExtend(session: Session): boolean {
  return session.endsAt !== null && session.extensions < MAX_EXTENSIONS;
}

/**
 * Adds a few more minutes. Extending after time's up counts from now, so a person who
 * lingered on the time's-up screen still gets the full extension.
 */
export function extendSession(session: Session, now: number): Session {
  if (!canExtend(session) || session.endsAt === null) {
    throw new Error('Session cannot be extended');
  }
  return {
    ...session,
    endsAt: Math.max(session.endsAt, now) + EXTENSION_MINUTES * MINUTE,
    extensions: session.extensions + 1,
    status: 'active',
  };
}

export function markTimesUp(session: Session): Session {
  return { ...session, status: 'timesUp' };
}

export function finishSession(
  session: Session,
  outcome: SessionOutcome,
  now: number,
): SessionRecord {
  return {
    id: session.id,
    intention: session.intention,
    startedAt: session.startedAt,
    endedAt: Math.max(now, session.startedAt),
    outcome,
    reminderMinutes: session.reminderMinutes,
    timeLimitMinutes: session.timeLimitMinutes,
  };
}

export interface DaySummary {
  total: number;
  completed: number;
}

/** Counts records that started on the same local calendar day as `now`. */
export function summarizeDay(records: readonly SessionRecord[], now: number): DaySummary {
  const day = new Date(now);
  const sameDay = records.filter((record) => {
    const started = new Date(record.startedAt);
    return (
      started.getFullYear() === day.getFullYear() &&
      started.getMonth() === day.getMonth() &&
      started.getDate() === day.getDate()
    );
  });
  return {
    total: sameDay.length,
    completed: sameDay.filter((record) => record.outcome === 'completed').length,
  };
}

import {
  canExtend,
  createSession,
  EXTENSION_MINUTES,
  extendSession,
  finishSession,
  INTENTION_MAX_LENGTH,
  isExpired,
  limitProgress,
  markTimesUp,
  MINUTE,
  nextReminderAt,
  normalizeIntention,
  remainingMs,
  REMINDER_HORIZON_MINUTES,
  summarizeDay,
  validateIntention,
  type SessionInput,
  type SessionRecord,
} from '../session';

const T0 = new Date(2026, 9, 11, 9, 41).getTime();

const input = (overrides: Partial<SessionInput> = {}): SessionInput => ({
  intention: 'Reply to Sam about Saturday',
  reminderMinutes: 5,
  timeLimitMinutes: 15,
  ...overrides,
});

describe('intention validation', () => {
  it('collapses whitespace from typing and dictation', () => {
    expect(normalizeIntention('  Reply\n to   Sam  ')).toBe('Reply to Sam');
  });

  it('rejects empty and overly long intentions', () => {
    expect(validateIntention('   ')).toEqual({ ok: false, reason: 'empty' });
    expect(validateIntention('a'.repeat(INTENTION_MAX_LENGTH + 1))).toEqual({
      ok: false,
      reason: 'tooLong',
    });
    expect(validateIntention(' Pay rent ')).toEqual({ ok: true, value: 'Pay rent' });
  });
});

describe('createSession', () => {
  it('computes the time limit from the start time', () => {
    const session = createSession(input(), T0, 's1');
    expect(session).toMatchObject({
      id: 's1',
      intention: 'Reply to Sam about Saturday',
      startedAt: T0,
      endsAt: T0 + 15 * MINUTE,
      extensions: 0,
      status: 'active',
    });
  });

  it('supports sessions without a time limit', () => {
    const session = createSession(input({ timeLimitMinutes: null }), T0, 's1');
    expect(session.endsAt).toBeNull();
    expect(remainingMs(session, T0 + 99 * MINUTE)).toBeNull();
    expect(isExpired(session, T0 + 999 * MINUTE)).toBe(false);
    expect(canExtend(session)).toBe(false);
  });

  it('throws on invalid input instead of persisting bad state', () => {
    expect(() => createSession(input({ intention: '' }), T0, 's1')).toThrow('empty');
    expect(() => createSession(input({ reminderMinutes: 7 as unknown as 5 }), T0, 's1')).toThrow(
      'reminder',
    );
    expect(() => createSession(input({ timeLimitMinutes: 20 as unknown as 15 }), T0, 's1')).toThrow(
      'time limit',
    );
  });
});

describe('time limit', () => {
  const session = createSession(input(), T0, 's1');

  it('counts down and expires exactly at the limit', () => {
    expect(remainingMs(session, T0 + 5 * MINUTE)).toBe(10 * MINUTE);
    expect(isExpired(session, T0 + 15 * MINUTE - 1)).toBe(false);
    expect(isExpired(session, T0 + 15 * MINUTE)).toBe(true);
    expect(remainingMs(session, T0 + 20 * MINUTE)).toBe(0);
  });

  it('reports progress between 0 and 1', () => {
    expect(limitProgress(session, T0)).toBe(0);
    expect(limitProgress(session, T0 + 7.5 * MINUTE)).toBeCloseTo(0.5);
    expect(limitProgress(session, T0 + 60 * MINUTE)).toBe(1);
  });

  it('allows one extension, counted from now when already past the limit', () => {
    const lateNow = T0 + 18 * MINUTE;
    const extended = extendSession(markTimesUp(session), lateNow);
    expect(extended.status).toBe('active');
    expect(extended.endsAt).toBe(lateNow + EXTENSION_MINUTES * MINUTE);
    expect(canExtend(extended)).toBe(false);
    expect(() => extendSession(extended, lateNow)).toThrow();
  });

  it('extends from the current limit when time remains', () => {
    const extended = extendSession(session, T0 + MINUTE);
    expect(extended.endsAt).toBe(T0 + (15 + EXTENSION_MINUTES) * MINUTE);
  });
});

describe('nextReminderAt', () => {
  it('follows the fixed interval grid', () => {
    const session = createSession(input({ reminderMinutes: 5, timeLimitMinutes: 30 }), T0, 's1');
    expect(nextReminderAt(session, T0)).toBe(T0 + 5 * MINUTE);
    expect(nextReminderAt(session, T0 + 5 * MINUTE)).toBe(T0 + 10 * MINUTE);
    expect(nextReminderAt(session, T0 + 7 * MINUTE)).toBe(T0 + 10 * MINUTE);
  });

  it('never schedules a reminder at or after the time limit', () => {
    const session = createSession(input({ reminderMinutes: 5, timeLimitMinutes: 15 }), T0, 's1');
    expect(nextReminderAt(session, T0 + 9 * MINUTE)).toBe(T0 + 10 * MINUTE);
    expect(nextReminderAt(session, T0 + 11 * MINUTE)).toBeNull();
  });

  it('stops after the reminder horizon when there is no limit', () => {
    const session = createSession(input({ timeLimitMinutes: null }), T0, 's1');
    expect(nextReminderAt(session, T0 + (REMINDER_HORIZON_MINUTES + 1) * MINUTE)).toBeNull();
  });

  it('is silent once time is up', () => {
    const session = markTimesUp(createSession(input(), T0, 's1'));
    expect(nextReminderAt(session, T0)).toBeNull();
  });
});

describe('finishSession and summarizeDay', () => {
  it('produces a history record', () => {
    const session = createSession(input(), T0, 's1');
    expect(finishSession(session, 'completed', T0 + 3 * MINUTE)).toEqual({
      id: 's1',
      intention: 'Reply to Sam about Saturday',
      startedAt: T0,
      endedAt: T0 + 3 * MINUTE,
      outcome: 'completed',
      reminderMinutes: 5,
      timeLimitMinutes: 15,
    });
  });

  it('only counts records from the same local day', () => {
    const record = (startedAt: number, outcome: SessionRecord['outcome']): SessionRecord => ({
      id: String(startedAt),
      intention: 'x',
      startedAt,
      endedAt: startedAt + MINUTE,
      outcome,
      reminderMinutes: 5,
      timeLimitMinutes: null,
    });
    const yesterday = new Date(2026, 9, 10, 23, 59).getTime();
    const records = [
      record(T0, 'completed'),
      record(T0 + MINUTE, 'abandoned'),
      record(yesterday, 'completed'),
    ];
    expect(summarizeDay(records, T0 + 60 * MINUTE)).toEqual({ total: 2, completed: 1 });
  });
});

import { MAX_PENDING_NOTIFICATIONS, planNotifications } from '../schedule';
import {
  createSession,
  extendSession,
  markTimesUp,
  MINUTE,
  REMINDER_HORIZON_MINUTES,
  type SessionInput,
} from '../session';

const T0 = new Date(2026, 9, 11, 9, 41).getTime();

const session = (overrides: Partial<SessionInput> = {}) =>
  createSession(
    { intention: 'Check the weather', reminderMinutes: 5, timeLimitMinutes: 15, ...overrides },
    T0,
    'abc',
  );

describe('planNotifications', () => {
  it('schedules reminders on the interval, then time’s up at the limit', () => {
    const plan = planNotifications(session(), T0);
    expect(plan.map((n) => [n.kind, (n.fireAt - T0) / MINUTE])).toEqual([
      ['reminder', 5],
      ['reminder', 10],
      ['timesUp', 15],
    ]);
    expect(new Set(plan.map((n) => n.id)).size).toBe(plan.length);
  });

  it('mentions the intention so the reminder is useful from the Lock Screen', () => {
    const [first] = planNotifications(session(), T0);
    expect(first?.body).toContain('Check the weather');
    expect(first?.body).toContain('5 min in');
  });

  it('skips reminders that are already in the past', () => {
    const plan = planNotifications(session(), T0 + 6 * MINUTE);
    expect(plan.map((n) => (n.fireAt - T0) / MINUTE)).toEqual([10, 15]);
    expect(plan[0]?.id).toBe('abc.reminder.2');
  });

  it('keeps the same grid after an extension', () => {
    const extended = extendSession(session(), T0 + 12 * MINUTE);
    const plan = planNotifications(extended, T0 + 12 * MINUTE);
    expect(plan.map((n) => [n.kind, (n.fireAt - T0) / MINUTE])).toEqual([
      ['reminder', 15],
      ['timesUp', 20],
    ]);
  });

  it('runs until the horizon without a limit', () => {
    const plan = planNotifications(session({ reminderMinutes: 15, timeLimitMinutes: null }), T0);
    expect(plan.every((n) => n.kind === 'reminder')).toBe(true);
    expect(plan).toHaveLength(REMINDER_HORIZON_MINUTES / 15);
  });

  it('stays under the iOS pending-notification cap', () => {
    const plan = planNotifications(session({ reminderMinutes: 5, timeLimitMinutes: null }), T0);
    expect(plan.length).toBeLessThanOrEqual(MAX_PENDING_NOTIFICATIONS);
  });

  it('plans nothing once time is up', () => {
    expect(planNotifications(markTimesUp(session()), T0)).toEqual([]);
  });
});

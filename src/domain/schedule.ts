import { MINUTE, REMINDER_HORIZON_MINUTES, type Session } from './session';

/** iOS keeps at most 64 pending local notifications per app; stay safely below it. */
export const MAX_PENDING_NOTIFICATIONS = 60;

export type NotificationKind = 'reminder' | 'timesUp';

export interface PlannedNotification {
  id: string;
  sessionId: string;
  kind: NotificationKind;
  /** Epoch milliseconds. */
  fireAt: number;
  title: string;
  body: string;
}

export function reminderCopy(session: Session, minutesIn: number) {
  return {
    title: 'Still on track?',
    body: `${minutesIn} min in. You unlocked to: ${session.intention}`,
  };
}

export function timesUpCopy(session: Session) {
  return {
    title: 'Time’s up',
    body: `You unlocked to: ${session.intention}. Time to put your phone down.`,
  };
}

/**
 * Every local notification a session needs from `now` on: reminders on the session's
 * interval grid, then a single "time's up" at the limit. Re-planning after an extension
 * keeps the same grid, so reminder numbering stays stable.
 */
export function planNotifications(session: Session, now: number): PlannedNotification[] {
  if (session.status !== 'active') return [];

  const plan: PlannedNotification[] = [];
  const interval = session.reminderMinutes * MINUTE;
  const horizon = session.startedAt + REMINDER_HORIZON_MINUTES * MINUTE;
  const reminderLimit = session.endsAt === null ? horizon : Math.min(horizon, session.endsAt - 1);
  const reserved = session.endsAt === null ? 0 : 1;

  for (let k = 1; ; k++) {
    const fireAt = session.startedAt + k * interval;
    if (fireAt > reminderLimit) break;
    if (plan.length >= MAX_PENDING_NOTIFICATIONS - reserved) break;
    if (fireAt <= now) continue;
    plan.push({
      id: `${session.id}.reminder.${k}`,
      sessionId: session.id,
      kind: 'reminder',
      fireAt,
      ...reminderCopy(session, k * session.reminderMinutes),
    });
  }

  if (session.endsAt !== null && session.endsAt > now) {
    plan.push({
      id: `${session.id}.timesUp`,
      sessionId: session.id,
      kind: 'timesUp',
      fireAt: session.endsAt,
      ...timesUpCopy(session),
    });
  }

  return plan;
}

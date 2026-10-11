import { planNotifications } from '@/domain/schedule';
import {
  createSession,
  type Session,
  type SessionInput,
  type SessionOutcome,
} from '@/domain/session';
import { focusShield } from '@/services/focusShield';
import { haptics } from '@/services/haptics';
import { liveActivity } from '@/services/liveActivity';
import { reminders } from '@/services/notifications';
import { useSessionStore } from '@/state/sessionStore';

/**
 * Orchestrates a session's side effects. Screens call these functions and never talk
 * to platform services directly, so Phase 2 native features plug in here once.
 */

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const report = (task: string) => (error: unknown) => {
  if (__DEV__) console.warn(`[session] ${task} failed`, error);
};

function syncPlatform(session: Session) {
  const now = Date.now();
  reminders.schedule(planNotifications(session, now)).catch(report('schedule reminders'));
  if (session.endsAt !== null) {
    focusShield.scheduleShield(session.endsAt).catch(report('schedule shield'));
  }
}

function clearPlatform(outcome: SessionOutcome) {
  reminders.cancelAll().catch(report('cancel reminders'));
  focusShield.release().catch(report('release shield'));
  liveActivity.end(outcome).catch(report('end live activity'));
}

export function startIntention(input: SessionInput): Session {
  const session = createSession(input, Date.now(), newId());
  useSessionStore.getState().start(session);
  haptics.medium();
  syncPlatform(session);
  liveActivity
    .start({ intention: session.intention, startedAt: session.startedAt, endsAt: session.endsAt })
    .catch(report('start live activity'));
  return session;
}

export function finishIntention(outcome: SessionOutcome) {
  const record = useSessionStore.getState().finish(outcome, Date.now());
  if (!record) return null;
  if (outcome === 'completed') haptics.success();
  clearPlatform(outcome);
  return record;
}

/** Five more minutes, once per session. */
export function extendIntention() {
  const session = useSessionStore.getState().extend(Date.now());
  if (!session) return null;
  haptics.light();
  syncPlatform(session);
  liveActivity
    .update({ intention: session.intention, startedAt: session.startedAt, endsAt: session.endsAt })
    .catch(report('update live activity'));
  return session;
}

/** Called when the time limit is reached while the app is running (or on next launch). */
export function reachTimesUp() {
  const { active, timesUp } = useSessionStore.getState();
  if (!active || active.status !== 'active') return;
  timesUp();
  haptics.warning();
}

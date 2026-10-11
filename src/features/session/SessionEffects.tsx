import { usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { isExpired, nextReminderAt } from '@/domain/session';
import { haptics } from '@/services/haptics';
import { reminders, type ReminderResponse } from '@/services/notifications';
import { useSessionStore } from '@/state/sessionStore';

import { finishIntention, reachTimesUp } from './sessionController';

/**
 * App-wide session behavior that isn't tied to a screen:
 * - configures notifications and handles "I did it" from a notification,
 * - watches the time limit (also on return from background),
 * - nudges the floating pill on schedule where notifications don't exist (web preview),
 * - presents the time's-up screen whenever the session is in that state.
 */
export function SessionEffects() {
  const router = useRouter();
  const pathname = usePathname();
  const navigationReady = Boolean(useRootNavigationState()?.key);
  const active = useSessionStore((state) => state.active);

  useEffect(() => {
    reminders
      .configure({
        onForegroundReminder: () => {
          useSessionStore.getState().nudge(Date.now());
          haptics.light();
        },
      })
      .catch((error) => __DEV__ && console.warn('[notifications] configure failed', error));
  }, []);

  useEffect(() => {
    const handle = (response: ReminderResponse) => {
      const current = useSessionStore.getState().active;
      if (!current || response.action !== 'done') return;
      if (response.sessionId !== null && response.sessionId !== current.id) return;
      finishIntention('completed');
    };
    const launch = reminders.takeLaunchResponse();
    if (launch) handle(launch);
    return reminders.addResponseListener(handle);
  }, []);

  useEffect(() => {
    if (!active || active.status !== 'active' || active.endsAt === null) return;
    const check = () => {
      if (isExpired(active, Date.now())) reachTimesUp();
    };
    check();
    const timer = setTimeout(check, Math.max(0, active.endsAt - Date.now()) + 50);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [active]);

  useEffect(() => {
    if (reminders.supported || !active || active.status !== 'active') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleNext = () => {
      const at = nextReminderAt(active, Date.now());
      if (at === null) return;
      timer = setTimeout(() => {
        useSessionStore.getState().nudge(Date.now());
        scheduleNext();
      }, at - Date.now());
    };
    scheduleNext();
    return () => clearTimeout(timer);
  }, [active]);

  const timesUp = active?.status === 'timesUp';
  useEffect(() => {
    if (navigationReady && timesUp && pathname !== '/times-up') router.push('/times-up');
  }, [navigationReady, timesUp, pathname, router]);

  return null;
}

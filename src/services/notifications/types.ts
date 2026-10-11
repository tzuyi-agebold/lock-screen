import type { NotificationKind, PlannedNotification } from '@/domain/schedule';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export interface ReminderResponse {
  kind: NotificationKind | null;
  sessionId: string | null;
  /** `open` = tapped the notification, `done` = tapped the "I did it" action. */
  action: 'open' | 'done';
}

export interface ReminderHandlers {
  /** A reminder fired while the app is in the foreground (no banner is shown). */
  onForegroundReminder: () => void;
}

/** Local reminders. Implemented with expo-notifications on device, a no-op on web. */
export interface ReminderService {
  readonly supported: boolean;
  configure: (handlers: ReminderHandlers) => Promise<void>;
  getPermission: () => Promise<PermissionState>;
  requestPermission: () => Promise<PermissionState>;
  /** Replaces every pending reminder with `plan`. */
  schedule: (plan: readonly PlannedNotification[]) => Promise<void>;
  /** Cancels pending reminders and clears delivered ones from Notification Center. */
  cancelAll: () => Promise<void>;
  addResponseListener: (listener: (response: ReminderResponse) => void) => () => void;
  /** The response that launched the app, consumed once. */
  takeLaunchResponse: () => ReminderResponse | null;
}

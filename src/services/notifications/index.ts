import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationKind } from '@/domain/schedule';

import type { PermissionState, ReminderResponse, ReminderService } from './types';

export type { PermissionState, ReminderResponse, ReminderService } from './types';

const ANDROID_CHANNEL = 'reminders';
const DONE_ACTION = 'done';
// Category identifiers must not contain ":" or "-".
const CATEGORY: Record<NotificationKind, string> = {
  reminder: 'intention_reminder',
  timesUp: 'intention_timesup',
};

function toPermissionState(status: Notifications.NotificationPermissionsStatus): PermissionState {
  if (status.granted) return 'granted';
  // Provisional (quiet) authorization still delivers to Notification Center.
  if (status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'denied';
}

function toResponse(response: Notifications.NotificationResponse): ReminderResponse {
  const data = response.notification.request.content.data ?? {};
  const kind = data.kind === 'reminder' || data.kind === 'timesUp' ? data.kind : null;
  return {
    kind,
    sessionId: typeof data.sessionId === 'string' ? data.sessionId : null,
    action: response.actionIdentifier === DONE_ACTION ? 'done' : 'open',
  };
}

export const reminders: ReminderService = {
  supported: true,

  async configure({ onForegroundReminder }) {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // In the foreground the floating pill nudges instead of a banner covering the app.
        if (notification.request.content.data?.kind === 'reminder') onForegroundReminder();
        return {
          shouldShowBanner: false,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      },
    });

    const doneAction: Notifications.NotificationAction = {
      identifier: DONE_ACTION,
      buttonTitle: 'I did it',
      options: { opensAppToForeground: true },
    };
    await Promise.all([
      Notifications.setNotificationCategoryAsync(CATEGORY.reminder, [doneAction]),
      Notifications.setNotificationCategoryAsync(CATEGORY.timesUp, [doneAction]),
      Platform.OS === 'android'
        ? Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
            name: 'Intention reminders',
            importance: Notifications.AndroidImportance.HIGH,
          })
        : Promise.resolve(),
    ]);
  },

  async getPermission() {
    return toPermissionState(await Notifications.getPermissionsAsync());
  },

  async requestPermission() {
    return toPermissionState(
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      }),
    );
  },

  async schedule(plan) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Promise.all(
      plan.map((item) =>
        Notifications.scheduleNotificationAsync({
          identifier: item.id,
          content: {
            title: item.title,
            body: item.body,
            data: { kind: item.kind, sessionId: item.sessionId },
            categoryIdentifier: CATEGORY[item.kind],
            // Only the moment the time limit hits may break through Focus; regular
            // reminders stay polite.
            interruptionLevel: item.kind === 'timesUp' ? 'timeSensitive' : 'active',
            sound: item.kind === 'timesUp' ? 'default' : false,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: item.fireAt,
            channelId: ANDROID_CHANNEL,
          },
        }),
      ),
    );
  },

  async cancelAll() {
    await Promise.all([
      Notifications.cancelAllScheduledNotificationsAsync(),
      Notifications.dismissAllNotificationsAsync(),
    ]);
  },

  addResponseListener(listener) {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
      listener(toResponse(response)),
    );
    return () => subscription.remove();
  },

  takeLaunchResponse() {
    const response = Notifications.getLastNotificationResponse();
    if (!response) return null;
    Notifications.clearLastNotificationResponse();
    return toResponse(response);
  },
};

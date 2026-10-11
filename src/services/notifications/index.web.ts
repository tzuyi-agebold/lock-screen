import type { ReminderService } from './types';

export type { PermissionState, ReminderResponse, ReminderService } from './types';

/**
 * The web preview has no local notifications. Reminders still surface in-app through the
 * floating pill, so the flow can be tried end to end in a browser.
 */
export const reminders: ReminderService = {
  supported: false,
  configure: async () => {},
  getPermission: async () => 'unsupported',
  requestPermission: async () => 'unsupported',
  schedule: async () => {},
  cancelAll: async () => {},
  addResponseListener: () => () => {},
  takeLaunchResponse: () => null,
};

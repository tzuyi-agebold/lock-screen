import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ReminderInterval, TimeLimit } from '@/domain/session';

import { persistStorage } from './storage';

export interface SettingsState {
  hasOnboarded: boolean;
  /** Defaults pre-selected on the intention screen. */
  reminderMinutes: ReminderInterval;
  timeLimitEnabled: boolean;
  timeLimitMinutes: TimeLimit;
  hapticsEnabled: boolean;

  completeOnboarding: () => void;
  setReminderMinutes: (minutes: ReminderInterval) => void;
  setTimeLimitEnabled: (enabled: boolean) => void;
  setTimeLimitMinutes: (minutes: TimeLimit) => void;
  setHapticsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      reminderMinutes: 10,
      timeLimitEnabled: false,
      timeLimitMinutes: 30,
      hapticsEnabled: true,

      completeOnboarding: () => set({ hasOnboarded: true }),
      setReminderMinutes: (reminderMinutes) => set({ reminderMinutes }),
      setTimeLimitEnabled: (timeLimitEnabled) => set({ timeLimitEnabled }),
      setTimeLimitMinutes: (timeLimitMinutes) => set({ timeLimitMinutes }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
    }),
    {
      name: 'intention.settings',
      version: 1,
      storage: persistStorage,
    },
  ),
);

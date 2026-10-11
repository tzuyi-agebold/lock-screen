import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  extendSession,
  finishSession,
  markTimesUp,
  type Session,
  type SessionOutcome,
  type SessionRecord,
} from '@/domain/session';

import { persistStorage } from './storage';

export const HISTORY_LIMIT = 200;

export interface SessionState {
  active: Session | null;
  /** Most recent first. */
  history: SessionRecord[];
  /** Whether the floating pill is shown. Reset to visible for every new session. */
  pillVisible: boolean;
  /** Bumped when a reminder fires while the app is open, so the pill can nudge. */
  nudgeAt: number;

  start: (session: Session) => void;
  extend: (now: number) => Session | null;
  timesUp: () => void;
  finish: (outcome: SessionOutcome, now: number) => SessionRecord | null;
  setPillVisible: (visible: boolean) => void;
  nudge: (now: number) => void;
  clearHistory: () => void;
}

/**
 * Pure state transitions. Side effects (notifications, haptics, Live Activities) live in
 * `features/session/sessionController.ts` so this store stays easy to reason about.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      active: null,
      history: [],
      pillVisible: true,
      nudgeAt: 0,

      start: (session) => set({ active: session, pillVisible: true }),

      extend: (now) => {
        const { active } = get();
        if (!active) return null;
        const extended = extendSession(active, now);
        set({ active: extended });
        return extended;
      },

      timesUp: () => {
        const { active } = get();
        if (active && active.status === 'active') set({ active: markTimesUp(active) });
      },

      finish: (outcome, now) => {
        const { active, history } = get();
        if (!active) return null;
        const record = finishSession(active, outcome, now);
        set({ active: null, history: [record, ...history].slice(0, HISTORY_LIMIT) });
        return record;
      },

      setPillVisible: (pillVisible) => set({ pillVisible }),
      nudge: (now) => set({ nudgeAt: now }),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'intention.session',
      version: 1,
      storage: persistStorage,
      partialize: ({ active, history, pillVisible }) => ({ active, history, pillVisible }),
    },
  ),
);

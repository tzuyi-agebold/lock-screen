import type { SessionOutcome } from '@/domain/session';

/**
 * Live Activity: the floating module that works *outside* the app.
 *
 * Apps can't draw over other apps on iOS. The approved equivalent is a Live Activity:
 * the intention and countdown on the Lock Screen and in the Dynamic Island, visible while
 * the person is in Instagram, Mail or anywhere else, with an "I did it" button.
 *
 * Phase 1 shows the in-app floating pill only. Phase 2 implements this interface with
 * `expo-widgets` in a development build (see docs/ROADMAP.md).
 */
export interface LiveActivityContent {
  intention: string;
  startedAt: number;
  endsAt: number | null;
}

export interface LiveActivityService {
  readonly available: boolean;
  start: (content: LiveActivityContent) => Promise<void>;
  update: (content: LiveActivityContent) => Promise<void>;
  end: (outcome: SessionOutcome) => Promise<void>;
}

export const liveActivity: LiveActivityService = {
  available: false,
  start: async () => {},
  update: async () => {},
  end: async () => {},
};

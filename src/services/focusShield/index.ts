/**
 * Focus shield: the "hard lock".
 *
 * iOS has no API that lets an app lock the device. The App Store-approved way to stop
 * usage is Apple's Screen Time API (FamilyControls + ManagedSettings + DeviceActivity):
 * when the limit hits, shield every app except an allowlist (Phone, Messages, Maps), with
 * a custom shield screen that names the person's intention.
 *
 * Phase 1 (Expo Go) does this inside the app instead: the time's-up screen plus a
 * time-sensitive notification. Phase 2 replaces this module with a native implementation
 * (see docs/ROADMAP.md). The interface stays the same, so no screen code changes.
 */
export interface FocusShield {
  /** True when the native Screen Time shield is available and authorized. */
  readonly available: boolean;
  /** Arrange for apps to be shielded at `endsAt` (runs even if the app is closed). */
  scheduleShield: (endsAt: number) => Promise<void>;
  /** Removes any shield and cancels a pending schedule. */
  release: () => Promise<void>;
}

export const focusShield: FocusShield = {
  available: false,
  scheduleShield: async () => {},
  release: async () => {},
};

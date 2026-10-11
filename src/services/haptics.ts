import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useSettingsStore } from '@/state/settingsStore';

const enabled = () => Platform.OS !== 'web' && useSettingsStore.getState().hapticsEnabled;

const play = (effect: () => Promise<void>) => {
  if (!enabled()) return;
  effect().catch(() => {
    // Haptics are a nicety; never let them surface an error.
  });
};

/** HIG-aligned haptic vocabulary, respecting the in-app haptics setting. */
export const haptics = {
  /** Picking a value (segmented control, chip). */
  selection: () => play(() => Haptics.selectionAsync()),
  /** Something settles into place (pill snapping to a corner). */
  light: () => play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A deliberate commit (starting a session). */
  medium: () => play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => play(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => play(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};

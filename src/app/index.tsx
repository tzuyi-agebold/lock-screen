import { Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ActiveSession } from '@/features/session/ActiveSession';
import { IntentionComposer } from '@/features/intention/IntentionComposer';
import { useSessionStore } from '@/state/sessionStore';
import { useSettingsStore } from '@/state/settingsStore';
import { durations } from '@/ui/theme';

/**
 * The home screen is the "unlock moment": with no active session it asks for an intention;
 * once one is set it becomes the session dashboard.
 */
export default function Home() {
  const hasOnboarded = useSettingsStore((state) => state.hasOnboarded);
  const active = useSessionStore((state) => state.active);

  if (!hasOnboarded) return <Redirect href="/onboarding" />;

  return (
    <Animated.View
      key={active ? `session-${active.id}` : 'composer'}
      entering={FadeIn.duration(durations.slow)}
      exiting={FadeOut.duration(durations.fast)}
      style={styles.fill}
    >
      {active ? <ActiveSession session={active} /> : <IntentionComposer />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Absolute so the outgoing and incoming states cross-fade in place.
  fill: { ...StyleSheet.absoluteFill },
});

import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { reminders } from '@/services/notifications';
import { useSettingsStore } from '@/state/settingsStore';
import { AmbientBackground, BrandMark, Button, Text } from '@/ui/components';
import { spacing } from '@/ui/theme';

const LINES = ['Name what you came to do.', 'Get nudged if you drift.', 'Stop when time’s up.'];

/** First launch: the idea in three lines, on the same ambient field as the home screen. */
export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);

  const onContinue = async () => {
    try {
      await reminders.requestPermission();
    } catch {
      // Reminders still work in-app without permission.
    }
    completeOnboarding();
    router.replace('/');
  };

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <View style={[styles.body, { paddingTop: insets.top + spacing.huge }]}>
        <Animated.View entering={FadeIn.duration(900)}>
          <BrandMark size={56} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150).duration(700)} style={styles.copy}>
          <Text variant="display" accessibilityRole="header">
            Unlock with intention.
          </Text>
          <View style={styles.lines}>
            {LINES.map((line) => (
              <Text key={line} variant="body" color="secondaryLabel">
                {line}
              </Text>
            ))}
          </View>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeIn.delay(500).duration(700)}
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
      >
        <Text variant="micro" color="tertiaryLabel" align="center">
          Stays on your iPhone · No account
        </Text>
        <Button title="Continue" onPress={onContinue} testID="onboarding-continue" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xxxl,
  },
  copy: {
    gap: spacing.lg,
  },
  lines: {
    gap: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
});

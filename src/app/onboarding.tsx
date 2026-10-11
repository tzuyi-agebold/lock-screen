import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { reminders } from '@/services/notifications';
import { useSettingsStore } from '@/state/settingsStore';
import { Button, GlowSlab, Text } from '@/ui/components';
import { ON_GLOW, spacing, useTheme } from '@/ui/theme';

const LINES = ['Name what you came to do.', 'Get nudged if you drift.', 'Stop when time’s up.'];

/** First launch: the glowing slab with the wordmark, the idea in three lines. */
export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.body, { paddingTop: insets.top + spacing.xxxl }]}>
        {/* Not wrapped in an entering animation: that would clip the slab's halo on web. */}
        <View style={styles.slabWrap}>
          <GlowSlab radius={48} style={styles.slab}>
            <View style={styles.wordmarkWrap}>
              <Text style={styles.wordmark} accessibilityRole="header">
                intention
              </Text>
            </View>
          </GlowSlab>
        </View>
        <Animated.View entering={FadeInDown.delay(250).duration(700)} style={styles.copy}>
          <Text variant="title" align="center">
            Unlock with intention.
          </Text>
          <View style={styles.lines}>
            {LINES.map((line) => (
              <Text key={line} variant="body" color="secondaryLabel" align="center">
                {line}
              </Text>
            ))}
          </View>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeIn.delay(600).duration(700)}
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
    gap: spacing.huge,
  },
  slabWrap: {
    alignItems: 'center',
  },
  slab: {
    width: '68%',
    maxWidth: 300,
    aspectRatio: 0.82,
  },
  wordmarkWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    color: ON_GLOW,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '500',
    letterSpacing: -0.4,
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

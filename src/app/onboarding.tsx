import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { reminders } from '@/services/notifications';
import { useSettingsStore } from '@/state/settingsStore';
import { Button, Icon, Text, type IconName } from '@/ui/components';
import { radius, spacing, useTheme, type ColorName } from '@/ui/theme';

const FEATURES: { icon: IconName; color: ColorName; title: string; body: string }[] = [
  {
    icon: 'target',
    color: 'tint',
    title: 'Name it first',
    body: 'Before you dive in, type or say the one thing you came to do.',
  },
  {
    icon: 'bell',
    color: 'orange',
    title: 'Gentle nudges',
    body: 'Every 5, 10 or 15 minutes, a reminder brings you back if you drift into another app.',
  },
  {
    icon: 'hourglass',
    color: 'teal',
    title: 'A clear finish line',
    body: 'Set a time limit, and you’ll be asked to put your phone down when it’s up.',
  },
];

/** A "Welcome" sheet in the style of Apple's own apps: what it does, in three lines. */
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
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.huge }]}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <View style={[styles.appIcon, { backgroundColor: colors.tint }]}>
            <Icon name="target" size={38} tintColor={colors.onTint} weight="semibold" />
          </View>
          <Text variant="largeTitle" align="center" accessibilityRole="header">
            Unlock with intention
          </Text>
          <Text color="secondaryLabel" align="center">
            Most unlocks start with a purpose and end somewhere else. Intention helps you remember
            why you picked up your phone.
          </Text>
        </Animated.View>

        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeInDown.delay(150 + index * 120).duration(500)}
              style={styles.feature}
            >
              <View style={styles.featureIcon}>
                <Icon name={feature.icon} size={30} color={feature.color} />
              </View>
              <View style={styles.featureText}>
                <Text variant="headline">{feature.title}</Text>
                <Text variant="subheadline" color="secondaryLabel">
                  {feature.body}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.privacy}>
          <Icon name="hand" size={14} color="tint" />
          <Text variant="footnote" color="secondaryLabel" align="center">
            Everything stays on your iPhone. No account needed.
          </Text>
        </View>
        <Button title="Continue" onPress={onContinue} testID="onboarding-continue" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  features: {
    marginTop: spacing.huge,
    gap: spacing.xxl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  featureIcon: {
    width: 40,
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  privacy: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
});

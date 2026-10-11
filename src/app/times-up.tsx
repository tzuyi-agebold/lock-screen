import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCountdown } from '@/domain/duration';
import { canExtend, EXTENSION_MINUTES } from '@/domain/session';
import { extendIntention, finishIntention } from '@/features/session/sessionController';
import { useNow } from '@/hooks/useNow';
import { useSessionStore } from '@/state/sessionStore';
import { Button, Icon, Text } from '@/ui/components';
import { durations, spacing, ThemeScope, useTheme } from '@/ui/theme';

/** A short pause before the next intention — the in-app half of the hard lock. */
export const REST_SECONDS = 60;

/**
 * Shown when the time limit is reached. Phase 2 pairs this with a Screen Time shield so
 * other apps are paused too; until then it's an honest, in-app stop sign.
 */
export default function TimesUp() {
  // Always dark: a calm, distinct "stop" moment regardless of appearance.
  return (
    <ThemeScope scheme="dark">
      <StatusBar style="light" />
      <TimesUpContent />
    </ThemeScope>
  );
}

function TimesUpContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const active = useSessionStore((state) => state.active);
  const [restUntil, setRestUntil] = useState<number | null>(null);
  // Captured once: the session is cleared as soon as the person answers.
  const [intention] = useState(() => active?.intention ?? '');
  const now = useNow(1000, restUntil !== null);

  // Return to the home screen underneath (it shows the intention composer again).
  const leave = useCallback(() => {
    if (router.canDismiss()) router.dismiss();
    else router.replace('/');
  }, [router]);

  // Nothing to show (e.g. the session was finished from a notification).
  useEffect(() => {
    if (restUntil === null && !active) leave();
  }, [active, restUntil, leave]);

  const tilt = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    // The hourglass flips over, rests, and flips again.
    tilt.set(
      withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(180, { duration: 700 }),
            withDelay(1600, withTiming(360, { duration: 700 })),
            withTiming(0, { duration: 0 }),
            withDelay(1600, withTiming(0, { duration: 0 })),
          ),
          -1,
        ),
      ),
    );
  }, [reduceMotion, tilt]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.get()}deg` }] }));

  const finish = (outcome: 'completed' | 'timedOut') => {
    setRestUntil(Date.now() + REST_SECONDS * 1000);
    finishIntention(outcome);
  };

  const resting = restUntil !== null;
  const restLeft = resting ? Math.min(REST_SECONDS * 1000, Math.max(0, restUntil - now)) : 0;

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.restBackground,
          paddingTop: insets.top + spacing.huge,
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
    >
      {!resting ? (
        <Animated.View key="ask" entering={FadeIn.duration(durations.slow)} style={styles.body}>
          <Animated.View style={iconStyle}>
            <Icon name="hourglass" size={64} color="label" weight="light" />
          </Animated.View>
          <Text variant="largeTitle" align="center" accessibilityRole="header">
            Time’s up
          </Text>
          <View style={styles.quote}>
            <Text variant="subheadline" align="center" color="secondaryLabel">
              You unlocked to
            </Text>
            <Text variant="title2" align="center">
              “{intention}”
            </Text>
          </View>
          <Text variant="body" align="center" color="secondaryLabel">
            Did you get it done?
          </Text>
        </Animated.View>
      ) : (
        <Animated.View
          key="rest"
          entering={FadeInDown.duration(durations.slow)}
          style={styles.body}
        >
          <Icon name="moon" size={56} color="label" weight="light" />
          <Text variant="largeTitle" align="center" accessibilityRole="header">
            Phone down
          </Text>
          <Text variant="body" align="center" color="secondaryLabel">
            Take a breath and look up. Your next intention can wait a minute.
          </Text>
          <Text
            variant="largeTitle"
            rounded
            tabular
            align="center"
            style={styles.timer}
            accessibilityLabel={`${Math.ceil(restLeft / 1000)} seconds`}
          >
            {formatCountdown(restLeft)}
          </Text>
        </Animated.View>
      )}

      <View style={styles.actions}>
        {!resting ? (
          <>
            <Button title="Yes, I did it" icon="check" onPress={() => finish('completed')} />
            <Button title="Not this time" variant="gray" onPress={() => finish('timedOut')} />
            {active && canExtend(active) ? (
              <Button
                title={`${EXTENSION_MINUTES} more minutes`}
                variant="plain"
                size="medium"
                onPress={() => {
                  extendIntention();
                  leave();
                }}
                accessibilityHint="Extends the time limit once."
              />
            ) : null}
          </>
        ) : (
          <Button
            title={restLeft > 0 ? 'Resting…' : 'Set a new intention'}
            icon={restLeft > 0 ? 'leaf' : 'target'}
            disabled={restLeft > 0}
            onPress={leave}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  quote: {
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  timer: {
    fontSize: 56,
    lineHeight: 64,
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
});

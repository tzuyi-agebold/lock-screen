import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
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
import { durations, spacing, useTheme } from '@/ui/theme';

/** A short pause before the next intention — the in-app half of the hard lock. */
export const REST_SECONDS = 60;

/**
 * Shown when the time limit is reached. Phase 2 pairs this with a Screen Time shield so
 * other apps are paused too; until then it's an honest, in-app stop sign.
 */
export default function TimesUp() {
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
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.huge,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
      ]}
    >
      {!resting ? (
        <Animated.View key="ask" entering={FadeIn.duration(durations.slow)} style={styles.body}>
          <Animated.View style={iconStyle}>
            <Icon name="hourglass" size={40} color="secondaryLabel" weight="ultraLight" />
          </Animated.View>
          <Text variant="micro" color="tertiaryLabel" accessibilityRole="header">
            Time’s up
          </Text>
          <Text variant="display" align="center">
            {intention}
          </Text>
          <Text variant="subheadline" align="center" color="secondaryLabel">
            Did you get it done?
          </Text>
        </Animated.View>
      ) : (
        <Animated.View key="rest" entering={FadeIn.duration(durations.slow)} style={styles.body}>
          <Text variant="micro" color="tertiaryLabel" accessibilityRole="header">
            Phone down
          </Text>
          <Text
            variant="numeral"
            align="center"
            accessibilityLabel={`${Math.ceil(restLeft / 1000)} seconds`}
          >
            {formatCountdown(restLeft)}
          </Text>
          <Text variant="subheadline" align="center" color="secondaryLabel">
            Look up. Breathe. The next thing can wait a minute.
          </Text>
        </Animated.View>
      )}

      <View style={styles.actions}>
        {!resting ? (
          <>
            <Button title="Yes, done" onPress={() => finish('completed')} />
            <View style={styles.secondary}>
              <Button
                title="Not this time"
                variant="quiet"
                size="medium"
                onPress={() => finish('timedOut')}
              />
              {active && canExtend(active) ? (
                <Button
                  title={`${EXTENSION_MINUTES} more min`}
                  variant="quiet"
                  size="medium"
                  onPress={() => {
                    extendIntention();
                    leave();
                  }}
                  accessibilityHint="Extends the time limit once."
                />
              ) : null}
            </View>
          </>
        ) : (
          <Button
            title={restLeft > 0 ? 'Resting' : 'New intention'}
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
  actions: {
    gap: spacing.xs,
  },
  secondary: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

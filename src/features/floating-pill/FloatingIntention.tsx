import { usePathname } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { formatCountdown, spokenDuration } from '@/domain/duration';
import { limitProgress, nextReminderAt, remainingMs, type Session } from '@/domain/session';
import { useNow } from '@/hooks/useNow';
import { haptics } from '@/services/haptics';
import { useSessionStore } from '@/state/sessionStore';
import { Button, GlassSurface, Icon, ProgressBar, Text, type IconName } from '@/ui/components';
import { durations, radius, spacing, springs, useTheme } from '@/ui/theme';

import { finishIntention } from '../session/sessionController';
import {
  reanchor,
  resolveSnap,
  TUCK_VISIBLE_WIDTH,
  tuckedX,
  untuck,
  type Side,
  type SnapArea,
  type SnapResult,
} from './snap';

/** Space kept clear for navigation chrome (top) and the primary actions (bottom). */
const KEEP_CLEAR_TOP = 52;
const KEEP_CLEAR_BOTTOM = 140;
/** Screens where the pill would only get in the way (modals cover it on iOS anyway). */
const HIDDEN_ON = new Set(['/onboarding', '/times-up', '/settings']);
const COMPACT_HEIGHT = 52;
const COMPACT_MAX_WIDTH = 248;
const EXPANDED_WIDTH = 320;

/**
 * The floating intention pill — an in-app Picture-in-Picture for the current intention.
 * Drag it anywhere; it springs to the nearest corner. Fling it past the side of the
 * screen to tuck it away, tap the tab to bring it back. Tap to expand for actions.
 *
 * Across other apps, the same role is played by the Live Activity (Phase 2).
 */
export function FloatingIntention() {
  const active = useSessionStore((state) => state.active);
  const pillVisible = useSessionStore((state) => state.pillVisible);
  const pathname = usePathname();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);

  const show =
    active !== null && active.status === 'active' && pillVisible && !HIDDEN_ON.has(pathname);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setArea((previous) =>
      previous?.width === width && previous.height === height ? previous : { width, height },
    );
  }, []);

  return (
    <View style={styles.layer} pointerEvents="box-none" onLayout={onLayout}>
      {show && area ? <Pill session={active} area={area} /> : null}
    </View>
  );
}

function Pill({
  session,
  area: container,
}: {
  session: Session;
  area: { width: number; height: number };
}) {
  const { colors, glass } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const setPillVisible = useSessionStore((state) => state.setPillVisible);
  const now = useNow(1000);
  const [expanded, setExpanded] = useState(false);
  /** The edge the pill is tucked into, or `null` when it rests in a corner. */
  const [tuckSide, setTuckSide] = useState<Side | null>(null);

  const area: SnapArea = {
    width: container.width,
    height: container.height,
    top: insets.top + KEEP_CLEAR_TOP,
    bottom: insets.bottom + KEEP_CLEAR_BOTTOM,
    left: insets.left,
    right: insets.right,
  };

  // First appearance: bottom-right corner, clear of the intention and the actions. Placed
  // from an estimated size so the very first frame is already in the right spot.
  const [initial] = useState(() =>
    reanchor(
      { x: 0, y: Number.MAX_SAFE_INTEGER, side: 'right', tucked: false },
      { width: COMPACT_MAX_WIDTH, height: COMPACT_HEIGHT },
      area,
    ),
  );

  const areaSV = useSharedValue(area);
  const size = useSharedValue({ width: COMPACT_MAX_WIDTH, height: COMPACT_HEIGHT });
  const snap = useSharedValue<SnapResult>(initial);
  const x = useSharedValue(initial.x);
  const y = useSharedValue(initial.y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lift = useSharedValue(0);
  const pulse = useSharedValue(reduceMotion ? 1 : 0.85);
  const placed = useSharedValue(false);

  // Shared values use `.get()` / `.set()` so the component stays React Compiler friendly.
  const moveTo = useCallback(
    (result: SnapResult, velocity = { x: 0, y: 0 }) => {
      'worklet';
      snap.set(result);
      if (reduceMotion) {
        x.set(withTiming(result.x, { duration: durations.base }));
        y.set(withTiming(result.y, { duration: durations.base }));
      } else {
        x.set(withSpring(result.x, { ...springs.snappy, velocity: velocity.x }));
        y.set(withSpring(result.y, { ...springs.snappy, velocity: velocity.y }));
      }
    },
    [reduceMotion, snap, x, y],
  );

  // Keep the pill inside the screen when the area changes (rotation, safe area, web resize).
  const { width, height, top, bottom, left: insetLeft, right: insetRight } = area;
  useEffect(() => {
    const next = { width, height, top, bottom, left: insetLeft, right: insetRight };
    areaSV.set(next);
    if (placed.get()) moveTo(reanchor(snap.get(), size.get(), next));
  }, [width, height, top, bottom, insetLeft, insetRight, areaSV, placed, moveTo, snap, size]);

  const onPillLayout = (event: LayoutChangeEvent) => {
    const measured = {
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    };
    size.set(measured);
    if (!placed.get()) {
      // Correct for the real size without animating, then pop in.
      const exact = reanchor(snap.get(), measured, area);
      snap.set(exact);
      x.set(exact.x);
      y.set(exact.y);
      pulse.set(reduceMotion ? 1 : withSpring(1, springs.bouncy));
      placed.set(true);
    } else {
      moveTo(reanchor(snap.get(), measured, areaSV.get()));
    }
  };

  const onSettled = useCallback((result: SnapResult) => {
    setTuckSide(result.tucked ? result.side : null);
    if (result.tucked) setExpanded(false);
    haptics.light();
  }, []);

  const bringBack = useCallback(() => {
    const current = snap.get();
    moveTo(untuck(current.y, current.side, size.get(), areaSV.get()));
    setTuckSide(null);
    haptics.light();
  }, [areaSV, moveTo, size, snap]);

  const tuckAway = useCallback(() => {
    const current = snap.get();
    moveTo({ ...current, x: tuckedX(current.side, size.get(), areaSV.get()), tucked: true });
    setTuckSide(current.side);
    setExpanded(false);
    haptics.light();
  }, [areaSV, moveTo, size, snap]);

  // A reminder fired while the app is open: bring the pill out and give it a gentle bounce.
  useEffect(
    () =>
      useSessionStore.subscribe((state, previous) => {
        if (state.nudgeAt === previous.nudgeAt) return;
        if (snap.get().tucked) bringBack();
        if (!reduceMotion) {
          pulse.set(withSequence(withSpring(1.08, springs.bouncy), withSpring(1, springs.bouncy)));
        }
      }),
    [bringBack, pulse, reduceMotion, snap],
  );

  const toggleExpanded = useCallback(() => {
    if (snap.get().tucked) {
      bringBack();
      return;
    }
    haptics.selection();
    setExpanded((value) => !value);
  }, [bringBack, snap]);

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.set(x.get());
      startY.set(y.get());
      lift.set(withSpring(1, springs.snappy));
    })
    .onUpdate((event) => {
      x.set(startX.get() + event.translationX);
      y.set(startY.get() + event.translationY);
    })
    .onEnd((event) => {
      const velocity = { x: event.velocityX, y: event.velocityY };
      const result = resolveSnap({ x: x.get(), y: y.get() }, velocity, size.get(), areaSV.get());
      moveTo(result, velocity);
      scheduleOnRN(onSettled, result);
    })
    .onFinalize(() => {
      lift.set(withSpring(0, springs.snappy));
    });

  const tap = Gesture.Tap().onEnd(() => {
    scheduleOnRN(toggleExpanded);
  });

  const gesture = Gesture.Race(pan, tap);

  const positionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { scale: pulse.get() * (1 + lift.get() * 0.04) },
    ],
  }));

  const nextAt = nextReminderAt(session, now);
  const left = remainingMs(session, now);
  const progress = limitProgress(session, now);
  const countdown = left !== null ? left : nextAt !== null ? nextAt - now : null;
  const countdownIcon: IconName = left !== null ? 'hourglass' : 'bell';
  const countdownLabel =
    left !== null
      ? `${spokenDuration(left)} left`
      : nextAt !== null
        ? `next reminder in ${spokenDuration(nextAt - now)}`
        : 'no more reminders';

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    switch (event.nativeEvent.actionName) {
      case 'activate':
        toggleExpanded();
        break;
      case 'done':
        finishIntention('completed');
        break;
      case 'tuck':
        tuckAway();
        break;
      case 'close':
        setPillVisible(false);
        break;
    }
  };

  const cornerRadius = expanded ? radius.xl : COMPACT_HEIGHT / 2;

  return (
    <Animated.View
      entering={FadeIn.duration(durations.base)}
      exiting={FadeOut.duration(durations.fast)}
      style={[
        styles.container,
        {
          width: expanded ? Math.min(EXPANDED_WIDTH, area.width - spacing.xxl) : undefined,
          borderRadius: cornerRadius,
          boxShadow: glass.shadow,
        },
        positionStyle,
      ]}
      layout={LinearTransition.springify().damping(20)}
      onLayout={onPillLayout}
    >
      <GlassSurface borderRadius={cornerRadius} interactive>
        <GestureDetector gesture={gesture}>
          <View
            style={[styles.header, !expanded && styles.headerCompact]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Your intention: ${session.intention}. ${countdownLabel}.`}
            accessibilityHint={expanded ? 'Hides actions.' : 'Shows actions. Drag to move.'}
            accessibilityActions={[
              { name: 'activate' },
              { name: 'done', label: 'Done' },
              { name: 'tuck', label: 'Tuck away' },
              { name: 'close', label: 'Close floating reminder' },
            ]}
            onAccessibilityAction={onAccessibilityAction}
          >
            <View style={[styles.dot, { backgroundColor: colors.label }]} />
            <Text
              variant={expanded ? 'headline' : 'subheadline'}
              weight={expanded ? '600' : '500'}
              numberOfLines={expanded ? 3 : 1}
              style={styles.intention}
              maxFontSizeMultiplier={1.4}
            >
              {session.intention}
            </Text>
            {countdown !== null ? (
              <View style={styles.countdown}>
                <Icon name={countdownIcon} size={11} color="tertiaryLabel" />
                <Text
                  variant="footnote"
                  color="secondaryLabel"
                  weight="500"
                  tabular
                  maxFontSizeMultiplier={1.4}
                >
                  {formatCountdown(countdown)}
                </Text>
              </View>
            ) : null}
          </View>
        </GestureDetector>

        {expanded ? (
          <Animated.View
            entering={FadeIn.duration(durations.base)}
            exiting={FadeOut.duration(durations.fast)}
            style={styles.expandedBody}
          >
            {progress !== null ? (
              <ProgressBar progress={progress} accessibilityLabel="Time limit used" />
            ) : null}
            <View style={styles.actions}>
              <Button
                title="Done"
                icon="check"
                size="small"
                onPress={() => finishIntention('completed')}
                style={styles.primaryAction}
              />
              <Button title="Tuck" variant="quiet" size="small" onPress={tuckAway} />
              <Button
                title="Close"
                variant="quiet"
                size="small"
                onPress={() => setPillVisible(false)}
              />
            </View>
          </Animated.View>
        ) : null}
      </GlassSurface>

      {tuckSide ? (
        <Animated.View
          entering={FadeIn.duration(durations.base)}
          exiting={FadeOut.duration(durations.fast)}
          pointerEvents="none"
          style={[
            styles.tab,
            { backgroundColor: colors.surfaceStrong },
            tuckSide === 'left' ? styles.tabOnRight : styles.tabOnLeft,
          ]}
        >
          <Icon
            name={tuckSide === 'left' ? 'chevronRight' : 'chevronLeft'}
            size={13}
            color="label"
            weight="semibold"
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    // Clips the tucked pill at the screen edge (and prevents horizontal scroll on web).
    overflow: 'hidden',
  },
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    maxWidth: EXPANDED_WIDTH,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerCompact: {
    minHeight: COMPACT_HEIGHT,
    maxWidth: COMPACT_MAX_WIDTH,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginHorizontal: spacing.xs,
  },
  intention: {
    flexShrink: 1,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
    paddingLeft: spacing.xs,
  },
  expandedBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  primaryAction: {
    flex: 1,
  },
  tab: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: TUCK_VISIBLE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOnLeft: {
    left: 0,
    borderTopLeftRadius: COMPACT_HEIGHT / 2,
    borderBottomLeftRadius: COMPACT_HEIGHT / 2,
  },
  tabOnRight: {
    right: 0,
    borderTopRightRadius: COMPACT_HEIGHT / 2,
    borderBottomRightRadius: COMPACT_HEIGHT / 2,
  },
});

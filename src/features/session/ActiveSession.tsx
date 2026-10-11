import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  formatClockTime,
  formatCountdown,
  formatDuration,
  spokenDuration,
} from '@/domain/duration';
import {
  elapsedMs,
  limitProgress,
  nextReminderAt,
  remainingMs,
  type Session,
} from '@/domain/session';
import { useNow } from '@/hooks/useNow';
import { reminders, type PermissionState } from '@/services/notifications';
import { useSessionStore } from '@/state/sessionStore';
import { Button, IconButton, Notice, ProgressBar, Text } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

import { finishIntention } from './sessionController';

/**
 * The session: the intention and one countdown, nothing else. The screen goes quiet
 * (plain black or white) the moment you begin.
 */
export function ActiveSession({ session }: { session: Session }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const now = useNow(1000);
  const pillVisible = useSessionStore((state) => state.pillVisible);
  const setPillVisible = useSessionStore((state) => state.setPillVisible);
  const [permission, setPermission] = useState<PermissionState | null>(null);

  useEffect(() => {
    reminders
      .getPermission()
      .then(setPermission)
      .catch(() => setPermission('unsupported'));
  }, []);

  const nextAt = nextReminderAt(session, now);
  const left = remainingMs(session, now);
  const progress = limitProgress(session, now);

  // One number: time left when there's a limit, otherwise the next reminder.
  const primary = left ?? (nextAt !== null ? nextAt - now : null);
  const caption =
    left !== null
      ? nextAt !== null
        ? `left · next reminder in ${formatCountdown(nextAt - now)}`
        : 'left'
      : nextAt !== null
        ? 'until your next reminder'
        : `${formatDuration(elapsedMs(session, now))} in`;
  const spoken =
    primary !== null
      ? left !== null
        ? `${spokenDuration(left)} left`
        : `Next reminder in ${spokenDuration(primary)}`
      : caption;

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text variant="micro" color="tertiaryLabel">
            Now · since {formatClockTime(session.startedAt)}
          </Text>
          <IconButton
            icon="settings"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
          />
        </View>

        <View style={styles.center}>
          <Text variant="display" accessibilityRole="header" testID="active-intention">
            {session.intention}
          </Text>

          <View style={styles.timer} accessible accessibilityLabel={spoken}>
            {primary !== null ? (
              <Text variant="numeral" color="label">
                {formatCountdown(primary)}
              </Text>
            ) : null}
            <Text variant="footnote" color="tertiaryLabel" tabular>
              {caption}
            </Text>
          </View>

          {progress !== null ? (
            <ProgressBar progress={progress} accessibilityLabel="Time limit used" />
          ) : null}

          {permission === 'denied' ? (
            <Notice
              icon="bell"
              title="Notifications are off"
              message="Reminders can only appear while Intention is open."
              action={{ title: 'Open Settings', onPress: () => Linking.openSettings() }}
            />
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button title="Done" onPress={() => finishIntention('completed')} testID="done-button" />
        <View style={styles.secondary}>
          {!pillVisible ? (
            <Button
              title="Show reminder"
              variant="quiet"
              size="medium"
              onPress={() => setPillVisible(true)}
            />
          ) : null}
          <Button
            title="End session"
            variant="quiet"
            size="medium"
            onPress={() => finishIntention('abandoned')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  timer: {
    gap: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  secondary: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

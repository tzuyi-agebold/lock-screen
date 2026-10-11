import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatClockTime, formatCountdown, formatDuration } from '@/domain/duration';
import {
  elapsedMs,
  limitProgress,
  nextReminderAt,
  remainingMs,
  summarizeDay,
  type Session,
} from '@/domain/session';
import { useNow } from '@/hooks/useNow';
import { reminders, type PermissionState } from '@/services/notifications';
import { useSessionStore } from '@/state/sessionStore';
import {
  Button,
  Icon,
  IconButton,
  Notice,
  ProgressBar,
  Text,
  type IconName,
} from '@/ui/components';
import { radius, spacing, useTheme } from '@/ui/theme';

import { finishIntention } from './sessionController';

/** The session dashboard: the intention, front and center, with its reminders and limit. */
export function ActiveSession({ session }: { session: Session }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const now = useNow(1000);
  const history = useSessionStore((state) => state.history);
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
  const today = summarizeDay(history, now);

  return (
    <View style={styles.fill}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.topBar}>
          <Text variant="subheadline" weight="600" color="secondaryLabel">
            Unlocked at {formatClockTime(session.startedAt)}
          </Text>
          <IconButton
            icon="settings"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
          />
        </View>

        <View style={[styles.hero, { backgroundColor: colors.secondaryGroupedBackground }]}>
          <View style={styles.heroLabel}>
            <Icon name="target" size={15} color="tint" weight="semibold" />
            <Text variant="footnote" weight="600" color="tint">
              YOUR INTENTION
            </Text>
          </View>
          <Text variant="title1" accessibilityRole="header" testID="active-intention">
            {session.intention}
          </Text>
          <Text variant="subheadline" color="secondaryLabel">
            {formatDuration(elapsedMs(session, now))} in · reminders every {session.reminderMinutes}{' '}
            min
          </Text>
        </View>

        <View style={styles.tiles}>
          <StatTile
            icon="bell"
            label="Next reminder"
            value={nextAt !== null ? formatCountdown(nextAt - now) : '—'}
          />
          <StatTile
            icon="hourglass"
            label="Time left"
            value={left !== null ? formatCountdown(left) : 'No limit'}
          />
        </View>
        {progress !== null ? (
          <View style={styles.progress}>
            <ProgressBar
              progress={progress}
              color={progress > 0.85 ? 'orange' : 'tint'}
              accessibilityLabel="Time limit used"
            />
          </View>
        ) : null}

        <View style={styles.notices}>
          {permission === 'denied' ? (
            <Notice
              icon="bell"
              title="Notifications are off"
              message="Reminders can only appear while Intention is open."
              action={{ title: 'Turn On in Settings', onPress: () => Linking.openSettings() }}
            />
          ) : null}
          {permission === 'unsupported' ? (
            <Notice
              icon="iphone"
              iconColor="tint"
              title="Previewing in a browser"
              message="On iPhone, reminders arrive as notifications. Here they show up as a nudge on the floating pill."
            />
          ) : null}
          {!pillVisible ? (
            <Button
              title="Show floating reminder"
              icon="target"
              variant="tinted"
              size="medium"
              onPress={() => setPillVisible(true)}
            />
          ) : null}
        </View>

        {today.total > 0 ? (
          <Text variant="footnote" color="secondaryLabel" align="center">
            Today: {today.completed} of {today.total}{' '}
            {today.total === 1 ? 'intention' : 'intentions'} done
          </Text>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, spacing.lg),
            backgroundColor: colors.groupedBackground,
          },
        ]}
      >
        <Button
          title="I did it"
          icon="check"
          onPress={() => finishIntention('completed')}
          testID="done-button"
        />
        <Button
          title="End without finishing"
          variant="plain"
          size="medium"
          onPress={() => finishIntention('abandoned')}
        />
      </View>
    </View>
  );
}

function StatTile({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.tile, { backgroundColor: colors.secondaryGroupedBackground }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.tileLabel}>
        <Icon name={icon} size={13} color="secondaryLabel" />
        <Text variant="footnote" color="secondaryLabel">
          {label}
        </Text>
      </View>
      <Text variant="title2" rounded tabular numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  tileLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progress: {
    paddingHorizontal: spacing.xs,
  },
  notices: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
});

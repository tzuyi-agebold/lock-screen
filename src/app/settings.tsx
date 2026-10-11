import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet } from 'react-native';

import { formatClockTime, formatDuration } from '@/domain/duration';
import {
  REMINDER_INTERVALS,
  TIME_LIMITS,
  type SessionOutcome,
  type SessionRecord,
} from '@/domain/session';
import { reminders, type PermissionState } from '@/services/notifications';
import { useSessionStore } from '@/state/sessionStore';
import { useSettingsStore } from '@/state/settingsStore';
import { ListCell, ListRow, ListSection, SegmentedControl, type IconName } from '@/ui/components';
import { spacing, type ColorName } from '@/ui/theme';

const REMINDER_OPTIONS = REMINDER_INTERVALS.map((value) => ({ value, label: `${value} min` }));
const LIMIT_OPTIONS = TIME_LIMITS.map((value) => ({ value, label: `${value} min` }));

const OUTCOME: Record<SessionOutcome, { label: string; icon: IconName; color: ColorName }> = {
  completed: { label: 'Done', icon: 'checkCircle', color: 'green' },
  abandoned: { label: 'Ended', icon: 'minus', color: 'gray' },
  timedOut: { label: 'Time’s up', icon: 'hourglass', color: 'orange' },
};

const PERMISSION_LABEL: Record<PermissionState, string> = {
  granted: 'On',
  denied: 'Off',
  undetermined: 'Not set',
  unsupported: 'iPhone only',
};

function confirmClear(onConfirm: () => void) {
  const title = 'Clear History?';
  const message = 'Past intentions will be removed from this device.';
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear', style: 'destructive', onPress: onConfirm },
  ]);
}

function recordSubtitle(record: SessionRecord) {
  return [
    OUTCOME[record.outcome].label,
    formatClockTime(record.startedAt),
    formatDuration(record.endedAt - record.startedAt),
  ].join(' · ');
}

export default function Settings() {
  const settings = useSettingsStore();
  const history = useSessionStore((state) => state.history);
  const clearHistory = useSessionStore((state) => state.clearHistory);
  const [permission, setPermission] = useState<PermissionState | null>(null);

  useEffect(() => {
    reminders
      .getPermission()
      .then(setPermission)
      .catch(() => setPermission('unsupported'));
  }, []);

  const onNotificationsPress = async () => {
    if (permission === 'undetermined') setPermission(await reminders.requestPermission());
    else if (permission === 'denied' || permission === 'granted') Linking.openSettings();
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <ListSection header="Default reminder" footer="Pre-selected each time you set an intention.">
        <ListCell>
          <SegmentedControl
            options={REMINDER_OPTIONS}
            value={settings.reminderMinutes}
            onChange={settings.setReminderMinutes}
            accessibilityLabel="Default reminder interval"
          />
        </ListCell>
      </ListSection>

      <ListSection header="Default time limit">
        <ListRow
          title="Time limit"
          icon="hourglass"
          iconBackground="indigo"
          toggle={{ value: settings.timeLimitEnabled, onValueChange: settings.setTimeLimitEnabled }}
        >
          {settings.timeLimitEnabled ? (
            <SegmentedControl
              options={LIMIT_OPTIONS}
              value={settings.timeLimitMinutes}
              onChange={settings.setTimeLimitMinutes}
              accessibilityLabel="Default time limit"
            />
          ) : null}
        </ListRow>
      </ListSection>

      <ListSection>
        <ListRow
          title="Notifications"
          icon="bell"
          iconBackground="red"
          value={permission ? PERMISSION_LABEL[permission] : undefined}
          chevron={permission !== 'unsupported'}
          onPress={permission === 'unsupported' ? undefined : onNotificationsPress}
        />
        <ListRow
          title="Haptics"
          icon="sparkles"
          iconBackground="blue"
          toggle={{ value: settings.hapticsEnabled, onValueChange: settings.setHapticsEnabled }}
        />
      </ListSection>

      <ListSection
        header="Coming in the App Store version"
        footer="iOS doesn’t let any app appear right after Face ID or draw over other apps. These are the Apple-approved ways Intention will meet you there."
      >
        <ListRow
          title="Lock Screen button"
          subtitle="Swap the flashlight for “Set Intention” (iOS 18+)"
          icon="lockScreen"
          iconBackground="tint"
        />
        <ListRow
          title="Live Activity"
          subtitle="Your intention in the Dynamic Island, over every app"
          icon="island"
          iconBackground="indigo"
        />
        <ListRow
          title="Screen Time limit"
          subtitle="Pause distracting apps when time’s up"
          icon="shield"
          iconBackground="teal"
        />
        <ListRow
          title="Shortcuts automation"
          subtitle="Ask for an intention when Instagram opens"
          icon="shortcuts"
          iconBackground="orange"
        />
      </ListSection>

      <ListSection
        header="History"
        footer="Stored only on this device. Intention has no account and collects no data."
      >
        {history.length === 0 ? (
          <ListRow title="No intentions yet" />
        ) : (
          history
            .slice(0, 20)
            .map((record) => (
              <ListRow
                key={record.id}
                title={record.intention}
                subtitle={recordSubtitle(record)}
                icon={OUTCOME[record.outcome].icon}
                iconBackground={OUTCOME[record.outcome].color}
              />
            ))
        )}
        {history.length > 0 ? (
          <ListRow title="Clear History" destructive onPress={() => confirmClear(clearHistory)} />
        ) : null}
      </ListSection>

      <ListSection>
        <ListRow title="Version" value={Constants.expoConfig?.version ?? '—'} />
      </ListSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
  },
});

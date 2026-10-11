import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet } from 'react-native';

import { formatClockTime, formatDuration } from '@/domain/duration';
import type { SessionOutcome, SessionRecord, TimeLimit } from '@/domain/session';
import { LIMIT_CHOICES, REMINDER_CHOICES } from '@/features/intention/choices';
import { haptics } from '@/services/haptics';
import { reminders, type PermissionState } from '@/services/notifications';
import { useSessionStore } from '@/state/sessionStore';
import { useSettingsStore } from '@/state/settingsStore';
import { ChoiceGroup, ListRow, ListSection, Text, type IconName } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

const OUTCOME: Record<SessionOutcome, { label: string; icon: IconName }> = {
  completed: { label: 'Done', icon: 'check' },
  abandoned: { label: 'Ended', icon: 'minus' },
  timedOut: { label: 'Time’s up', icon: 'hourglass' },
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
  const { colors } = useTheme();
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

  const onLimitChange = (value: TimeLimit | null) => {
    haptics.selection();
    settings.setTimeLimitEnabled(value !== null);
    if (value !== null) settings.setTimeLimitMinutes(value);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
    >
      <ListSection header="Remind" bare>
        <ChoiceGroup
          options={REMINDER_CHOICES}
          value={settings.reminderMinutes}
          onChange={(value) => {
            haptics.selection();
            settings.setReminderMinutes(value);
          }}
          accessibilityLabel="Default reminder interval"
        />
      </ListSection>

      <ListSection header="Limit" bare>
        <ChoiceGroup
          options={LIMIT_CHOICES}
          value={settings.timeLimitEnabled ? settings.timeLimitMinutes : null}
          onChange={onLimitChange}
          accessibilityLabel="Default time limit"
        />
      </ListSection>

      <ListSection>
        <ListRow
          title="Notifications"
          icon="bell"
          value={permission ? PERMISSION_LABEL[permission] : undefined}
          chevron={permission !== 'unsupported'}
          onPress={permission === 'unsupported' ? undefined : onNotificationsPress}
        />
        <ListRow
          title="Haptics"
          icon="sparkles"
          toggle={{ value: settings.hapticsEnabled, onValueChange: settings.setHapticsEnabled }}
        />
      </ListSection>

      <ListSection header="History">
        {history.length === 0 ? (
          <ListRow title="Nothing yet" />
        ) : (
          history
            .slice(0, 20)
            .map((record) => (
              <ListRow
                key={record.id}
                title={record.intention}
                subtitle={recordSubtitle(record)}
                icon={OUTCOME[record.outcome].icon}
              />
            ))
        )}
        {history.length > 0 ? (
          <ListRow title="Clear History" destructive onPress={() => confirmClear(clearHistory)} />
        ) : null}
      </ListSection>

      <Text variant="micro" color="quaternaryLabel" align="center">
        Intention {Constants.expoConfig?.version ?? ''} · On this device only
      </Text>
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

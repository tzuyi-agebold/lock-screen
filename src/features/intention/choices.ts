import type { ChoiceOption } from '@/ui/components';
import type { ReminderInterval, TimeLimit } from '@/domain/session';

/** Terse labels for the reminder and limit pickers, with full spoken labels. */
export const REMINDER_CHOICES: readonly ChoiceOption<ReminderInterval>[] = [
  { value: 5, label: '5m', accessibilityLabel: 'Every 5 minutes' },
  { value: 10, label: '10m', accessibilityLabel: 'Every 10 minutes' },
  { value: 15, label: '15m', accessibilityLabel: 'Every 15 minutes' },
];

export const LIMIT_CHOICES: readonly ChoiceOption<TimeLimit | null>[] = [
  { value: null, label: 'Off', accessibilityLabel: 'No time limit' },
  { value: 15, label: '15m', accessibilityLabel: '15 minutes' },
  { value: 30, label: '30m', accessibilityLabel: '30 minutes' },
  { value: 45, label: '45m', accessibilityLabel: '45 minutes' },
  { value: 60, label: '1h', accessibilityLabel: '1 hour' },
];

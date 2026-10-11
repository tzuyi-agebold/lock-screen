import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  INTENTION_MAX_LENGTH,
  REMINDER_INTERVALS,
  TIME_LIMITS,
  validateIntention,
  type ReminderInterval,
  type TimeLimit,
} from '@/domain/session';
import { useNow } from '@/hooks/useNow';
import { haptics } from '@/services/haptics';
import { reminders } from '@/services/notifications';
import { useSpeechToText, type SpeechError } from '@/services/speech/useSpeechToText';
import { useSessionStore } from '@/state/sessionStore';
import { useSettingsStore } from '@/state/settingsStore';
import {
  Button,
  Icon,
  IconButton,
  ListCell,
  ListRow,
  ListSection,
  PressableScale,
  SegmentedControl,
  Text,
} from '@/ui/components';
import { durations, radius, spacing, typography, useTheme } from '@/ui/theme';

import { startIntention } from '../session/sessionController';
import { MicButton } from './MicButton';
import { buildSuggestions, joinDictation } from './suggestions';

const REMINDER_OPTIONS = REMINDER_INTERVALS.map((value) => ({ value, label: `${value} min` }));
const LIMIT_OPTIONS = TIME_LIMITS.map((value) => ({ value, label: `${value} min` }));

const SPEECH_HINTS: Record<SpeechError, string> = {
  unavailable: 'Tip: tap the microphone on your keyboard to dictate.',
  permission: 'To speak your intention, allow Microphone and Speech Recognition in Settings.',
  failed: 'Couldn’t catch that. Try again, or type it.',
};

/** How long the "you did it" banner stays after finishing a session. */
const CELEBRATION_MS = 8000;

/**
 * The unlock moment: name one intention, choose how often to be reminded and, optionally,
 * when to stop.
 */
export function IntentionComposer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const settings = useSettingsStore();
  const history = useSessionStore((state) => state.history);
  const now = useNow(60_000);

  const [text, setText] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<ReminderInterval>(
    settings.reminderMinutes,
  );
  const [limitEnabled, setLimitEnabled] = useState(settings.timeLimitEnabled);
  const [limitMinutes, setLimitMinutes] = useState<TimeLimit>(settings.timeLimitMinutes);
  const [starting, setStarting] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const typedBeforeDictation = useRef('');

  const speech = useSpeechToText((transcript) =>
    setText(joinDictation(typedBeforeDictation.current, transcript).slice(0, INTENTION_MAX_LENGTH)),
  );
  const [tip, setTip] = useState<string | null>(null);
  const hint = speech.error ? SPEECH_HINTS[speech.error] : tip;

  const validation = validateIntention(text);
  const suggestions = useMemo(() => buildSuggestions(history), [history]);
  const lastRecord = history[0];
  const [celebrating, setCelebrating] = useState(
    () => lastRecord?.outcome === 'completed' && Date.now() - lastRecord.endedAt < CELEBRATION_MS,
  );
  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(false), CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebrating]);

  const today = new Date(now).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const onMicPress = async () => {
    if (speech.listening) {
      speech.stop();
      return;
    }
    if (!speech.available) {
      setTip(SPEECH_HINTS.unavailable);
      inputRef.current?.focus();
      return;
    }
    setTip(null);
    typedBeforeDictation.current = text;
    haptics.selection();
    await speech.start();
  };

  const onStart = async () => {
    if (!validation.ok || starting) return;
    setStarting(true);
    speech.stop();
    Keyboard.dismiss();

    // Remember these choices as next time's defaults.
    settings.setReminderMinutes(reminderMinutes);
    settings.setTimeLimitEnabled(limitEnabled);
    settings.setTimeLimitMinutes(limitMinutes);

    // Ask for notification permission in context — the first time reminders matter.
    try {
      if ((await reminders.getPermission()) === 'undetermined') await reminders.requestPermission();
    } catch {
      // Without permission, reminders still appear in-app on the floating pill.
    }

    try {
      startIntention({
        intention: validation.value,
        reminderMinutes,
        timeLimitMinutes: limitEnabled ? limitMinutes : null,
      });
    } finally {
      setStarting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.topBar}>
          <Text variant="subheadline" weight="600" color="secondaryLabel">
            {today}
          </Text>
          <IconButton
            icon="settings"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
          />
        </View>

        {celebrating && lastRecord ? (
          <Animated.View
            entering={FadeInDown.duration(durations.slow)}
            exiting={FadeOut.duration(durations.base)}
            style={[styles.celebration, { backgroundColor: colors.secondaryGroupedBackground }]}
            accessibilityLiveRegion="polite"
          >
            <Icon name="checkCircle" size={22} color="green" />
            <View style={styles.fill}>
              <Text variant="subheadline" weight="600" numberOfLines={1}>
                Done: {lastRecord.intention}
              </Text>
              <Text variant="footnote" color="secondaryLabel">
                You did what you came for. Maybe put the phone down?
              </Text>
            </View>
          </Animated.View>
        ) : null}

        <Text variant="largeTitle" accessibilityRole="header" style={styles.title}>
          What are you here to do?
        </Text>
        <Text color="secondaryLabel" style={styles.subtitle}>
          Name it before you dive in. You’ll get a gentle nudge if you drift.
        </Text>

        <View style={[styles.inputCard, { backgroundColor: colors.secondaryGroupedBackground }]}>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={(value) => {
              setText(value);
              speech.dismissError();
            }}
            placeholder="e.g. Reply to Sam about Saturday"
            placeholderTextColor={colors.tertiaryLabel}
            selectionColor={colors.tint}
            style={[styles.input, { color: colors.label }]}
            multiline
            maxLength={INTENTION_MAX_LENGTH}
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            autoFocus
            autoCapitalize="sentences"
            accessibilityLabel="Your intention"
            accessibilityHint="Type or dictate the one thing you came to do."
            testID="intention-input"
          />
          <View style={styles.inputFooter}>
            <Text variant="caption1" color="tertiaryLabel" tabular>
              {text.length > INTENTION_MAX_LENGTH - 30
                ? `${text.length}/${INTENTION_MAX_LENGTH}`
                : speech.listening
                  ? 'Listening…'
                  : ''}
            </Text>
            <MicButton listening={speech.listening} onPress={onMicPress} />
          </View>
        </View>
        {hint ? (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Text variant="footnote" color="secondaryLabel" style={styles.hint}>
              {hint}
            </Text>
          </Animated.View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipsScroller}
          contentContainerStyle={styles.chips}
          accessibilityLabel="Suggestions"
        >
          {suggestions.map((suggestion) => (
            <PressableScale
              key={suggestion}
              onPress={() => {
                haptics.selection();
                setText(suggestion);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Use suggestion: ${suggestion}`}
              style={[styles.chip, { backgroundColor: colors.secondaryGroupedBackground }]}
            >
              <Text variant="subheadline">{suggestion}</Text>
            </PressableScale>
          ))}
        </ScrollView>

        <ListSection
          header="Remind me every"
          footer="A notification brings you back to your intention if you get pulled into something else."
        >
          <ListCell>
            <SegmentedControl
              options={REMINDER_OPTIONS}
              value={reminderMinutes}
              onChange={(value) => {
                haptics.selection();
                setReminderMinutes(value);
              }}
              accessibilityLabel="Reminder interval"
            />
          </ListCell>
        </ListSection>

        <Animated.View layout={LinearTransition.duration(durations.base)}>
          <ListSection
            header="Time limit"
            footer={
              limitEnabled
                ? `After ${limitMinutes} minutes, you’ll be asked to put your phone down.`
                : 'Optional. Decide now how much time this is worth.'
            }
          >
            <ListRow
              title="Set a time limit"
              icon="hourglass"
              iconBackground="indigo"
              toggle={{
                value: limitEnabled,
                onValueChange: (value) => {
                  haptics.selection();
                  setLimitEnabled(value);
                },
              }}
            >
              {limitEnabled ? (
                <Animated.View entering={FadeIn.duration(durations.base)} exiting={FadeOut}>
                  <SegmentedControl
                    options={LIMIT_OPTIONS}
                    value={limitMinutes}
                    onChange={(value) => {
                      haptics.selection();
                      setLimitMinutes(value);
                    }}
                    accessibilityLabel="Time limit"
                  />
                </Animated.View>
              ) : null}
            </ListRow>
          </ListSection>
        </Animated.View>
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
          title="Start"
          icon="lockOpen"
          onPress={onStart}
          disabled={!validation.ok}
          loading={starting}
          accessibilityHint="Starts your intention and its reminders."
          testID="start-button"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: spacing.sm,
  },
  celebration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  title: {
    marginTop: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  inputCard: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  input: {
    ...typography.title3,
    fontWeight: '400',
    minHeight: 84,
    textAlignVertical: 'top',
    padding: 0,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  hint: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  chipsScroller: {
    marginHorizontal: -spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
    flexGrow: 0,
  },
  chips: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.capsule,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});

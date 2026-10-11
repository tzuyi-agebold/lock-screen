import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  INTENTION_MAX_LENGTH,
  validateIntention,
  type ReminderInterval,
  type TimeLimit,
} from '@/domain/session';
import { haptics } from '@/services/haptics';
import { reminders } from '@/services/notifications';
import { useSpeechToText, type SpeechError } from '@/services/speech/useSpeechToText';
import { useSessionStore } from '@/state/sessionStore';
import { useSettingsStore } from '@/state/settingsStore';
import { AmbientBackground, Button, ChoiceGroup, IconButton, Text } from '@/ui/components';
import { durations, spacing, typography, useTheme } from '@/ui/theme';

import { startIntention } from '../session/sessionController';
import { LIMIT_CHOICES, REMINDER_CHOICES } from './choices';
import { joinDictation } from './dictation';
import { MicButton } from './MicButton';

const SPEECH_HINTS: Record<SpeechError, string> = {
  unavailable: 'Use the mic on your keyboard to dictate.',
  permission: 'Allow Microphone and Speech Recognition in Settings to speak.',
  failed: 'Didn’t catch that. Try again, or type it.',
};

/** How long the quiet "Done" line stays after finishing a session. */
const CELEBRATION_MS = 6000;

/**
 * The unlock moment: one intention, how often to be reminded, and an optional limit — on a
 * slowly shifting, blurred field of nature colors.
 */
export function IntentionComposer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const settings = useSettingsStore();
  const lastRecord = useSessionStore((state) => state.history[0]);

  const [text, setText] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<ReminderInterval>(
    settings.reminderMinutes,
  );
  const [limit, setLimit] = useState<TimeLimit | null>(
    settings.timeLimitEnabled ? settings.timeLimitMinutes : null,
  );
  const [starting, setStarting] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const typedBeforeDictation = useRef('');

  const speech = useSpeechToText((transcript) =>
    setText(joinDictation(typedBeforeDictation.current, transcript).slice(0, INTENTION_MAX_LENGTH)),
  );
  const [tip, setTip] = useState<string | null>(null);
  const hint = speech.error ? SPEECH_HINTS[speech.error] : tip;

  const validation = validateIntention(text);
  const [celebrating, setCelebrating] = useState(
    () => lastRecord?.outcome === 'completed' && Date.now() - lastRecord.endedAt < CELEBRATION_MS,
  );
  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(false), CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebrating]);

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

  const onBegin = async () => {
    if (!validation.ok || starting) return;
    setStarting(true);
    speech.stop();
    Keyboard.dismiss();

    // Remember these choices as next time's defaults.
    settings.setReminderMinutes(reminderMinutes);
    settings.setTimeLimitEnabled(limit !== null);
    if (limit !== null) settings.setTimeLimitMinutes(limit);

    // Ask for notification permission in context — the first time reminders matter.
    try {
      if ((await reminders.getPermission()) === 'undetermined') await reminders.requestPermission();
    } catch {
      // Without permission, reminders still appear in-app on the floating pill.
    }

    try {
      startIntention({ intention: validation.value, reminderMinutes, timeLimitMinutes: limit });
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.fill}>
      <AmbientBackground />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            {celebrating && lastRecord ? (
              <Animated.View
                entering={FadeIn.duration(durations.slow)}
                exiting={FadeOut.duration(durations.slow)}
                accessibilityLiveRegion="polite"
              >
                <Text variant="footnote" color="secondaryLabel">
                  Done. Phone down?
                </Text>
              </Animated.View>
            ) : (
              <View />
            )}
            <IconButton
              icon="settings"
              accessibilityLabel="Settings"
              onPress={() => router.push('/settings')}
            />
          </View>

          <View style={styles.center}>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={(value) => {
                setText(value);
                speech.dismissError();
              }}
              placeholder="What are you here to do?"
              placeholderTextColor={colors.tertiaryLabel}
              selectionColor={colors.label}
              cursorColor={colors.label}
              style={[
                styles.input,
                { color: colors.label },
                Platform.OS === 'web' && styles.webInput,
              ]}
              multiline
              maxLength={INTENTION_MAX_LENGTH}
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              autoCapitalize="sentences"
              accessibilityLabel="Your intention"
              accessibilityHint="Type or dictate the one thing you came to do."
              testID="intention-input"
            />
            <View style={styles.inputFooter}>
              <Text variant="footnote" color="tertiaryLabel" style={styles.fill}>
                {speech.listening ? 'Listening…' : (hint ?? '')}
              </Text>
              <MicButton listening={speech.listening} onPress={onMicPress} />
            </View>

            <View style={[styles.hairline, { backgroundColor: colors.border }]} />

            <View style={styles.choice}>
              <Text variant="micro" color="tertiaryLabel">
                Remind
              </Text>
              <ChoiceGroup
                options={REMINDER_CHOICES}
                value={reminderMinutes}
                onChange={(value) => {
                  haptics.selection();
                  setReminderMinutes(value);
                }}
                accessibilityLabel="Reminder interval"
                testID="remind-choices"
              />
            </View>
            <View style={styles.choice}>
              <Text variant="micro" color="tertiaryLabel">
                Limit
              </Text>
              <ChoiceGroup
                options={LIMIT_CHOICES}
                value={limit}
                onChange={(value) => {
                  haptics.selection();
                  setLimit(value);
                }}
                accessibilityLabel="Time limit"
                testID="limit-choices"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Button
            title="Begin"
            onPress={onBegin}
            disabled={!validation.ok}
            loading={starting}
            accessibilityHint="Starts your intention and its reminders."
            testID="start-button"
          />
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: spacing.xxxl,
    gap: spacing.lg,
  },
  input: {
    ...typography.display,
    minHeight: 84,
    textAlignVertical: 'top',
    padding: 0,
  },
  // Browsers draw a focus box around text fields; iOS shows only the caret.
  webInput: {
    outlineWidth: 0,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  choice: {
    gap: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
  },
});

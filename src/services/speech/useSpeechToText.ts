import { requireOptionalNativeModule } from 'expo';
import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { Platform } from 'react-native';

type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

/**
 * Loads on-device speech recognition only where it exists. Expo Go doesn't bundle this
 * native module, so the app falls back to the keyboard's built-in dictation there. A
 * development or App Store build includes it.
 */
function loadSpeechModule(): SpeechModule | null {
  if (Platform.OS === 'web') {
    const supported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    if (!supported) return null;
  } else if (!requireOptionalNativeModule('ExpoSpeechRecognition')) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-speech-recognition').ExpoSpeechRecognitionModule as SpeechModule;
  } catch {
    return null;
  }
}

let cachedModule: SpeechModule | null | undefined;
function getSpeechModule(): SpeechModule | null {
  if (cachedModule === undefined) cachedModule = loadSpeechModule();
  return cachedModule;
}

export type SpeechError = 'permission' | 'unavailable' | 'failed';

export interface SpeechToText {
  /** Whether in-app speech recognition exists in this build. */
  available: boolean;
  listening: boolean;
  error: SpeechError | null;
  start: () => Promise<void>;
  stop: () => void;
  dismissError: () => void;
}

const deviceLocale = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return 'en-US';
  }
};

/** Streams a spoken intention into text, preferring on-device recognition for privacy. */
export function useSpeechToText(
  onTranscript: (text: string, isFinal: boolean) => void,
): SpeechToText {
  const speech = getSpeechModule();
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<SpeechError | null>(null);
  const onResult = useEffectEvent(onTranscript);

  useEffect(() => {
    if (!speech) return;
    const subscriptions = [
      speech.addListener('start', () => setListening(true)),
      speech.addListener('end', () => setListening(false)),
      speech.addListener('result', (event) => {
        const transcript = event.results[0]?.transcript;
        if (transcript) onResult(transcript, event.isFinal);
      }),
      speech.addListener('error', (event) => {
        setListening(false);
        if (event.error === 'not-allowed') setError('permission');
        else if (event.error !== 'aborted' && event.error !== 'no-speech') setError('failed');
      }),
    ];
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      speech.abort();
    };
  }, [speech]);

  const start = useCallback(async () => {
    if (!speech) {
      setError('unavailable');
      return;
    }
    setError(null);
    const permission = await speech.requestPermissionsAsync();
    if (!permission.granted) {
      setError('permission');
      return;
    }
    speech.start({
      lang: deviceLocale(),
      interimResults: true,
      continuous: false,
      addsPunctuation: true,
      requiresOnDeviceRecognition: Platform.OS === 'ios' && speech.supportsOnDeviceRecognition(),
      iosTaskHint: 'dictation',
    });
  }, [speech]);

  const stop = useCallback(() => speech?.stop(), [speech]);
  const dismissError = useCallback(() => setError(null), []);

  return { available: speech !== null, listening, error, start, stop, dismissError };
}

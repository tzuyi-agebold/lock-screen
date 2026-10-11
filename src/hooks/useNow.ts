import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Current time, refreshed every `intervalMs` and immediately when the app returns to the
 * foreground (JS timers pause in the background on iOS).
 */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, intervalMs);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [intervalMs, enabled]);

  return now;
}

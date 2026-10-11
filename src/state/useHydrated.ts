import { useSyncExternalStore } from 'react';

import { useSessionStore } from './sessionStore';
import { useSettingsStore } from './settingsStore';

const stores = [useSettingsStore, useSessionStore] as const;

const allHydrated = () => stores.every((store) => store.persist.hasHydrated());

const subscribe = (onChange: () => void) => {
  const unsubscribers = stores.map((store) => store.persist.onFinishHydration(onChange));
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
};

/** True once every persisted store has been restored from disk. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, allHydrated, allHydrated);
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** On-device only. Nothing the person types ever leaves their phone. */
export const persistStorage = createJSONStorage(() => AsyncStorage);

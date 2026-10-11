import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { useTheme, type ColorName } from '../theme';

type SymbolName = Extract<SymbolViewProps['name'], object>;

/**
 * The app's icon set: SF Symbols on iOS, matching Material Symbols on Android and web.
 * Add icons here (never inline) so the vocabulary stays small and consistent.
 */
const ICONS = {
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  mic: { ios: 'mic.fill', android: 'mic', web: 'mic' },
  waveform: { ios: 'waveform', android: 'graphic_eq', web: 'graphic_eq' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  checkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  closeCircle: { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' },
  timer: { ios: 'timer', android: 'timer', web: 'timer' },
  bell: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  hourglass: { ios: 'hourglass', android: 'hourglass_top', web: 'hourglass_top' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  lockOpen: { ios: 'lock.open.fill', android: 'lock_open', web: 'lock_open' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  target: { ios: 'scope', android: 'target', web: 'target' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  moon: { ios: 'moon.fill', android: 'bedtime', web: 'bedtime' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  leaf: { ios: 'leaf.fill', android: 'eco', web: 'eco' },
  hand: { ios: 'hand.raised.fill', android: 'front_hand', web: 'front_hand' },
  flag: { ios: 'flag.checkered', android: 'sports_score', web: 'sports_score' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  minimize: {
    ios: 'arrow.down.right.and.arrow.up.left',
    android: 'close_fullscreen',
    web: 'close_fullscreen',
  },
  iphone: { ios: 'iphone', android: 'smartphone', web: 'smartphone' },
  lockScreen: { ios: 'lock.iphone', android: 'phonelink_lock', web: 'phonelink_lock' },
  shortcuts: { ios: 'square.2.layers.3d.fill', android: 'layers', web: 'layers' },
  shield: { ios: 'shield.lefthalf.filled', android: 'shield', web: 'shield' },
  island: { ios: 'capsule.fill', android: 'touch_app', web: 'touch_app' },
  minus: { ios: 'minus.circle.fill', android: 'do_not_disturb_on', web: 'do_not_disturb_on' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  plusFive: { ios: 'goforward.5', android: 'forward_5', web: 'forward_5' },
  history: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  brain: { ios: 'brain.head.profile', android: 'psychology', web: 'psychology' },
} as const satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorName;
  /** Raw color override, e.g. white on a tinted background. */
  tintColor?: string;
  weight?: SymbolViewProps['weight'];
  type?: SymbolViewProps['type'];
}

export function Icon({ name, size = 22, color = 'label', tintColor, weight, type }: IconProps) {
  const { colors } = useTheme();
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={tintColor ?? colors[color]}
      weight={weight}
      type={type}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

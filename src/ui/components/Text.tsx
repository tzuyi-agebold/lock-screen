import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import {
  roundedFontFamily,
  typography,
  useTheme,
  type ColorName,
  type TextVariant,
} from '../theme';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: ColorName;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  /** Fixed-width digits so timers don't jitter. */
  tabular?: boolean;
  /** SF Pro Rounded, for numerals. */
  rounded?: boolean;
}

/** Text that always uses a Dynamic Type style and a semantic color. */
export function Text({
  variant = 'body',
  color = 'label',
  weight,
  align,
  tabular,
  rounded,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: colors[color] },
        weight !== undefined && { fontWeight: weight },
        align !== undefined && { textAlign: align },
        tabular && { fontVariant: ['tabular-nums'] },
        rounded && { fontFamily: roundedFontFamily },
        style,
      ]}
    />
  );
}

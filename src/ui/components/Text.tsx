import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { typography, useTheme, type ColorName, type TextVariant } from '../theme';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: ColorName;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  /** Fixed-width digits so timers don't jitter. */
  tabular?: boolean;
}

/** Text that always uses a type-scale style and a semantic (monochrome) color. */
export function Text({
  variant = 'body',
  color = 'label',
  weight,
  align,
  tabular,
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
        style,
      ]}
    />
  );
}

import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MIN_TOUCH_TARGET, radius, spacing, useTheme, type ColorName } from '../theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type ButtonVariant = 'filled' | 'tinted' | 'gray' | 'plain' | 'destructive';
export type ButtonSize = 'large' | 'medium' | 'small';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const SIZE = {
  large: { minHeight: 50, paddingHorizontal: spacing.xl, variant: 'headline', icon: 20 },
  medium: { minHeight: MIN_TOUCH_TARGET, paddingHorizontal: spacing.lg, variant: 'body', icon: 18 },
  small: { minHeight: 32, paddingHorizontal: spacing.md, variant: 'subheadline', icon: 15 },
} as const;

/** iOS button styles from the HIG: filled, tinted, gray and plain, all capsule-shaped. */
export function Button({
  title,
  onPress,
  variant = 'filled',
  size = 'large',
  icon,
  disabled = false,
  loading = false,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const metrics = SIZE[size];
  const inactive = disabled || loading;

  const background = {
    filled: inactive ? colors.fill : colors.tint,
    tinted: colors.tintFill,
    gray: colors.fill,
    plain: 'transparent',
    destructive: colors.fill,
  }[variant];

  const labelColor: ColorName = inactive
    ? 'tertiaryLabel'
    : variant === 'filled'
      ? 'onTint'
      : variant === 'gray'
        ? 'label'
        : variant === 'destructive'
          ? 'red'
          : 'tint';

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      hitSlop={size === 'small' ? 6 : undefined}
      style={[
        styles.base,
        {
          minHeight: metrics.minHeight,
          paddingHorizontal: metrics.paddingHorizontal,
          backgroundColor: background,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[labelColor]} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Icon name={icon} size={metrics.icon} color={labelColor} weight="semibold" />
          ) : null}
          <Text variant={metrics.variant} weight="600" color={labelColor} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.capsule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});

import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MIN_TOUCH_TARGET, radius, spacing, useTheme, type ColorName } from '../theme';
import { GlassFill } from './GlassFill';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

/**
 * - `glass`: the primary action — translucent glass with a brushed-metal sheen, never solid.
 * - `quiet`: text only, for secondary actions.
 * - `danger`: quiet text for the one destructive action.
 */
export type ButtonVariant = 'glass' | 'quiet' | 'danger';
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
  large: { minHeight: 54, paddingHorizontal: spacing.xxl, variant: 'body', icon: 17 },
  medium: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.xl,
    variant: 'subheadline',
    icon: 15,
  },
  small: { minHeight: 34, paddingHorizontal: spacing.md + 2, variant: 'footnote', icon: 13 },
} as const;

export function Button({
  title,
  onPress,
  variant = 'glass',
  size = 'large',
  icon,
  disabled = false,
  loading = false,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const { colors, glass } = useTheme();
  const metrics = SIZE[size];
  const inactive = disabled || loading;
  const labelColor: ColorName =
    variant === 'danger' ? 'danger' : variant === 'quiet' ? 'secondaryLabel' : 'label';

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      hitSlop={size === 'small' ? 5 : undefined}
      style={[
        styles.base,
        { minHeight: metrics.minHeight, paddingHorizontal: metrics.paddingHorizontal },
        variant === 'glass' && { boxShadow: glass.shadow },
        inactive && styles.inactive,
        style,
      ]}
    >
      {variant === 'glass' ? <GlassFill borderRadius={radius.capsule} /> : null}
      {loading ? (
        <ActivityIndicator color={colors[labelColor]} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Icon name={icon} size={metrics.icon} color={labelColor} weight="medium" />
          ) : null}
          <Text
            variant={metrics.variant}
            weight={variant === 'glass' ? '600' : '500'}
            color={labelColor}
            numberOfLines={1}
          >
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
  inactive: {
    opacity: 0.4,
  },
});

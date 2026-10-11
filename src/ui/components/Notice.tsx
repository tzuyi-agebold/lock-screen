import { StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme, type ColorName } from '../theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface NoticeProps {
  icon: IconName;
  iconColor?: ColorName;
  title: string;
  message: string;
  action?: { title: string; onPress: () => void };
}

/** An inline, non-blocking explanation, used instead of alerts for recoverable states. */
export function Notice({ icon, iconColor = 'orange', title, message, action }: NoticeProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.secondaryGroupedBackground }]}
      accessibilityRole="summary"
    >
      <Icon name={icon} size={20} color={iconColor} />
      <View style={styles.body}>
        <Text variant="subheadline" weight="600">
          {title}
        </Text>
        <Text variant="footnote" color="secondaryLabel">
          {message}
        </Text>
        {action ? (
          <Button
            title={action.title}
            onPress={action.onPress}
            variant="tinted"
            size="small"
            style={styles.action}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  action: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
});

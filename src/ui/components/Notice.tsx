import { StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '../theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface NoticeProps {
  icon: IconName;
  title: string;
  message: string;
  action?: { title: string; onPress: () => void };
}

/** A quiet inline explanation for a recoverable state, instead of an alert. */
export function Notice({ icon, title, message, action }: NoticeProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessibilityRole="summary"
    >
      <Icon name={icon} size={16} color="secondaryLabel" />
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
            variant="glass"
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
    borderWidth: 1,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  action: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
});

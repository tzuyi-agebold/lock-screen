import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { Toggle } from './Toggle';

export interface ListSectionProps {
  header?: string;
  footer?: string;
  /** No card around the content — for controls that carry their own outline. */
  bare?: boolean;
  children: ReactNode;
}

/** A quiet grouped section: micro header, hairline-bordered card, hairline separators. */
export function ListSection({ header, footer, bare = false, children }: ListSectionProps) {
  const { colors } = useTheme();
  const rows = Children.toArray(children).filter(isValidElement) as ReactElement<{
    separator?: boolean;
  }>[];

  return (
    <View style={styles.section}>
      {header ? (
        <Text
          variant="micro"
          color="tertiaryLabel"
          style={styles.header}
          accessibilityRole="header"
        >
          {header}
        </Text>
      ) : null}
      {bare ? (
        children
      ) : (
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {rows.map((row, index) => cloneElement(row, { separator: index < rows.length - 1 }))}
        </View>
      )}
      {footer ? (
        <Text variant="footnote" color="tertiaryLabel" style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export interface ListCellProps {
  children: ReactNode;
  /** Injected by `ListSection`. */
  separator?: boolean;
}

/** A free-form cell inside a `ListSection`, e.g. a full-width choice group. */
export function ListCell({ children, separator }: ListCellProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.cell}>
      {children}
      {separator ? (
        <View style={[styles.separator, { left: spacing.lg, backgroundColor: colors.border }]} />
      ) : null}
    </View>
  );
}

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Trailing secondary text, e.g. the current value. */
  value?: string;
  /** Show a disclosure chevron (navigates somewhere). */
  chevron?: boolean;
  /** Turns the row into a toggle. */
  toggle?: { value: boolean; onValueChange: (value: boolean) => void };
  onPress?: () => void;
  destructive?: boolean;
  /** Full-width content below the title row. */
  children?: ReactNode;
  /** Injected by `ListSection`. */
  separator?: boolean;
  accessibilityHint?: string;
}

export function ListRow({
  title,
  subtitle,
  icon,
  value,
  chevron,
  toggle,
  onPress,
  destructive,
  children,
  separator,
  accessibilityHint,
}: ListRowProps) {
  const { colors } = useTheme();
  const inset = icon ? spacing.lg + 20 + spacing.md : spacing.lg;

  const content = (
    <View style={styles.rowOuter}>
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={16} color="secondaryLabel" /> : null}
        <View style={styles.titles}>
          <Text color={destructive ? 'danger' : 'label'} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="footnote" color="tertiaryLabel">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {value ? (
          <Text color="tertiaryLabel" numberOfLines={1} style={styles.value}>
            {value}
          </Text>
        ) : null}
        {toggle ? (
          <Toggle
            value={toggle.value}
            onValueChange={toggle.onValueChange}
            accessibilityLabel={title}
          />
        ) : null}
        {chevron ? <Icon name="chevronRight" size={12} color="tertiaryLabel" /> : null}
      </View>
      {children ? <View style={styles.extra}>{children}</View> : null}
      {separator ? (
        <View style={[styles.separator, { left: inset, backgroundColor: colors.border }]} />
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={1}
      pressedOpacity={0.5}
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}, ${value}` : title}
      accessibilityHint={accessibilityHint}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
  },
  header: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  footer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cell: {
    padding: spacing.md,
  },
  rowOuter: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    minHeight: MIN_TOUCH_TARGET + 4,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  value: {
    maxWidth: '50%',
  },
  extra: {
    paddingBottom: spacing.md,
  },
  separator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});

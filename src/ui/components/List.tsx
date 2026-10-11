import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';

import { MIN_TOUCH_TARGET, radius, spacing, useTheme, type ColorName } from '../theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

const ICON_TILE = 30;

/** react-native-web colors the "on" thumb separately (teal by default); keep it iOS white. */
const webSwitchProps: object = Platform.OS === 'web' ? { activeThumbColor: '#FFFFFF' } : {};

export interface ListSectionProps {
  header?: string;
  footer?: string;
  children: ReactNode;
}

/** An inset-grouped list section, like the Settings app. */
export function ListSection({ header, footer, children }: ListSectionProps) {
  const { colors } = useTheme();
  const rows = Children.toArray(children).filter(isValidElement) as ReactElement<{
    separator?: boolean;
  }>[];

  return (
    <View style={styles.section}>
      {header ? (
        <Text
          variant="footnote"
          color="secondaryLabel"
          style={styles.header}
          accessibilityRole="header"
        >
          {header.toUpperCase()}
        </Text>
      ) : null}
      <View style={[styles.card, { backgroundColor: colors.secondaryGroupedBackground }]}>
        {rows.map((row, index) => cloneElement(row, { separator: index < rows.length - 1 }))}
      </View>
      {footer ? (
        <Text variant="footnote" color="secondaryLabel" style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconBackground?: ColorName;
  /** Trailing secondary text, e.g. the current value. */
  value?: string;
  /** Show a disclosure chevron (navigates somewhere). */
  chevron?: boolean;
  /** Turns the row into a toggle. */
  toggle?: { value: boolean; onValueChange: (value: boolean) => void };
  onPress?: () => void;
  destructive?: boolean;
  /** Full-width content below the title row (e.g. a segmented control). */
  children?: ReactNode;
  /** Injected by `ListSection`. */
  separator?: boolean;
  accessibilityHint?: string;
}

export function ListRow({
  title,
  subtitle,
  icon,
  iconBackground = 'tint',
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
  const inset = icon ? spacing.lg + ICON_TILE + spacing.md : spacing.lg;

  const content = (
    <View style={styles.rowOuter}>
      <View style={styles.row}>
        {icon ? (
          <View style={[styles.iconTile, { backgroundColor: colors[iconBackground] }]}>
            <Icon name={icon} size={17} tintColor="#FFFFFF" />
          </View>
        ) : null}
        <View style={styles.titles}>
          <Text color={destructive ? 'red' : 'label'}>{title}</Text>
          {subtitle ? (
            <Text variant="footnote" color="secondaryLabel">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {value ? (
          <Text color="secondaryLabel" numberOfLines={1} style={styles.value}>
            {value}
          </Text>
        ) : null}
        {toggle ? (
          <Switch
            value={toggle.value}
            onValueChange={toggle.onValueChange}
            trackColor={{ true: colors.green, false: colors.fill }}
            thumbColor="#FFFFFF"
            {...webSwitchProps}
            ios_backgroundColor={colors.fill}
            accessibilityLabel={title}
          />
        ) : null}
        {chevron ? (
          <Icon name="chevronRight" size={14} color="tertiaryLabel" weight="semibold" />
        ) : null}
      </View>
      {children ? <View style={styles.extra}>{children}</View> : null}
      {separator ? (
        <View style={[styles.separator, { left: inset, backgroundColor: colors.separator }]} />
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={1}
      pressedOpacity={0.55}
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}, ${value}` : title}
      accessibilityHint={accessibilityHint}
    >
      {content}
    </PressableScale>
  );
}

export interface ListCellProps {
  children: ReactNode;
  /** Injected by `ListSection`. */
  separator?: boolean;
}

/** A free-form cell inside a `ListSection`, e.g. a full-width segmented control. */
export function ListCell({ children, separator }: ListCellProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.cell}>
      {children}
      {separator ? (
        <View style={[styles.separator, { left: spacing.lg, backgroundColor: colors.separator }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  header: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm - 2,
  },
  footer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm - 2,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  rowOuter: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm + 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconTile: {
    width: ICON_TILE,
    height: ICON_TILE,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
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

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { durations, radius, springs, useTheme } from '../theme';
import { GlassFill } from './GlassFill';
import { Text } from './Text';

export interface ChoiceOption<T> {
  label: string;
  value: T;
  /** Spoken label when the visible one is terse (e.g. "15" → "15 minutes"). */
  accessibilityLabel?: string;
}

export interface ChoiceGroupProps<T> {
  options: readonly ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  testID?: string;
}

const HEIGHT = 38;
const INSET = 3;

/**
 * A monochrome segmented control: plain text options on a hairline track, with a glass
 * indicator that glides to the chosen one.
 */
export function ChoiceGroup<T>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testID,
}: ChoiceGroupProps<T>) {
  const { colors, glass } = useTheme();
  const reduceMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const segmentWidth = trackWidth > 0 ? (trackWidth - INSET * 2) / options.length : 0;

  const offset = useSharedValue(0);
  useEffect(() => {
    const target = selectedIndex * segmentWidth;
    offset.set(
      reduceMotion
        ? withTiming(target, { duration: durations.fast })
        : withSpring(target, springs.snappy),
    );
  }, [selectedIndex, segmentWidth, reduceMotion, offset]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width !== trackWidth) {
      offset.set(selectedIndex * ((width - INSET * 2) / options.length));
      setTrackWidth(width);
    }
  };

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { width: segmentWidth, boxShadow: glass.shadow },
            indicatorStyle,
          ]}
        >
          <GlassFill borderRadius={radius.capsule} />
        </Animated.View>
      ) : null}
      {options.map((option, index) => {
        const selected = index === selectedIndex;
        return (
          <Pressable
            key={option.label}
            onPress={() => {
              if (!selected) onChange(option.value);
            }}
            hitSlop={{ top: 3, bottom: 3 }}
            accessibilityRole="radio"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ checked: selected }}
            style={styles.option}
          >
            <Text
              variant="subheadline"
              weight={selected ? '600' : '500'}
              color={selected ? 'label' : 'tertiaryLabel'}
              tabular
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: HEIGHT,
    flexDirection: 'row',
    padding: INSET - 1,
    borderRadius: radius.capsule,
    borderWidth: 1,
  },
  indicator: {
    position: 'absolute',
    top: INSET - 1,
    bottom: INSET - 1,
    left: INSET - 1,
    borderRadius: radius.capsule,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

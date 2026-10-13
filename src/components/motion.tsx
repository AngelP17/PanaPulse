import React, { useState } from 'react';
import { GestureResponderEvent, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { cubicBezier, Easing, useReducedMotion } from 'react-native-reanimated';

/** Strong ease-out for UI (never ease-in on interface elements). */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pill or button-like pressable with physical press feedback: scales to 0.97 on press-in (120 ms, ease-out)
 * and commits on press-out. With Reduce Motion it dims instead of scaling.
 * Not for full-width list rows (they highlight) or the bottom nav (pressed 100+ times a day: no animation).
 */
export function PressScale({
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [down, setDown] = useState(false);
  const base = (StyleSheet.flatten(style)?.opacity as number | undefined) ?? 1; // keeps a caller's disabled dim
  return (
    <AnimatedPressable
      {...rest}
      pressRetentionOffset={{ top: 16, left: 16, right: 16, bottom: 16 }}
      onPressIn={(e: GestureResponderEvent) => {
        setDown(true);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setDown(false);
        onPressOut?.(e);
      }}
      style={[
        style,
        {
          transform: [{ scale: down && !reduced ? 0.97 : 1 }],
          opacity: down && reduced ? base * 0.72 : base,
          transitionProperty: ['transform', 'opacity'],
          transitionDuration: 120,
          transitionTimingFunction: CSS_EASE_OUT,
        },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

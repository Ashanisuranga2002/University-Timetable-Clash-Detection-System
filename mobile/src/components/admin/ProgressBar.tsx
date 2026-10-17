// ===============================================================
// Admin ProgressBar Component
// Smooth animated linear progress bar used in telemetry metrics and system load cards
// ===============================================================

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { AC } from '@/constants/adminTheme';

// Component props
interface ProgressBarProps {
  progress: number;   // Value between 0.0 and 1.0 (0% to 100%)
  color?: string;     // Fill color (defaults to primary indigo)
  height?: number;    // Height in pixels (defaults to 4)
  animated?: boolean; // Whether to animate the width transition
}

export function ProgressBar({
  progress,
  color = AC.primary,
  height = 4,
  animated = true,
}: ProgressBarProps) {
  // Animated value tracking the current fill percentage
  const anim = useRef(new Animated.Value(0)).current;

  // Trigger smooth transition whenever the progress value changes
  useEffect(() => {
    if (animated) {
      Animated.timing(anim, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      anim.setValue(progress);
    }
  }, [progress, animated, anim]);

  // Interpolate numerical 0..1 range into percentage string for CSS width
  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color, height }]} />
    </View>
  );
}


const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: AC.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { borderRadius: 4 },
});

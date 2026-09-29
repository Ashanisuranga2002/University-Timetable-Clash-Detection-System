import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { AC } from '@/constants/adminTheme';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color = AC.primary,
  height = 4,
  animated = true,
}: ProgressBarProps) {
  const anim = useRef(new Animated.Value(0)).current;

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

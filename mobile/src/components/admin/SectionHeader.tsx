import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AC, AS } from '@/constants/adminTheme';

interface SectionHeaderProps {
  title: string;
  right?: string;
  rightBadge?: string;
  onRightPress?: () => void;
}

export function SectionHeader({ title, right, rightBadge, onRightPress }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {right ? (
        <Pressable onPress={onRightPress} hitSlop={8} accessibilityRole="button">
          <View style={styles.rightRow}>
            {rightBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{rightBadge}</Text>
              </View>
            ) : null}
            <Text style={styles.rightText}>{right}</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AS.screenH,
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: '700', color: AC.textPrimary },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rightText: { fontSize: 13, fontWeight: '600', color: AC.primary },
  badge: {
    backgroundColor: AC.dangerLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: AC.danger },
});

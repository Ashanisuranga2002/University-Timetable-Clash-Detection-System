import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AC, AS } from '@/constants/adminTheme';

interface AdminHeaderProps {
  title: string;
  showCampus?: boolean;
  onNotification?: () => void;
  onProfile?: () => void;
}

export function AdminHeader({ title, showCampus = true, onNotification, onProfile }: AdminHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {showCampus && (
          <View style={styles.campusRow}>
            <View style={styles.greenDot} />
            <Text style={styles.campusText}>CAMPUS US-EAST</Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onNotification}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
        >
          <Text style={styles.bellIcon}>??</Text>
          <View style={styles.redDot} />
        </Pressable>
        <Pressable
          onPress={onProfile}
          style={styles.profileBtn}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          hitSlop={8}
        >
          <Text style={styles.profileText}>A</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: AC.bgCard,
    paddingHorizontal: AS.screenH,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: AC.border,
  },
  left: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AC.textPrimary,
    letterSpacing: -0.3,
  },
  campusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 5,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: AC.success,
  },
  campusText: {
    fontSize: 11,
    fontWeight: '600',
    color: AC.textSecondary,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: { position: 'relative' },
  bellIcon: { fontSize: 20 },
  redDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: AC.bgCard,
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AC.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

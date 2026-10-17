// ===============================================================
// Admin Header Component
// Top app bar with campus status indicator, back navigation,
// live notification alert indicator, and admin profile avatar
// ===============================================================

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { AC, AS } from '@/constants/adminTheme';
import { fetchAlertsApi } from '@/services/api';

// Props accepted by the AdminHeader component
interface AdminHeaderProps {
  title: string;                 // Screen title heading
  showCampus?: boolean;          // Whether to display the campus dot subtitle
  showBack?: boolean;            // Whether to show back navigation button
  onBack?: () => void;           // Custom back button press handler
  onNotification?: () => void;   // Custom notification bell press handler
  onProfile?: () => void;        // Custom profile avatar press handler
}

export function AdminHeader({
  title,
  showCampus = true,
  showBack = false,
  onBack,
  onNotification,
  onProfile,
}: AdminHeaderProps) {
  const insets = useSafeAreaInsets();
  // State for administrator initial avatar letter (defaults to 'A')
  const [initial, setInitial] = useState('A');
  // State indicating if unhandled active alerts exist
  const [hasAlerts, setHasAlerts] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // 1. Load active admin name from local storage to display first initial
    AsyncStorage.getItem('current_admin_user')
      .then(raw => {
        if (raw && isMounted) {
          try {
            const u = JSON.parse(raw);
            const name = u.name || u.fullName || '';
            if (name) {
              setInitial(name.trim().charAt(0).toUpperCase());
            }
          } catch {}
        }
      })
      .catch(() => {});

    // 2. Query active alerts to toggle notification bell red dot badge
    fetchAlertsApi({ status: 'active' })
      .then(res => {
        if (res && res.data && isMounted) {
          const activeOnly = res.data.filter((a: any) => a.state === 'active' || a.state === 'new');
          setHasAlerts(activeOnly.length > 0);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Back button handler: custom callback or navigate back in router stack
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/admin' as any);
    }
  };

  // Notification bell click: opens alerts screen
  const handleNotification = () => {
    if (onNotification) onNotification();
    else router.push('/admin/alerts' as any);
  };

  // Profile avatar click: opens admin profile screen
  const handleProfile = () => {
    if (onProfile) onProfile();
    else router.push('/admin/profile' as any);
  };


  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        {showBack && (
          <Pressable
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go Back"
            hitSlop={8}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {showCampus && (
            <View style={styles.campusRow}>
              <View style={styles.greenDot} />
              <Text style={styles.campusText}>CAMPUS US-EAST</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={handleNotification}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {hasAlerts && <View style={styles.redDot} />}
        </Pressable>
        <Pressable
          onPress={handleProfile}
          style={styles.profileBtn}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          hitSlop={8}
        >
          <Text style={styles.profileText}>{initial}</Text>
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
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: AC.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  title: {
    fontSize: 18,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AC.success,
  },
  campusText: {
    fontSize: 10,
    fontWeight: '700',
    color: AC.textSecondary,
    letterSpacing: 0.5,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AC.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: { fontSize: 16 },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AC.danger,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AC.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { AC, AS } from '@/constants/adminTheme';
import { fetchAlertsApi } from '@/services/api';

interface AdminHeaderProps {
  title: string;
  showCampus?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  onNotification?: () => void;
  onProfile?: () => void;
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
  const [initial, setInitial] = useState('A');
  const [hasAlerts, setHasAlerts] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Load admin initial from real session
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

    // Check for active alerts
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

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/admin' as any);
    }
  };

  const handleNotification = () => {
    if (onNotification) onNotification();
    else router.push('/admin/alerts' as any);
  };

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

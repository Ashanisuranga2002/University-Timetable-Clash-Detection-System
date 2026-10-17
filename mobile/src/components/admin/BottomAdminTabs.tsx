// ===============================================================
// Bottom Admin Navigation Tabs
// Floating persistent bottom bar with active indicator and badge count
// ===============================================================

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AC } from '@/constants/adminTheme';
import { fetchAlertsApi } from '@/services/api';

// Interface defining navigation tab item structure
interface Tab {
  name: string;
  label: string;
  route: string;
  icon: string;
}

// Navigation tabs for the Admin portal
const TABS: Tab[] = [
  { name: 'dashboard', label: 'Dashboard', route: '/admin', icon: '📊' },
  { name: 'monitor', label: 'Monitor', route: '/admin/service-status', icon: '🖥' },
  { name: 'alerts', label: 'Alerts', route: '/admin/alerts', icon: '⚠️' },
  { name: 'profile', label: 'Profile', route: '/admin/profile', icon: '👤' },
];

// Helper to determine if a tab is currently active based on the current pathname
function matchesTab(pathname: string, tab: Tab): boolean {
  if (tab.route === '/admin') {
    return pathname === '/admin' || pathname === '/admin/index';
  }
  if (tab.route === '/admin/profile') {
    return pathname === '/admin/profile';
  }
  return pathname.startsWith(tab.route);
}

export function BottomAdminTabs() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  // State for number of active unaddressed alerts
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);

  // Poll or refresh active alert badge count on route change
  useEffect(() => {
    let isMounted = true;
    async function loadAlertsCount() {
      try {
        const res = await fetchAlertsApi({ status: 'active' });
        if (res && res.data && Array.isArray(res.data) && isMounted) {
          // Count only active alerts
          const activeOnly = res.data.filter((a: any) => a.state === 'active' || a.state === 'new');
          setActiveAlertsCount(activeOnly.length);
        }
      } catch {
        if (isMounted) setActiveAlertsCount(0);
      }
    }
    loadAlertsCount();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>

      {TABS.map(tab => {
        const active = matchesTab(pathname, tab);
        const badgeCount = tab.name === 'alerts' ? activeAlertsCount : 0;

        return (
          <Pressable
            key={tab.name}
            onPress={() => router.push(tab.route as '/')}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            hitSlop={4}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Text style={styles.icon}>{tab.icon}</Text>
              {badgeCount > 0 && !active ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: AC.tabBg,
    borderTopWidth: 1,
    borderTopColor: AC.border,
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: { position: 'relative', padding: 6, borderRadius: 10 },
  iconWrapActive: { backgroundColor: AC.tabActiveBg },
  icon: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AC.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  label: { fontSize: 10, fontWeight: '600', color: AC.tabInactive },
  labelActive: { color: AC.tabActive, fontWeight: '700' },
});

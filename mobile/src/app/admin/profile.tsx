import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AC, AR, AS } from '@/constants/adminTheme';
import { BottomAdminTabs } from '@/components/admin/BottomAdminTabs';
import {
  fetchAdminProfileApi,
  fetchAdminDashboardStatsApi,
  AdminProfileData,
  AdminDashboardStats,
} from '@/services/api';

const QUICK_LINKS = [
  { icon: '👥', label: 'User Management', sub: 'Manage system users', route: '/admin/users' },
  { icon: '🖥️', label: 'Monitor Management', sub: 'Configure service monitors', route: '/admin/monitors' },
  { icon: '⚠️', label: 'Alert Monitor', sub: 'Review system alerts', route: '/admin/alerts' },
  { icon: '📊', label: 'Service Status', sub: 'View live system health', route: '/admin/service-status' },
];

function getInitials(name?: string): string {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const filtered = parts.filter(p => !['dr.', 'prof.', 'mr.', 'ms.', 'mrs.'].includes(p.toLowerCase()));
  const target = filtered.length >= 2 ? filtered : parts;
  return target.slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return 'Active Member';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Active Member' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return 'Active Member';
  }
}

function formatLastLogin(dateStr?: string): string {
  if (!dateStr) return 'Active session';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Active session';
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'Active session';
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickLink({
  icon,
  label,
  sub,
  route,
}: {
  icon: string;
  label: string;
  sub: string;
  route: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickLink, pressed && styles.quickLinkPressed]}
      onPress={() => router.push(route as any)}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.quickLinkIcon}>
        <Text style={styles.quickLinkEmoji}>{icon}</Text>
      </View>
      <View style={styles.quickLinkText}>
        <Text style={styles.quickLinkLabel}>{label}</Text>
        <Text style={styles.quickLinkSub}>{sub}</Text>
      </View>
      <Text style={styles.quickLinkArrow}>›</Text>
    </Pressable>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function AdminProfileScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      let savedUser = null;
      try {
        const storedStr = await AsyncStorage.getItem('current_admin_user');
        if (storedStr) {
          savedUser = JSON.parse(storedStr);
        }
      } catch {
        // ignore JSON parse error
      }

      const adminId = savedUser?.adminId || savedUser?.userId || 'ADM001';

      const [profileRes, statsRes] = await Promise.allSettled([
        fetchAdminProfileApi(adminId),
        fetchAdminDashboardStatsApi(),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value?.success) {
        const fetched = profileRes.value.admin || profileRes.value.data;
        setProfile(fetched);
      } else if (savedUser) {
        setProfile(savedUser);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.data);
      }
    } catch (err: any) {
      console.warn('Profile load error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the admin portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('current_admin_user');
            } catch {
              // ignore
            }
            router.dismissAll();
            router.replace('/');
          },
        },
      ]
    );
  };

  const adminName = profile?.name || 'Administrator';
  const adminRole = profile?.role || 'Administrator';
  const adminId = profile?.adminId || profile?.userId || 'ADM001';
  const adminEmail = profile?.email || 'admin@university.edu';
  const adminDept = profile?.department || 'Academic Affairs';
  const adminStatus = profile?.status || 'Active';
  const adminInitials = getInitials(adminName);
  const joinDate = formatJoinDate(profile?.createdAt);
  const lastLogin = formatLastLogin(profile?.lastLogin);

  const systemStats = [
    { label: 'Total Users', value: stats ? `${stats.users.total}` : '--' },
    { label: 'Active Monitors', value: stats ? `${stats.monitors.healthy}` : '--' },
    { label: 'Open Alerts', value: stats ? `${stats.alerts.active}` : '--' },
    { label: 'System Health', value: stats ? stats.systemHealth.status : '--' },
  ];

  return (
    <View style={styles.screen}>
      {/* ── Custom Header ─────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/admin' as any))}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
          hitSlop={8}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Admin Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={AC.primary} />
            <Text style={{ fontSize: 13, color: AC.textSecondary }}>Loading admin credentials...</Text>
          </View>
        ) : (
          <>
            {/* ── Avatar + Identity Card ──────────────────────────────── */}
            <View style={styles.identityCard}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{adminInitials}</Text>
                </View>
                <View style={styles.onlineDot} />
              </View>

              <Text style={styles.adminName}>{adminName}</Text>

              <View style={styles.rolePill}>
                <View style={styles.roleDot} />
                <Text style={styles.roleText}>{adminRole}</Text>
              </View>

              <View style={styles.campusPill}>
                <Text style={styles.campusText}>{adminDept.toUpperCase()}</Text>
              </View>
            </View>

            {/* ── System Stats Row ─────────────────────────────────────── */}
            <View style={styles.statsRow}>
              {systemStats.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} />
              ))}
            </View>

            {/* ── Account Info ─────────────────────────────────────────── */}
            <View>
              <SectionTitle title="Account Information" />
              <View style={styles.infoCard}>
                {[
                  { label: 'Admin ID / User ID', value: adminId },
                  { label: 'Full Name', value: adminName },
                  { label: 'Official Email', value: adminEmail },
                  { label: 'Role', value: adminRole },
                  { label: 'Department', value: adminDept },
                  { label: 'Account Status', value: adminStatus },
                  { label: 'Last Login', value: lastLogin },
                  { label: 'Member Since', value: joinDate },
                ].map((row, idx, arr) => (
                  <View key={row.label}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{row.label}</Text>
                      <Text style={styles.infoValue}>{row.value}</Text>
                    </View>
                    {idx < arr.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            {/* ── Preferences ──────────────────────────────────────────── */}
            <View>
              <SectionTitle title="Preferences" />
              <View style={styles.infoCard}>
                <View style={styles.prefRow}>
                  <View>
                    <Text style={styles.prefLabel}>Push Notifications</Text>
                    <Text style={styles.prefSub}>Alert & system notifications</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#CBD5E1', true: AC.primaryMid }}
                    thumbColor={notificationsEnabled ? AC.primary : '#F1F5F9'}
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.prefRow}>
                  <View>
                    <Text style={styles.prefLabel}>Dark Mode</Text>
                    <Text style={styles.prefSub}>Switch UI theme</Text>
                  </View>
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: '#CBD5E1', true: AC.primaryMid }}
                    thumbColor={darkMode ? AC.primary : '#F1F5F9'}
                  />
                </View>
              </View>
            </View>

            {/* ── Quick Access Links ───────────────────────────────────── */}
            <View>
              <SectionTitle title="Quick Access" />
              <View style={styles.quickLinksCard}>
                {QUICK_LINKS.map((link, idx, arr) => (
                  <View key={link.label}>
                    <QuickLink {...link} />
                    {idx < arr.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            {/* ── Sign Out ─────────────────────────────────────────────── */}
            <Pressable
              style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
            >
              <Text style={styles.signOutText}>🚪  Sign Out of Admin Portal</Text>
            </Pressable>

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>

      <BottomAdminTabs />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AC.bgApp },

  // Header
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
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: AC.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 18, fontWeight: '700', color: AC.textPrimary },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AC.textPrimary,
    letterSpacing: -0.3,
  },

  // Scroll
  scroll: { flex: 1 },
  content: { padding: AS.screenH, gap: 16 },

  // Identity Card
  identityCard: {
    backgroundColor: AC.primary,
    borderRadius: AR.card,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#FFF' },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: AC.primary,
  },
  adminName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: AR.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' },
  roleText: { fontSize: 12, fontWeight: '700', color: '#E0E7FF' },
  campusPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: AR.chip,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  campusText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 1 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: AC.primary },
  statLabel: { fontSize: 9, fontWeight: '700', color: AC.textSecondary, textAlign: 'center', letterSpacing: 0.3 },

  // Section title
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AC.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 2,
  },

  // Info Card
  infoCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    paddingHorizontal: AS.cardH,
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: { fontSize: 13, color: AC.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: AC.textPrimary, maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: AC.borderLight },

  // Preferences
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  prefLabel: { fontSize: 13, fontWeight: '600', color: AC.textPrimary },
  prefSub: { fontSize: 11, color: AC.textTertiary, marginTop: 2 },

  // Quick Links
  quickLinksCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    paddingHorizontal: AS.cardH,
    paddingVertical: 4,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  quickLinkPressed: { opacity: 0.6 },
  quickLinkIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: AC.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkEmoji: { fontSize: 18 },
  quickLinkText: { flex: 1 },
  quickLinkLabel: { fontSize: 14, fontWeight: '600', color: AC.textPrimary },
  quickLinkSub: { fontSize: 11, color: AC.textTertiary, marginTop: 1 },
  quickLinkArrow: { fontSize: 20, color: AC.textTertiary, fontWeight: '300' },

  // Sign Out
  signOutBtn: {
    backgroundColor: '#FFF1F2',
    borderRadius: AR.button,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 15,
    alignItems: 'center',
  },
  signOutBtnPressed: { opacity: 0.7 },
  signOutText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
});

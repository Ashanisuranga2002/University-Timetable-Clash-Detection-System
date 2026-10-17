import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FooterTab } from '../components/FooterTab';
import { fetchDashboardApi, fetchAdminDashboardApi } from '../services/api';

export default function ProfileScreen() {
  const params = useLocalSearchParams();
  const [sessionStudent, setSessionStudent] = useState<any>(null);
  const [sessionAdmin, setSessionAdmin] = useState<any>(null);

  const role =
    (params.role as 'student' | 'admin') ||
    (params.adminId ? 'admin' : sessionAdmin ? 'admin' : 'student');

  const studentId =
    (params.studentId as string) ||
    sessionStudent?.studentId ||
    sessionStudent?.userId ||
    '';

  const adminId =
    (params.adminId as string) ||
    sessionAdmin?.adminId ||
    sessionAdmin?.userId ||
    '';

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    name: string;
    roleTitle: string;
    idBadge: string;
    initials: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
  }>({
    name: 'User Profile',
    roleTitle: 'University Member',
    idBadge: 'ID: --',
    initials: 'ST',
    stat1Value: '0',
    stat1Label: 'Enrolled Courses',
    stat2Value: '0 Credits',
    stat2Label: 'Academic Load',
  });

  function getInitials(fullName: string) {
    if (!fullName) return 'ST';
    const parts = fullName
      .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '')
      .trim()
      .split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.substring(0, 2) || 'ST').toUpperCase();
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [studentRaw, adminRaw] = await Promise.all([
          AsyncStorage.getItem('current_student_user').catch(() => null),
          AsyncStorage.getItem('current_admin_user').catch(() => null),
        ]);

        let parsedStudent = null;
        let parsedAdmin = null;
        if (studentRaw) {
          try {
            parsedStudent = JSON.parse(studentRaw);
            setSessionStudent(parsedStudent);
          } catch {}
        }
        if (adminRaw) {
          try {
            parsedAdmin = JSON.parse(adminRaw);
            setSessionAdmin(parsedAdmin);
          } catch {}
        }

        if (role === 'admin') {
          const res = await fetchAdminDashboardApi().catch(() => null);
          const staffName =
            (params.adminName as string) ||
            parsedAdmin?.name ||
            'Administrator';
          const staffDept =
            (params.adminDept as string) ||
            parsedAdmin?.department ||
            parsedAdmin?.role ||
            'Academic Affairs';
          const staffId =
            (params.adminId as string) ||
            parsedAdmin?.adminId ||
            parsedAdmin?.userId ||
            adminId;

          setProfileData({
            name: staffName,
            roleTitle: staffDept,
            idBadge: `ID: ${staffId}`,
            initials: getInitials(staffName),
            stat1Value: String(res?.stats?.totalRegistrations || '0'),
            stat1Label: 'Total Approvals',
            stat2Value: 'Mon & Wed',
            stat2Label: 'Office Hours',
          });
        } else {
          const effectiveStudentId =
            (params.studentId as string) ||
            parsedStudent?.studentId ||
            parsedStudent?.userId ||
            studentId;

          const res = effectiveStudentId ? await fetchDashboardApi(effectiveStudentId).catch(() => null) : null;
          const stuName =
            res?.student?.name ||
            parsedStudent?.name ||
            (effectiveStudentId ? `Student ${effectiveStudentId}` : 'Student');
          const stuProg =
            res?.student?.programme ||
            parsedStudent?.programme ||
            parsedStudent?.department ||
            'Faculty of Computing';
          const stuId = res?.student?.studentId || effectiveStudentId || parsedStudent?.studentId || parsedStudent?.userId || '--';

          setProfileData({
            name: stuName,
            roleTitle: stuProg,
            idBadge: `ID: ${stuId}`,
            initials: res?.student?.initials || getInitials(stuName),
            stat1Value: String(res?.academics?.registeredCount ?? 0),
            stat1Label: 'Enrolled Courses',
            stat2Value: `${res?.academics?.totalCredits ?? 0} Credits`,
            stat2Label: 'Academic Load',
          });
        }
      } catch (e) {
        // Fallback profile state remains active
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [role, studentId, adminId]);

  const handleBack = () => {
    if (role === 'admin') {
      router.replace({ pathname: '/admin-dashboard', params: { adminId } });
    } else {
      router.replace({ pathname: '/dashboard', params: { studentId } });
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('current_student_user');
            await AsyncStorage.removeItem('current_admin_user');
            router.replace('/');
          },
        },
      ]
    );
  };


  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top Bar Header ────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Profile</Text>

        <TouchableOpacity
          style={styles.notificationBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="notifications-outline" size={22} color="#1E293B" />
          <View style={styles.redDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Avatar & Identity Card ─────────────────────── */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{profileData.initials}</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>

          <Text style={styles.profileName}>{profileData.name}</Text>
          <Text style={styles.profileRole}>{profileData.roleTitle}</Text>

          <View style={styles.idBadgeContainer}>
            <Text style={styles.idBadgeText}>{profileData.idBadge}</Text>
          </View>
        </View>

        {/* ── Quick Stats Row ────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {/* Stat 1: Total Approvals / Enrolled Courses */}
          <View style={styles.statCard}>
            <View style={styles.statIconGreen}>
              <Ionicons name="checkmark" size={16} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{profileData.stat1Value}</Text>
            <Text style={styles.statLabel}>{profileData.stat1Label}</Text>
          </View>

          {/* Stat 2: Office Hours / Academic Load */}
          <View style={styles.statCard}>
            <View style={styles.statIconPurple}>
              <Ionicons name="time-outline" size={16} color="#6366F1" />
            </View>
            <Text style={styles.statNumber}>{profileData.stat2Value}</Text>
            <Text style={styles.statLabel}>{profileData.stat2Label}</Text>
          </View>
        </View>

        {/* ── Account Settings Section ──────────────────────────── */}
        <Text style={styles.sectionHeaderTitle}>Account Settings</Text>

        <View style={styles.settingsMenuCard}>
          {/* Item 1: Notification Preferences */}
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconWrap}>
                <Ionicons name="notifications-outline" size={18} color="#475569" />
              </View>
              <Text style={styles.settingItemText}>Notification Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.itemDivider} />

          {/* Item 2: Security & Passwords */}
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#475569" />
              </View>
              <Text style={styles.settingItemText}>Security & Passwords</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.itemDivider} />

          {/* Item 3: Help & Support */}
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconWrap}>
                <Ionicons name="help-circle-outline" size={18} color="#475569" />
              </View>
              <Text style={styles.settingItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ── Sign Out Button ────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Bottom Footer Navigation ────────────────────────────── */}
      <FooterTab
        active="profile"
        studentId={studentId}
        adminId={adminId}
        role={role}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  notificationBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: 6,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },

  // ── Profile Hero Card ──────────────────────────────────────
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileRole: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  idBadgeContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.3,
  },

  // ── Stats Row ──────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statIconGreen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIconPurple: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // ── Account Settings ───────────────────────────────────────
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  settingsMenuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 62,
  },

  // ── Sign Out ───────────────────────────────────────────────
  signOutButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 12,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});

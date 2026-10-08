import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export type TabName = 'dashboard' | 'timetable' | 'courses' | 'clashes' | 'requests' | 'profile';

interface FooterTabProps {
  active: TabName;
  studentId?: string;
  adminId?: string;
  role?: 'student' | 'admin';
}

interface TabItem {
  key: TabName;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
}

const ADMIN_TABS: TabItem[] = [
  { key: 'dashboard', label: 'Dashboard', iconName: 'grid', iconOutline: 'grid-outline' },
  { key: 'courses',   label: 'Timetable', iconName: 'calendar', iconOutline: 'calendar-outline' },
  { key: 'clashes',   label: 'Requests',  iconName: 'document-text', iconOutline: 'document-text-outline' },
  { key: 'profile',   label: 'Profile',   iconName: 'person', iconOutline: 'person-outline' },
];

const STUDENT_TABS: TabItem[] = [
  { key: 'dashboard', label: 'Dashboard', iconName: 'grid', iconOutline: 'grid-outline' },
  { key: 'timetable', label: 'Timetable', iconName: 'calendar', iconOutline: 'calendar-outline' },
  { key: 'requests', label: 'Requests', iconName: 'document-text', iconOutline: 'document-text-outline' },
  { key: 'profile', label: 'Profile', iconName: 'person', iconOutline: 'person-outline' },
];

export function FooterTab({ active, studentId = 'IT21047138', adminId, role = 'student' }: FooterTabProps) {
  const tabs = role === 'admin' ? ADMIN_TABS : STUDENT_TABS;
  const navigate = (key: TabName) => {
    if (key === active) return;
    
    if (role === 'admin') {
      if (key === 'dashboard') {
        router.push({ pathname: '/admin-dashboard', params: { adminId } });
      } else if (key === 'profile') {
        router.push({ pathname: '/profile', params: { adminId, role: 'admin' } });
      } else {
        router.push({ pathname: '/admin-dashboard', params: { adminId } });
      }
      return;
    }

    // Student navigation
    const pathMap: Record<TabName, string> = {
      dashboard: '/dashboard',
      timetable: '/Student/timetable-preview',
      courses: '/course-selection',
      clashes: '/course-selection',
      requests: '/Student/requests',
      profile: '/profile',
    };
    router.push({ pathname: pathMap[key] as any, params: { studentId, role: 'student' } });
  };

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => navigate(tab.key)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isActive ? tab.iconName : tab.iconOutline}
              size={21}
              color={isActive ? '#6366F1' : '#9CA3AF'}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 3,
  },
  labelActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6366F1',
    marginTop: 2,
  },
});

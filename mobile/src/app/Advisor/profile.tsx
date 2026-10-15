// mobile/src/app/(advisor)/profile.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ScrollView,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdvisorProfileScreen() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('current_admin_user').then((raw) => {
      if (raw) {
        try {
          setSessionUser(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const getInitials = (fullName: string) => {
    if (!fullName) return 'AD';
    const parts = fullName
      .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '')
      .trim()
      .split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.substring(0, 2) || 'AD').toUpperCase();
  };

  const name = sessionUser?.name || 'Academic Advisor';
  const role = sessionUser?.role || 'Academic Advisor';
  const department = sessionUser?.department || 'Faculty of Computing';
  const email = sessionUser?.email || 'advisor@university.edu';
  const advisorId = sessionUser?.adminId || sessionUser?.userId || 'ADV001';
  const initials = getInitials(name);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the advisor portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('current_admin_user');
            await AsyncStorage.removeItem('current_student_user');
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Advisor Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.roleText}>{role}</Text>
          <Text style={styles.departmentText}>{department}</Text>
        </View>

        {/* Advisor Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Staff ID</Text>
            <Text style={styles.detailValue}>{advisorId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailValue}>{email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Department</Text>
            <Text style={styles.detailValue}>{department}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Status</Text>
            <Text style={[styles.detailValue, { color: '#039855' }]}>Active</Text>
          </View>
        </View>

        {/* Settings Links */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Personal Info', `Staff Name: ${name}\nID: ${advisorId}\nEmail: ${email}\nDept: ${department}`)}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="person-outline" size={20} color="#475467" />
              <Text style={styles.settingItemText}>Personal Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Notifications', 'Advisory notifications are enabled.')}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="notifications-outline" size={20} color="#475467" />
              <Text style={styles.settingItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Security', 'Your session is encrypted with standard university credentials.')}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#475467" />
              <Text style={styles.settingItemText}>Security & Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#D92D20" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    paddingHorizontal: 16, 
    paddingTop: 16, 
    paddingBottom: 16, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    elevation: 1,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A3AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  nameText: { fontSize: 20, fontWeight: '700', color: '#101828', marginBottom: 4 },
  roleText: { fontSize: 14, color: '#4A3AFF', fontWeight: '600', marginBottom: 2 },
  departmentText: { fontSize: 13, color: '#667085' },

  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: { fontSize: 13, color: '#667085' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#101828' },
  divider: { height: 1, backgroundColor: '#F2F4F7' },

  settingsSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#667085', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  settingItemLeft: { flexDirection: 'row', alignItems: 'center' },
  settingItemText: { marginLeft: 12, fontSize: 15, color: '#344054', fontWeight: '500' },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3F2',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE4E2',
    marginTop: 8,
  },
  logoutText: { color: '#D92D20', fontSize: 16, fontWeight: '600' },
});

// mobile/src/app/(advisor)/profile.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdvisorProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>AD</Text>
          </View>
          <Text style={styles.nameText}>Dr. Advisor Name</Text>
          <Text style={styles.roleText}>Academic Advisor</Text>
          <Text style={styles.departmentText}>Faculty of Computing</Text>
        </View>

        {/* Settings Links */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="person-outline" size={20} color="#475467" />
              <Text style={styles.settingItemText}>Personal Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="notifications-outline" size={20} color="#475467" />
              <Text style={styles.settingItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#475467" />
              <Text style={styles.settingItemText}>Security & Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/')}>
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
    marginBottom: 24,
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

  settingsSection: { marginBottom: 24 },
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

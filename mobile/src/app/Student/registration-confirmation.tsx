// mobile/src/app/(student)/registration-confirmation.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegistrationConfirmationScreen() {
  const router = useRouter();

  const handleReturnToDashboard = () => {
    // Navigate back to the main student dashboard
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registration Confirmation</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>

      {/* Main Content Centered */}
      <View style={styles.content}>
        <View style={styles.card}>
          
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="checkmark" size={32} color="#039855" />
            </View>
          </View>

          {/* Titles[cite: 53] */}
          <Text style={styles.successTitle}>Registration Successful!</Text>
          <Text style={styles.successSubtitle}>
            Your timetable clash has been resolved and submitted successfully.
          </Text>

          {/* Details Box[cite: 53] */}
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Modules Registered</Text>
              <Text style={styles.detailValue}>4 Modules</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Schedule Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>CONFLICT-FREE VERIFIED</Text>
              </View>
            </View>
          </View>

          {/* Return Button[cite: 53] */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleReturnToDashboard}
          >
            <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  
  // Header Styles[cite: 53]
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
  liveBadge: { backgroundColor: '#ECFDF3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 },
  liveBadgeText: { color: '#027A48', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // Content & Card Styles[cite: 53]
  content: { flex: 1, padding: 16, justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  
  // Icon Styles
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconBackground: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ECFDF3', alignItems: 'center', justifyContent: 'center' },
  
  // Text Styles[cite: 53]
  successTitle: { fontSize: 20, fontWeight: 'bold', color: '#101828', textAlign: 'center', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#475467', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  
  // Details Box Styles[cite: 53]
  detailsBox: { borderWidth: 1, borderColor: '#EAECF0', borderRadius: 12, padding: 16, marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 14, color: '#475467', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#101828', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#EAECF0', marginVertical: 16 },
  
  statusBadge: { backgroundColor: '#ECFDF3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  statusBadgeText: { color: '#027A48', fontSize: 12, fontWeight: '700' },
  
  // Button Styles[cite: 53]
  primaryButton: { backgroundColor: '#4A3AFF', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdvisorRequestsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request Management</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="document-text-outline" size={32} color="#4A3AFF" />
        </View>
        <Text style={styles.title}>All Requests</Text>
        <Text style={styles.subtitle}>You can view and manage all student module requests from the main overview.</Text>
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/Advisor/dashboard')}
        >
          <Text style={styles.primaryButtonText}>Go to Overview</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EAECF0', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEF2F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#101828', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#667085', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  primaryButton: { backgroundColor: '#4A3AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' }
});

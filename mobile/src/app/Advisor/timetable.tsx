import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdvisorTimetableScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Advisor Schedule</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="calendar-outline" size={32} color="#4A3AFF" />
        </View>
        <Text style={styles.title}>Your Timetable</Text>
        <Text style={styles.subtitle}>Your upcoming advisory sessions and module schedules will appear here.</Text>
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
  subtitle: { fontSize: 14, color: '#667085', textAlign: 'center', lineHeight: 20 }
});

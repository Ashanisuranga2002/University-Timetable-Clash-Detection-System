// mobile/src/app/(advisor)/review-request.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ReviewRequestScreen() {
  const router = useRouter();

  const handleApprove = () => {
    // In a real app, this triggers the PUT/PATCH request to update the status to 'APPROVED'
    console.log('Request Approved');
    router.back(); // Returns to the dashboard
  };

  const handleReject = () => {
    // Triggers the PUT/PATCH request to update the status to 'REJECTED'
    console.log('Request Rejected');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Request</Text>
        <View style={styles.actionBadge}>
          <Text style={styles.actionBadgeText}>ACTION REQUIRED</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Reassignment Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TIMETABLE REASSIGNMENT</Text>
          <View style={styles.exchangeBadge}>
            <Text style={styles.exchangeBadgeText}>SLOT EXCHANGE</Text>
          </View>
        </View>

        {/* Comparison Cards[cite: 54] */}
        <View style={styles.comparisonContainer}>
          {/* Current Card (Red/Clash) */}
          <View style={[styles.compareCard, styles.currentCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardLabel, { color: '#B42318' }]}>CURRENT</Text>
              <View style={styles.clashBadge}>
                <Text style={styles.clashBadgeText}>CLASH</Text>
              </View>
            </View>
            <Text style={styles.courseText}>IT3010 • Group A</Text>
            <Text style={styles.timeText}>Mon 09:00 - 11:00</Text>
            <View style={styles.statusRow}>
              <View style={styles.redDot} />
              <Text style={styles.overlapText}>Overlaps IT3030</Text>
            </View>
          </View>

          {/* Requested Card (Green/Clean) */}
          <View style={[styles.compareCard, styles.requestedCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardLabel, { color: '#027A48' }]}>REQUESTED</Text>
              <View style={styles.cleanBadge}>
                <Text style={styles.cleanBadgeText}>CLEAN</Text>
              </View>
            </View>
            <Text style={styles.courseText}>IT3010 • Group C</Text>
            <Text style={styles.timeText}>Mon 12:00 - 14:00</Text>
            <View style={styles.statusRow}>
              <Ionicons name="checkmark" size={14} color="#027A48" />
              <Text style={styles.noConflictText}>No Conflict</Text>
            </View>
          </View>
        </View>

        {/* Student Details Card[cite: 54] */}
        <View style={styles.detailsCard}>
          {/* Student Header */}
          <View style={styles.studentHeader}>
            <View style={styles.studentInfoRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>AP</Text>
              </View>
              <View>
                <Text style={styles.studentName}>Alex Perera</Text>
                <Text style={styles.studentId}>IT20601828</Text>
              </View>
            </View>
            <View style={styles.yearBadge}>
              <Text style={styles.yearBadgeText}>Y3 S2</Text>
            </View>
          </View>

          {/* Target Course Module */}
          <Text style={styles.fieldLabel}>TARGET COURSE MODULE</Text>
          <View style={styles.fieldBox}>
            <Text style={styles.fieldValueText}>
              <Text style={{ fontWeight: '700' }}>IT3010</Text> - Distributed Systems & Cloud
            </Text>
          </View>

          {/* Stated Reason */}
          <Text style={styles.fieldLabel}>STUDENT'S STATED REASON</Text>
          <View style={styles.fieldBox}>
            <Text style={styles.reasonText}>
              Both Courses are compulsory and clash on the current Monday morning schedule. Requesting urgent swap to Group C to avoid overlapping lab attendance.
            </Text>
          </View>

          {/* Footer Info */}
          <View style={styles.detailsFooter}>
            <View style={styles.seatsBadge}>
              <Text style={styles.seatsBadgeText}>GROUP C HAS 6 AVAILABLE SEATS</Text>
            </View>
            <Text style={styles.timestamp}>Submitted Today, 10:24 AM</Text>
          </View>
        </View>

        {/* Action Buttons[cite: 54] */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
            <Ionicons name="close" size={20} color="#D92D20" style={{ marginRight: 8 }} />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  
  // Header[cite: 54]
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
  actionBadge: { backgroundColor: '#FFFAEB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  actionBadgeText: { color: '#B54708', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Section Header[cite: 54]
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#667085', letterSpacing: 1 },
  exchangeBadge: { backgroundColor: '#EEF2F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  exchangeBadgeText: { color: '#4A3AFF', fontSize: 10, fontWeight: '700' },

  // Comparison Cards[cite: 54]
  comparisonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  compareCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, backgroundColor: '#FFFFFF' },
  currentCard: { borderColor: '#FEE4E2', marginRight: 6 },
  requestedCard: { borderColor: '#A6F4C5', marginLeft: 6 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  clashBadge: { backgroundColor: '#FEF3F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  clashBadgeText: { color: '#B42318', fontSize: 9, fontWeight: '700' },
  cleanBadge: { backgroundColor: '#ECFDF3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cleanBadgeText: { color: '#027A48', fontSize: 9, fontWeight: '700' },
  courseText: { fontSize: 13, fontWeight: '700', color: '#101828', marginBottom: 2 },
  timeText: { fontSize: 12, color: '#667085', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D92D20', marginRight: 6 },
  overlapText: { fontSize: 11, color: '#D92D20', fontWeight: '500' },
  noConflictText: { fontSize: 11, color: '#027A48', fontWeight: '500', marginLeft: 4 },

  // Details Card[cite: 54]
  detailsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EAECF0', elevation: 1, marginBottom: 24 },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  studentInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4A3AFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  studentName: { fontSize: 16, fontWeight: '700', color: '#101828' },
  studentId: { fontSize: 13, color: '#667085', marginTop: 2 },
  yearBadge: { backgroundColor: '#F2F4F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  yearBadgeText: { color: '#344054', fontSize: 12, fontWeight: '600' },
  
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#98A2B3', marginBottom: 8, marginTop: 4 },
  fieldBox: { borderWidth: 1, borderColor: '#EAECF0', borderRadius: 8, padding: 12, marginBottom: 16 },
  fieldValueText: { fontSize: 14, color: '#344054' },
  reasonText: { fontSize: 13, color: '#475467', lineHeight: 20 },
  
  detailsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  seatsBadge: { backgroundColor: '#ECFDF3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  seatsBadgeText: { color: '#027A48', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  timestamp: { fontSize: 11, color: '#98A2B3' },

  // Action Buttons[cite: 54]
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rejectButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FEE4E2', backgroundColor: '#FFFFFF', marginRight: 8 },
  rejectButtonText: { color: '#D92D20', fontSize: 16, fontWeight: '600' },
  approveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, backgroundColor: '#12B76A', marginLeft: 8 },
  approveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
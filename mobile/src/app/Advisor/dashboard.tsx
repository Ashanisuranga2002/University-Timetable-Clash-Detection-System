// mobile/src/app/(advisor)/dashboard.tsx
import React, { useState } from 'react';
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

// Mock data reflecting the students in your designs[cite: 46, 47, 48]
const MOCK_REQUESTS = [
  { id: '1', name: 'Alex Perera', studentId: 'IT20601828', initials: 'AP', course: 'IT3010 – Distributed Systems', date: '11 Sep 2026', details: 'Slot B Overlap', type: 'TIMETABLE CLASH', status: 'PENDING' },
  { id: '2', name: 'Senadi De Silva', studentId: 'IT20584410', initials: 'SD', course: 'IT3060 – HCI Practice', date: '09 Sep 2026', details: 'Group Reassignment', type: 'GROUP ISSUE', status: 'PENDING' },
  { id: '3', name: 'Kasun Liyanage', studentId: 'IT20619022', initials: 'KL', course: 'IT3080 – Machine Learning', date: '11 Sep 2026', details: 'Lab Session Conflict', type: 'TIMETABLE CLASH', status: 'PENDING' },
  { id: '4', name: 'Nethmi Jayasinghe', studentId: 'IT20723145', initials: 'NJ', course: 'IT3040 – Cloud Computing', date: '12 Sep 2026', details: 'Schedule Swap', type: 'SWAP REQUEST', status: 'PENDING' },
  // Adding a few approved/rejected items so the tabs work when tapped
  { id: '5', name: 'Alex Perera', studentId: 'IT20601828', initials: 'AP', course: 'IT3010 – Distributed Systems', date: '11 Sep 2026', details: 'Slot B Overlap', type: 'SWAP APPROVED', status: 'APPROVED' },
  { id: '6', name: 'Senadi De Silva', studentId: 'IT20584410', initials: 'SD', course: 'IT3060 – HCI Practice', date: '09 Sep 2026', details: 'Group Reassignment', type: 'SWAP REJECTED', status: 'REJECTED' },
];

export default function AdvisorDashboardScreen() {
  const router = useRouter();
  
  // State to track which summary card is currently selected (PENDING by default)
  const [activeTab, setActiveTab] = useState('PENDING');

  // Filter requests based on the active tab
  const displayedRequests = MOCK_REQUESTS.filter(req => req.status === activeTab);

  const handleReviewPress = (requestId: string) => {
    // Navigate to the Review Request screen
    router.push('/Advisor/review-request');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="menu" size={28} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advisor Dashboard</Text>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>AD</Text>
          <View style={styles.statusDot} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Advisory Portal Overview Banner[cite: 46] */}
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerTitle}>Advisory Portal Overview</Text>
            <Text style={styles.bannerSubtitle}>Resolve module clashes & student requests</Text>
          </View>
          <Ionicons name="ribbon-outline" size={24} color="#FFFFFF" />
        </View>

        {/* Summary Metric Cards[cite: 46, 47, 48] */}
        <View style={styles.metricsContainer}>
          {/* Pending Card */}
          <TouchableOpacity 
            style={[styles.metricCard, activeTab === 'PENDING' && styles.metricCardActivePending]}
            onPress={() => setActiveTab('PENDING')}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>PENDING</Text>
              <Ionicons name="time" size={16} color="#DC6803" />
            </View>
            <Text style={styles.metricValue}>04</Text>
          </TouchableOpacity>

          {/* Approved Card */}
          <TouchableOpacity 
            style={[styles.metricCard, activeTab === 'APPROVED' && styles.metricCardActiveApproved]}
            onPress={() => setActiveTab('APPROVED')}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>APPROVED</Text>
              <Ionicons name="checkmark-circle" size={16} color="#039855" />
            </View>
            <Text style={styles.metricValue}>24</Text>
          </TouchableOpacity>

          {/* Rejected Card */}
          <TouchableOpacity 
            style={[styles.metricCard, activeTab === 'REJECTED' && styles.metricCardActiveRejected]}
            onPress={() => setActiveTab('REJECTED')}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>REJECTED</Text>
              <Ionicons name="close-circle" size={16} color="#D92D20" />
            </View>
            <Text style={styles.metricValue}>03</Text>
          </TouchableOpacity>
        </View>

        {/* Section Header[cite: 46, 47] */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {activeTab === 'PENDING' ? '4 NEW' : activeTab === 'APPROVED' ? '24 RECENT' : '03 RECENT'}
              </Text>
            </View>
          </View>
          <TouchableOpacity>
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Requests List[cite: 46, 47, 48] */}
        {displayedRequests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            
            <View style={styles.requestHeaderRow}>
              <View style={styles.studentInfo}>
                <View style={[styles.initialsCircle, { backgroundColor: activeTab === 'PENDING' ? '#EEF2F6' : '#F9FAFB' }]}>
                  <Text style={styles.initialsText}>{request.initials}</Text>
                </View>
                <View>
                  <Text style={styles.studentName}>{request.name}</Text>
                  <Text style={styles.studentId}>{request.studentId}</Text>
                </View>
              </View>

              {/* Dynamic Badge based on status[cite: 46, 47, 48] */}
              <View style={[
                styles.typeBadge, 
                activeTab === 'APPROVED' ? styles.typeBadgeApproved : 
                activeTab === 'REJECTED' ? styles.typeBadgeRejected : 
                (request.type === 'GROUP ISSUE' || request.type === 'SWAP REQUEST') ? styles.typeBadgeSecondary : {}
              ]}>
                <Text style={[
                  styles.typeBadgeText,
                  activeTab === 'APPROVED' ? styles.typeBadgeTextApproved : 
                  activeTab === 'REJECTED' ? styles.typeBadgeTextRejected : 
                  (request.type === 'GROUP ISSUE' || request.type === 'SWAP REQUEST') ? styles.typeBadgeTextSecondary : {}
                ]}>
                  {request.type}
                </Text>
              </View>
            </View>

            <View style={styles.requestBodyRow}>
              <View style={styles.courseDetails}>
                <Text style={styles.courseTitle}>{request.course}</Text>
                <Text style={styles.courseSubtitle}>{request.date} • {request.details}</Text>
              </View>
              
              {/* Dynamic Button based on status[cite: 46, 47, 48] */}
              <TouchableOpacity 
                style={activeTab === 'PENDING' ? styles.primaryButton : styles.secondaryButton}
                onPress={() => handleReviewPress(request.id)}
              >
                <Text style={activeTab === 'PENDING' ? styles.primaryButtonText : styles.secondaryButtonText}>
                  {activeTab === 'PENDING' ? 'Review' : 'Details'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  // Header[cite: 46]
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2F6', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { color: '#4A3AFF', fontWeight: 'bold', fontSize: 14 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#12B76A', position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#FFFFFF' },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Banner[cite: 46]
  banner: { backgroundColor: '#4A3AFF', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  bannerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  bannerSubtitle: { color: '#E0DFFF', fontSize: 13 },

  // Summary Metrics[cite: 46, 47, 48]
  metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  metricCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginHorizontal: 4, borderWidth: 1, borderColor: '#EAECF0', elevation: 1 },
  metricCardActivePending: { borderColor: '#F79009', borderWidth: 1.5 },
  metricCardActiveApproved: { borderColor: '#12B76A', borderWidth: 1.5 },
  metricCardActiveRejected: { borderColor: '#F04438', borderWidth: 1.5 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricLabel: { fontSize: 11, fontWeight: '600', color: '#667085' },
  metricValue: { fontSize: 24, fontWeight: '700', color: '#101828' },

  // Section Header[cite: 46]
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#101828', marginRight: 8 },
  countBadge: { backgroundColor: '#EEF2F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { color: '#4A3AFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  filterText: { color: '#4A3AFF', fontSize: 14, fontWeight: '600' },

  // Request Cards[cite: 46, 47, 48]
  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EAECF0', elevation: 1 },
  requestHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  studentInfo: { flexDirection: 'row', alignItems: 'center' },
  initialsCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  initialsText: { color: '#4A3AFF', fontWeight: 'bold', fontSize: 14 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#101828' },
  studentId: { fontSize: 13, color: '#667085', marginTop: 2 },
  
  // Badges[cite: 46, 47, 48]
  typeBadge: { backgroundColor: '#FFFAEB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  typeBadgeText: { color: '#B54708', fontSize: 10, fontWeight: '700' },
  typeBadgeSecondary: { backgroundColor: '#EEF2F6' },
  typeBadgeTextSecondary: { color: '#4A3AFF' },
  typeBadgeApproved: { backgroundColor: '#ECFDF3' },
  typeBadgeTextApproved: { color: '#027A48' },
  typeBadgeRejected: { backgroundColor: '#FEF3F2' },
  typeBadgeTextRejected: { color: '#B42318' },

  // Body and Buttons[cite: 46, 47]
  requestBodyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  courseDetails: { flex: 1, paddingRight: 12 },
  courseTitle: { fontSize: 14, fontWeight: '600', color: '#344054', marginBottom: 4 },
  courseSubtitle: { fontSize: 12, color: '#667085' },
  
  primaryButton: { backgroundColor: '#4A3AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  secondaryButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  secondaryButtonText: { color: '#344054', fontSize: 13, fontWeight: '600' },
});
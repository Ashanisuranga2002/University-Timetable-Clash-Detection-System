import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getAllRequests } from '@/services/advisorService';
import { fetchAdvisorCourseDeletionRequestsApi } from '@/services/api';

export default function AdvisorRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'TIMETABLE' | 'COURSE_REMOVAL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const [normalResponse, deletionResponse] = await Promise.all([
        getAllRequests(),
        fetchAdvisorCourseDeletionRequestsApi(),
      ]);

      const normalRequests = Array.isArray(normalResponse)
        ? normalResponse
        : normalResponse?.requests || normalResponse?.data || [];
      const deletionList = Array.isArray(deletionResponse)
        ? deletionResponse
        : deletionResponse?.requests || deletionResponse?.data || [];

      const deletionRequests = deletionList.map((item: any) => ({
        ...item,
        _id: `course-deletion-${item._id}`,
        deletionRequestId: item._id,
        requestType: 'COURSE_DELETION',
        workflowStatus: item.status === 'PENDING' ? 'PENDING_ADVISOR' : item.status,
        courseCode: item.courseId?.courseCode || 'Course Removal',
        requestedGroup: 'Course deletion request',
        conflictDetails: item.reason || 'Student requested course removal',
      }));

      setRequests([...normalRequests, ...deletionRequests]);
    } catch (error) {
      console.warn('Failed to load advisor requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadRequests(); }, [loadRequests]));

  const review = (request: any) => {
    if (request.requestType === 'COURSE_DELETION') {
      router.push({ pathname: '/Advisor/review-course-deletion', params: { requestData: JSON.stringify(request) } });
      return;
    }
    router.push({ pathname: '/Advisor/review-request', params: { requestData: JSON.stringify(request) } });
  };

  const pendingCount = requests.filter((request) => request.workflowStatus === 'PENDING_ADVISOR').length;
  const visibleRequests = requests.filter((request) => {
    if (activeTab === 'COURSE_REMOVAL') return request.requestType === 'COURSE_DELETION';
    if (activeTab === 'TIMETABLE') return request.requestType !== 'COURSE_DELETION';
    return true;
  });
  const pendingRemovalCount = requests.filter(
    (request) => request.requestType === 'COURSE_DELETION' && request.workflowStatus === 'PENDING_ADVISOR'
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Request Management</Text>
        <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{pendingCount} PENDING</Text></View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} />}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}><Ionicons name="document-text-outline" size={24} color="#4A3AFF" /></View>
          <View>
            <Text style={styles.summaryTitle}>Student Requests</Text>
            <Text style={styles.summaryText}>Review timetable and course-removal requests.</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ALL' && styles.tabActive]}
            onPress={() => setActiveTab('ALL')}
          >
            <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'TIMETABLE' && styles.tabActive]}
            onPress={() => setActiveTab('TIMETABLE')}
          >
            <Text style={[styles.tabText, activeTab === 'TIMETABLE' && styles.tabTextActive]}>Timetable</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'COURSE_REMOVAL' && styles.tabActive]}
            onPress={() => setActiveTab('COURSE_REMOVAL')}
          >
            <Text style={[styles.tabText, activeTab === 'COURSE_REMOVAL' && styles.tabTextActive]}>
              Course Removal {pendingRemovalCount > 0 ? `(${pendingRemovalCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="large" color="#4A3AFF" style={styles.loader} /> : null}
        {!loading && visibleRequests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {activeTab === 'COURSE_REMOVAL' ? 'No course-removal requests' : 'No requests'}
            </Text>
            <Text style={styles.emptyText}>New student requests will appear here.</Text>
          </View>
        ) : null}

        {!loading && visibleRequests.map((request) => {
          const isPending = request.workflowStatus === 'PENDING_ADVISOR';
          const isDeletion = request.requestType === 'COURSE_DELETION';
          return (
            <View key={request._id} style={styles.requestCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.requestIcon}>
                  <Ionicons name={isDeletion ? 'trash-outline' : 'calendar-outline'} size={19} color={isDeletion ? '#B42318' : '#4A3AFF'} />
                </View>
                <View style={styles.requestHeading}>
                  <Text style={styles.courseCode}>{request.courseCode || 'Student Request'}</Text>
                  <Text style={styles.studentId}>Student: {request.studentId}</Text>
                </View>
                <View style={[styles.statusBadge, isPending ? styles.pending : styles.completed]}>
                  <Text style={[styles.statusText, isPending ? styles.pendingText : styles.completedText]}>{isPending ? 'PENDING' : request.status || 'PROCESSED'}</Text>
                </View>
              </View>
              <Text style={styles.requestType}>{isDeletion ? 'Course deletion request' : 'Timetable subgroup request'}</Text>
              <Text style={styles.reason}>{request.conflictDetails || request.reason || 'No additional details.'}</Text>
              <TouchableOpacity style={styles.reviewButton} onPress={() => review(request)}>
                <Text style={styles.reviewText}>{isPending ? 'Review Request' : 'View Details'}</Text>
                <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EAECF0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#101828' },
  headerBadge: { backgroundColor: '#EEF2FF', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  headerBadgeText: { color: '#4A3AFF', fontSize: 10, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 36 },
  summaryCard: { backgroundColor: '#4A3AFF', borderRadius: 16, padding: 17, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  summaryIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  summaryTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  summaryText: { color: '#E0DFFF', fontSize: 12.5, marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: '#EEF2F6', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 },
  tab: { flex: 1, minHeight: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#101828', shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
  tabText: { color: '#667085', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  tabTextActive: { color: '#4A3AFF' },
  loader: { marginTop: 50 },
  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EAECF0' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  requestIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F2F4F7', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  requestHeading: { flex: 1 },
  courseCode: { color: '#101828', fontSize: 15, fontWeight: '800' },
  studentId: { color: '#667085', fontSize: 12, marginTop: 3 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  pending: { backgroundColor: '#FFFAEB' },
  completed: { backgroundColor: '#ECFDF3' },
  statusText: { fontSize: 10, fontWeight: '800' },
  pendingText: { color: '#B54708' },
  completedText: { color: '#027A48' },
  requestType: { color: '#344054', fontSize: 13, fontWeight: '700', marginTop: 14 },
  reason: { color: '#667085', fontSize: 13, lineHeight: 19, marginTop: 5 },
  reviewButton: { marginTop: 14, minHeight: 44, borderRadius: 10, backgroundColor: '#4A3AFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  reviewText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { color: '#101828', fontSize: 18, fontWeight: '800' },
  emptyText: { color: '#667085', fontSize: 13, marginTop: 8 },
});

import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { BottomAdminTabs } from '@/components/admin/BottomAdminTabs';
import {
  approveCourseDeletionRequestApi,
  fetchAdminCourseDeletionRequestsApi,
  rejectCourseDeletionRequestApi,
} from '@/services/api';
import { AC, AS } from '@/constants/adminTheme';

type DeletionRequest = {
  _id: string;
  studentId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  courseId?: { courseCode?: string; courseName?: string };
};

export default function CourseDeletionRequestsScreen() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      const response = await fetchAdminCourseDeletionRequestsApi();
      const nextRequests = Array.isArray(response)
        ? response
        : response?.requests || response?.data || [];
      setRequests(nextRequests);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to load deletion requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const decide = async (request: DeletionRequest, decision: 'approve' | 'reject') => {
    const raw = await AsyncStorage.getItem('current_admin_user');
    let adminId = 'administrator';
    try {
      adminId = raw ? JSON.parse(raw).adminId || JSON.parse(raw).userId || adminId : adminId;
    } catch {}

    try {
      if (decision === 'approve') {
        await approveCourseDeletionRequestApi(request._id, adminId, 'Approved by administrator');
      } else {
        await rejectCourseDeletionRequestApi(request._id, adminId, 'Request rejected by administrator');
      }
      await loadRequests();
      Alert.alert('Updated', `Request ${decision === 'approve' ? 'approved' : 'rejected'}.`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to update request');
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Course Removal Requests" showBack />
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={loadRequests}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No removal requests</Text>
            <Text style={styles.emptyText}>Student course removal requests will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.courseCode}>{item.courseId?.courseCode || 'Course'}</Text>
                <Text style={styles.courseName}>{item.courseId?.courseName || 'Unknown course'}</Text>
              </View>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Text style={styles.student}>Student: {item.studentId}</Text>
            <Text style={styles.reason}>{item.reason}</Text>
            {item.status === 'PENDING' ? (
              <View style={styles.actions}>
                <Pressable style={styles.rejectButton} onPress={() => decide(item, 'reject')}>
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
                <Pressable style={styles.approveButton} onPress={() => decide(item, 'approve')}>
                  <Text style={styles.approveText}>Approve Removal</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      />
      <BottomAdminTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AC.bgApp },
  content: { padding: AS.screenH, paddingBottom: 32, gap: 12 },
  card: { backgroundColor: AC.bgCard, borderRadius: 16, borderWidth: 1, borderColor: AC.border, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  courseCode: { color: AC.textPrimary, fontSize: 17, fontWeight: '800' },
  courseName: { color: AC.textSecondary, fontSize: 13, marginTop: 3 },
  status: { color: '#B54708', fontSize: 11, fontWeight: '800' },
  student: { color: AC.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 14 },
  reason: { color: AC.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  rejectButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#FEF3F2', alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: '#B42318', fontWeight: '800' },
  approveButton: { flex: 1.5, minHeight: 44, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  approveText: { color: '#FFFFFF', fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { color: AC.textPrimary, fontSize: 18, fontWeight: '800' },
  emptyText: { color: AC.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 8 },
});

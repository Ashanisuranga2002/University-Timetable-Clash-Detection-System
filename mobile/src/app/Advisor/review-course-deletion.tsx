import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  approveAdvisorCourseDeletionRequestApi,
  rejectAdvisorCourseDeletionRequestApi,
} from '@/services/api';

export default function ReviewCourseDeletionScreen() {
  const router = useRouter();
  const { requestData } = useLocalSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState('');
  const [advisorId, setAdvisorId] = useState('ADV001');

  const request = useMemo(() => {
    try {
      return requestData ? JSON.parse(requestData as string) : null;
    } catch {
      return null;
    }
  }, [requestData]);

  useEffect(() => {
    AsyncStorage.getItem('current_admin_user').then((raw) => {
      if (!raw) return;
      try {
        const user = JSON.parse(raw);
        setAdvisorId(user.adminId || user.userId || 'ADV001');
      } catch {}
    });
  }, []);

  const handleDecision = async (decision: 'approve' | 'reject') => {
    if (!request?.deletionRequestId) return;
    setSubmitting(true);
    try {
      if (decision === 'approve') {
        await approveAdvisorCourseDeletionRequestApi(
          request.deletionRequestId,
          advisorId,
          comments || 'Course removal approved by advisor.'
        );
      } else {
        await rejectAdvisorCourseDeletionRequestApi(
          request.deletionRequestId,
          advisorId,
          comments || 'Course removal rejected by advisor.'
        );
      }
      Alert.alert('Success', `Course removal request ${decision === 'approve' ? 'approved' : 'rejected'}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to process this request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Request data is unavailable.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const course = request.courseId || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Removal Review</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>PENDING</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>STUDENT REQUEST</Text>
          <Text style={styles.studentId}>{request.studentId}</Text>
          <Text style={styles.courseCode}>{course.courseCode || request.courseCode}</Text>
          <Text style={styles.courseName}>{course.courseName || 'Registered course'}</Text>

          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>REASON</Text>
            <Text style={styles.reasonText}>{request.reason || request.conflictDetails}</Text>
          </View>

          <Text style={styles.sectionLabel}>ADVISOR NOTES</Text>
          <TextInput
            value={comments}
            onChangeText={setComments}
            placeholder="Add a decision note..."
            placeholderTextColor="#98A2B3"
            multiline
            style={styles.notesInput}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleDecision('reject')}
              disabled={submitting}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleDecision('approve')}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.approveText}>Approve Removal</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFFFFF' },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#101828' },
  pendingBadge: { backgroundColor: '#FFFAEB', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  pendingText: { color: '#B54708', fontSize: 10, fontWeight: '800' },
  content: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#EAECF0' },
  sectionLabel: { color: '#667085', fontSize: 11, fontWeight: '800', letterSpacing: 0.7, marginBottom: 8, marginTop: 4 },
  studentId: { color: '#4A3AFF', fontSize: 16, fontWeight: '800', marginBottom: 18 },
  courseCode: { color: '#101828', fontSize: 20, fontWeight: '800' },
  courseName: { color: '#475467', fontSize: 14, marginTop: 4, marginBottom: 18 },
  reasonBox: { backgroundColor: '#FEF3F2', borderRadius: 12, padding: 14, marginBottom: 18 },
  reasonLabel: { color: '#B42318', fontSize: 11, fontWeight: '800', marginBottom: 5 },
  reasonText: { color: '#7A271A', fontSize: 14, lineHeight: 20 },
  notesInput: { minHeight: 110, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, padding: 12, color: '#101828', textAlignVertical: 'top', marginBottom: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  rejectButton: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: '#FEF3F2', alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: '#B42318', fontWeight: '800' },
  approveButton: { flex: 1.5, minHeight: 48, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  approveText: { color: '#FFFFFF', fontWeight: '800' },
  errorText: { textAlign: 'center', marginTop: 120, color: '#475467' },
  backButton: { alignSelf: 'center', marginTop: 20, backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  backButtonText: { color: '#FFFFFF', fontWeight: '800' },
});

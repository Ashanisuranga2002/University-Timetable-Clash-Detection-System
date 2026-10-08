import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FooterTab } from '@/components/FooterTab';
import {
  deleteStudentRequestApi,
  fetchStudentRequestsApi,
  updateStudentRequestApi,
} from '@/services/api';

type StudentRequest = {
  _id: string;
  courseCode: string;
  currentGroup: string;
  requestedGroup: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdAt?: string;
};

export default function StudentRequestsScreen() {
  const { studentId: studentIdParam } = useLocalSearchParams();
  const studentId = (studentIdParam as string) || 'IT21047138';
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingRequest, setEditingRequest] = useState<StudentRequest | null>(null);
  const [requestedGroup, setRequestedGroup] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRequests = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await fetchStudentRequestsApi(studentId);
      const list = Array.isArray(response) ? response : response?.requests || [];
      setRequests(list);
    } catch (error: any) {
      Alert.alert('Unable to load requests', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  useFocusEffect(useCallback(() => {
    loadRequests();
  }, [loadRequests]));

  const openEditor = (request: StudentRequest) => {
    setEditingRequest(request);
    setRequestedGroup(request.requestedGroup || '');
    setReason(request.reason || '');
  };

  const saveChanges = async () => {
    if (!editingRequest) return;
    if (!requestedGroup.trim() || !reason.trim()) {
      Alert.alert('Required fields', 'Enter the requested subgroup and a reason.');
      return;
    }
    setSaving(true);
    try {
      const response = await updateStudentRequestApi(
        editingRequest._id,
        studentId,
        requestedGroup.trim(),
        reason.trim(),
      );
      if (!response?.request) throw new Error(response?.message || 'The request could not be updated.');
      setEditingRequest(null);
      await loadRequests(true);
    } catch (error: any) {
      Alert.alert('Unable to update request', error?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRequest = (request: StudentRequest) => {
    Alert.alert(
      'Delete request?',
      `Your ${request.courseCode} subgroup request will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudentRequestApi(request._id, studentId);
              setRequests(current => current.filter(item => item._id !== request._id));
            } catch (error: any) {
              Alert.alert('Unable to delete request', error?.message || 'Please try again.');
            }
          },
        },
      ],
    );
  };

  const statusStyle = (status: string) => {
    if (status === 'APPROVED') return styles.approvedBadge;
    if (status === 'REJECTED') return styles.rejectedBadge;
    return styles.pendingBadge;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Requests</Text>
          <Text style={styles.subtitle}>Track and manage your advisor requests</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={() => loadRequests(true)} accessibilityLabel="Refresh requests">
          <Ionicons name="refresh" size={20} color="#4A3AFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4A3AFF" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRequests(true)} tintColor="#4A3AFF" />}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}><Ionicons name="document-text-outline" size={20} color="#4A3AFF" /></View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryTitle}>{requests.length} {requests.length === 1 ? 'request' : 'requests'}</Text>
              <Text style={styles.summarySubtitle}>Pending requests can be edited or deleted.</Text>
            </View>
          </View>

          {requests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="file-tray-outline" size={36} color="#98A2B3" />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyText}>Alternative subgroup requests you submit will appear here.</Text>
            </View>
          ) : requests.map(request => {
            const isPending = request.status === 'PENDING';
            return (
              <View key={request._id} style={styles.requestCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.courseBadge}><Text style={styles.courseBadgeText}>{request.courseCode}</Text></View>
                  <View style={[styles.statusBadge, statusStyle(request.status)]}>
                    <Text style={styles.statusText}>{request.status || 'PENDING'}</Text>
                  </View>
                </View>
                <Text style={styles.groupChange}>{request.currentGroup || 'Current group'} <Ionicons name="arrow-forward" size={14} color="#667085" /> {request.requestedGroup}</Text>
                <Text style={styles.reasonLabel}>Reason</Text>
                <Text style={styles.reasonText}>{request.reason}</Text>
                {request.createdAt ? <Text style={styles.dateText}>{new Date(request.createdAt).toLocaleDateString()}</Text> : null}

                {isPending ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.editButton} onPress={() => openEditor(request)}>
                      <Ionicons name="create-outline" size={17} color="#4A3AFF" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteRequest(request)}>
                      <Ionicons name="trash-outline" size={17} color="#D92D20" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.lockedText}>This request can no longer be changed.</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      <FooterTab active="requests" studentId={studentId} role="student" />

      <Modal visible={!!editingRequest} transparent animationType="slide" onRequestClose={() => setEditingRequest(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Request</Text>
              <TouchableOpacity onPress={() => setEditingRequest(null)} accessibilityLabel="Close editor">
                <Ionicons name="close" size={24} color="#667085" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Requested subgroup</Text>
            <TextInput value={requestedGroup} onChangeText={setRequestedGroup} style={styles.input} placeholder="e.g. Group C" />
            <Text style={styles.inputLabel}>Reason</Text>
            <TextInput value={reason} onChangeText={setReason} style={[styles.input, styles.reasonInput]} multiline textAlignVertical="top" placeholder="Explain your request" />
            <TouchableOpacity style={[styles.saveButton, saving && styles.disabledButton]} onPress={saveChanges} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EAECF0' },
  title: { color: '#101828', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#667085', fontSize: 13, marginTop: 4 },
  refreshButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F3FF', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 20, flexGrow: 1 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderColor: '#E0E7FF', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: '#3730A3', fontSize: 15, fontWeight: '700' },
  summarySubtitle: { color: '#4338CA', fontSize: 12, marginTop: 3 },
  emptyCard: { flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderColor: '#EAECF0', borderWidth: 1, borderRadius: 16, padding: 24 },
  emptyTitle: { color: '#101828', fontSize: 17, fontWeight: '700', marginTop: 12 },
  emptyText: { color: '#667085', fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6 },
  requestCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAECF0', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  courseBadge: { backgroundColor: '#F2F4F7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  courseBadgeText: { color: '#344054', fontWeight: '700', fontSize: 12 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pendingBadge: { backgroundColor: '#FFFAEB' },
  approvedBadge: { backgroundColor: '#ECFDF3' },
  rejectedBadge: { backgroundColor: '#FEF3F2' },
  statusText: { color: '#475467', fontWeight: '700', fontSize: 10 },
  groupChange: { color: '#101828', fontSize: 15, fontWeight: '700', marginTop: 14 },
  reasonLabel: { color: '#667085', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 14 },
  reasonText: { color: '#475467', fontSize: 13, lineHeight: 19, marginTop: 4 },
  dateText: { color: '#98A2B3', fontSize: 11, marginTop: 10 },
  actionsRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#F2F4F7', marginTop: 14, paddingTop: 12 },
  editButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#D9D6FE', borderRadius: 10, paddingVertical: 10 },
  editButtonText: { color: '#4A3AFF', fontSize: 13, fontWeight: '700' },
  deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#FECDCA', borderRadius: 10, paddingVertical: 10 },
  deleteButtonText: { color: '#D92D20', fontSize: 13, fontWeight: '700' },
  lockedText: { color: '#98A2B3', fontSize: 12, marginTop: 14 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16, 24, 40, 0.45)' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { color: '#101828', fontSize: 18, fontWeight: '700' },
  inputLabel: { color: '#344054', fontSize: 13, fontWeight: '600', marginBottom: 7, marginTop: 10 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#D0D5DD', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, color: '#101828', fontSize: 14 },
  reasonInput: { minHeight: 100 },
  saveButton: { height: 50, borderRadius: 11, backgroundColor: '#4A3AFF', alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  disabledButton: { opacity: 0.65 },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

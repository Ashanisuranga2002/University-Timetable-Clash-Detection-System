import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  approveRequest, 
  rejectRequest, 
  createReviewDraft, 
  updateReviewDraft, 
  deleteReviewDraft,
  getReviewByRequestId
} from '@/services/advisorService';

export default function ReviewRequestScreen() {
  const router = useRouter();
  const { requestData } = useLocalSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  
  const [comments, setComments] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);

  let request: any = null;
  if (requestData) {
    try {
      request = JSON.parse(requestData as string);
    } catch (e) {
      console.warn("Failed to parse request data");
    }
  }

  useEffect(() => {
    if (request && request._id) {
      loadDraft();
    } else {
      setLoadingDraft(false);
    }
  }, []);

  const loadDraft = async () => {
    try {
      const draft = await getReviewByRequestId(request._id);
      if (draft && draft.reviewStatus === 'DRAFT') {
        setDraftId(draft._id);
        setComments(draft.comments || '');
      } else if (draft && draft.reviewStatus === 'SUBMITTED') {
        // Just show the submitted comments
        setComments(draft.comments || '');
      }
    } catch (error) {
      // It's normal for it to return 404 if no draft exists
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      if (draftId) {
        await updateReviewDraft(draftId, comments, 'PENDING');
        Alert.alert('Saved', 'Your draft has been updated.');
      } else {
        const response = await createReviewDraft(request._id, 'ADV-01', comments);
        if (response && response.review && response.review._id) {
          setDraftId(response.review._id);
        }
        Alert.alert('Saved', 'A new draft has been saved.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!draftId) return;
    setSubmitting(true);
    try {
      await deleteReviewDraft(draftId);
      setDraftId(null);
      setComments('');
      Alert.alert('Deleted', 'Draft has been removed.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    setSubmitting(true);
    try {
      if (decision === 'APPROVED') {
        await approveRequest(request._id, 'ADV-01', comments || 'Request Approved');
      } else {
        await rejectRequest(request._id, 'ADV-01', comments || 'Request Rejected');
      }
      
      Alert.alert('Success', `Request has been ${decision.toLowerCase()} successfully.`);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!request) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Error: Request data not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 10, backgroundColor: '#4A3AFF', borderRadius: 8 }}>
          <Text style={{ color: '#FFF' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const getInitials = (id: string) => {
    if (!id) return 'ST';
    return id.substring(0, 2).toUpperCase();
  };

  const isPending = request.status === 'PENDING';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#101828" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Request</Text>
          <View style={[styles.actionBadge, !isPending && { backgroundColor: '#ECFDF3' }]}>
            <Text style={[styles.actionBadgeText, !isPending && { color: '#027A48' }]}>
              {isPending ? 'ACTION REQUIRED' : request.status}
            </Text>
          </View>
        </View>

        {loadingDraft ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4A3AFF" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* Reassignment Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TIMETABLE REASSIGNMENT</Text>
              <View style={styles.exchangeBadge}>
                <Text style={styles.exchangeBadgeText}>SLOT EXCHANGE</Text>
              </View>
            </View>

            {/* Comparison Cards */}
            <View style={styles.comparisonContainer}>
              {/* Current Card (Red/Clash) */}
              <View style={[styles.compareCard, styles.currentCard]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardLabel, { color: '#B42318' }]}>CURRENT</Text>
                  <View style={styles.clashBadge}>
                    <Text style={styles.clashBadgeText}>CLASH</Text>
                  </View>
                </View>
                <Text style={styles.courseText}>{request.courseCode} • {request.currentGroup}</Text>
                <Text style={styles.timeText}>Currently Allocated</Text>
                <View style={styles.statusRow}>
                  <View style={styles.redDot} />
                  <Text style={styles.overlapText}>{request.conflictDetails || 'Timetable Conflict'}</Text>
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
                <Text style={styles.courseText}>{request.courseCode} • {request.requestedGroup}</Text>
                <Text style={styles.timeText}>Requested Swap</Text>
                <View style={styles.statusRow}>
                  <Ionicons name="checkmark" size={14} color="#027A48" />
                  <Text style={styles.noConflictText}>No Conflict</Text>
                </View>
              </View>
            </View>

            {/* Student Details Card */}
            <View style={styles.detailsCard}>
              <View style={styles.studentHeader}>
                <View style={styles.studentInfoRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(request.studentId)}</Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{request.studentId}</Text>
                    <Text style={styles.studentId}>Student ID</Text>
                  </View>
                </View>
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>STUDENT</Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>TARGET COURSE MODULE</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValueText}>
                  <Text style={{ fontWeight: '700' }}>{request.courseCode}</Text>
                </Text>
              </View>

              <Text style={styles.fieldLabel}>STUDENT'S STATED REASON</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.reasonText}>
                  {request.reason}
                </Text>
              </View>
            </View>

            {/* Advisor Notes Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{isPending ? 'ADVISOR NOTES (DRAFT)' : 'ADVISOR NOTES'}</Text>
              {draftId && isPending && (
                <TouchableOpacity onPress={handleDeleteDraft} disabled={submitting}>
                  <Text style={{ color: '#D92D20', fontSize: 12, fontWeight: '600' }}>Delete Draft</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.draftContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Add internal notes or feedback for the student..."
                multiline
                numberOfLines={4}
                value={comments}
                onChangeText={setComments}
                editable={isPending && !submitting}
                textAlignVertical="top"
              />
              {isPending && (
                <View style={styles.draftActions}>
                  <TouchableOpacity 
                    style={styles.saveDraftButton} 
                    onPress={handleSaveDraft}
                    disabled={submitting}
                  >
                    <Ionicons name="save-outline" size={16} color="#344054" style={{ marginRight: 6 }} />
                    <Text style={styles.saveDraftText}>Save Draft</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {isPending && (
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.rejectButton} 
                  onPress={() => handleDecision('REJECTED')}
                  disabled={submitting}
                >
                  <Ionicons name="close" size={20} color="#D92D20" style={{ marginRight: 8 }} />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.approveButton} 
                  onPress={() => handleDecision('APPROVED')}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
  actionBadge: { backgroundColor: '#FFFAEB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  actionBadgeText: { color: '#B54708', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#667085', letterSpacing: 1 },
  exchangeBadge: { backgroundColor: '#EEF2F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  exchangeBadgeText: { color: '#4A3AFF', fontSize: 10, fontWeight: '700' },

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

  // Drafts Section
  draftContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0', padding: 12, marginBottom: 24 },
  textInput: { fontSize: 14, color: '#101828', minHeight: 80, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EAECF0', marginBottom: 12 },
  draftActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  saveDraftButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F4F7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveDraftText: { color: '#344054', fontSize: 13, fontWeight: '600' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rejectButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FEE4E2', backgroundColor: '#FFFFFF', marginRight: 8 },
  rejectButtonText: { color: '#D92D20', fontSize: 16, fontWeight: '600' },
  approveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, backgroundColor: '#12B76A', marginLeft: 8 },
  approveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
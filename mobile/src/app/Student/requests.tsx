import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FooterTab } from '@/components/FooterTab';
import {
  deleteStudentRequestApi,
  fetchStudentRequestsApi,
  updateStudentRequestApi,
} from '@/services/api';

type StudentRequest = {
  _id: string;
  studentId?: string;
  courseCode: string;
  currentGroup: string;
  requestedGroup: string;
  conflictDetails?: string;
  conflictDay?: string;
  conflictStartTime?: string;
  conflictEndTime?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  requestType?: 'COORDINATOR_CHANGE' | 'ADVISOR_APPROVAL' | string;
  workflowStatus?: string;
  lastDecision?: string;
  advisorId?: string;
  advisorNotes?: string;
  coordinatorId?: string;
  coordinatorNotes?: string;
  proposedDay?: string;
  proposedStartTime?: string;
  proposedEndTime?: string;
  proposedVenue?: string;
  createdAt?: string;
  updatedAt?: string;
};

type FilterType = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function StudentRequestsScreen() {
  const router = useRouter();
  const { studentId: studentIdParam } = useLocalSearchParams();
  const [sessionUser, setSessionUser] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('current_student_user').then((raw) => {
      if (raw) {
        try {
          setSessionUser(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const studentId =
    (studentIdParam as string) ||
    sessionUser?.studentId ||
    sessionUser?.userId ||
    'IT22334455';

  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('ALL');

  // Modals
  const [viewingRequest, setViewingRequest] = useState<StudentRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<StudentRequest | null>(null);
  const [requestedGroup, setRequestedGroup] = useState('');
  const [reason, setReason] = useState('');
  const [conflictDetails, setConflictDetails] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRequests = useCallback(
    async (refresh = false) => {
      if (!studentId) return;
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
    },
    [studentId]
  );

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const isRequestPending = (req: StudentRequest) => {
    return (
      req.status === 'PENDING' &&
      req.lastDecision !== 'APPROVED' &&
      req.lastDecision !== 'REJECTED'
    );
  };

  const isRequestApproved = (req: StudentRequest) => {
    return req.status === 'APPROVED' || req.lastDecision === 'APPROVED';
  };

  const isRequestRejected = (req: StudentRequest) => {
    return req.lastDecision === 'REJECTED' || (req.status === 'REJECTED' && req.lastDecision !== 'APPROVED');
  };

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    requests.forEach((r) => {
      if (isRequestApproved(r)) approved++;
      else if (isRequestRejected(r)) rejected++;
      else pending++;
    });
    return { all: requests.length, pending, approved, rejected };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (filter === 'PENDING') return requests.filter(isRequestPending);
    if (filter === 'APPROVED') return requests.filter(isRequestApproved);
    if (filter === 'REJECTED') return requests.filter(isRequestRejected);
    return requests;
  }, [requests, filter]);

  const openViewer = (request: StudentRequest) => {
    setViewingRequest(request);
  };

  const openEditor = (request: StudentRequest) => {
    setEditingRequest(request);
    setRequestedGroup(request.requestedGroup || '');
    setReason(request.reason || '');
    setConflictDetails(request.conflictDetails || '');
  };

  const saveChanges = async () => {
    if (!editingRequest) return;
    if (!requestedGroup.trim() || !reason.trim()) {
      Alert.alert('Required fields', 'Please enter the requested subgroup and a reason.');
      return;
    }
    setSaving(true);
    try {
      const response = await updateStudentRequestApi(
        editingRequest._id,
        studentId,
        requestedGroup.trim(),
        reason.trim(),
        conflictDetails.trim()
      );
      if (!response?.request) {
        throw new Error(response?.message || 'The request could not be updated.');
      }

      // Update state locally
      setRequests((current) =>
        current.map((item) =>
          item._id === editingRequest._id ? { ...item, ...response.request } : item
        )
      );

      // If also currently viewing this item in view modal, update it
      if (viewingRequest?._id === editingRequest._id) {
        setViewingRequest((prev) => (prev ? { ...prev, ...response.request } : null));
      }

      setEditingRequest(null);
      Alert.alert('Request Updated', 'Your subgroup request has been successfully updated.');
    } catch (error: any) {
      Alert.alert('Unable to update request', error?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRequest = (request: StudentRequest) => {
    Alert.alert(
      'Delete Request?',
      `Are you sure you want to delete your ${request.courseCode} subgroup request? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Request',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudentRequestApi(request._id, studentId);
              setRequests((current) => current.filter((item) => item._id !== request._id));
              if (viewingRequest?._id === request._id) {
                setViewingRequest(null);
              }
              Alert.alert('Request Deleted', 'Your request has been removed.');
            } catch (error: any) {
              Alert.alert('Unable to delete request', error?.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusBadgeConfig = (request: StudentRequest) => {
    if (isRequestApproved(request)) {
      return {
        label: 'APPROVED',
        bg: '#ECFDF3',
        text: '#027A48',
        border: '#A6F4C5',
        icon: 'checkmark-circle' as const,
      };
    }
    if (isRequestRejected(request)) {
      return {
        label: 'REJECTED',
        bg: '#FEF3F2',
        text: '#B42318',
        border: '#FECDCA',
        icon: 'close-circle' as const,
      };
    }
    if (request.workflowStatus === 'PENDING_COORDINATOR') {
      return {
        label: 'PENDING COORDINATOR',
        bg: '#EFF8FF',
        text: '#175CD3',
        border: '#B2DDFF',
        icon: 'time' as const,
      };
    }
    return {
      label: 'PENDING ADVISOR REVIEW',
      bg: '#FFF8E6',
      text: '#B54708',
      border: '#FEDF89',
      icon: 'hourglass-outline' as const,
    };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Student Requests</Text>
          <Text style={styles.subtitle}>View, update, or cancel your subgroup requests</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.newRequestBtn}
            onPress={() =>
              router.push({
                pathname: '/Student/timetable-preview',
                params: { studentId },
              })
            }
            activeOpacity={0.8}
            accessibilityLabel="New Request"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newRequestBtnText}>New</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadRequests(true)}
            accessibilityLabel="Refresh requests"
          >
            <Ionicons name="refresh" size={18} color="#4A3AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterChipText, filter === 'ALL' && styles.filterChipTextActive]}>
            All ({counts.all})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'PENDING' && styles.filterChipActive]}
          onPress={() => setFilter('PENDING')}
        >
          <Text
            style={[styles.filterChipText, filter === 'PENDING' && styles.filterChipTextActive]}
          >
            Pending ({counts.pending})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'APPROVED' && styles.filterChipActive]}
          onPress={() => setFilter('APPROVED')}
        >
          <Text
            style={[styles.filterChipText, filter === 'APPROVED' && styles.filterChipTextActive]}
          >
            Approved ({counts.approved})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'REJECTED' && styles.filterChipActive]}
          onPress={() => setFilter('REJECTED')}
        >
          <Text
            style={[styles.filterChipText, filter === 'REJECTED' && styles.filterChipTextActive]}
          >
            Rejected ({counts.rejected})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4A3AFF" />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRequests(true)}
              tintColor="#4A3AFF"
            />
          }
        >
          {/* Summary / Tip Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="information-circle" size={22} color="#4A3AFF" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>
                {counts.pending} pending review
              </Text>
              <Text style={styles.summarySubtitle}>
                Requests can be viewed, updated, or deleted anytime before your advisor approves or rejects them.
              </Text>
            </View>
          </View>

          {/* List or Empty State */}
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={36} color="#98A2B3" />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'ALL'
                  ? 'No Requests Submitted Yet'
                  : `No ${filter.toLowerCase()} requests`}
              </Text>
              <Text style={styles.emptyText}>
                When you encounter a timetable conflict, submit an alternative subgroup request from the Timetable page.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() =>
                  router.push({
                    pathname: '/Student/timetable-preview',
                    params: { studentId },
                  })
                }
              >
                <Ionicons name="calendar-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>View Timetable & Resolve Clashes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredRequests.map((request) => {
              const pending = isRequestPending(request);
              const approved = isRequestApproved(request);
              const rejected = isRequestRejected(request);
              const badge = getStatusBadgeConfig(request);

              return (
                <View key={request._id} style={styles.requestCard}>
                  {/* Card Header: Course Code & Status Badge */}
                  <View style={styles.cardHeader}>
                    <View style={styles.courseBadge}>
                      <Ionicons name="book-outline" size={14} color="#344054" style={{ marginRight: 4 }} />
                      <Text style={styles.courseBadgeText}>{request.courseCode}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: badge.bg,
                          borderColor: badge.border,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name={badge.icon}
                        size={12}
                        color={badge.text}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {/* Subgroup Transition */}
                  <View style={styles.transitionBox}>
                    <View style={styles.transitionSubBox}>
                      <Text style={styles.transitionLabel}>CURRENT</Text>
                      <Text style={styles.transitionValue} numberOfLines={1}>
                        {request.currentGroup || 'Enrolled Slot'}
                      </Text>
                    </View>
                    <View style={styles.arrowIconWrap}>
                      <Ionicons name="arrow-forward" size={16} color="#4A3AFF" />
                    </View>
                    <View style={styles.transitionSubBox}>
                      <Text style={styles.transitionLabel}>REQUESTED</Text>
                      <Text style={[styles.transitionValue, styles.requestedValue]} numberOfLines={1}>
                        {request.requestedGroup}
                      </Text>
                    </View>
                  </View>

                  {/* Conflict Context (if any) */}
                  {request.conflictDetails ? (
                    <View style={styles.conflictInfoRow}>
                      <Ionicons name="alert-circle-outline" size={14} color="#D92D20" />
                      <Text style={styles.conflictInfoText} numberOfLines={2}>
                        {request.conflictDetails}
                      </Text>
                    </View>
                  ) : null}

                  {/* Proposed Slot Info */}
                  {request.proposedDay ? (
                    <View style={styles.proposedSlotRow}>
                      <Ionicons name="calendar-outline" size={14} color="#475467" />
                      <Text style={styles.proposedSlotText}>
                        Slot: {request.proposedDay} {request.proposedStartTime}–{request.proposedEndTime}
                        {request.proposedVenue ? ` (${request.proposedVenue})` : ''}
                      </Text>
                    </View>
                  ) : null}

                  {/* Reason Snippet */}
                  <View style={styles.reasonBlock}>
                    <Text style={styles.reasonLabel}>REASON</Text>
                    <Text style={styles.reasonText} numberOfLines={3}>
                      {request.reason}
                    </Text>
                  </View>

                  {/* Submission date */}
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={13} color="#98A2B3" />
                    <Text style={styles.metaText}>
                      Submitted on{' '}
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recently'}
                    </Text>
                  </View>

                  {/* Outcome Notice if Approved / Rejected */}
                  {approved && (
                    <View style={styles.decisionBannerApproved}>
                      <Ionicons name="checkmark-circle" size={16} color="#027A48" />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.decisionBannerTitleApproved}>
                          Approved by Academic Advisor
                        </Text>
                        <Text style={styles.decisionBannerSubtitleApproved}>
                          Your timetable change has been confirmed.
                        </Text>
                        {request.advisorNotes ? (
                          <Text style={styles.advisorNotesText}>
                            Notes: "{request.advisorNotes}"
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  )}

                  {rejected && (
                    <View style={styles.decisionBannerRejected}>
                      <Ionicons name="close-circle" size={16} color="#B42318" />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.decisionBannerTitleRejected}>
                          Request Rejected by Advisor
                        </Text>
                        <Text style={styles.decisionBannerSubtitleRejected}>
                          {request.advisorNotes
                            ? `Reason: ${request.advisorNotes}`
                            : 'This change could not be approved. Consult your advisor for details.'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Actions Row */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.viewDetailsBtn}
                      onPress={() => openViewer(request)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="eye-outline" size={16} color="#4A3AFF" />
                      <Text style={styles.viewDetailsBtnText}>View Details</Text>
                    </TouchableOpacity>

                    {pending && (
                      <>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => openEditor(request)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="create-outline" size={16} color="#344054" />
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => deleteRequest(request)}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="trash-outline" size={16} color="#D92D20" />
                          <Text style={styles.deleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Footer Tab */}
      <FooterTab active="requests" studentId={studentId} role="student" />

      {/* VIEW DETAILS MODAL */}
      <Modal
        visible={!!viewingRequest}
        transparent
        animationType="slide"
        onRequestClose={() => setViewingRequest(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailsModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderSub}>Request Details</Text>
                <Text style={styles.modalTitle}>
                  {viewingRequest?.courseCode} Subgroup Change
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setViewingRequest(null)}
                style={styles.closeModalBtn}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={22} color="#667085" />
              </TouchableOpacity>
            </View>

            {viewingRequest && (
              <ScrollView style={styles.detailsScrollView} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Status Bar */}
                {(() => {
                  const badge = getStatusBadgeConfig(viewingRequest);
                  return (
                    <View
                      style={[
                        styles.detailStatusRow,
                        { backgroundColor: badge.bg, borderColor: badge.border },
                      ]}
                    >
                      <Ionicons name={badge.icon} size={18} color={badge.text} />
                      <Text style={[styles.detailStatusText, { color: badge.text }]}>
                        Status: {badge.label}
                      </Text>
                    </View>
                  );
                })()}

                {/* Subgroup comparison */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Subgroup Allocation</Text>
                  <View style={styles.detailCompareBox}>
                    <View style={styles.detailCompareCol}>
                      <Text style={styles.detailCompareLabel}>CURRENT GROUP</Text>
                      <Text style={styles.detailCompareVal}>
                        {viewingRequest.currentGroup || 'Current Schedule'}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward-circle" size={24} color="#4A3AFF" />
                    <View style={styles.detailCompareCol}>
                      <Text style={styles.detailCompareLabel}>REQUESTED GROUP</Text>
                      <Text style={[styles.detailCompareVal, { color: '#4A3AFF', fontWeight: '700' }]}>
                        {viewingRequest.requestedGroup}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Conflict Details */}
                {viewingRequest.conflictDetails ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Conflict Reason</Text>
                    <View style={styles.detailInfoBox}>
                      <Ionicons name="alert-circle" size={18} color="#D92D20" style={{ marginRight: 8 }} />
                      <Text style={styles.detailInfoText}>{viewingRequest.conflictDetails}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Proposed Slot */}
                {viewingRequest.proposedDay ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Proposed Schedule</Text>
                    <View style={styles.detailSlotBox}>
                      <View style={styles.slotDetailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#475467" />
                        <Text style={styles.slotDetailLabel}>Day:</Text>
                        <Text style={styles.slotDetailValue}>{viewingRequest.proposedDay}</Text>
                      </View>
                      <View style={styles.slotDetailRow}>
                        <Ionicons name="time-outline" size={16} color="#475467" />
                        <Text style={styles.slotDetailLabel}>Time:</Text>
                        <Text style={styles.slotDetailValue}>
                          {viewingRequest.proposedStartTime} – {viewingRequest.proposedEndTime}
                        </Text>
                      </View>
                      {viewingRequest.proposedVenue ? (
                        <View style={styles.slotDetailRow}>
                          <Ionicons name="location-outline" size={16} color="#475467" />
                          <Text style={styles.slotDetailLabel}>Venue:</Text>
                          <Text style={styles.slotDetailValue}>{viewingRequest.proposedVenue}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                {/* Reason */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Student Statement / Reason</Text>
                  <View style={styles.detailReasonBox}>
                    <Text style={styles.detailReasonText}>{viewingRequest.reason}</Text>
                  </View>
                </View>

                {/* Advisor notes */}
                {viewingRequest.advisorNotes ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Advisor Feedback</Text>
                    <View style={styles.detailAdvisorBox}>
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4A3AFF" style={{ marginRight: 8 }} />
                      <Text style={styles.detailAdvisorText}>{viewingRequest.advisorNotes}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Timestamps */}
                <View style={styles.detailMetaBox}>
                  <Text style={styles.detailMetaText}>
                    Submitted: {viewingRequest.createdAt ? new Date(viewingRequest.createdAt).toLocaleString() : 'N/A'}
                  </Text>
                  {viewingRequest.updatedAt && viewingRequest.updatedAt !== viewingRequest.createdAt ? (
                    <Text style={styles.detailMetaText}>
                      Updated: {new Date(viewingRequest.updatedAt).toLocaleString()}
                    </Text>
                  ) : null}
                </View>

                {/* Actions inside viewer */}
                {isRequestPending(viewingRequest) && (
                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      style={styles.modalEditBtn}
                      onPress={() => {
                        const target = viewingRequest;
                        setViewingRequest(null);
                        openEditor(target);
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.modalEditBtnText}>Edit Request</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalDeleteBtn}
                      onPress={() => {
                        deleteRequest(viewingRequest);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#D92D20" />
                      <Text style={styles.modalDeleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* EDIT REQUEST MODAL */}
      <Modal
        visible={!!editingRequest}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingRequest(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderSub}>Update Request</Text>
                <Text style={styles.modalTitle}>
                  {editingRequest?.courseCode} Subgroup
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditingRequest(null)}
                style={styles.closeModalBtn}
                accessibilityLabel="Close editor"
              >
                <Ionicons name="close" size={22} color="#667085" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Context info banner */}
              <View style={styles.editContextBanner}>
                <Ionicons name="school-outline" size={16} color="#4A3AFF" />
                <Text style={styles.editContextText}>
                  Current Group: <Text style={{ fontWeight: '700' }}>{editingRequest?.currentGroup || 'Schedule'}</Text>
                </Text>
              </View>

              <Text style={styles.inputLabel}>
                Requested Subgroup / Slot <Text style={{ color: '#D92D20' }}>*</Text>
              </Text>
              <TextInput
                value={requestedGroup}
                onChangeText={setRequestedGroup}
                style={styles.input}
                placeholder="e.g. Group A, Slot B, or Group 2"
                placeholderTextColor="#98A2B3"
              />

              <Text style={styles.inputLabel}>
                Reason for Change <Text style={{ color: '#D92D20' }}>*</Text>
              </Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                style={[styles.input, styles.reasonInput]}
                multiline
                textAlignVertical="top"
                placeholder="Explain why you need this subgroup change"
                placeholderTextColor="#98A2B3"
              />

              <Text style={styles.inputLabel}>Conflict Details / Notes (Optional)</Text>
              <TextInput
                value={conflictDetails}
                onChangeText={setConflictDetails}
                style={styles.input}
                placeholder="e.g. Overlaps with IT3060 lab session on Wednesday"
                placeholderTextColor="#98A2B3"
              />
            </ScrollView>

            <View style={styles.editBtnGroup}>
              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={() => setEditingRequest(null)}
                disabled={saving}
              >
                <Text style={styles.cancelEditBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={saveChanges}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
  },
  headerLeft: { flex: 1, marginRight: 10 },
  title: { color: '#101828', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { color: '#667085', fontSize: 12, marginTop: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A3AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 4,
  },
  newRequestBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F2F4F7',
  },
  filterChipActive: { backgroundColor: '#4A3AFF' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#667085' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { color: '#667085', fontSize: 14, marginTop: 12 },
  content: { padding: 14, paddingBottom: 24, flexGrow: 1 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderColor: '#C7D7FE',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  summaryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryContent: { flex: 1 },
  summaryTitle: { color: '#3538CD', fontSize: 14, fontWeight: '700' },
  summarySubtitle: { color: '#444CE7', fontSize: 12, marginTop: 2, lineHeight: 16 },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EAECF0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { color: '#101828', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyText: {
    color: '#667085',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    maxWidth: 280,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A3AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  courseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  courseBadgeText: { color: '#344054', fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusBadgeText: { fontWeight: '700', fontSize: 10, letterSpacing: 0.3 },
  transitionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  transitionSubBox: { flex: 1 },
  transitionLabel: { fontSize: 10, fontWeight: '700', color: '#98A2B3', letterSpacing: 0.3 },
  transitionValue: { fontSize: 13, fontWeight: '600', color: '#344054', marginTop: 2 },
  requestedValue: { color: '#4A3AFF', fontWeight: '700' },
  arrowIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  conflictInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  conflictInfoText: { color: '#B42318', fontSize: 12, fontWeight: '500', flex: 1 },
  proposedSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  proposedSlotText: { color: '#475467', fontSize: 12, fontWeight: '500', flex: 1 },
  reasonBlock: { marginBottom: 10 },
  reasonLabel: { color: '#98A2B3', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  reasonText: { color: '#344054', fontSize: 13, lineHeight: 18, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  metaText: { color: '#98A2B3', fontSize: 11 },
  decisionBannerApproved: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF3',
    borderColor: '#A6F4C5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  decisionBannerTitleApproved: { color: '#027A48', fontSize: 13, fontWeight: '700' },
  decisionBannerSubtitleApproved: { color: '#05603A', fontSize: 12, marginTop: 1 },
  advisorNotesText: { color: '#05603A', fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  decisionBannerRejected: {
    flexDirection: 'row',
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  decisionBannerTitleRejected: { color: '#B42318', fontSize: 13, fontWeight: '700' },
  decisionBannerSubtitleRejected: { color: '#912018', fontSize: 12, marginTop: 1 },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    paddingTop: 12,
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F4F3FF',
    borderRadius: 9,
    paddingVertical: 9,
  },
  viewDetailsBtnText: { color: '#4A3AFF', fontSize: 12, fontWeight: '700' },
  editBtn: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    paddingVertical: 9,
  },
  editBtnText: { color: '#344054', fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#FECDCA',
    backgroundColor: '#FEF3F2',
    borderRadius: 9,
    paddingVertical: 9,
  },
  deleteBtnText: { color: '#D92D20', fontSize: 12, fontWeight: '700' },

  // Modals
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16, 24, 40, 0.5)',
  },
  detailsModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  editModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  modalHeaderSub: { color: '#667085', fontSize: 12, fontWeight: '600' },
  modalTitle: { color: '#101828', fontSize: 19, fontWeight: '800', marginTop: 2 },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsScrollView: { maxHeight: 460 },
  detailStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  detailStatusText: { fontSize: 13, fontWeight: '700' },
  detailSection: { marginBottom: 14 },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667085',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  detailCompareBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  detailCompareCol: { flex: 1 },
  detailCompareLabel: { fontSize: 10, fontWeight: '700', color: '#98A2B3' },
  detailCompareVal: { fontSize: 14, fontWeight: '600', color: '#101828', marginTop: 3 },
  detailInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
    padding: 10,
    borderRadius: 10,
  },
  detailInfoText: { color: '#B42318', fontSize: 13, flex: 1, lineHeight: 18 },
  detailSlotBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EAECF0',
    gap: 6,
  },
  slotDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotDetailLabel: { fontSize: 12, color: '#667085', fontWeight: '600', width: 50 },
  slotDetailValue: { fontSize: 13, color: '#101828', fontWeight: '600', flex: 1 },
  detailReasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  detailReasonText: { color: '#344054', fontSize: 13, lineHeight: 19 },
  detailAdvisorBox: {
    flexDirection: 'row',
    backgroundColor: '#F4F3FF',
    borderRadius: 10,
    padding: 12,
  },
  detailAdvisorText: { color: '#3538CD', fontSize: 13, lineHeight: 19, flex: 1 },
  detailMetaBox: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    marginTop: 6,
    gap: 3,
  },
  detailMetaText: { fontSize: 11, color: '#98A2B3' },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
  },
  modalEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A3AFF',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  modalEditBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  modalDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  modalDeleteBtnText: { color: '#D92D20', fontWeight: '700', fontSize: 14 },

  // Edit Modal Elements
  editContextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  editContextText: { color: '#3538CD', fontSize: 13 },
  inputLabel: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#101828',
    fontSize: 14,
  },
  reasonInput: { minHeight: 90 },
  editBtnGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelEditBtn: {
    flex: 1,
    height: 48,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditBtnText: { color: '#344054', fontSize: 14, fontWeight: '700' },
  saveButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#4A3AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: { opacity: 0.65 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

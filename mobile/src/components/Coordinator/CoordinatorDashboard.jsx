import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  ActionButton,
  CoordinatorIcon,
  CoordinatorScaffold,
  Panel,
  ProgressBar,
  SectionHeading,
  StatusBadge,
} from '@/components/Coordinator/CoordinatorUI';
import CoordinatorTheme from '@/constants/CoordinatorTheme';
import {
  addCourseScheduleSlotApi,
  createCourseSubgroupApi,
  deleteCourseScheduleSlotApi,
  deleteCourseSubgroupApi,
  fetchCoordinatorClashRequestsApi,
  fetchCoordinatorCourseDetailsApi,
  fetchCoordinatorCoursesApi,
  fetchCoordinatorStatsApi,
  resolveCoordinatorClashRequestApi,
} from '@/services/api';

const { colors, radius, spacing } = CoordinatorTheme;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SESSION_TYPES = ['Lecture', 'Lab', 'Tutorial'];

export default function CoordinatorDashboard() {
  const { width: viewportWidth } = useWindowDimensions();
  const compactCourseHeader = viewportWidth < 480;

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncedAt, setSyncedAt] = useState(new Date());

  const [sessionUser, setSessionUser] = useState(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    configuredCourses: 0,
    pendingCourses: 0,
    totalSubgroups: 0,
    pendingClashRequests: 0,
  });

  const [courses, setCourses] = useState([]);
  const [clashRequests, setClashRequests] = useState([]);
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Course Editor Modal State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingSubgroups, setEditingSubgroups] = useState([]);
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);

  // New Slot Form State
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotDay, setSlotDay] = useState('Monday');
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('12:00');
  const [slotRoom, setSlotRoom] = useState('');
  const [slotType, setSlotType] = useState('Lecture');

  // New Subgroup Form State
  const [showAddSubgroup, setShowAddSubgroup] = useState(false);
  const [subgroupName, setSubgroupName] = useState('Group A');
  const [subgroupDay, setSubgroupDay] = useState('Monday');
  const [subgroupStartTime, setSubgroupStartTime] = useState('09:00');
  const [subgroupEndTime, setSubgroupEndTime] = useState('11:00');
  const [subgroupVenue, setSubgroupVenue] = useState('');
  const [subgroupCapacity, setSubgroupCapacity] = useState('35');

  // Clash Request Resolution Modal State
  const [selectedClash, setSelectedClash] = useState(null);
  const [clashModalVisible, setClashModalVisible] = useState(false);
  const [proposedSubgroup, setProposedSubgroup] = useState('');
  const [requestSubgroups, setRequestSubgroups] = useState([]);
  const [loadingRequestSubgroups, setLoadingRequestSubgroups] = useState(false);
  const [coordinatorNotes, setCoordinatorNotes] = useState('');
  const [resolvingClash, setResolvingClash] = useState(false);

  // Load Session User
  useEffect(() => {
    AsyncStorage.getItem('current_admin_user').then((raw) => {
      if (raw) {
        try {
          const u = JSON.parse(raw);
          setSessionUser(u);
        } catch {}
      }
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, coursesRes, clashRes] = await Promise.all([
        fetchCoordinatorStatsApi().catch(() => null),
        fetchCoordinatorCoursesApi().catch(() => null),
        fetchCoordinatorClashRequestsApi().catch(() => null),
      ]);

      if (statsRes?.stats) {
        setStats(statsRes.stats);
      }
      if (coursesRes?.courses) {
        setCourses(coursesRes.courses);
      }
      if (clashRes?.requests) {
        setClashRequests(clashRes.requests);
      }
      setSyncedAt(new Date());
    } catch (err) {
      console.warn('Failed to load coordinator data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const openCourseEditor = async (course) => {
    setSelectedCourse(course);
    setCourseModalVisible(true);
    setShowAddSlot(false);
    setShowAddSubgroup(false);
    try {
      const details = await fetchCoordinatorCourseDetailsApi(course.courseCode);
      if (details?.course) {
        setSelectedCourse(details.course);
        setEditingSubgroups(details.subgroups || []);
      }
    } catch (err) {
      console.warn('Failed to fetch full course details:', err);
      setEditingSubgroups(course.subgroups || []);
    }
  };

  const handleAddScheduleSlot = async () => {
    if (!selectedCourse) return;
    if (!slotStartTime.trim() || !slotEndTime.trim()) {
      Alert.alert('Required Fields', 'Please enter start time and end time.');
      return;
    }
    setSavingCourse(true);
    try {
      const res = await addCourseScheduleSlotApi(selectedCourse.courseCode, {
        day: slotDay,
        startTime: slotStartTime.trim(),
        endTime: slotEndTime.trim(),
        room: slotRoom.trim() || 'Hall A',
        type: slotType,
      });

      if (res?.success) {
        Alert.alert('Slot Added', `Schedule slot for ${slotDay} added successfully.`);
        setShowAddSlot(false);
        setSlotRoom('');
        // Refresh details
        const details = await fetchCoordinatorCourseDetailsApi(selectedCourse.courseCode);
        if (details?.course) {
          setSelectedCourse(details.course);
        }
        await loadData();
      } else {
        Alert.alert('Error', res?.message || 'Failed to add schedule slot.');
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to add schedule slot.');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteScheduleSlot = async (index) => {
    if (!selectedCourse) return;
    Alert.alert(
      'Remove Schedule Slot?',
      'Are you sure you want to remove this timetable slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setSavingCourse(true);
            try {
              const res = await deleteCourseScheduleSlotApi(selectedCourse.courseCode, index);
              if (res?.success) {
                const details = await fetchCoordinatorCourseDetailsApi(selectedCourse.courseCode);
                if (details?.course) {
                  setSelectedCourse(details.course);
                }
                await loadData();
              }
            } catch (err) {
              Alert.alert('Error', err?.message || 'Failed to remove schedule slot.');
            } finally {
              setSavingCourse(false);
            }
          },
        },
      ]
    );
  };

  const handleAddSubgroup = async () => {
    if (!selectedCourse) return;
    if (!subgroupName.trim() || !subgroupStartTime.trim() || !subgroupEndTime.trim()) {
      Alert.alert('Required Fields', 'Please enter group name, start time and end time.');
      return;
    }
    setSavingCourse(true);
    try {
      const res = await createCourseSubgroupApi(selectedCourse.courseCode, {
        groupName: subgroupName.trim(),
        day: subgroupDay,
        startTime: subgroupStartTime.trim(),
        endTime: subgroupEndTime.trim(),
        venue: subgroupVenue.trim() || 'Lab 302',
        capacity: Number(subgroupCapacity) || 35,
      });

      if (res?.success) {
        Alert.alert('Subgroup Created', `${subgroupName} created and synchronized.`);
        setShowAddSubgroup(false);
        setSubgroupVenue('');
        const details = await fetchCoordinatorCourseDetailsApi(selectedCourse.courseCode);
        if (details?.course) {
          setSelectedCourse(details.course);
          setEditingSubgroups(details.subgroups || []);
        }
        await loadData();
      } else {
        Alert.alert('Error', res?.message || 'Failed to create subgroup.');
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to create subgroup.');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteSubgroup = async (subgroupId) => {
    Alert.alert(
      'Delete Subgroup?',
      'This will remove this subgroup and unassign it from student registration.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSavingCourse(true);
            try {
              const res = await deleteCourseSubgroupApi(subgroupId);
              if (res?.success) {
                const details = await fetchCoordinatorCourseDetailsApi(selectedCourse.courseCode);
                if (details?.course) {
                  setSelectedCourse(details.course);
                  setEditingSubgroups(details.subgroups || []);
                }
                await loadData();
              }
            } catch (err) {
              Alert.alert('Error', err?.message || 'Failed to delete subgroup.');
            } finally {
              setSavingCourse(false);
            }
          },
        },
      ]
    );
  };

  const openResolveClashModal = async (clash) => {
    setSelectedClash(clash);
    setProposedSubgroup('');
    setRequestSubgroups([]);
    setCoordinatorNotes(`Rescheduled slot to resolve collision on ${clash.courseCode}.`);
    setClashModalVisible(true);
    setLoadingRequestSubgroups(true);
    try {
      const response = await fetchCoordinatorCourseDetailsApi(clash.courseCode);
      const groups = response?.subgroups || [];
      const choices = clash.lastDecision === 'REJECTED' && clash.proposedSubgroupId
        ? groups.filter((group) => String(group._id) !== String(clash.proposedSubgroupId))
        : groups;
      setRequestSubgroups(choices);
    } catch (err) {
      Alert.alert('Unable to load subgroups', err?.message || 'Open the course timetable and configure a subgroup first.');
    } finally {
      setLoadingRequestSubgroups(false);
    }
  };

  const handleResolveClash = async () => {
    if (!selectedClash || !proposedSubgroup) {
      Alert.alert('Choose a subgroup', 'Select a configured subgroup with a suitable time before forwarding this request.');
      return;
    }
    setResolvingClash(true);
    try {
      const res = await resolveCoordinatorClashRequestApi(selectedClash._id, {
        proposedSubgroup,
        coordinatorNotes,
        coordinatorId: sessionUser?.adminId || sessionUser?.userId,
      });
      if (res?.success) {
        Alert.alert(
          'Conflict Resolved',
          'The timetable clash resolution has been recorded and forwarded to the Academic Advisor.',
          [{ text: 'OK', onPress: () => setClashModalVisible(false) }]
        );
        await loadData();
      } else {
        Alert.alert('Error', res?.message || 'Failed to resolve clash request.');
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to resolve clash request.');
    } finally {
      setResolvingClash(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('current_admin_user');
          await AsyncStorage.removeItem('current_student_user');
          router.replace('/');
        },
      },
    ]);
  };

  // Filtered courses
  const filteredCourses = courses.filter((c) => {
    const matchesSemester =
      semesterFilter === 'All' || String(c.semester) === String(semesterFilter);
    const matchesSearch =
      !searchQuery.trim() ||
      c.courseCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lecturer?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSemester && matchesSearch;
  });

  return (
    <CoordinatorScaffold
      title={
        activeTab === 'Dashboard'
          ? 'Coordinator Dashboard'
          : activeTab === 'Timetable'
          ? 'Course Timetable & Subgroups'
          : activeTab === 'Clashes'
          ? 'Timetable Clash Requests'
          : 'Coordinator Profile'
      }
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── Top Period Strip ──────────────────────────────────────────────── */}
      <View style={styles.periodStrip}>
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>2026/2027 — SEMESTER 3 (ACTIVE)</Text>
        </View>
        <TouchableOpacity
          style={styles.syncedText}
          onPress={loadData}
          disabled={loading}
          activeOpacity={0.7}
        >
          <CoordinatorIcon name="sync" size={13} color={colors.primary} />
          <Text style={[styles.metaText, { color: colors.primary, fontWeight: '600' }]}>
            {loading ? 'Syncing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Greeting Block ────────────────────────────────────────────────── */}
      <View style={styles.greetingBlock}>
        <Text style={styles.greeting}>
          Welcome, {sessionUser?.name || 'Academic Coordinator'}
        </Text>
        <Text style={styles.greetingHint}>
          Manage course schedules, allocate subgroups, and resolve timetable clashes.
        </Text>
      </View>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: DASHBOARD OVERVIEW                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Dashboard' && (
        <>
          {/* Institutional Telemetry */}
          <View style={styles.sectionBlock}>
            <SectionHeading
              title="INSTITUTIONAL TELEMETRY"
              action="Live Feed  →"
              onPress={loadData}
            />

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.metricGrid}>
                <View style={styles.metricCard}>
                  <View style={styles.metricTop}>
                    <View style={styles.metricIcon}>
                      <CoordinatorIcon name="calendar" color={colors.primary} size={17} />
                    </View>
                    <StatusBadge label="ACTIVE" tone="success" />
                  </View>
                  <Text style={styles.metricValue}>{stats.totalCourses}</Text>
                  <Text style={styles.metricLabel}>Total Courses</Text>
                  <Text style={styles.metricCaption}>
                    {stats.configuredCourses} Timetabled • {stats.pendingCourses} Pending
                  </Text>
                  <Text style={styles.metricBadge}>CURRICULUM</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricTop}>
                    <View style={styles.metricIcon}>
                      <CoordinatorIcon name="group" color={colors.primary} size={17} />
                    </View>
                    <StatusBadge label="ALLOCATED" tone="info" />
                  </View>
                  <Text style={styles.metricValue}>{stats.totalSubgroups}</Text>
                  <Text style={styles.metricLabel}>Course Subgroups</Text>
                  <Text style={styles.metricCaption}>Active Cohort Sections</Text>
                  <Text style={styles.metricBadge}>CAPACITY READY</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricTop}>
                    <View style={styles.metricIcon}>
                      <CoordinatorIcon name="validation" color={colors.primary} size={17} />
                    </View>
                    <StatusBadge label="SYNCED" tone="success" />
                  </View>
                  <Text style={styles.metricValue}>100%</Text>
                  <Text style={styles.metricLabel}>Schedule Matrix</Text>
                  <Text style={styles.metricCaption}>Conflict Detector Live</Text>
                  <Text style={styles.metricBadge}>ENGINE READY</Text>
                </View>

                <View
                  style={[
                    styles.metricCard,
                    stats.pendingClashRequests > 0 && styles.metricCardDanger,
                  ]}
                >
                  <View style={styles.metricTop}>
                    <View
                      style={[
                        styles.metricIcon,
                        stats.pendingClashRequests > 0 && styles.metricIconDanger,
                      ]}
                    >
                      <CoordinatorIcon
                        name="warning"
                        color={stats.pendingClashRequests > 0 ? colors.red : colors.primary}
                        size={17}
                      />
                    </View>
                    <StatusBadge
                      label={stats.pendingClashRequests > 0 ? 'ACTION' : 'CLEAR'}
                      tone={stats.pendingClashRequests > 0 ? 'danger' : 'success'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.metricValue,
                      stats.pendingClashRequests > 0 && styles.metricValueDanger,
                    ]}
                  >
                    {stats.pendingClashRequests}
                  </Text>
                  <Text style={styles.metricLabel}>Schedule Clashes</Text>
                  <Text style={styles.metricCaption}>Student Conflict Requests</Text>
                  <Text style={styles.metricBadge}>COORDINATOR DESK</Text>
                </View>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionBlock}>
            <SectionHeading title="QUICK ACTIONS" action="Workflow Tools" />
            <ActionButton
              label="Manage Course Timetables & Subgroups"
              icon="calendar"
              onPress={() => setActiveTab('Timetable')}
            />
            <ActionButton
              label="Review Student Clash Requests"
              icon="warning"
              kind="secondary"
              onPress={() => setActiveTab('Clashes')}
            />
          </View>

          {/* Recent Student Clash Reports Alert Panel */}
          {clashRequests.length > 0 && (
            <View style={styles.sectionBlock}>
              <SectionHeading
                title="STUDENT TIMETABLE CONFLICTS"
                action="View all  →"
                onPress={() => setActiveTab('Clashes')}
              />
              <Panel style={styles.alertPanel}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="alert-circle" size={20} color={colors.red} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.red }}>
                    {clashRequests.length} Pending Timetable Conflict Report(s)
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.text, marginBottom: 12, lineHeight: 18 }}>
                  Students reported overlapping time slots blocking course registration. Select an
                  alternative subgroup to reschedule and forward for Advisor approval.
                </Text>
                <ActionButton
                  label="Resolve Next Conflict"
                  icon="arrow"
                  kind="danger"
                  onPress={() => openResolveClashModal(clashRequests[0])}
                />
              </Panel>
            </View>
          )}

          {/* Validation Engine Status Panel */}
          <Panel style={styles.enginePanel}>
            <View style={styles.engineHeading}>
              <View style={styles.engineStatusDot} />
              <Text style={styles.engineTitle}>Timetable Clash Engine v4.2</Text>
              <StatusBadge label="ACTIVE" tone="success" />
            </View>
            <Text style={styles.engineCopy}>
              Real-time schedule validation detects overlapping lectures, labs, and subgroup
              capacities automatically across all student registrations.
            </Text>
            <View style={styles.progressCaptionRow}>
              <Text style={styles.progressLabel}>SYSTEM INTEGRITY</Text>
              <Text style={styles.progressLabel}>100%</Text>
            </View>
            <ProgressBar progress={100} />
          </Panel>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: COURSE TIMETABLES & SUBGROUPS (THE CORE REQUEST)              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Timetable' && (
        <View style={{ gap: spacing.medium }}>
          {/* Header Banner */}
          <Panel style={{ backgroundColor: colors.infoSurface, borderColor: '#DCE5FF' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <CoordinatorIcon name="calendar" color={colors.primary} size={20} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                Course Timetable & Subgroup Configurator
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.muted, lineHeight: 16 }}>
              Courses created by Administrator appear here. Select any course to configure lecture/lab
              timings and create cohort subgroups.
            </Text>
          </Panel>

          {/* Search & Filter */}
          <View style={{ gap: 8 }}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by course code, title, or lecturer..."
              placeholderTextColor="#98A2B3"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Semester Filter Pills */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {['All', '1', '2', '3'].map((sem) => {
                const active = semesterFilter === sem;
                return (
                  <TouchableOpacity
                    key={sem}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                    onPress={() => setSemesterFilter(sem)}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        active && styles.filterPillTextActive,
                      ]}
                    >
                      {sem === 'All' ? 'All Semesters' : `Semester ${sem}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Courses List */}
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
          ) : filteredCourses.length === 0 ? (
            <Panel style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Ionicons name="book-outline" size={36} color={colors.muted} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 8 }}>
                No Courses Found
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
                Courses created by Administrator will appear here.
              </Text>
            </Panel>
          ) : (
            filteredCourses.map((course) => {
              const scheduleCount = (course.schedule || []).length;
              const subgroupCount = (course.subgroups || []).length;

              return (
                <Panel key={course._id} style={styles.courseCard}>
                  <View style={styles.courseCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.courseCode}>{course.courseCode}</Text>
                        <StatusBadge
                          label={course.type === 'Core' ? 'CORE' : 'ELECTIVE'}
                          tone={course.type === 'Core' ? 'info' : 'neutral'}
                        />
                      </View>
                      <Text style={styles.courseName}>{course.courseName}</Text>
                    </View>
                    <View style={styles.creditsBadge}>
                      <Text style={styles.creditsBadgeText}>{course.credits} Credits</Text>
                    </View>
                  </View>

                  <View style={styles.courseMetaRow}>
                    <Ionicons name="person-outline" size={13} color={colors.muted} />
                    <Text style={styles.courseMetaText}>
                      {course.lecturer || 'Faculty Assigned'} • Sem {course.semester}
                    </Text>
                  </View>

                  {/* Status Pills */}
                  <View style={{ flexDirection: 'row', gap: 8, marginVertical: 10 }}>
                    <View
                      style={[
                        styles.statusPill,
                        scheduleCount > 0
                          ? { backgroundColor: colors.greenSurface, borderColor: '#A6F4C5' }
                          : { backgroundColor: colors.warningSurface, borderColor: '#FEDF89' },
                      ]}
                    >
                      <Ionicons
                        name={scheduleCount > 0 ? 'time' : 'alert-circle'}
                        size={13}
                        color={scheduleCount > 0 ? colors.green : colors.warning}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          scheduleCount > 0 ? { color: colors.green } : { color: colors.warning },
                        ]}
                      >
                        {scheduleCount > 0 ? `${scheduleCount} Schedule Slot(s)` : 'No Schedule Set'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        subgroupCount > 0
                          ? { backgroundColor: colors.lightPurple, borderColor: '#D9D6FE' }
                          : { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                      ]}
                    >
                      <Ionicons
                        name={subgroupCount > 0 ? 'people' : 'people-outline'}
                        size={13}
                        color={subgroupCount > 0 ? colors.primary : colors.muted}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          subgroupCount > 0 ? { color: colors.primary } : { color: colors.muted },
                        ]}
                      >
                        {subgroupCount > 0 ? `${subgroupCount} Subgroup(s)` : 'No Subgroups'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Button */}
                  <ActionButton
                    label="Configure Timetable & Subgroups"
                    icon="edit"
                    kind="secondary"
                    onPress={() => openCourseEditor(course)}
                  />
                </Panel>
              );
            })
          )}
        </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: TIMETABLE CLASH REQUESTS                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Clashes' && (
        <View style={{ gap: spacing.medium }}>
          <Panel style={{ backgroundColor: colors.redSurface, borderColor: '#FECDCA' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name="warning" size={20} color={colors.red} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.red }}>
                Student Schedule Conflicts Desk
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: '#7A271A', lineHeight: 16 }}>
              When students detect collision overlaps during registration, their clash reports arrive
              here. Propose an alternative subgroup slot and forward to the Academic Advisor.
            </Text>
          </Panel>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
          ) : clashRequests.length === 0 ? (
            <Panel style={{ alignItems: 'center', paddingVertical: 35 }}>
              <Ionicons name="checkmark-done-circle-outline" size={42} color={colors.green} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 8 }}>
                No Pending Schedule Clashes
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 4 }}>
                All course timetables and student registrations are conflict-free.
              </Text>
            </Panel>
          ) : (
            clashRequests.map((clash) => (
              <Panel key={clash._id} style={{ gap: 10, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="person" size={14} color={colors.primary} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                      {clash.studentId}
                    </Text>
                  </View>
                  <StatusBadge
                    label={clash.lastDecision === 'REJECTED' ? 'REJECTED · REASSIGN' : 'PENDING COORDINATOR'}
                    tone={
                      clash.lastDecision === 'REJECTED' ? 'danger' : 'neutral'
                    }
                  />
                </View>

                <View style={{ backgroundColor: colors.surfaceSubtle, padding: 10, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                    {clash.courseCode}
                  </Text>
                  {clash.currentGroup ? (
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 3 }}>
                      Current subgroup: {clash.currentGroup}
                    </Text>
                  ) : null}
                  {clash.conflictDay && clash.conflictStartTime && clash.conflictEndTime ? (
                    <Text style={{ fontSize: 11, color: colors.red, marginTop: 3 }}>
                      Conflicting time: {clash.conflictDay} {clash.conflictStartTime}–{clash.conflictEndTime}
                    </Text>
                  ) : null}
                  {clash.conflictDetails ? (
                    <Text style={{ fontSize: 11, color: colors.red, marginTop: 3 }}>
                      {clash.conflictDetails}
                    </Text>
                  ) : null}
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    Reason: {clash.reason}
                  </Text>
                </View>

                <ActionButton
                  label="Resolve & Propose Subgroup"
                  icon="sync"
                  kind="primary"
                  onPress={() => openResolveClashModal(clash)}
                />
              </Panel>
            ))
          )}
        </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: PROFILE                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Profile' && (
        <View style={{ gap: spacing.medium }}>
          <Panel style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.lightPurple,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              {sessionUser?.name || 'Academic Coordinator'}
            </Text>
            <StatusBadge label="TIMETABLE COORDINATOR" tone="info" />
          </Panel>

          <Panel style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>Coordinator ID</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                {sessionUser?.adminId || sessionUser?.userId || 'CRD001'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>Email Address</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                {sessionUser?.email || 'coordinator@university.edu'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>Department</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                {sessionUser?.department || 'Curriculum Planning'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>Role</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                {sessionUser?.role || 'Course & Timetable Coordinator'}
              </Text>
            </View>
          </Panel>

          <ActionButton
            label="Sign Out"
            icon="close"
            kind="danger"
            onPress={handleSignOut}
          />
        </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: COURSE TIMETABLE & SUBGROUP CONFIGURATOR                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={courseModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCourseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalEyebrow}>COURSE CONFIGURATOR</Text>
              <Text style={styles.modalTitle}>
                {selectedCourse?.courseCode} • {selectedCourse?.courseName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setCourseModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
            {/* ── Section A: Timetable Schedule Slots ─────────────────────── */}
            <Panel style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: compactCourseHeader ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: compactCourseHeader ? 'stretch' : 'center',
                  gap: 8,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.sectionCardTitle}>1. TIMETABLE SCHEDULE SLOTS</Text>
                  <Text style={styles.sectionCardSubtitle}>
                    Master Lecture & Lab timings for timetable preview
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.addMiniButton,
                    compactCourseHeader && { alignSelf: 'flex-end' },
                  ]}
                  onPress={() => setShowAddSlot(!showAddSlot)}
                >
                  <Ionicons name={showAddSlot ? 'close' : 'add'} size={16} color="#FFFFFF" />
                  <Text style={styles.addMiniButtonText}>
                    {showAddSlot ? 'Cancel' : 'Add Slot'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Add Slot Form */}
              {showAddSlot && (
                <View style={styles.inlineForm}>
                  <Text style={styles.formHeading}>Add New Schedule Slot</Text>

                  {/* Day Picker */}
                  <Text style={styles.inputLabel}>Day of Week</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {DAYS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.smallPill, slotDay === d && styles.smallPillActive]}
                        onPress={() => setSlotDay(d)}
                      >
                        <Text style={[styles.smallPillText, slotDay === d && styles.smallPillTextActive]}>
                          {d.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Start / End Time */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Start Time (HH:MM)</Text>
                      <TextInput
                        style={styles.formInput}
                        value={slotStartTime}
                        onChangeText={setSlotStartTime}
                        placeholder="09:00"
                        placeholderTextColor="#98A2B3"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>End Time (HH:MM)</Text>
                      <TextInput
                        style={styles.formInput}
                        value={slotEndTime}
                        onChangeText={setSlotEndTime}
                        placeholder="12:00"
                        placeholderTextColor="#98A2B3"
                      />
                    </View>
                  </View>

                  {/* Room & Type */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Room / Hall</Text>
                      <TextInput
                        style={styles.formInput}
                        value={slotRoom}
                        onChangeText={setSlotRoom}
                        placeholder="e.g. Auditorium East"
                        placeholderTextColor="#98A2B3"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Session Type</Text>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        {SESSION_TYPES.map((t) => (
                          <TouchableOpacity
                            key={t}
                            style={[styles.smallPill, slotType === t && styles.smallPillActive, { flex: 1 }]}
                            onPress={() => setSlotType(t)}
                          >
                            <Text style={[styles.smallPillText, slotType === t && styles.smallPillTextActive, { fontSize: 10 }]}>
                              {t}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <ActionButton
                    label={savingCourse ? 'Saving Slot...' : 'Save Schedule Slot'}
                    icon="save"
                    disabled={savingCourse}
                    onPress={handleAddScheduleSlot}
                  />
                </View>
              )}

              {/* Current Slots List */}
              {selectedCourse?.schedule && selectedCourse.schedule.length > 0 ? (
                selectedCourse.schedule.map((slot, index) => (
                  <View key={slot._id || index} style={styles.slotRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slotTitle}>
                        {slot.day} • {slot.startTime} - {slot.endTime}
                      </Text>
                      <Text style={styles.slotMeta}>
                        {slot.room || 'Room TBA'} • {slot.type || 'Lecture'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteScheduleSlot(index)}
                      style={styles.deleteIconButton}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyNotice}>
                  No schedule slots configured yet. Click "Add Slot" above.
                </Text>
              )}
            </Panel>

            {/* ── Section B: Subgroups (Cohort Allocation) ──────────────── */}
            <Panel style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: compactCourseHeader ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: compactCourseHeader ? 'stretch' : 'center',
                  gap: 8,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.sectionCardTitle}>2. COURSE SUBGROUPS</Text>
                  <Text style={styles.sectionCardSubtitle}>
                    Lab/tutorial groups students select during course enrollment
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.addMiniButton,
                    compactCourseHeader && { alignSelf: 'flex-end' },
                  ]}
                  onPress={() => setShowAddSubgroup(!showAddSubgroup)}
                >
                  <Ionicons name={showAddSubgroup ? 'close' : 'add'} size={16} color="#FFFFFF" />
                  <Text style={styles.addMiniButtonText}>
                    {showAddSubgroup ? 'Cancel' : 'Add Group'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Add Subgroup Form */}
              {showAddSubgroup && (
                <View style={styles.inlineForm}>
                  <Text style={styles.formHeading}>Create New Subgroup</Text>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Group Name</Text>
                      <TextInput
                        style={styles.formInput}
                        value={subgroupName}
                        onChangeText={setSubgroupName}
                        placeholder="e.g. Group A / Slot B"
                        placeholderTextColor="#98A2B3"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Capacity</Text>
                      <TextInput
                        style={styles.formInput}
                        value={subgroupCapacity}
                        onChangeText={setSubgroupCapacity}
                        keyboardType="numeric"
                        placeholder="35"
                        placeholderTextColor="#98A2B3"
                      />
                    </View>
                  </View>

                  {/* Day Picker */}
                  <Text style={styles.inputLabel}>Day</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {DAYS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.smallPill, subgroupDay === d && styles.smallPillActive]}
                        onPress={() => setSubgroupDay(d)}
                      >
                        <Text style={[styles.smallPillText, subgroupDay === d && styles.smallPillTextActive]}>
                          {d.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Times & Venue */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Start Time</Text>
                      <TextInput
                        style={styles.formInput}
                        value={subgroupStartTime}
                        onChangeText={setSubgroupStartTime}
                        placeholder="09:00"
                        placeholderTextColor="#98A2B3"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>End Time</Text>
                      <TextInput
                        style={styles.formInput}
                        value={subgroupEndTime}
                        onChangeText={setSubgroupEndTime}
                        placeholder="11:00"
                        placeholderTextColor="#98A2B3"
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Venue / Lab</Text>
                  <TextInput
                    style={styles.formInput}
                    value={subgroupVenue}
                    onChangeText={setSubgroupVenue}
                    placeholder="e.g. Computing Lab 01"
                    placeholderTextColor="#98A2B3"
                  />

                  <ActionButton
                    label={savingCourse ? 'Creating Subgroup...' : 'Save Subgroup'}
                    icon="save"
                    disabled={savingCourse}
                    onPress={handleAddSubgroup}
                  />
                </View>
              )}

              {/* Subgroups List */}
              {editingSubgroups && editingSubgroups.length > 0 ? (
                editingSubgroups.map((grp) => (
                  <View key={grp._id} style={styles.slotRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.slotTitle}>{grp.groupName}</Text>
                        <StatusBadge label={`Cap: ${grp.capacity}`} tone="info" />
                      </View>
                      <Text style={styles.slotMeta}>
                        {grp.day} • {grp.startTime} - {grp.endTime} • {grp.venue || 'Lab TBA'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteSubgroup(grp._id)}
                      style={styles.deleteIconButton}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyNotice}>
                  No subgroups created yet. Click "Add Group" above.
                </Text>
              )}
            </Panel>
          </ScrollView>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: RESOLVE CLASH REQUEST                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={clashModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setClashModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                Resolve Student Clash
              </Text>
              <TouchableOpacity onPress={() => setClashModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              Student: {selectedClash?.studentId} • {selectedClash?.courseCode}
            </Text>

            <View style={{ backgroundColor: colors.redSurface, padding: 10, borderRadius: 8, marginVertical: 10 }}>
              <Text style={{ fontSize: 11, color: colors.red, fontWeight: '600' }}>
                Conflict Details:
              </Text>
              <Text style={{ fontSize: 11, color: '#7A271A', marginTop: 2 }}>
                {selectedClash?.conflictDetails || selectedClash?.reason}
              </Text>
            </View>

            <Text style={styles.inputLabel}>Choose an alternative subgroup and time</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 6 }}>
              Select a configured slot that resolves this student’s timetable conflict.
            </Text>
            {loadingRequestSubgroups ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 14 }} />
            ) : requestSubgroups.length === 0 ? (
              <Text style={{ color: colors.red, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>
                No subgroups are configured for {selectedClash?.courseCode}. Add a subgroup and its time in Course Management, then reopen this request.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 170, marginBottom: 10 }} nestedScrollEnabled>
                {requestSubgroups.map((group) => {
                  const chosen = proposedSubgroup === group._id;
                  return (
                    <TouchableOpacity
                      key={group._id}
                      onPress={() => setProposedSubgroup(group._id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 10,
                        marginBottom: 7,
                        borderRadius: 9,
                        borderWidth: 1,
                        borderColor: chosen ? colors.primary : colors.border,
                        backgroundColor: chosen ? colors.lightPurple : '#FFFFFF',
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{group.groupName}</Text>
                        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>
                          {group.day} {group.startTime}–{group.endTime} · {group.venue || 'TBA'}
                        </Text>
                      </View>
                      <Ionicons
                        name={chosen ? 'checkmark-circle' : 'ellipse-outline'}
                        size={19}
                        color={chosen ? colors.primary : colors.muted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <Text style={styles.inputLabel}>Coordinator Resolution Notes</Text>
            <TextInput
              style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
              value={coordinatorNotes}
              onChangeText={setCoordinatorNotes}
              multiline
              placeholder="Notes for Academic Advisor..."
              placeholderTextColor="#98A2B3"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: colors.surfaceSubtle,
                }}
                onPress={() => setClashModalVisible(false)}
              >
                <Text style={{ fontWeight: '600', color: colors.text, fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 2,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: colors.primary,
                }}
                disabled={resolvingClash || loadingRequestSubgroups || !proposedSubgroup}
                onPress={handleResolveClash}
              >
                {resolvingClash ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ fontWeight: '700', color: '#FFFFFF', fontSize: 13 }}>
                    Forward to Advisor
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CoordinatorScaffold>
  );
}

const styles = StyleSheet.create({
  periodStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.small,
  },
  periodBadge: {
    backgroundColor: colors.lightPurple,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  periodText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  syncedText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  metaText: {
    color: colors.muted,
    fontSize: 11,
  },
  greetingBlock: {
    gap: 4,
    marginTop: -4,
  },
  greeting: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
  },
  greetingHint: {
    color: colors.muted,
    fontSize: 12,
  },
  sectionBlock: {
    gap: spacing.medium,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.small,
  },
  metricCard: {
    width: '48.5%',
    minHeight: 135,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    padding: spacing.medium,
  },
  metricCardDanger: {
    backgroundColor: colors.redSurface,
    borderColor: '#F5C9CE',
  },
  metricTop: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricIcon: {
    width: 30,
    height: 30,
    backgroundColor: colors.lightPurple,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconDanger: {
    backgroundColor: '#FFE1E5',
  },
  metricValue: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    marginTop: 6,
  },
  metricValueDanger: {
    color: colors.red,
  },
  metricLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  metricCaption: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 2,
  },
  metricBadge: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 5,
  },
  alertPanel: {
    backgroundColor: colors.redSurface,
    borderColor: '#F5C9CE',
    padding: 14,
  },
  enginePanel: {
    backgroundColor: colors.infoSurface,
    borderColor: '#DCE5FF',
    gap: spacing.small,
  },
  engineHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  engineStatusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.green,
  },
  engineTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  engineCopy: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
  },
  progressCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  progressLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Course Search & Filter */
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  /* Course Card */
  courseCard: {
    borderColor: colors.border,
    gap: 6,
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseCode: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  courseName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  creditsBadge: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  creditsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  courseMetaText: {
    fontSize: 11,
    color: colors.muted,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
  },
  sectionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  sectionCardSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  addMiniButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMiniButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  inlineForm: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginVertical: 4,
  },
  formHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.text,
  },
  smallPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  smallPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  smallPillTextActive: {
    color: '#FFFFFF',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  slotMeta: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  deleteIconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyNotice: {
    fontSize: 11,
    color: colors.muted,
    fontStyle: 'italic',
    paddingVertical: 6,
  },

  /* Dialog */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
});

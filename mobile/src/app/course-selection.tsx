import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchCoursesApi, fetchDashboardApi, submitRegistrationApi } from '../services/api';
import { FooterTab } from '../components/FooterTab';

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
  type?: string;
}

interface SlotItem {
  slotName: string;
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
}

interface CourseItem {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
  type: 'Core' | 'Elective';
  lecturer?: string;
  description?: string;
  schedule?: ScheduleItem[];
  slots?: SlotItem[];
}

const DEFAULT_COURSES: CourseItem[] = [
  {
    _id: 'c1',
    courseCode: 'IT3060',
    courseName: 'Human Computer Interaction',
    credits: 4,
    semester: 3,
    type: 'Core',
    lecturer: 'Prof. Diana Jenkins • Dept of Informatics',
    schedule: [
      { day: 'Monday', startTime: '09:00', endTime: '12:00', room: 'Auditorium East', type: 'Lecture' },
      { day: 'Wednesday', startTime: '14:00', endTime: '16:00', room: 'Graphics Lab T-302', type: 'Lab' },
    ],
  },
  {
    _id: 'c2',
    courseCode: 'IT3040',
    courseName: 'Distributed Systems & Cloud',
    credits: 4,
    semester: 3,
    type: 'Core',
    lecturer: 'Dr. Aaron Vance • Systems Engineering',
    schedule: [
      { day: 'Tuesday', startTime: '10:00', endTime: '13:00', room: 'Turing Hall B-201', type: 'Lecture' },
    ],
  },
  {
    _id: 'c3',
    courseCode: 'IT3080',
    courseName: 'Machine Learning Applications',
    credits: 4,
    semester: 3,
    type: 'Elective',
    lecturer: 'Assoc. Prof. Elena Wu • AI Lab',
    slots: [
      { slotName: 'Slot A', day: 'Thursday', startTime: '09:00', endTime: '12:00', room: 'Robotics Center R-12' },
      { slotName: 'Slot B', day: 'Wednesday', startTime: '14:00', endTime: '17:00', room: 'AI Lab 102' },
    ],
  },
  {
    _id: 'c4',
    courseCode: 'IT3090',
    courseName: 'Mobile Application Development',
    credits: 4,
    semester: 3,
    type: 'Elective',
    lecturer: 'Lecturer Marcus Lin • Mobile UX',
    schedule: [
      { day: 'Friday', startTime: '14:00', endTime: '17:00', room: 'Computing Block C • Lab 04', type: 'Lab' },
    ],
  },
];

export default function CourseSelectionScreen() {
  const params = useLocalSearchParams();
  const studentId = (params.studentId as string) || 'IT21047138';

  const [courses, setCourses] = useState<CourseItem[]>(DEFAULT_COURSES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Core' | 'Elective'>('All');

  // Enrolled course codes set
  const [enrolledCodes, setEnrolledCodes] = useState<Set<string>>(
    new Set(['IT3060', 'IT3040', 'IT3080', 'IT3090'])
  );

  // Selected slots for courses with slot choices (e.g. IT3080 -> Slot B for testing conflicts)
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({
    IT3080: 'Slot B',
  });

  const [saving, setSaving] = useState(false);

  const loadCoursesAndRegistration = async () => {
    try {
      const [courseRes, dashRes] = await Promise.all([
        fetchCoursesApi(),
        fetchDashboardApi(studentId).catch(() => null),
      ]);

      if (courseRes?.success && Array.isArray(courseRes.courses) && courseRes.courses.length > 0) {
        setCourses(courseRes.courses);
      }

      const regCourses = dashRes?.academics?.courses || dashRes?.registration?.courses;
      if (dashRes?.success && regCourses && Array.isArray(regCourses)) {
        const enrolled = new Set<string>();
        regCourses.forEach((c: any) => {
          if (c.courseCode) enrolled.add(c.courseCode);
        });
        if (enrolled.size > 0) {
          setEnrolledCodes(enrolled);
        }
      }
    } catch (e) {
      // Fallback stays in place
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCoursesAndRegistration();
  }, [studentId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCoursesAndRegistration();
  };

  // Toggle enrollment for a course
  const toggleEnrollment = (code: string) => {
    setEnrolledCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Set slot for a course
  const setSlot = (courseCode: string, slotName: string) => {
    setSelectedSlots((prev) => ({
      ...prev,
      [courseCode]: slotName,
    }));
  };

  // Filter courses based on tab and search text
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Filter by Type
      if (filterType === 'Core' && c.type !== 'Core') return false;
      if (filterType === 'Elective' && c.type !== 'Elective') return false;

      // Filter by Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const codeMatch = c.courseCode.toLowerCase().includes(q);
        const nameMatch = c.courseName.toLowerCase().includes(q);
        const lectMatch = (c.lecturer || '').toLowerCase().includes(q);
        const descMatch = (c.description || '').toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !lectMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }, [courses, filterType, search]);

  // Counts
  const totalCount = courses.length;
  const coreCount = courses.filter((c) => c.type === 'Core').length;
  const electiveCount = courses.filter((c) => c.type === 'Elective').length;

  // Calculate total credits
  const totalCredits = useMemo(() => {
    return courses
      .filter((c) => enrolledCodes.has(c.courseCode))
      .reduce((sum, c) => sum + (c.credits || 4), 0);
  }, [courses, enrolledCodes]);

  const hasSlotBConflict =
    enrolledCodes.has('IT3080') && selectedSlots['IT3080'] === 'Slot B';

  const handleSaveRegistration = () => {
    const enrolledArray = Array.from(enrolledCodes);
    if (enrolledArray.length === 0) {
      Alert.alert('No Courses Selected', 'Please select at least one course to register.');
      return;
    }

    // Navigate to Timetable Preview page
    router.push({
      pathname: '/Student/timetable-preview',
      params: { 
        studentId, 
        courseIdsParam: JSON.stringify(enrolledArray),
        selectedSlotsParam: JSON.stringify(selectedSlots)
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.logo}
            onPress={() => router.push({ pathname: '/dashboard', params: { studentId } })}
            activeOpacity={0.8}
          >
            <Ionicons name="school" size={19} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Selection</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notification}
            onPress={() => router.push({ pathname: '/dashboard', params: { studentId } })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={22} color="#374151" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatar}
            onPress={() =>
              router.push({
                pathname: '/profile',
                params: { studentId, role: 'student' },
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>AP</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
      >
        {/* ── Search Box ──────────────────────────────── */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#7B8190" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search module code, name or lecturer..."
            placeholderTextColor="#8B8F9B"
            style={styles.searchInput}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filter Tabs ─────────────────────────────── */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, filterType === 'All' && styles.activeTab]}
            onPress={() => setFilterType('All')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filterType === 'All' && styles.activeTabText]}>
              All ({totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, filterType === 'Core' && styles.activeTab]}
            onPress={() => setFilterType('Core')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filterType === 'Core' && styles.activeTabText]}>
              Core ({coreCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, filterType === 'Elective' && styles.activeTab]}
            onPress={() => setFilterType('Elective')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filterType === 'Elective' && styles.activeTabText]}>
              Electives ({electiveCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Academic Load Card ──────────────────────── */}
        <View style={styles.loadCard}>
          <View style={styles.loadHeader}>
            <View style={styles.loadTitleRow}>
              <View style={styles.loadIcon}>
                <Ionicons name="trending-up" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.loadTitle}>Academic Load</Text>
            </View>

            <View style={hasSlotBConflict ? styles.conflictBadge : styles.optimalBadge}>
              <View style={hasSlotBConflict ? styles.redDot : styles.greenDot} />
              <Text style={hasSlotBConflict ? styles.conflictBadgeText : styles.optimalText}>
                {hasSlotBConflict ? 'Clash Detected' : 'Optimal Load'}
              </Text>
            </View>
          </View>

          <View style={styles.creditRow}>
            <Text style={styles.creditLabel}>Enrolled Credit Ratio</Text>
            <View style={styles.creditValueRow}>
              <Text style={styles.creditValue}>{totalCredits}</Text>
              <Text style={styles.creditMax}> / 20 Credits</Text>
            </View>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((totalCredits / 20) * 100, 100)}%`,
                  backgroundColor: hasSlotBConflict ? '#EF4444' : '#4F46E5',
                },
              ]}
            />
          </View>

          <View style={styles.loadScale}>
            <Text style={styles.scaleText}>Min 12 cr</Text>
            <Text style={styles.targetText}>Target 16–18 cr</Text>
            <Text style={styles.scaleText}>Max 20 cr</Text>
          </View>
        </View>

        {/* ── Course List ─────────────────────────────── */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#4F46E5" size="large" />
            <Text style={styles.loadingText}>Loading catalogue…</Text>
          </View>
        ) : filteredCourses.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="book-outline" size={42} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptySub}>
              Try adjusting your search query or switching filters.
            </Text>
          </View>
        ) : (
          filteredCourses.map((course) => {
            const isEnrolled = enrolledCodes.has(course.courseCode);
            const isCore = course.type === 'Core';
            const hasSlots = course.slots && course.slots.length > 0;
            const curSlot = selectedSlots[course.courseCode] || 'Slot A';

            return (
              <View key={course._id || course.courseCode} style={styles.courseCard}>
                {/* Card Top Meta */}
                <View style={styles.courseTopRow}>
                  <View style={styles.courseMeta}>
                    <View style={isCore ? styles.coreBadge : styles.electiveBadge}>
                      <Text style={isCore ? styles.coreText : styles.electiveText}>
                        {course.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.courseCredits}>{course.credits || 4}.0 cr</Text>
                  </View>

                  {/* Enrollment action button / status */}
                  {isCore ? (
                    <TouchableOpacity
                      style={[styles.enrolledBadge, !isEnrolled && { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}
                      onPress={() => toggleEnrollment(course.courseCode)}
                      activeOpacity={0.7}
                    >
                      {isEnrolled ? (
                        <>
                          <Ionicons name="checkmark" size={14} color="#059669" />
                          <Text style={styles.enrolledText}>Enrolled</Text>
                        </>
                      ) : (
                        <Text style={[styles.enrolledText, { color: '#64748B' }]}>+ Add Core</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        isEnrolled && { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
                      ]}
                      onPress={() => toggleEnrollment(course.courseCode)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.addButtonText, isEnrolled && { color: '#059669' }]}>
                        {isEnrolled ? '✓ Added' : '+ Add'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Course Title */}
                <Text style={styles.courseTitle}>
                  {course.courseCode} {course.courseName}
                </Text>

                {/* Lecturer info */}
                {course.lecturer ? (
                  <Text style={styles.lecturer}>{course.lecturer}</Text>
                ) : null}

                {/* Slot Selection (if any) */}
                {hasSlots ? (
                  <View style={styles.slotsWrapper}>
                    {course.slots!.map((slot) => {
                      const isSelected = curSlot === slot.slotName;
                      const isClash = slot.slotName === 'Slot B' && course.courseCode === 'IT3080';

                      return (
                        <TouchableOpacity
                          key={slot.slotName}
                          style={[
                            styles.slotOption,
                            isSelected && styles.selectedSlot,
                            isClash && isSelected && styles.conflictSlotBorder,
                          ]}
                          onPress={() => setSlot(course.courseCode, slot.slotName)}
                          activeOpacity={0.8}
                        >
                          <View style={isSelected ? styles.radioOuterActive : styles.radioOuter}>
                            {isSelected && <View style={styles.radioInner} />}
                          </View>

                          <View style={styles.slotContent}>
                            <Text style={styles.slotTitle}>
                              {slot.slotName}: {slot.day} {slot.startTime} - {slot.endTime}
                            </Text>
                            <Text style={styles.slotRoom}>
                              {slot.room} {isClash ? '• Clash with IT3060 Lab' : '• Optimal'}
                            </Text>
                          </View>

                          {isSelected && !isClash && (
                            <View style={styles.selectedBadge}>
                              <Text style={styles.selectedText}>Selected ✓</Text>
                            </View>
                          )}

                          {isClash && (
                            <Ionicons name="warning-outline" size={18} color="#DC2626" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  // Schedule details
                  course.schedule && course.schedule.length > 0 && (
                    <View style={styles.scheduleContainer}>
                      <View style={styles.divider} />
                      {course.schedule.map((sch, sIdx) => (
                        <View key={sIdx} style={styles.scheduleRow}>
                          <Ionicons
                            name={sch.type === 'Lab' ? 'flask-outline' : 'time-outline'}
                            size={16}
                            color="#737986"
                          />
                          <Text style={styles.scheduleText}>
                            {sch.day} {sch.startTime} - {sch.endTime} ({sch.room || 'Main Hall'})
                          </Text>
                        </View>
                      ))}
                    </View>
                  )
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Bottom Confirm Bar ────────────────────────── */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.reviewButton, saving && { opacity: 0.7 }]}
          onPress={handleSaveRegistration}
          disabled={saving}
          activeOpacity={0.88}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.reviewButtonText}>
                Confirm & Sync ({totalCredits} Credits)
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Footer Navigation ─────────────────────────── */}
      <FooterTab active="courses" studentId={studentId} role="student" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Header ─────────────────────────────────────────
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notification: {
    position: 'relative',
    padding: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4F46E5',
  },

  // ── Scroll Content ─────────────────────────────────
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // ── Search Box ─────────────────────────────────────
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },

  // ── Filter Tabs ────────────────────────────────────
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '800',
  },

  // ── Academic Load Card ─────────────────────────────
  loadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  loadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  optimalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  conflictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  optimalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  conflictBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  creditValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  creditValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  creditMax: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  loadScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  targetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // ── Course Card ────────────────────────────────────
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  courseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coreBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
  },
  electiveBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  electiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  courseCredits: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  enrolledText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 4,
  },
  lecturer: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  scheduleContainer: {
    marginTop: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  scheduleText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },

  // ── Slot Options ───────────────────────────────────
  slotsWrapper: {
    marginTop: 10,
    gap: 8,
  },
  slotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  selectedSlot: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  conflictSlotBorder: {
    borderColor: '#F87171',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#4F46E5',
  },
  slotContent: {
    flex: 1,
  },
  slotTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  slotRoom: {
    fontSize: 11,
    color: '#64748B',
  },
  selectedBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  selectedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },

  // ── States ─────────────────────────────────────────
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 240,
  },

  // ── Bottom Sync Button ─────────────────────────────
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  reviewButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  createCourseApi,
  deleteCourseApi,
  fetchAdminCoursesApi,
  fetchAdminDashboardApi,
  updateCourseApi,
} from '../services/api';
import { FooterTab } from '../components/FooterTab';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  totalCourses: number;
  totalStudents: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  blockedRegistrations: number;
  coreCount: number;
  electiveCount: number;
}

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
  type?: string;
}

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
  type: 'Core' | 'Elective';
  lecturer: string;
  description?: string;
  schedule?: ScheduleItem[];
  isActive?: boolean;
}

// ─── Course Form Modal ─────────────────────────────────────────────────────────

interface CourseFormProps {
  initialCode?: string;
  initialName?: string;
  initialCredits?: string;
  initialSemester?: string;
  initialType?: 'Core' | 'Elective';
  initialLecturer?: string;
  initialDesc?: string;
  visible: boolean;
  title: string;
  subtitle?: string;
  saveLabel: string;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  isEdit?: boolean;
}

function CourseFormModal({
  initialCode = '',
  initialName = '',
  initialCredits = '4',
  initialSemester = '3',
  initialType = 'Core',
  initialLecturer = '',
  initialDesc = '',
  visible,
  title,
  subtitle,
  saveLabel,
  onClose,
  onSave,
  isEdit = false,
}: CourseFormProps) {
  const [courseCode, setCourseCode] = useState(initialCode);
  const [courseName, setCourseName] = useState(initialName);
  const [credits, setCredits] = useState(initialCredits);
  const [semester, setSemester] = useState(initialSemester);
  const [type, setType] = useState<'Core' | 'Elective'>(initialType);
  const [lecturer, setLecturer] = useState(initialLecturer);
  const [description, setDescription] = useState(initialDesc);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    setCourseCode(initialCode);
    setCourseName(initialName);
    setCredits(initialCredits);
    setSemester(initialSemester);
    setType(initialType);
    setLecturer(initialLecturer);
    setDescription(initialDesc);
    setFieldError('');
  }, [initialCode, initialName, initialCredits, initialSemester, initialType, initialLecturer, initialDesc, visible]);

  const handleSave = async () => {
    if (!courseCode.trim() || !courseName.trim()) {
      setFieldError('Course Code and Course Name are required');
      return;
    }
    if (!credits || isNaN(Number(credits)) || Number(credits) < 1) {
      setFieldError('Enter valid credits (e.g. 4)');
      return;
    }
    setSaving(true);
    setFieldError('');
    try {
      await onSave({
        courseCode: courseCode.toUpperCase().trim(),
        courseName: courseName.trim(),
        credits: Number(credits),
        semester: Number(semester),
        type,
        lecturer: lecturer.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (e: any) {
      setFieldError(e?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={mStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}
        >
          <View style={mStyles.sheet}>
            {/* Handle */}
            <View style={mStyles.handle} />

            {/* Header */}
            <View style={mStyles.header}>
              <View style={[mStyles.headerIcon, isEdit && { backgroundColor: '#ECFDF5' }]}>
                <Ionicons
                  name={isEdit ? 'pencil' : 'add'}
                  size={20}
                  color={isEdit ? '#059669' : '#4F46E5'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={mStyles.headerTitle}>{title}</Text>
                {subtitle ? <Text style={mStyles.headerSub}>{subtitle}</Text> : null}
              </View>
              <TouchableOpacity onPress={onClose} style={mStyles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {fieldError ? (
                <View style={mStyles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={mStyles.errorText}>{fieldError}</Text>
                </View>
              ) : null}

              <Text style={mStyles.label}>COURSE CODE *</Text>
              <TextInput
                style={mStyles.input}
                value={courseCode}
                onChangeText={setCourseCode}
                placeholder="e.g. IT3100"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <Text style={mStyles.label}>COURSE NAME *</Text>
              <TextInput
                style={mStyles.input}
                value={courseName}
                onChangeText={setCourseName}
                placeholder="e.g. Software Architecture"
                placeholderTextColor="#94A3B8"
              />

              <View style={mStyles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={mStyles.label}>CREDITS *</Text>
                  <TextInput
                    style={mStyles.input}
                    value={credits}
                    onChangeText={setCredits}
                    placeholder="4"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={mStyles.label}>SEMESTER *</Text>
                  <TextInput
                    style={mStyles.input}
                    value={semester}
                    onChangeText={setSemester}
                    placeholder="3"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={mStyles.label}>COURSE TYPE *</Text>
              <View style={mStyles.typeRow}>
                {(['Core', 'Elective'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[mStyles.typeBtn, type === t && mStyles.typeBtnActive]}
                    onPress={() => setType(t)}
                    activeOpacity={0.8}
                  >
                    <Text style={[mStyles.typeBtnText, type === t && mStyles.typeBtnTextActive]}>
                      {t} Module
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={mStyles.label}>LECTURER / DEPARTMENT</Text>
              <TextInput
                style={mStyles.input}
                value={lecturer}
                onChangeText={setLecturer}
                placeholder="e.g. Prof. John Smith • Dept of Computing"
                placeholderTextColor="#94A3B8"
              />

              <Text style={mStyles.label}>DESCRIPTION</Text>
              <TextInput
                style={[mStyles.input, { height: 74, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Brief course overview and learning objectives..."
                placeholderTextColor="#94A3B8"
                multiline
              />
            </ScrollView>

            <TouchableOpacity
              style={[
                mStyles.saveBtn,
                isEdit && { backgroundColor: '#059669', shadowColor: '#059669' },
                saving && { opacity: 0.75 },
              ]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.88}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={isEdit ? 'checkmark-circle-outline' : 'add-circle-outline'}
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={mStyles.saveBtnText}>{saveLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.7,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    marginBottom: 4,
  },
  row2: { flexDirection: 'row' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  typeBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  typeBtnTextActive: { color: '#4F46E5', fontWeight: '800' },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

// ─── Course Card Component ────────────────────────────────────────────────────

function CourseCard({
  course,
  onEdit,
  onDelete,
}: {
  course: Course;
  onEdit: (c: Course) => void;
  onDelete: (id: string, code: string) => void;
}) {
  const isCore = course.type === 'Core';
  return (
    <View style={cStyles.card}>
      <View style={cStyles.cardTop}>
        <View style={cStyles.metaLeft}>
          <View style={[cStyles.typePill, isCore ? cStyles.pillCore : cStyles.pillElective]}>
            <Text style={[cStyles.pillText, isCore ? cStyles.pillTextCore : cStyles.pillTextElective]}>
              {course.type.toUpperCase()}
            </Text>
          </View>
          <Text style={cStyles.creditsBadge}>{course.credits || 4}.0 cr</Text>
          <View style={cStyles.semBadge}>
            <Text style={cStyles.semText}>SEM {course.semester || 3}</Text>
          </View>
        </View>

        <View style={cStyles.actions}>
          <TouchableOpacity
            style={cStyles.editBtn}
            onPress={() => onEdit(course)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={13} color="#4F46E5" />
            <Text style={cStyles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={cStyles.deleteBtn}
            onPress={() => onDelete(course._id, course.courseCode)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={13} color="#DC2626" />
            <Text style={cStyles.deleteBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={cStyles.title}>
        {course.courseCode} {course.courseName}
      </Text>

      {course.lecturer ? (
        <View style={cStyles.lecturerRow}>
          <Ionicons name="person-circle-outline" size={14} color="#64748B" />
          <Text style={cStyles.lecturerText} numberOfLines={1}>
            {course.lecturer}
          </Text>
        </View>
      ) : null}

      {course.description ? (
        <Text style={cStyles.descText} numberOfLines={2}>
          {course.description}
        </Text>
      ) : null}
    </View>
  );
}

const cStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillCore: { backgroundColor: '#EEF2FF' },
  pillElective: { backgroundColor: '#ECFDF5' },
  pillText: { fontSize: 10, fontWeight: '800' },
  pillTextCore: { color: '#4F46E5' },
  pillTextElective: { color: '#059669' },
  creditsBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  semBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  semText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  actions: { flexDirection: 'row', gap: 6 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  editBtnText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 6,
  },
  lecturerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lecturerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  descText: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
    marginTop: 2,
  },
});

// ─── Main Admin Dashboard Component ──────────────────────────────────────────

export default function AdminDashboardScreen() {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 430 || height < 860;

  const params = useLocalSearchParams();
  const adminName = (params.adminName as string) || 'Dr. Sarah Mitchell';
  const adminId = (params.adminId as string) || 'ADM001';
  const adminDept = (params.adminDept as string) || 'Academic Affairs';

  const [stats, setStats] = useState<Stats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add modal
  const [addVisible, setAddVisible] = useState(false);

  // Edit modal
  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const [dashRes, coursesRes] = await Promise.all([
        fetchAdminDashboardApi(),
        fetchAdminCoursesApi(),
      ]);
      if (dashRes?.success) setStats(dashRes.stats);
      if (coursesRes?.success) setCourses(coursesRes.courses || []);
    } catch (e) {
      console.warn('Admin dashboard error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAdd = async (data: any) => {
    const res = await createCourseApi(data);
    if (!res?.success) throw new Error(res?.message || 'Failed to create course');
    await loadData();
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setEditVisible(true);
  };

  const handleUpdate = async (data: any) => {
    if (!editing) return;
    const res = await updateCourseApi(editing._id, data);
    if (!res?.success) throw new Error(res?.message || 'Failed to update course');
    await loadData();
  };

  const handleDelete = (id: string, code: string) => {
    Alert.alert(
      'Remove Course',
      `Remove ${code} from the catalogue? Students will no longer be able to register for this module.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteCourseApi(id);
            if (res?.success) loadData();
          },
        },
      ]
    );
  };

  const initials = (name: string) => {
    const parts = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.substring(0, 2) || 'AD').toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Scrollable Dashboard Content ────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isCompact && styles.scrollContentCompact,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
      >
        {/* ── Top Bar Header (Classy, matching Student Dashboard) ────── */}
        <View style={[styles.topBar, isCompact && styles.topBarCompact]}>
          <View style={styles.profileRow}>
            <TouchableOpacity
              style={[styles.avatar, isCompact && styles.avatarCompact]}
              onPress={() =>
                router.push({
                  pathname: '/profile',
                  params: { adminId, adminName, adminDept, role: 'admin' },
                })
              }
              activeOpacity={0.8}
            >
              <Text style={[styles.avatarText, isCompact && styles.avatarTextCompact]}>
                {initials(adminName)}
              </Text>
            </TouchableOpacity>

            <View>
              <View style={[styles.campusRow, isCompact && styles.campusRowCompact]}>
                <View style={styles.greenDot} />
                <Text style={[styles.campusText, isCompact && styles.campusTextCompact]}>
                  {adminId} • {adminDept.toUpperCase()}
                </Text>
              </View>

              <Text style={[styles.userName, isCompact && styles.userNameCompact]}>
                {adminName}
              </Text>
            </View>
          </View>

          <View style={[styles.headerActions, isCompact && styles.headerActionsCompact]}>
            <TouchableOpacity
              style={[styles.headerIconButton, isCompact && styles.headerIconButtonCompact]}
              onPress={() => setAddVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#4F46E5" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerIconButton, isCompact && styles.headerIconButtonCompact]}
              onPress={() =>
                router.push({
                  pathname: '/profile',
                  params: { adminId, adminName, adminDept, role: 'admin' },
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={19} color="#374151" />
              <View style={[styles.notificationDot, isCompact && styles.notificationDotCompact]} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#4F46E5" size="large" />
            <Text style={styles.loadingText}>Loading Admin Centre…</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* ── Hero Card (Classy, matching Student Dashboard) ──────── */}
            <View style={[styles.heroCard, isCompact && styles.heroCardCompact]}>
              <View style={[styles.heroTopRow, isCompact && styles.heroTopRowCompact]}>
                <View style={styles.heroLabelWrap}>
                  <View style={[styles.heroIcon, isCompact && styles.heroIconCompact]}>
                    <Ionicons name="shield-checkmark" size={18} color="#4F46E5" />
                  </View>

                  <View>
                    {!isCompact ? (
                      <Text style={styles.heroEyebrow}>CENTRAL CURRICULUM PORTAL</Text>
                    ) : null}

                    <Text style={[styles.heroTitle, isCompact && styles.heroTitleCompact]}>
                      Course Administration
                    </Text>
                  </View>
                </View>

                <View style={[styles.operationalBadge, isCompact && styles.operationalBadgeCompact]}>
                  <View style={styles.greenDotSmall} />
                  <Text style={[styles.operationalText, isCompact && styles.operationalTextCompact]}>
                    SYSTEM ACTIVE
                  </Text>
                </View>
              </View>

              {!isCompact ? (
                <Text style={styles.heroMeta}>
                  {adminDept} • Real-Time Timetable & Clash Synchronization
                </Text>
              ) : null}

              {/* Progress & Quick Stats Track */}
              <View style={[styles.creditBlock, isCompact && styles.creditBlockCompact]}>
                <View style={styles.creditRow}>
                  <View style={styles.creditLeft}>
                    <Ionicons name="layers-outline" size={15} color="#4F46E5" />
                    <Text style={[styles.creditLabel, isCompact && styles.creditLabelCompact]}>
                      Module Distribution
                    </Text>
                  </View>

                  <Text style={[styles.creditCount, isCompact && styles.creditCountCompact]}>
                    <Text style={[styles.creditCountStrong, isCompact && styles.creditCountStrongCompact]}>
                      {stats?.coreCount ?? 0} Core
                    </Text>{' '}
                    • {stats?.electiveCount ?? 0} Elective
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          ((stats?.totalCourses ?? 1) / Math.max(stats?.totalCourses ?? 1, 10)) * 100,
                          100
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Primary Action Button */}
              <TouchableOpacity
                style={[styles.primaryButton, isCompact && styles.primaryButtonCompact]}
                activeOpacity={0.88}
                onPress={() => setAddVisible(true)}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={[styles.primaryButtonText, isCompact && styles.primaryButtonTextCompact]}>
                  Add New Course
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#A5B4FC" />
              </TouchableOpacity>
            </View>

            {/* ── Stats Grid (Classy 2x2 matching Student Dashboard) ──── */}
            <View style={styles.statsGrid}>
              {/* Stat 1: Total Courses */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Total Modules</Text>
                  <View style={styles.statIconPill}>
                    <Ionicons name="book-outline" size={14} color="#4F46E5" />
                  </View>
                </View>
                <Text style={styles.statValue}>{stats?.totalCourses ?? courses.length} Courses</Text>
                <Text style={styles.statSubtext}>
                  {stats?.coreCount ?? 0} Core • {stats?.electiveCount ?? 0} Elective
                </Text>
                <View style={styles.statFooterRow}>
                  <Text style={styles.statFooterLabel}>Catalogue</Text>
                  <Text style={styles.statFooterValue}>Active</Text>
                </View>
              </View>

              {/* Stat 2: Students & Registrations */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Registrations</Text>
                  <View style={styles.statIconPillGreen}>
                    <Ionicons name="people-outline" size={14} color="#059669" />
                  </View>
                </View>
                <Text style={[styles.statValue, styles.greenValue]}>
                  {stats?.totalRegistrations ?? 0} Total
                </Text>
                <Text style={styles.statSubtext}>
                  {stats?.totalStudents ?? 0} Enrolled Students
                </Text>
                <View style={styles.statFooterRow}>
                  <Text style={styles.statFooterLabel}>Status</Text>
                  <Text style={styles.statFooterValueGreen}>
                    {stats?.confirmedRegistrations ?? 0} Confirmed
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Clash Overview Row (If clashes present or clean state) ─ */}
            <View style={styles.clashAlertCard}>
              <View style={styles.clashAlertLeft}>
                <View
                  style={[
                    styles.clashIconWrap,
                    (stats?.blockedRegistrations ?? 0) > 0
                      ? { backgroundColor: '#FEF2F2' }
                      : { backgroundColor: '#ECFDF5' },
                  ]}
                >
                  <Ionicons
                    name={
                      (stats?.blockedRegistrations ?? 0) > 0
                        ? 'warning-outline'
                        : 'shield-checkmark-outline'
                    }
                    size={20}
                    color={(stats?.blockedRegistrations ?? 0) > 0 ? '#DC2626' : '#059669'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clashAlertTitle}>
                    {(stats?.blockedRegistrations ?? 0) > 0
                      ? `${stats?.blockedRegistrations} Timetable Conflicts Flagged`
                      : '0 Timetable Conflicts Detected'}
                  </Text>
                  <Text style={styles.clashAlertSub}>
                    {(stats?.blockedRegistrations ?? 0) > 0
                      ? 'Student registrations held in blocked state until resolved.'
                      : 'Automated timetable clash detection active for all schedules.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Section Title & Course Catalogue ───────────────────── */}
            <View style={styles.sectionRow}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Course Catalogue</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{courses.length}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setAddVisible(true)} activeOpacity={0.7}>
                <Text style={styles.sectionLink}>+ Add Module</Text>
              </TouchableOpacity>
            </View>

            {courses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="book-outline" size={40} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No courses found</Text>
                <Text style={styles.emptySub}>
                  Tap "+ Add Module" to publish the first course to students.
                </Text>
              </View>
            ) : (
              courses.map((c) => (
                <CourseCard
                  key={c._id || c.courseCode}
                  course={c}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Add Course Modal ────────────────────────────────────────── */}
      <CourseFormModal
        visible={addVisible}
        title="Add New Course"
        subtitle="Will be immediately visible in student course selection"
        saveLabel="Create Course"
        onClose={() => setAddVisible(false)}
        onSave={handleAdd}
      />

      {/* ── Edit Course Modal ───────────────────────────────────────── */}
      <CourseFormModal
        visible={editVisible}
        title="Edit Course"
        subtitle={editing ? `${editing.courseCode} — changes sync immediately` : ''}
        saveLabel="Save Changes"
        isEdit
        initialCode={editing?.courseCode ?? ''}
        initialName={editing?.courseName ?? ''}
        initialCredits={editing ? String(editing.credits) : '4'}
        initialSemester={editing ? String(editing.semester) : '3'}
        initialType={editing?.type ?? 'Core'}
        initialLecturer={editing?.lecturer ?? ''}
        initialDesc={editing?.description ?? ''}
        onClose={() => {
          setEditVisible(false);
          setEditing(null);
        }}
        onSave={handleUpdate}
      />

      {/* ── Unified Footer Navigation ───────────────────────────────── */}
      <FooterTab active="dashboard" adminId={adminId} role="admin" />
    </SafeAreaView>
  );
}

// ─── Styles (Matching Classy Student Dashboard Style System) ───────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 26,
  },
  scrollContentCompact: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 20,
  },

  // ── Top Bar ───────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topBarCompact: {
    marginBottom: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D8E3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarCompact: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 8,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  avatarTextCompact: {
    fontSize: 12,
  },
  campusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  campusRowCompact: {
    marginBottom: 0,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#19C37D',
    marginRight: 6,
  },
  campusText: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  campusTextCompact: {
    fontSize: 10.5,
  },
  userName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#111827',
  },
  userNameCompact: {
    fontSize: 14.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionsCompact: {
    gap: 6,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  headerIconButtonCompact: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  notificationDotCompact: {
    top: 6,
    right: 7,
    width: 5,
    height: 5,
  },

  // ── Hero Card ─────────────────────────────────────────────────
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7ECF5',
    marginBottom: 14,
    shadowColor: '#1E293B',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroCardCompact: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroTopRowCompact: {
    marginBottom: 6,
  },
  heroLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  heroIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconCompact: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  heroEyebrow: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  heroTitleCompact: {
    fontSize: 15.5,
  },
  operationalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDFDF5',
    borderWidth: 1,
    borderColor: '#B9F3D3',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  operationalBadgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  greenDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#19C37D',
  },
  operationalText: {
    fontSize: 10,
    color: '#0F9F59',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  operationalTextCompact: {
    fontSize: 9,
  },
  heroMeta: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
  },

  // ── Credit Block ──────────────────────────────────────────────
  creditBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  creditBlockCompact: {
    padding: 10,
    marginBottom: 10,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  creditLabelCompact: {
    fontSize: 11,
  },
  creditCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  creditCountCompact: {
    fontSize: 11,
  },
  creditCountStrong: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  creditCountStrongCompact: {
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },

  // ── Primary Action Button ─────────────────────────────────────
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonCompact: {
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButtonTextCompact: {
    fontSize: 13,
  },

  // ── Stats Grid ────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7ECF5',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '700',
  },
  statIconPill: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconPillGreen: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  greenValue: {
    color: '#059669',
  },
  statSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  statFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  statFooterLabel: {
    fontSize: 10.5,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  statFooterValue: {
    fontSize: 10.5,
    color: '#4F46E5',
    fontWeight: '800',
  },
  statFooterValueGreen: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '800',
  },

  // ── Clash Alert Card ──────────────────────────────────────────
  clashAlertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7ECF5',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  clashAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clashIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clashAlertTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  clashAlertSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },

  // ── Section Row ───────────────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  countBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  sectionLink: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '700',
  },

  // ── Empty State ───────────────────────────────────────────────
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
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

  // ── Loading Wrap ──────────────────────────────────────────────
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});

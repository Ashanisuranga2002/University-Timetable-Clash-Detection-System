import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { fetchDashboardApi } from '../services/api';

export default function DashboardScreen() {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 430 || height < 860;

  const params = useLocalSearchParams();
  const studentId = (params.studentId as string) || 'IT21047138';

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await fetchDashboardApi(studentId);
      if (res?.success) {
        setDashboardData(res);
      }
    } catch (err: any) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [studentId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const student = dashboardData?.student || {
    name: 'Alex Perera',
    studentId: 'IT21047138',
    programme: 'BSc (Hons) in Information Technology',
    semester: 3,
    initials: 'AP',
  };

  const academics = dashboardData?.academics || {
    registeredCount: 4,
    totalCredits: 16,
    maxCredits: 20,
    creditPercentage: 80,
    status: 'confirmed',
  };

  const clashes = dashboardData?.clashes || {
    hasClashes: false,
    count: 0,
    items: [],
  };

  const scheduleList =
    dashboardData?.schedule && dashboardData.schedule.length > 0
      ? dashboardData.schedule.slice(0, 3)
      : [
          {
            id: '1',
            time: '09:00 - 11:00 AM',
            tag: 'LAB',
            courseCode: 'IT3060',
            courseName: 'Human Computer Interaction',
            location: 'Computing Block C • Lab 04',
          },
          {
            id: '2',
            time: '13:30 - 15:30 PM',
            tag: 'LECTURE',
            courseCode: 'IT3040',
            courseName: 'Cloud Computing Systems',
            location: 'Main Complex • Hall 3A',
          },
        ];

  return (
    <View style={styles.container}>
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
        <View style={[styles.topBar, isCompact && styles.topBarCompact]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, isCompact && styles.avatarCompact]}>
              <Text
                style={[
                  styles.avatarText,
                  isCompact && styles.avatarTextCompact,
                ]}
              >
                {student.initials || 'ST'}
              </Text>
            </View>

            <View>
              <View
                style={[
                  styles.campusRow,
                  isCompact && styles.campusRowCompact,
                ]}
              >
                <View style={styles.greenDot} />

                <Text
                  style={[
                    styles.campusText,
                    isCompact && styles.campusTextCompact,
                  ]}
                >
                  {student.studentId} • SEM {student.semester}
                </Text>
              </View>

              <Text
                style={[
                  styles.userName,
                  isCompact && styles.userNameCompact,
                ]}
              >
                {student.name}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.headerActions,
              isCompact && styles.headerActionsCompact,
            ]}
          >
            <View
              style={[
                styles.headerIconButton,
                isCompact && styles.headerIconButtonCompact,
              ]}
            >
              <Text
                style={[
                  styles.headerGlyph,
                  isCompact && styles.headerGlyphCompact,
                ]}
              >
                ⌗
              </Text>
            </View>

            <View
              style={[
                styles.headerIconButton,
                isCompact && styles.headerIconButtonCompact,
              ]}
            >
              <Text
                style={[
                  styles.headerGlyph,
                  isCompact && styles.headerGlyphCompact,
                ]}
              >
                🔔
              </Text>

              <View
                style={[
                  styles.notificationDot,
                  isCompact && styles.notificationDotCompact,
                ]}
              />
            </View>
          </View>
        </View>

        <View style={[styles.heroCard, isCompact && styles.heroCardCompact]}>
          <View
            style={[
              styles.heroTopRow,
              isCompact && styles.heroTopRowCompact,
            ]}
          >
            <View style={styles.heroLabelWrap}>
              <View
                style={[
                  styles.heroIcon,
                  isCompact && styles.heroIconCompact,
                ]}
              >
                <Text
                  style={[
                    styles.heroIconGlyph,
                    isCompact && styles.heroIconGlyphCompact,
                  ]}
                >
                  ✦
                </Text>
              </View>

              <View>
                {!isCompact ? (
                  <Text style={styles.heroEyebrow}>
                    SEMESTER {student.semester} ENROLLMENT
                  </Text>
                ) : null}

                <Text
                  style={[
                    styles.heroTitle,
                    isCompact && styles.heroTitleCompact,
                  ]}
                >
                  Course Enrollment
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.operationalBadge,
                isCompact && styles.operationalBadgeCompact,
                clashes.hasClashes && { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
              ]}
            >
              <View style={[styles.greenDotSmall, clashes.hasClashes && { backgroundColor: '#DC2626' }]} />

              <Text
                style={[
                  styles.operationalText,
                  isCompact && styles.operationalTextCompact,
                  clashes.hasClashes && { color: '#DC2626' },
                ]}
              >
                {clashes.hasClashes ? 'CLASH DETECTED' : 'OPERATIONAL / OPEN'}
              </Text>
            </View>
          </View>

          {!isCompact ? (
            <Text style={styles.heroMeta}>
              {student.programme || 'Information Technology'}
            </Text>
          ) : null}

          <View
            style={[
              styles.creditBlock,
              isCompact && styles.creditBlockCompact,
            ]}
          >
            <View style={styles.creditRow}>
              <View style={styles.creditLeft}>
                <Text
                  style={[
                    styles.creditGlyph,
                    isCompact && styles.creditGlyphCompact,
                  ]}
                >
                  ▣
                </Text>

                <Text
                  style={[
                    styles.creditLabel,
                    isCompact && styles.creditLabelCompact,
                  ]}
                >
                  Credit Load
                </Text>
              </View>

              <Text
                style={[
                  styles.creditCount,
                  isCompact && styles.creditCountCompact,
                ]}
              >
                <Text
                  style={[
                    styles.creditCountStrong,
                    isCompact && styles.creditCountStrongCompact,
                  ]}
                >
                  {academics.totalCredits}
                </Text>{' '}
                / {academics.maxCredits} Credits
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(academics.creditPercentage, 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* Continue Registration Button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isCompact && styles.primaryButtonCompact,
            ]}
            activeOpacity={0.88}
            onPress={() =>
              router.push({
                pathname: '/course-selection',
                params: { studentId },
              })
            }
          >
            <Text
              style={[
                styles.primaryButtonText,
                isCompact && styles.primaryButtonTextCompact,
              ]}
            >
              Continue Registration
            </Text>

            <Text
              style={[
                styles.primaryArrowGlyph,
                isCompact && styles.primaryArrowGlyphCompact,
              ]}
            >
              →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Registered</Text>

              <View style={styles.statIconPill}>
                <Text style={styles.statPillGlyph}>▤</Text>
              </View>
            </View>

            <Text style={styles.statValue}>{academics.registeredCount} Modules</Text>

            <Text style={styles.statSubtext}>
              {academics.totalCredits >= 16 ? 'Target achieved' : 'Pending completion'}
            </Text>

            <View style={styles.statFooterRow}>
              <Text style={styles.statFooterLabel}>Credit Load</Text>
              <Text style={styles.statFooterValue}>{academics.creditPercentage}%</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Timetable</Text>

              <View
                style={
                  clashes.hasClashes
                    ? styles.statIconPillRed
                    : styles.statIconPillGreen
                }
              >
                <Text
                  style={
                    clashes.hasClashes
                      ? styles.statPillGlyphRed
                      : styles.statPillGlyphGreen
                  }
                >
                  {clashes.hasClashes ? '!' : '✓'}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.statValue,
                clashes.hasClashes ? styles.redValue : styles.greenValue,
              ]}
            >
              {clashes.hasClashes
                ? `${clashes.count} Clash${clashes.count > 1 ? 'es' : ''}`
                : 'No Clashes'}
            </Text>

            <Text
              style={[
                styles.statSubtext,
                clashes.hasClashes ? styles.redSubtext : styles.greenSubtext,
              ]}
            >
              {clashes.hasClashes ? 'Overlap in schedule' : 'Validated & synced'}
            </Text>

            <View style={styles.statFooterRow}>
              <Text style={styles.statFooterLabel}>Status</Text>
              <Text
                style={
                  clashes.hasClashes
                    ? styles.statFooterValueRed
                    : styles.statFooterValueGreen
                }
              >
                {clashes.hasClashes ? 'Action needed' : 'Optimal'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Enrolled Schedule</Text>
          <Text
            style={styles.sectionLink}
            onPress={() =>
              router.push({
                pathname: '/course-selection',
                params: { studentId },
              })
            }
          >
            Manage Courses
          </Text>
        </View>

        {scheduleList.map((item: any, idx: number) => (
          <View key={item.id || idx} style={styles.scheduleCard}>
            <View
              style={[
                styles.scheduleAccent,
                idx % 2 === 1 && styles.scheduleAccentGreen,
              ]}
            />

            <View style={styles.scheduleBody}>
              <View style={styles.scheduleTopRow}>
                <Text style={styles.scheduleTime}>
                  {item.day ? `${item.day} • ` : ''}
                  {item.time}
                </Text>

                <Text
                  style={[
                    styles.scheduleTag,
                    idx % 2 === 1 && styles.scheduleTagGreen,
                  ]}
                >
                  {item.tag || 'CLASS'}
                </Text>
              </View>

              <Text style={styles.scheduleCode}>{item.courseCode}</Text>

              <Text style={styles.scheduleTitle}>{item.courseName}</Text>

              <Text style={styles.scheduleLocation}>{item.location}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Quick Services</Text>

        <View style={styles.quickGrid}>
          <View style={styles.quickCard}>
            <View style={styles.quickIconPurple}>
              <Text style={styles.quickGlyphPurple}>T</Text>
            </View>

            <Text style={styles.quickLabel}>Timetable</Text>
          </View>

          <View style={styles.quickCard}>
            <View style={styles.quickIconGreen}>
              <Text style={styles.quickGlyphGreen}>E</Text>
            </View>

            <Text style={styles.quickLabel}>Electives</Text>
          </View>

          <View style={styles.quickCard}>
            <View style={styles.quickIconBlue}>
              <Text style={styles.quickGlyphBlue}>!</Text>
            </View>

            <Text style={styles.quickLabel}>Alerts</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

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
    letterSpacing: 0.4,
  },

  campusTextCompact: {
    fontSize: 10.5,
    letterSpacing: 0.3,
  },

  userName: {
    fontSize: 19,
    color: '#111827',
    fontWeight: '800',
  },

  userNameCompact: {
    fontSize: 17,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },

  headerActionsCompact: {
    gap: 8,
  },

  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  headerIconButtonCompact: {
    width: 38,
    height: 38,
    borderRadius: 13,
  },

  notificationDot: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },

  notificationDotCompact: {
    right: 8,
    top: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  headerGlyph: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4B5563',
  },

  headerGlyphCompact: {
    fontSize: 14,
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
    marginBottom: 16,
  },

  heroCardCompact: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },

  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  heroTopRowCompact: {
    marginBottom: 8,
  },

  heroLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  heroIconCompact: {
    width: 30,
    height: 30,
    borderRadius: 10,
    marginRight: 8,
  },

  heroIconGlyph: {
    fontSize: 15,
    fontWeight: '900',
    color: '#19A86B',
  },

  heroIconGlyphCompact: {
    fontSize: 13,
  },

  heroEyebrow: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '800',
    letterSpacing: 0.35,
  },

  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },

  heroTitleCompact: {
    fontSize: 17,
    marginTop: 1,
  },

  operationalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#19C37D',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 3,
  },

  operationalBadgeCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 1,
  },

  greenDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#19C37D',
    marginRight: 6,
  },

  operationalText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#19A86B',
  },

  operationalTextCompact: {
    fontSize: 9,
  },

  heroMeta: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 12,
  },

  creditBlock: {
    backgroundColor: '#F7F8FC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },

  creditBlockCompact: {
    padding: 10,
    marginBottom: 12,
    borderRadius: 14,
  },

  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  creditLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  creditGlyph: {
    fontSize: 14,
    fontWeight: '900',
    color: '#6B7280',
  },

  creditGlyphCompact: {
    fontSize: 13,
  },

  creditLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },

  creditLabelCompact: {
    fontSize: 12,
  },

  creditCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '700',
  },

  creditCountCompact: {
    fontSize: 12,
  },

  creditCountStrong: {
    fontSize: 18,
    fontWeight: '800',
    color: '#5B4DF5',
  },

  creditCountStrongCompact: {
    fontSize: 16,
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },

  progressFill: {
    width: '80%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#5B4DF5',
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#5B4DF5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  primaryButtonCompact: {
    minHeight: 48,
    borderRadius: 14,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  primaryButtonTextCompact: {
    fontSize: 14,
  },

  primaryArrowGlyph: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  primaryArrowGlyphCompact: {
    fontSize: 16,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },

  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  statLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },

  statIconPill: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#F2EEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statPillGlyph: {
    fontSize: 13,
    fontWeight: '900',
    color: '#5B4DF5',
  },

  statIconPillGreen: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#ECFDF3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statPillGlyphGreen: {
    fontSize: 13,
    fontWeight: '900',
    color: '#19A86B',
  },

  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },

  greenValue: {
    color: '#19A86B',
  },

  redValue: {
    color: '#DC2626',
  },

  statSubtext: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12,
  },

  greenSubtext: {
    color: '#19A86B',
  },

  redSubtext: {
    color: '#DC2626',
  },

  statIconPillRed: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statPillGlyphRed: {
    fontSize: 13,
    fontWeight: '900',
    color: '#DC2626',
  },

  statFooterValueRed: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },

  statFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },

  statFooterLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },

  statFooterValue: {
    color: '#5B4DF5',
    fontSize: 12,
    fontWeight: '800',
  },

  statFooterValueGreen: {
    color: '#19A86B',
    fontSize: 12,
    fontWeight: '800',
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  sectionLink: {
    fontSize: 13,
    color: '#5B4DF5',
    fontWeight: '800',
  },

  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    overflow: 'hidden',
  },

  scheduleAccent: {
    width: 6,
    backgroundColor: '#5B4DF5',
  },

  scheduleAccentGreen: {
    backgroundColor: '#19C37D',
  },

  scheduleBody: {
    flex: 1,
    padding: 14,
  },

  scheduleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  scheduleTime: {
    color: '#5B4DF5',
    fontSize: 13,
    fontWeight: '800',
  },

  scheduleTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5B4DF5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  scheduleTagGreen: {
    color: '#19A86B',
    backgroundColor: '#ECFDF3',
  },

  scheduleCode: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },

  scheduleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 3,
  },

  scheduleLocation: {
    color: '#6B7280',
    fontSize: 12.5,
  },

  quickGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    alignItems: 'center',
  },

  quickIconPurple: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F2EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  quickGlyphPurple: {
    fontSize: 18,
    fontWeight: '900',
    color: '#5B4DF5',
  },

  quickIconGreen: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ECFDF3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  quickGlyphGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: '#19A86B',
  },

  quickIconBlue: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  quickGlyphBlue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#3B82F6',
  },

  quickLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
});
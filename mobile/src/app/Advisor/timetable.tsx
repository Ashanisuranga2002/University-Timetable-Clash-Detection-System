import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAllRequests } from '@/services/advisorService';
import { fetchDashboardApi, previewTimetableApi } from '@/services/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const ROW_HEIGHT = 58;
const GRID_START_HOUR = 8;
const GRID_END_HOUR = 18;
const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);

const COLORS = [
  { color: '#ECFDF3', borderColor: '#A6F4C5', textColor: '#027A48' },
  { color: '#FFFAEB', borderColor: '#FEDF89', textColor: '#B54708' },
  { color: '#EFF8FF', borderColor: '#B2DDFF', textColor: '#175CD3' },
  { color: '#F9F5FF', borderColor: '#E9D7FE', textColor: '#6941C6' }
];

const formatTimeStr = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export default function AdvisorTimetableScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ADVISEE' | 'SCHEDULE'>('ADVISEE');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [clashes, setClashes] = useState<any[]>([]);
  const [nuwanRequest, setNuwanRequest] = useState<any>(null);

  const studentId = 'IT22334455';

  const loadNuwanTimetable = async () => {
    try {
      setLoading(true);

      const requests = await getAllRequests().catch(() => []);
      const reqList = Array.isArray(requests) ? requests : requests?.requests || [];
      const nuwanReq = reqList.find((r: any) => r.studentId === studentId);
      if (nuwanReq) {
        setNuwanRequest(nuwanReq);
      }

      const dash = await fetchDashboardApi(studentId).catch(() => null);
      let courseCodes = ['IT3060', 'IT3040', 'IT3080', 'IT3090'];
      let selectedSlots: Record<string, string> = { IT3080: 'Slot B' };

      if (dash?.success && dash.academics?.courses?.length) {
        courseCodes = dash.academics.courses.map((c: any) => c.courseCode);
        if (dash.academics.selectedSlots) {
          selectedSlots = { ...selectedSlots, ...dash.academics.selectedSlots };
        }
      }

      const previewRes = await previewTimetableApi(courseCodes, selectedSlots).catch(() => null);
      const courses = previewRes?.previewCourses || [];

      let eventId = 1;
      const rawEvents: any[] = [];

      courses.forEach((c: any, index: number) => {
        const colorObj = COLORS[index % COLORS.length];
        const sessions: any[] = [];

        if (c.schedule && c.schedule.length > 0) {
          sessions.push(...c.schedule);
        }

        if (c.slots && c.slots.length > 0) {
          const chosenSlotName = selectedSlots[c.courseCode] || selectedSlots[c._id];
          const activeSlot = chosenSlotName
            ? c.slots.find((s: any) => s.slotName === chosenSlotName)
            : c.slots[0];
          if (activeSlot) {
            sessions.push(activeSlot);
          }
        }

        sessions.forEach((session: any) => {
          if (!session.day || !session.startTime || !session.endTime) return;
          const toMinutes = (v: string) => {
            const [h, m = '0'] = v.split(':');
            return Number(h) * 60 + Number(m);
          };
          const startMinutes = toMinutes(session.startTime);
          const endMinutes = toMinutes(session.endTime);
          const dayMap: Record<string, string> = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri' };
          const dayStr = dayMap[session.day] || session.day.substring(0, 3);

          rawEvents.push({
            id: String(eventId++),
            course: c.courseCode,
            courseName: c.courseName,
            type: session.type || session.slotName || 'Class',
            room: session.room || session.venue || 'TBA',
            day: dayStr,
            dayName: session.day,
            group: session.slotName || null,
            startMinutes,
            endMinutes,
            durationMinutes: Math.max(30, endMinutes - startMinutes),
            ...colorObj,
          });
        });
      });

      const detectedClashes: any[] = [];
      const clashingIds = new Set<string>();

      for (let i = 0; i < rawEvents.length; i++) {
        for (let j = i + 1; j < rawEvents.length; j++) {
          const e1 = rawEvents[i];
          const e2 = rawEvents[j];
          if (e1.course === e2.course || e1.day !== e2.day) continue;
          const oStart = Math.max(e1.startMinutes, e2.startMinutes);
          const oEnd = Math.min(e1.endMinutes, e2.endMinutes);
          if (oStart < oEnd) {
            clashingIds.add(e1.id);
            clashingIds.add(e2.id);
            detectedClashes.push({
              course1Code: e1.course,
              course1Name: e1.courseName || e1.course,
              course2Code: e2.course,
              course2Name: e2.courseName || e2.course,
              day: e1.dayName || e1.day,
              startTime: formatTimeStr(oStart),
              endTime: formatTimeStr(oEnd),
              room1: e1.room,
              room2: e2.room,
              course1Group: e1.group || e1.type,
              course2Group: e2.group || e2.type,
              overlapMinutes: oEnd - oStart,
            });
          }
        }
      }

      const dayMapGroups: Record<string, any[]> = {};
      rawEvents.forEach((ev) => {
        ev.isClash = clashingIds.has(ev.id);
        if (!dayMapGroups[ev.day]) dayMapGroups[ev.day] = [];
        dayMapGroups[ev.day].push(ev);
      });

      Object.values(dayMapGroups).forEach((dayEvents) => {
        dayEvents.sort((a, b) => a.startMinutes - b.startMinutes);
        for (let i = 0; i < dayEvents.length; i++) {
          const evA = dayEvents[i];
          let maxCol = 1;
          let myCol = 0;
          for (let j = 0; j < dayEvents.length; j++) {
            if (i === j) continue;
            const evB = dayEvents[j];
            const oStart = Math.max(evA.startMinutes, evB.startMinutes);
            const oEnd = Math.min(evA.endMinutes, evB.endMinutes);
            if (oStart < oEnd) {
              maxCol = Math.max(maxCol, 2);
              if (j < i) {
                myCol = (evB.colIndex ?? 0) + 1;
              }
            }
          }
          evA.colIndex = myCol;
          evA.colTotal = maxCol;
        }
      });

      setEvents(rawEvents);
      setClashes(detectedClashes);
    } catch (e) {
      console.warn('Error loading advisee timetable:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNuwanTimetable();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNuwanTimetable();
  };

  const handleOpenReview = () => {
    if (nuwanRequest) {
      router.push({
        pathname: '/Advisor/review-request',
        params: { requestData: JSON.stringify(nuwanRequest) }
      });
    } else {
      router.push('/Advisor/dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Advisor Timetable</Text>
      </View>

      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, activeTab === 'ADVISEE' && styles.segmentButtonActive]}
          onPress={() => setActiveTab('ADVISEE')}
        >
          <Ionicons 
            name="people-outline" 
            size={16} 
            color={activeTab === 'ADVISEE' ? '#4A3AFF' : '#667085'} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.segmentText, activeTab === 'ADVISEE' && styles.segmentTextActive]}>
            Advisee Conflicts (Nuwan)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentButton, activeTab === 'SCHEDULE' && styles.segmentButtonActive]}
          onPress={() => setActiveTab('SCHEDULE')}
        >
          <Ionicons 
            name="calendar-outline" 
            size={16} 
            color={activeTab === 'SCHEDULE' ? '#4A3AFF' : '#667085'} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.segmentText, activeTab === 'SCHEDULE' && styles.segmentTextActive]}>
            My Office Hours
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'ADVISEE' ? (
          <>
            <View style={styles.studentCard}>
              <View style={styles.studentTopRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>NS</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.studentName}>Nuwan Silva</Text>
                  <Text style={styles.studentMeta}>Student ID: IT22334455 • Semester 3</Text>
                  <Text style={styles.studentDept}>BSc (Hons) in Information Technology</Text>
                </View>
                <View style={styles.clashStatusBadge}>
                  <Text style={styles.clashStatusText}>CLASH DETECTED</Text>
                </View>
              </View>

              <View style={styles.reviewPromptRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewPromptTitle}>Active Clash Override Request</Text>
                  <Text style={styles.reviewPromptSubtitle}>
                    Wednesday overlap on IT3060 vs IT3080. Draft review ready.
                  </Text>
                </View>
                <TouchableOpacity style={styles.reviewActionButton} onPress={handleOpenReview}>
                  <Text style={styles.reviewActionText}>Review Request</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.gridSectionHeader}>
              <View style={styles.gridHeaderBadge}>
                <Ionicons name="calendar" size={16} color="#4A3AFF" />
                <Text style={styles.gridHeaderBadgeText}>NUWAN'S TIMETABLE SCHEDULE</Text>
              </View>
              <Text style={styles.gridSubtitle}>Conflicting sessions appear side-by-side in bold red.</Text>
            </View>

            {loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#4A3AFF" />
              </View>
            ) : (
              <>
                <View style={styles.gridWrapper}>
                  <View style={styles.gridHeaderRow}>
                    <View style={styles.timeColumnHeader}>
                      <Text style={styles.gridHeaderText}>TIME</Text>
                    </View>
                    {DAYS.map(day => (
                      <View key={day} style={styles.dayColumnHeader}>
                        <Text style={[styles.gridHeaderText, day === 'Wed' && { color: '#B42318', fontWeight: '800' }]}>
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.gridBody}>
                    <View style={styles.timeLabelColumn}>
                      {HOURS.map(hour => (
                        <View key={hour} style={[styles.timeLabelCell, { height: ROW_HEIGHT }]}>
                          <Text style={styles.timeText}>{hour < 10 ? `0${hour}:00` : `${hour}:00`}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={[styles.eventsArea, { height: HOURS.length * ROW_HEIGHT }]}>
                      {HOURS.map((_, index) => (
                        <View key={index} style={[styles.gridLine, { top: index * ROW_HEIGHT }]} />
                      ))}
                      {DAYS.map((_, index) => (
                        <View key={index} style={[styles.verticalGridLine, { left: `${(index / DAYS.length) * 100}%` }]} />
                      ))}

                      {events.map(event => {
                        const dayIndex = DAYS.indexOf(event.day);
                        if (dayIndex === -1) return null;

                        const topPosition = (event.startMinutes / 60 - GRID_START_HOUR) * ROW_HEIGHT;
                        const blockHeight = (event.durationMinutes / 60) * ROW_HEIGHT;

                        const colTotal = event.colTotal || 1;
                        const colIdx = event.colIndex || 0;
                        const dayWidth = 100 / DAYS.length;
                        const subWidth = dayWidth / colTotal;
                        const leftPos = (dayIndex * dayWidth) + (colIdx * subWidth);
                        const isClashing = Boolean(event.isClash);

                        return (
                          <View
                            key={event.id}
                            style={[
                              styles.eventBlock,
                              {
                                top: topPosition,
                                height: blockHeight,
                                left: `${leftPos}%` as any,
                                width: `${subWidth}%` as any,
                                backgroundColor: isClashing ? '#FEF3F2' : event.color,
                                borderColor: isClashing ? '#D92D20' : event.borderColor,
                                borderWidth: isClashing ? 1.5 : 1,
                                zIndex: isClashing ? 10 : 1,
                              }
                            ]}
                          >
                            {isClashing && (
                              <View style={styles.clashPill}>
                                <Ionicons name="warning" size={9} color="#B42318" />
                                <Text style={styles.clashPillText}>CLASH</Text>
                              </View>
                            )}
                            <Text style={[styles.eventCourse, { color: isClashing ? '#B42318' : '#101828' }]} numberOfLines={1}>
                              {event.course} {event.type ? `• ${event.type}` : ''}
                            </Text>
                            <Text style={{ fontSize: 9, color: isClashing ? '#912018' : '#475467', marginTop: 1 }} numberOfLines={1}>
                              {formatTimeStr(event.startMinutes)} - {formatTimeStr(event.endMinutes)}
                            </Text>
                            <Text style={[styles.eventRoom, { color: isClashing ? '#B42318' : event.textColor, marginTop: 1 }]} numberOfLines={1}>
                              {event.room}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <View style={styles.clashSection}>
                  <View style={styles.clashSectionHeader}>
                    <Ionicons name="alert-circle" size={20} color="#D92D20" />
                    <Text style={styles.clashSectionTitle}>
                      Detected Timetable Conflicts ({clashes.length})
                    </Text>
                  </View>

                  {clashes.map((c, i) => (
                    <View key={i} style={styles.clashCard}>
                      <View style={styles.clashCardTop}>
                        <Text style={styles.clashCardDay}>
                          {c.day.toUpperCase()} • {c.startTime} - {c.endTime} ({c.overlapMinutes} MIN OVERLAP)
                        </Text>
                        <View style={styles.clashCardBadge}>
                          <Text style={styles.clashCardBadgeText}>CRITICAL COLLISION</Text>
                        </View>
                      </View>

                      <View style={styles.clashCardRow}>
                        <View style={styles.clashBox}>
                          <Text style={styles.clashBoxCourse}>{c.course1Code}</Text>
                          <Text style={styles.clashBoxGroup}>{c.course1Group || 'Lab'}</Text>
                          <Text style={styles.clashBoxRoom}>{c.room1 || 'Campus Lab'}</Text>
                        </View>

                        <View style={styles.clashVsPill}>
                          <Text style={styles.clashVsText}>VS</Text>
                        </View>

                        <View style={[styles.clashBox, styles.clashBoxRight]}>
                          <Text style={styles.clashBoxCourse}>{c.course2Code}</Text>
                          <Text style={styles.clashBoxGroup}>{c.course2Group || 'Slot B'}</Text>
                          <Text style={styles.clashBoxRoom}>{c.room2 || 'AI Lab'}</Text>
                        </View>
                      </View>

                      <Text style={styles.clashCardFooterText}>
                        Nuwan cannot attend both {c.course1Code} and {c.course2Code} concurrently on {c.day}.
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.officeHoursContainer}>
            <View style={styles.officeHoursHeader}>
              <View style={styles.officeHoursIcon}>
                <Ionicons name="time-outline" size={24} color="#4A3AFF" />
              </View>
              <View>
                <Text style={styles.officeHoursTitle}>Academic Advising Hours</Text>
                <Text style={styles.officeHoursSubtitle}>Weekly student consultation and draft review slots</Text>
              </View>
            </View>

            <View style={styles.slotCard}>
              <View style={styles.slotHeaderRow}>
                <Text style={styles.slotDay}>Monday</Text>
                <Text style={styles.slotTime}>13:00 – 15:00</Text>
              </View>
              <Text style={styles.slotName}>Drop-in Student Academic Advising</Text>
              <Text style={styles.slotVenue}>Computing Faculty Building • Room F-102</Text>
            </View>

            <View style={styles.slotCard}>
              <View style={styles.slotHeaderRow}>
                <Text style={styles.slotDay}>Wednesday</Text>
                <Text style={styles.slotTime}>10:00 – 12:00</Text>
              </View>
              <Text style={styles.slotName}>Timetable Conflict & Course Add/Drop Reviews</Text>
              <Text style={styles.slotVenue}>Department of Informatics • Office B-204</Text>
            </View>

            <View style={styles.slotCard}>
              <View style={styles.slotHeaderRow}>
                <Text style={styles.slotDay}>Thursday</Text>
                <Text style={styles.slotTime}>15:30 – 17:00</Text>
              </View>
              <Text style={styles.slotName}>Academic Progress & Subgroup Transfer Approval</Text>
              <Text style={styles.slotVenue}>Department of Informatics • Office B-204</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    paddingHorizontal: 16, 
    paddingTop: 16, 
    paddingBottom: 12, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#EAECF0', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F7',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  segmentText: { fontSize: 12, fontWeight: '600', color: '#667085' },
  segmentTextActive: { color: '#4A3AFF', fontWeight: '700' },

  scrollContent: { padding: 16, paddingBottom: 40 },

  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    marginBottom: 16,
    elevation: 1,
  },
  studentTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A3AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  studentName: { fontSize: 16, fontWeight: '700', color: '#101828' },
  studentMeta: { fontSize: 12, color: '#475467', marginTop: 1 },
  studentDept: { fontSize: 11, color: '#667085', marginTop: 1 },
  clashStatusBadge: {
    backgroundColor: '#FEF3F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDCA',
  },
  clashStatusText: { color: '#B42318', fontSize: 10, fontWeight: '800' },

  reviewPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    gap: 10,
  },
  reviewPromptTitle: { fontSize: 13, fontWeight: '700', color: '#101828' },
  reviewPromptSubtitle: { fontSize: 11, color: '#667085', marginTop: 1 },
  reviewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A3AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  reviewActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  gridSectionHeader: { marginBottom: 12 },
  gridHeaderBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  gridHeaderBadgeText: { fontSize: 12, fontWeight: '800', color: '#4A3AFF', letterSpacing: 0.5 },
  gridSubtitle: { fontSize: 12, color: '#667085' },

  loaderWrap: { padding: 40, alignItems: 'center' },

  gridWrapper: {
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    backgroundColor: '#F9FAFB',
  },
  timeColumnHeader: {
    width: 46,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#EAECF0',
  },
  dayColumnHeader: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  gridHeaderText: { fontSize: 11, fontWeight: '700', color: '#475467' },
  gridBody: { flexDirection: 'row' },
  timeLabelColumn: {
    width: 46,
    borderRightWidth: 1,
    borderRightColor: '#EAECF0',
    backgroundColor: '#F9FAFB',
  },
  timeLabelCell: { alignItems: 'center', paddingTop: 6 },
  timeText: { fontSize: 10, color: '#667085' },
  eventsArea: { flex: 1, position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#EAECF0' },
  verticalGridLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#EAECF0' },
  eventBlock: {
    position: 'absolute',
    borderRadius: 6,
    padding: 3,
    overflow: 'hidden',
  },
  eventCourse: { fontSize: 9, fontWeight: '700' },
  eventRoom: { fontSize: 8, fontWeight: '600' },
  clashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEE4E2',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 1,
  },
  clashPillText: { fontSize: 7, fontWeight: '800', color: '#B42318' },

  clashSection: {
    backgroundColor: '#FEF3F2',
    borderWidth: 1.5,
    borderColor: '#FECDCA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  clashSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  clashSectionTitle: { fontSize: 14, fontWeight: '800', color: '#B42318' },
  clashCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDCA',
    padding: 12,
  },
  clashCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
    paddingBottom: 6,
    marginBottom: 8,
  },
  clashCardDay: { fontSize: 11, fontWeight: '700', color: '#B42318' },
  clashCardBadge: { backgroundColor: '#B42318', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  clashCardBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  clashCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clashBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  clashBoxRight: { backgroundColor: '#FEF6EE', borderColor: '#F9DBAF' },
  clashBoxCourse: { fontSize: 12, fontWeight: '700', color: '#101828' },
  clashBoxGroup: { fontSize: 11, fontWeight: '600', color: '#475467', marginTop: 1 },
  clashBoxRoom: { fontSize: 10, color: '#667085', marginTop: 1 },
  clashVsPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEE4E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  clashVsText: { fontSize: 9, fontWeight: '800', color: '#B42318' },
  clashCardFooterText: { fontSize: 11, color: '#7A271A', marginTop: 8, fontStyle: 'italic' },

  officeHoursContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  officeHoursHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  officeHoursIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  officeHoursTitle: { fontSize: 16, fontWeight: '700', color: '#101828' },
  officeHoursSubtitle: { fontSize: 12, color: '#667085', marginTop: 2 },
  slotCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    marginBottom: 10,
  },
  slotHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  slotDay: { fontSize: 13, fontWeight: '700', color: '#4A3AFF' },
  slotTime: { fontSize: 12, fontWeight: '600', color: '#344054' },
  slotName: { fontSize: 13, fontWeight: '600', color: '#101828' },
  slotVenue: { fontSize: 11, color: '#667085', marginTop: 2 },
});

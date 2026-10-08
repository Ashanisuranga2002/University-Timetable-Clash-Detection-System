import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { previewTimetableApi, submitRegistrationApi, fetchDashboardApi } from '@/services/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const ROW_HEIGHT = 60; // Each hour block is 60 pixels tall

const COLORS = [
  { color: '#ECFDF3', borderColor: '#A6F4C5', textColor: '#027A48' },
  { color: '#FFFAEB', borderColor: '#FEDF89', textColor: '#B54708' },
  { color: '#EFF8FF', borderColor: '#B2DDFF', textColor: '#175CD3' },
  { color: '#F9F5FF', borderColor: '#E9D7FE', textColor: '#6941C6' }
];

const formatPreviewTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export default function TimetablePreviewScreen() {
  const router = useRouter();
  const { studentId, courseIdsParam, selectedSlotsParam, proposedSubgroupsParam } = useLocalSearchParams();
  const proposedSubgroups = proposedSubgroupsParam ? JSON.parse(proposedSubgroupsParam as string) : [];
  const isConflictFreePreview = proposedSubgroups.length > 0;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [clashes, setClashes] = useState<any[]>([]);
  const [hasClashes, setHasClashes] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  useEffect(() => {
    fetchPreview();
  }, [courseIdsParam, proposedSubgroupsParam]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setPreviewLoaded(false);
      let courseIds = [];
      let selectedSlots = {};
      
      if (courseIdsParam) {
        courseIds = JSON.parse((courseIdsParam as string) || '[]');
        selectedSlots = JSON.parse((selectedSlotsParam as string) || '{}');
      } else {
        // Fallback for when accessed via tab directly: fetch user's saved registration
        const dashRes = await fetchDashboardApi((studentId as string) || 'IT21047138');
        if (dashRes?.success) {
          const regCourses = dashRes.academics?.courses || dashRes.registration?.courses || [];
          courseIds = regCourses.map((c: any) => c.courseCode);
        }
      }

      const res = await previewTimetableApi(courseIds, selectedSlots, proposedSubgroups);
      
      if (res?.success) {
        
        // Map previewCourses to events
        let eventId = 1;
        const newEvents: any[] = [];
        const previewCourses = res.previewCourses || [];
        
        previewCourses.forEach((c: any, index: number) => {
          const colorObj = COLORS[index % COLORS.length];
          let sessions: any[] = [];
          const courseProposal = proposedSubgroups.find((proposal: any) =>
            proposal.courseCode?.toUpperCase() === c.courseCode?.toUpperCase()
          );
          
          if (c.schedule && c.schedule.length > 0) {
            const replacedSession = courseProposal?.replaceSession;
            sessions.push(...c.schedule.filter((session: any) => !(
              replacedSession &&
              session.day?.toLowerCase() === replacedSession.day?.toLowerCase() &&
              session.startTime === replacedSession.startTime &&
              session.endTime === replacedSession.endTime
            )));
          }
          
          // Render the chosen alternative from the selection payload itself. This
          // keeps the preview accurate even if the API still returns the old slot.
          if (courseProposal?.day && courseProposal.startTime && courseProposal.endTime) {
            sessions.push({
              slotName: courseProposal.groupName,
              day: courseProposal.day,
              startTime: courseProposal.startTime,
              endTime: courseProposal.endTime,
              room: courseProposal.venue || 'TBA',
            });
          } else if (c.slots && c.slots.length > 0) {
            const chosenSlotName = selectedSlots[c._id] || selectedSlots[c.courseCode];
            let activeSlot = chosenSlotName ? c.slots.find((s: any) => s.slotName === chosenSlotName) : null;
            if (!activeSlot) activeSlot = c.slots[0];

            if (activeSlot) {
              sessions.push(activeSlot);
            }
          }

          sessions.forEach(session => {
            if (!session.day || !session.startTime || !session.endTime) return;
            
            const toMinutes = (value: string) => {
              const [hours, minutes = '0'] = value.split(':');
              return Number(hours) * 60 + Number(minutes);
            };
            const startMinutes = toMinutes(session.startTime);
            const endMinutes = toMinutes(session.endTime);
            
            const dayMap: any = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri' };
            const dayStr = dayMap[session.day] || session.day.substring(0, 3);
            const isProposedSubgroup = proposedSubgroups.some((proposal: any) =>
              proposal.courseCode?.toUpperCase() === c.courseCode?.toUpperCase() &&
              proposal.groupName === session.slotName
            );
            
            newEvents.push({
              id: String(eventId++),
              course: c.courseCode,
              type: session.type || session.slotName || 'Class',
              room: session.room || session.venue || 'TBA',
              day: dayStr,
              dayName: session.day,
              startMinutes,
              endMinutes,
              durationMinutes: Math.max(30, endMinutes - startMinutes),
              ...colorObj,
              ...(isProposedSubgroup ? {
                color: '#F4F3FF',
                borderColor: '#7A5AF8',
                textColor: '#5925DC',
              } : {}),
            });
          });
        });

        const missingProposals = proposedSubgroups.filter((proposal: any) =>
          !newEvents.some(event =>
            event.course?.toUpperCase() === proposal.courseCode?.toUpperCase() &&
            event.type === proposal.groupName
          )
        );
        if (missingProposals.length > 0) {
          throw new Error(`Selected subgroup was not included in the preview: ${missingProposals.map((proposal: any) => proposal.groupName).join(', ')}`);
        }

        setEvents(newEvents);
        const localClashes: any[] = [];
        for (let i = 0; i < newEvents.length; i += 1) {
          for (let j = i + 1; j < newEvents.length; j += 1) {
            const first = newEvents[i];
            const second = newEvents[j];
            if (first.course === second.course || first.day !== second.day) continue;
            const overlapStart = Math.max(first.startMinutes, second.startMinutes);
            const overlapEnd = Math.min(first.endMinutes, second.endMinutes);
            if (overlapStart >= overlapEnd) continue;
            localClashes.push({
              course1Code: first.course,
              course1Name: first.course,
              course2Code: second.course,
              course2Name: second.course,
              day: first.dayName || first.day,
              startTime: formatPreviewTime(first.startMinutes),
              endTime: formatPreviewTime(first.endMinutes),
              room1: first.room,
              room2: second.room,
              overlapMinutes: overlapEnd - overlapStart,
            });
          }
        }
        setClashes(localClashes);
        setHasClashes(localClashes.length > 0);
        setPreviewLoaded(true);
      }
    } catch (err) {
      console.warn('Error fetching timetable preview', err);
    } finally {
      setLoading(false);
    }
  };



  const handleConfirm = async () => {
    if (hasClashes) {
      router.replace({
        pathname: '/Student/schedule-conflict',
        params: { 
          studentId, 
          courseIdsParam, 
          selectedSlotsParam,
          proposedSubgroupsParam,
          clashesParam: JSON.stringify(clashes)
        }
      });
      return;
    }

    setSubmitting(true);
    try {
      const courseIds = JSON.parse((courseIdsParam as string) || '[]');
      const selectedSlots = JSON.parse((selectedSlotsParam as string) || '{}');
      const proposedSubgroups = proposedSubgroupsParam ? JSON.parse(proposedSubgroupsParam as string) : [];

      if (proposedSubgroups.length > 0) {
        setSubmitting(false);
        router.replace({
          pathname: '/Student/advisor-request',
          params: { studentId, proposedSubgroupsParam, previewConfirmed: 'true' }
        });
      } else {
        // Normal registration without clash
        const res = await submitRegistrationApi(studentId as string, courseIds, selectedSlots);
        router.push('/Student/registration-confirmation');
        setSubmitting(false);
      }
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Failed to confirm registration.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4A3AFF" />
      </View>
    );
  }

  const moduleCount = [...new Set(events.map(e => e.course))].length;
  const clashCount = clashes.length;
  const gridStartHour = events.length ? Math.min(8, Math.floor(Math.min(...events.map(e => e.startMinutes / 60)))) : 8;
  const gridEndHour = events.length ? Math.max(17, Math.ceil(Math.max(...events.map(e => (e.startMinutes + e.durationMinutes) / 60)))) : 17;
  const hours = Array.from({ length: gridEndHour - gridStartHour }, (_, index) => gridStartHour + index);
  const formatTime = formatPreviewTime;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isConflictFreePreview ? 'Conflict-Free Timetable Preview' : 'Timetable Preview'}</Text>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>AP</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isConflictFreePreview && (
          <View style={styles.changeSummary}>
            <Ionicons name="swap-horizontal" size={18} color="#4A3AFF" />
            <View style={styles.changeSummaryList}>
              {proposedSubgroups.map((proposal: any) => (
                <Text key={proposal.courseCode} style={styles.changeSummaryText}>
                  {proposal.courseCode} updated to {proposal.groupName}
                </Text>
              ))}
            </View>
          </View>
        )}
        
        {/* Summary Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MODULES</Text>
            <Text style={styles.statValue}>{moduleCount}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>CLASHES</Text>
            <Text style={[styles.statValue, { color: hasClashes ? '#D92D20' : '#039855' }]}>{clashCount}</Text>
          </View>
        </View>

        {/* Timetable Grid Container */}
        <View style={styles.gridWrapper}>
          <View style={styles.gridHeaderRow}>
            <View style={styles.timeColumnHeader}>
              <Text style={styles.gridHeaderText}>TIME</Text>
            </View>
            {DAYS.map(day => (
              <View key={day} style={styles.dayColumnHeader}>
                <Text style={styles.gridHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.gridBody}>
            <View style={styles.timeLabelColumn}>
              {hours.map(hour => (
                <View key={hour} style={[styles.timeLabelCell, { height: ROW_HEIGHT }]}>
                  <Text style={styles.timeText}>{hour < 10 ? `0${hour}:00` : `${hour}:00`}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.eventsArea, { height: hours.length * ROW_HEIGHT }]}>
              {hours.map((_, index) => (
                <View key={index} style={[styles.gridLine, { top: index * ROW_HEIGHT }]} />
              ))}
              {DAYS.map((_, index) => (
                <View key={index} style={[styles.verticalGridLine, { left: `${(index / DAYS.length) * 100}%` }]} />
              ))}

              {events.map(event => {
                const dayIndex = DAYS.indexOf(event.day);
                if (dayIndex === -1) return null;

                const topPosition = (event.startMinutes / 60 - gridStartHour) * ROW_HEIGHT;
                const blockHeight = event.durationMinutes / 60 * ROW_HEIGHT;
                const leftPosition = `${(dayIndex / DAYS.length) * 100}%`;
                const blockWidth = `${(1 / DAYS.length) * 100}%`;

                return (
                  <View 
                    key={event.id}
                    style={[
                      styles.eventBlock,
                      {
                        top: topPosition,
                        height: blockHeight,
                        left: leftPosition as any,
                        width: blockWidth as any,
                        backgroundColor: event.color,
                        borderColor: event.borderColor,
                      }
                    ]}
                  >
                    <Text style={[styles.eventCourse, { color: '#101828' }]} numberOfLines={1}>
                      {event.course} {event.type ? `• ${event.type}` : ''}
                    </Text>
                    <Text style={{ fontSize: 9, color: '#475467', marginTop: 2 }} numberOfLines={1}>
                      {event.day} {formatTime(event.startMinutes)} - {formatTime(event.startMinutes + event.durationMinutes)}
                    </Text>
                    <Text style={[styles.eventRoom, { color: event.textColor, marginTop: 2 }]} numberOfLines={1}>
                      {event.room}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Status Banner */}
        {!previewLoaded ? (
          <View style={[styles.successBanner, { backgroundColor: '#FEF3F2', borderColor: '#FECDCA' }]}>
            <Ionicons name="alert-circle" size={20} color="#D92D20" />
            <Text style={[styles.successBannerText, { color: '#B42318' }]}>Unable to load the timetable preview. Please go back and try again.</Text>
          </View>
        ) : hasClashes ? (
          <View style={[styles.successBanner, { backgroundColor: '#FEF3F2', borderColor: '#FECDCA' }]}>
            <Ionicons name="alert-circle" size={20} color="#D92D20" />
            <Text style={[styles.successBannerText, { color: '#B42318' }]}>Conflicts detected in your timetable. Please review.</Text>
          </View>
        ) : isConflictFreePreview ? (
          <View style={[styles.successBanner, { backgroundColor: '#ECFDF3', borderColor: '#A6F4C5' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#039855" />
            <Text style={[styles.successBannerText, { color: '#027A48' }]}>All conflicts resolved. Your timetable is now conflict-free!</Text>
          </View>
        ) : (
          <View style={[styles.successBanner, { backgroundColor: '#F0F9FF', borderColor: '#B2DDFF' }]}>
            <Ionicons name="information-circle" size={20} color="#026AA2" />
            <Text style={[styles.successBannerText, { color: '#026AA2' }]}>Timetable preview generated.</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleConfirm}
            disabled={submitting || !previewLoaded}
          >
            {submitting ? (
               <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
               <Text style={styles.primaryButtonText}>
                 {hasClashes
                   ? 'Resolve Timetable Conflicts'
                   : isConflictFreePreview
                     ? 'Confirm & Continue to Advisor Request'
                     : 'Confirm Registration'}
               </Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  iconButton: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#101828' },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2F6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#4A3AFF', fontWeight: 'bold', fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  changeSummary: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginBottom: 16, borderRadius: 10, backgroundColor: '#F4F3FF', borderWidth: 1, borderColor: '#D9D6FE' },
  changeSummaryList: { flex: 1, gap: 3 },
  changeSummaryText: { color: '#4236B8', fontSize: 13, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  statBox: { alignItems: 'center', paddingHorizontal: 32 },
  statLabel: { fontSize: 12, color: '#475467', fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 28, color: '#101828', fontWeight: 'bold' },
  divider: { width: 1, height: 40, backgroundColor: '#EAECF0' },
  gridWrapper: { borderWidth: 1, borderColor: '#EAECF0', borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF', marginBottom: 24 },
  gridHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EAECF0', backgroundColor: '#F9FAFB' },
  timeColumnHeader: { width: 50, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#EAECF0' },
  dayColumnHeader: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  gridHeaderText: { fontSize: 12, fontWeight: '600', color: '#475467' },
  gridBody: { flexDirection: 'row' },
  timeLabelColumn: { width: 50, borderRightWidth: 1, borderRightColor: '#EAECF0', backgroundColor: '#F9FAFB' },
  timeLabelCell: { alignItems: 'center', paddingTop: 8 },
  timeText: { fontSize: 11, color: '#667085' },
  eventsArea: { flex: 1, position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#EAECF0' },
  verticalGridLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#EAECF0' },
  eventBlock: { position: 'absolute', borderWidth: 1, borderRadius: 6, padding: 4, margin: 1, overflow: 'hidden' },
  eventCourse: { fontSize: 10, fontWeight: '700' },
  eventRoom: { fontSize: 10, fontWeight: '500', marginBottom: 2 },
  successBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF3', borderColor: '#A6F4C5', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 24 },
  successBannerText: { marginLeft: 8, color: '#027A48', fontWeight: '600', fontSize: 14 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  secondaryButton: { flex: 1, paddingVertical: 16, borderRadius: 8, borderWidth: 1, borderColor: '#D0D5DD', alignItems: 'center', marginRight: 8, backgroundColor: '#FFFFFF' },
  secondaryButtonText: { color: '#344054', fontWeight: '600', fontSize: 14 },
  primaryButton: { flex: 1, paddingVertical: 16, borderRadius: 8, backgroundColor: '#4A3AFF', alignItems: 'center', marginLeft: 8 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});

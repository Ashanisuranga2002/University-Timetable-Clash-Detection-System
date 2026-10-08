import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Switch,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchSubgroupsApi, previewTimetableApi } from '@/services/api';

export default function AlternativeSubgroupsScreen() {
  const router = useRouter();
  const { studentId, clashCourseCode, clashParam, courseIdsParam, selectedSlotsParam } = useLocalSearchParams();
  
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubgroup, setSelectedSubgroup] = useState<any>(null);
  const [showConflictFree, setShowConflictFree] = useState(false);
  const [existingSessions, setExistingSessions] = useState<any[]>([]);

  const clash = clashParam ? JSON.parse(clashParam as string) : null;

  useEffect(() => {
    if (!clashCourseCode) return;
    loadSubgroups();
  }, [clashCourseCode]);

  const loadSubgroups = async () => {
    try {
      setLoading(true);
      const res = await fetchSubgroupsApi(clashCourseCode as string);
      if (res?.success) {
        setSubgroups(res.subgroups);
      }

      // Fetch student's current timetable
      const courseIds = JSON.parse((courseIdsParam as string) || '[]');
      const selectedSlots = JSON.parse((selectedSlotsParam as string) || '{}');
      const previewRes = await previewTimetableApi(courseIds, selectedSlots, []);

      if (previewRes?.success && previewRes.previewCourses) {
         let extractedSessions: any[] = [];
         previewRes.previewCourses.forEach((c: any) => {
           // Skip the conflicting course because we are REPLACING its slot
           if (c.courseCode === clashCourseCode) return;
           
           if (c.schedule && c.schedule.length > 0) {
             extractedSessions.push(...c.schedule);
           }
           if (c.slots && c.slots.length > 0) {
             const chosenSlotName = selectedSlots[c._id] || selectedSlots[c.courseCode] || selectedSlots[c.courseCode?.toUpperCase()];
             const activeSlot = chosenSlotName ? c.slots.find((s: any) => s.slotName === chosenSlotName) : c.slots[0];
             if (activeSlot) extractedSessions.push(activeSlot);
           }
         });
         setExistingSessions(extractedSessions);
      }

    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedSubgroup) return;
    
    // Navigate back to the timetable preview with the proposed subgroup
    const proposedSubgroups = [{ 
      courseCode: clashCourseCode, 
      subgroupId: selectedSubgroup._id,
      groupName: selectedSubgroup.groupName 
    }];
    
    router.push({
      pathname: '/Student/timetable-preview',
      params: { 
        studentId, 
        courseIdsParam, 
        selectedSlotsParam,
        proposedSubgroupsParam: JSON.stringify(proposedSubgroups)
      }
    });
  };

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes;
  };

  const isSubgroupConflictFree = (sg: any) => {
    if (!existingSessions || existingSessions.length === 0) return true;
    
    if (!sg.day || !sg.startTime || !sg.endTime) return true;
    const sgStart = timeToMinutes(sg.startTime);
    const sgEnd = timeToMinutes(sg.endTime);

    for (const session of existingSessions) {
      if (!session.day || !session.startTime || !session.endTime) continue;
      
      if (session.day.toLowerCase() === sg.day.toLowerCase()) {
        const sessStart = timeToMinutes(session.startTime);
        const sessEnd = timeToMinutes(session.endTime);
        
        const overlapStart = Math.max(sgStart, sessStart);
        const overlapEnd = Math.min(sgEnd, sessEnd);
        
        // If overlapStart is strictly less than overlapEnd, we have a time overlap!
        if (overlapStart < overlapEnd) {
          return false;
        }
      }
    }
    return true;
  };

  const filteredSubgroups = subgroups.filter(sg => {
    if (showConflictFree) return isSubgroupConflictFree(sg);
    return true;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A3AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alternative Subgroups</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.currentCard}>
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>CURRENT COURSE</Text>
          </View>
          <Text style={styles.courseTitle}>
            {clashCourseCode} {clash?.course1Name ? `- ${clash.course1Name}` : ''}
          </Text>
          <Text style={styles.allocatedText}>
            Currently Allocated: <Text style={{fontWeight:'700', color: '#101828'}}>Group A</Text> 
            {clash ? ` (${clash.day} ${clash.startTime} - ${clash.endTime})` : ''}
          </Text>

          <View style={styles.alertBox}>
            <View style={styles.alertIconBox}>
              <Ionicons name="warning" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Timetable Conflict Detected</Text>
              <Text style={styles.alertSub}>
                Overlaps with {clash?.course2Code || 'another course'}{clash?.course2Name ? ` ${clash.course2Name}` : ''}
              </Text>
            </View>
            <Text style={styles.alertClashText}>CLASH</Text>
          </View>
        </View>

        <View style={styles.altHeaderRow}>
          <Text style={styles.altHeaderTitle}>Available Alternatives</Text>
          <Text style={styles.altCountText}>{filteredSubgroups.length} Available</Text>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterLeft}>
            <Ionicons name="filter-outline" size={20} color="#667085" />
            <Text style={styles.filterText}>Show conflict-free only</Text>
          </View>
          <Switch 
            value={showConflictFree} 
            onValueChange={setShowConflictFree}
            trackColor={{ false: '#E2E8F0', true: '#4A3AFF' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {filteredSubgroups.map((group, index) => {
          const isSelected = selectedSubgroup?._id === group._id;
          const isConflictFree = isSubgroupConflictFree(group);
          const isRecommended = index === 0 && isConflictFree; 
          
          return (
            <TouchableOpacity
              key={group._id}
              style={[styles.sgCard, isSelected && styles.sgCardSelected]}
              onPress={() => setSelectedSubgroup(group)}
              activeOpacity={0.8}
            >
              <View style={styles.sgTopRow}>
                <View style={styles.sgTopLeft}>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.sgGroupName}>{group.groupName}</Text>
                  {isRecommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>RECOMMENDED</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.selectBtn, isSelected && styles.selectBtnActive]}>
                  <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextActive]}>
                    {isSelected ? 'Selected' : 'Select'}
                  </Text>
                </View>
              </View>

              <View style={styles.sgDetails}>
                <View style={styles.sgDetailRow}>
                  <Ionicons name="time-outline" size={16} color="#475467" />
                  <Text style={styles.sgDetailText}>
                    {group.day} {group.startTime} - {group.endTime}
                  </Text>
                </View>
                <View style={styles.sgDetailRow}>
                  <Ionicons name="location-outline" size={16} color="#475467" />
                  <Text style={styles.sgDetailText}>
                    Venue: {group.room || 'TBA'}
                  </Text>
                </View>
              </View>

              <View style={styles.sgDivider} />

              <View style={styles.sgBottomRow}>
                <View style={styles.conflictStatusRow}>
                  <Ionicons 
                    name={isConflictFree ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={isConflictFree ? "#039855" : "#D92D20"} 
                  />
                  <Text style={[styles.conflictStatusText, { color: isConflictFree ? '#039855' : '#D92D20' }]}>
                    {isConflictFree ? 'No conflict detected' : 'Conflict detected'}
                  </Text>
                </View>
                <Text style={styles.seatsText}>
                  {Math.max(0, (group.capacity || 30) - (group.enrolledCount || 0))} seats left
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {selectedSubgroup && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>
              Continue with {selectedSubgroup.groupName}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF'
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  
  content: { padding: 16 },

  currentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  currentBadge: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  currentBadgeText: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  allocatedText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
  },
  alertIconBox: {
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  alertTextBox: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  alertSub: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
  },
  alertClashText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },

  altHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  altHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  altCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },

  sgCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  sgCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
  },
  sgTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sgTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  sgGroupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  recommendedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  selectBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectBtnActive: {
    backgroundColor: '#4F46E5',
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  selectBtnTextActive: {
    color: '#FFFFFF',
  },
  sgDetails: {
    gap: 6,
    marginBottom: 12,
  },
  sgDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sgDetailText: {
    fontSize: 13,
    color: '#475569',
  },
  sgDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  sgBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conflictStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conflictStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  seatsText: {
    fontSize: 12,
    color: '#94A3B8',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  continueBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
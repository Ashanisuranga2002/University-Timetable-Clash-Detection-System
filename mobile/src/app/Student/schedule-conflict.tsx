import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ScheduleConflictScreen() {
  const router = useRouter();
  const { studentId, courseIdsParam, selectedSlotsParam, clashesParam, proposedSubgroupsParam } = useLocalSearchParams();
  
  const clashes = clashesParam ? JSON.parse(clashesParam as string) : [];
  const clashCount = clashes.length;
  
  // Use the first clash to display
  const primaryClash = clashCount > 0 ? clashes[0] : null;

  const handleResolve = () => {
    if (!primaryClash) return;
    router.replace({
      pathname: '/Student/alternative-subgroups',
      params: { 
        studentId, 
        clashCourseCode: primaryClash.course1Code,
        clashParam: JSON.stringify(primaryClash),
        courseIdsParam,
        selectedSlotsParam,
        proposedSubgroupsParam
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Conflict</Text>
        <View style={styles.criticalBadge}>
          <Text style={styles.criticalBadgeText}>CRITICAL</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Warning Icon Section */}
        <View style={styles.warningSection}>
          <View style={styles.warningIconBg}>
            <Ionicons name="warning-outline" size={32} color="#D92D20" />
          </View>
          <Text style={styles.warningTitle}>{clashCount} Timetable Conflict Remains</Text>
          <Text style={styles.warningSubtitle}>
            Please resolve the overlapping slot before confirming your course registration.
          </Text>
        </View>

        {/* Conflict Card */}
        {primaryClash && (
          <View style={styles.conflictCard}>
            <View style={styles.cardHeader}>
              <View style={styles.slash} />
              <Text style={styles.cardHeaderTitle}>CONFLICT WINDOW</Text>
            </View>

            {/* Course 1 Box */}
            <View style={styles.courseBox}>
              <View style={styles.courseBoxHeader}>
                <Text style={styles.courseName}>{primaryClash.course2Code} • Group A</Text>
                <View style={styles.enrolledBadge}>
                  <Text style={styles.enrolledBadgeText}>ENROLLED SLOT</Text>
                </View>
              </View>
              <Text style={styles.courseDetails}>
                {primaryClash.day} {primaryClash.startTime} - {primaryClash.endTime} • Room {primaryClash.room2 || 'TBA'}
              </Text>
            </View>

            {/* Collision Divider */}
            <View style={styles.collisionDivider}>
              <View style={styles.collisionLine} />
              <View style={styles.collisionPill}>
                <Text style={styles.collisionPillText}>Collision ({primaryClash.overlapMinutes} mins overlap)</Text>
              </View>
            </View>

            {/* Course 2 Box (Conflicted) */}
            <View style={[styles.courseBox, styles.courseBoxConflicted]}>
              <View style={styles.courseBoxHeader}>
                <Text style={[styles.courseName, { color: '#B42318' }]}>{primaryClash.course1Code} • Group A</Text>
                <Text style={styles.conflictedText}>CONFLICTED</Text>
              </View>
              <Text style={styles.courseDetails}>
                {primaryClash.day} {primaryClash.startTime} - {primaryClash.endTime} • Room {primaryClash.room1 || 'TBA'}
              </Text>
            </View>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.footerEngine}>Timetable Engine v4.2</Text>
              <Text style={styles.footerAlternatives}>Alternatives Ready</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.resolveButton} onPress={handleResolve}>
            <Text style={styles.resolveButtonText}>Resolve Conflict</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back to Timetable</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
  criticalBadge: { backgroundColor: '#FEF3F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 },
  criticalBadgeText: { color: '#B42318', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  
  scrollContent: { padding: 24, paddingBottom: 40 },
  
  warningSection: { alignItems: 'center', marginBottom: 24 },
  warningIconBg: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#FEF3F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  warningTitle: { fontSize: 20, fontWeight: '700', color: '#101828', marginBottom: 8, textAlign: 'center' },
  warningSubtitle: { fontSize: 14, color: '#475467', textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  
  conflictCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAECF0', padding: 16, marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  slash: { width: 4, height: 16, backgroundColor: '#F04438', transform: [{ rotate: '15deg' }], marginRight: 8, borderRadius: 2 },
  cardHeaderTitle: { fontSize: 12, fontWeight: '700', color: '#101828', letterSpacing: 0.5 },
  
  courseBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#EAECF0' },
  courseBoxConflicted: { backgroundColor: '#FEF3F2', borderColor: '#FECDCA' },
  courseBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  courseName: { fontSize: 14, fontWeight: '700', color: '#101828' },
  enrolledBadge: { backgroundColor: '#EEF2F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  enrolledBadgeText: { color: '#4A3AFF', fontSize: 10, fontWeight: '700' },
  conflictedText: { color: '#B42318', fontSize: 10, fontWeight: '700' },
  courseDetails: { fontSize: 13, color: '#667085' },
  
  collisionDivider: { position: 'relative', height: 24, justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
  collisionLine: { position: 'absolute', left: 24, right: 24, height: 1, backgroundColor: '#EAECF0' },
  collisionPill: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: '#FECDCA', zIndex: 2 },
  collisionPillText: { color: '#D92D20', fontSize: 11, fontWeight: '600' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EAECF0' },
  footerEngine: { fontSize: 12, color: '#98A2B3' },
  footerAlternatives: { fontSize: 12, fontWeight: '600', color: '#DC6803' },
  
  actionsContainer: { gap: 16 },
  resolveButton: { backgroundColor: '#4A3AFF', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  resolveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  backButton: { paddingVertical: 12, alignItems: 'center' },
  backButtonText: { color: '#344054', fontSize: 16, fontWeight: '600' },
});

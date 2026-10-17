// mobile/src/app/(student)/timetable-preview.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock data representing the student's resolved timetable
const MOCK_EVENTS = [
  { id: '1', course: 'IT3010', room: 'G1102', day: 'Mon', startHour: 10, duration: 2, color: '#ECFDF3', borderColor: '#A6F4C5', textColor: '#027A48' },
  { id: '2', course: 'IT3050', room: 'G1302', day: 'Tue', startHour: 9, duration: 2, color: '#FFFAEB', borderColor: '#FEDF89', textColor: '#B54708' },
  { id: '3', course: 'IT3020', room: 'A403', day: 'Wed', startHour: 8, duration: 2, color: '#EFF8FF', borderColor: '#B2DDFF', textColor: '#175CD3' },
  { id: '4', course: 'IT3040', room: 'B503', day: 'Thu', startHour: 13, duration: 2, color: '#F9F5FF', borderColor: '#E9D7FE', textColor: '#6941C6' }
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const ROW_HEIGHT = 60; // Each hour block is 60 pixels tall

export default function TimetablePreviewScreen() {
  const router = useRouter();

  const handleConfirm = () => {
    // Navigates to the final success screen
    router.push('/Student/registration-confirmation');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header[cite: 51] */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timetable Preview</Text>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>AP</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Summary Statistics[cite: 51] */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MODULES</Text>
            <Text style={styles.statValue}>4</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>CLASHES</Text>
            <Text style={[styles.statValue, { color: '#039855' }]}>0</Text>
          </View>
        </View>

        {/* Timetable Grid Container */}
        <View style={styles.gridWrapper}>
          
          {/* Grid Header (Days)[cite: 51] */}
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

          {/* Grid Body */}
          <View style={styles.gridBody}>
            {/* Time Labels & Horizontal Lines */}
            <View style={styles.timeLabelColumn}>
              {HOURS.map(hour => (
                <View key={hour} style={[styles.timeLabelCell, { height: ROW_HEIGHT }]}>
                  <Text style={styles.timeText}>{hour < 10 ? `0${hour}:00` : `${hour}:00`}</Text>
                </View>
              ))}
            </View>

            {/* Vertical Day Columns for Events */}
            <View style={styles.eventsArea}>
              {/* Draw horizontal grid lines */}
              {HOURS.map((_, index) => (
                <View key={index} style={[styles.gridLine, { top: index * ROW_HEIGHT }]} />
              ))}
              
              {/* Draw vertical grid lines */}
              {DAYS.map((_, index) => (
                <View key={index} style={[styles.verticalGridLine, { left: `${(index / DAYS.length) * 100}%` }]} />
              ))}

              {/* Render the actual class blocks */}
              {MOCK_EVENTS.map(event => {
                const dayIndex = DAYS.indexOf(event.day);
                if (dayIndex === -1) return null;

                // Calculate absolute position based on time
                const topPosition = (event.startHour - 8) * ROW_HEIGHT;
                const blockHeight = event.duration * ROW_HEIGHT;
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
                    <Text style={[styles.eventRoom, { color: event.textColor }]}>{event.room}</Text>
                    <Text style={[styles.eventCourse, { color: '#101828' }]}>{event.course}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Status Banner[cite: 51] */}
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#039855" />
          <Text style={styles.successBannerText}>All conflicts resolved. Ready to register.</Text>
        </View>

        {/* Action Buttons[cite: 51] */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Change Subgroup</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleConfirm}
          >
            <Text style={styles.primaryButtonText}>Confirm Registration</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // Header Styles[cite: 51]
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2F6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#4A3AFF', fontWeight: 'bold', fontSize: 14 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Stats Styles[cite: 51]
  statsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  statBox: { alignItems: 'center', paddingHorizontal: 32 },
  statLabel: { fontSize: 12, color: '#475467', fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 28, color: '#101828', fontWeight: 'bold' },
  divider: { width: 1, height: 40, backgroundColor: '#EAECF0' },

  // Grid Styles
  gridWrapper: { borderWidth: 1, borderColor: '#EAECF0', borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF', marginBottom: 24 },
  gridHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EAECF0', backgroundColor: '#F9FAFB' },
  timeColumnHeader: { width: 50, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#EAECF0' },
  dayColumnHeader: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  gridHeaderText: { fontSize: 12, fontWeight: '600', color: '#475467' },
  
  gridBody: { flexDirection: 'row' },
  timeLabelColumn: { width: 50, borderRightWidth: 1, borderRightColor: '#EAECF0', backgroundColor: '#F9FAFB' },
  timeLabelCell: { alignItems: 'center', paddingTop: 8 },
  timeText: { fontSize: 11, color: '#667085' },
  
  eventsArea: { flex: 1, position: 'relative', minHeight: 9 * 60 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#EAECF0' },
  verticalGridLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#EAECF0' },
  
  eventBlock: { position: 'absolute', borderWidth: 1, borderRadius: 6, padding: 4, margin: 1 },
  eventCourse: { fontSize: 10, fontWeight: '700' },
  eventRoom: { fontSize: 10, fontWeight: '500', marginBottom: 2 },

  // Banner Styles[cite: 51]
  successBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF3', borderColor: '#A6F4C5', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 24 },
  successBannerText: { marginLeft: 8, color: '#027A48', fontWeight: '600', fontSize: 14 },

  // Action Buttons[cite: 51]
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  secondaryButton: { flex: 1, paddingVertical: 16, borderRadius: 8, borderWidth: 1, borderColor: '#D0D5DD', alignItems: 'center', marginRight: 8, backgroundColor: '#FFFFFF' },
  secondaryButtonText: { color: '#344054', fontWeight: '600', fontSize: 14 },
  primaryButton: { flex: 1, paddingVertical: 16, borderRadius: 8, backgroundColor: '#4A3AFF', alignItems: 'center', marginLeft: 8 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
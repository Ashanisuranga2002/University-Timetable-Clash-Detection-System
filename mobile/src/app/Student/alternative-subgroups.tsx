// mobile/src/app/(student)/alternative-groups.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock data based on the UI design[cite: 49]
const MOCK_ALTERNATIVES = [
  {
    id: 'group_b',
    name: 'Group B',
    isRecommended: true,
    time: 'Tue 09:00 - 11:00',
    venue: 'Venue: G1302 · Lab 03',
    hasConflict: false,
    seatsLeft: 12,
  },
  {
    id: 'group_c',
    name: 'Group C',
    isRecommended: false,
    time: 'Tue 13:00 - 15:00',
    venue: 'Venue: G1302 · Lab 01',
    hasConflict: false,
    seatsLeft: 5,
  },
  {
    id: 'group_d',
    name: 'Group D',
    isRecommended: false,
    time: 'Thu 13:00 - 15:00',
    venue: 'Venue: G1302 · Lab 01',
    hasConflict: true, // Used to test the toggle switch
    seatsLeft: 20,
  }
];

export default function AlternativeGroupsScreen() {
  const router = useRouter();
  const [showConflictFree, setShowConflictFree] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>('group_b'); // Group B selected by default[cite: 50]

  // Filter logic for the toggle switch
  const displayedGroups = showConflictFree 
    ? MOCK_ALTERNATIVES.filter(group => !group.hasConflict) 
    : MOCK_ALTERNATIVES;

  const handleContinue = () => {
    // In the future, this will trigger the POST request to your backend,
    // then navigate to the timetable preview or registration confirmation.
    router.push('/Student/timetable-preview');
  };

  return (
    <View style={styles.container}>
      {/* Header[cite: 49] */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alternative Subgroups</Text>
        <View style={{ width: 24 }} /> {/* Spacer to center title */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Course Card[cite: 49] */}
        <View style={styles.currentCourseContainer}>
          <Text style={styles.badge}>CURRENT COURSE</Text>
          <Text style={styles.courseTitle}>IT3050 – Cloud Computing Systems</Text>
          <Text style={styles.allocationText}>Currently Allocated: <Text style={{fontWeight: 'bold'}}>Group A</Text> (Mon 09:00 – 11:00)</Text>
          
          <View style={styles.conflictAlert}>
            <Ionicons name="warning" size={20} color="#D92D20" />
            <View style={styles.conflictTextContainer}>
              <Text style={styles.conflictTitle}>Timetable Conflict Detected</Text>
              <Text style={styles.conflictSubtitle}>Overlaps with IT3060 HCI Lab</Text>
            </View>
            <Text style={styles.clashBadge}>CLASH</Text>
          </View>
        </View>

        {/* Filter Section[cite: 49] */}
        <View style={styles.filterHeader}>
          <Text style={styles.sectionTitle}>Available Alternatives</Text>
          <Text style={styles.availableCount}>{MOCK_ALTERNATIVES.length} Available</Text>
        </View>

        <View style={styles.toggleContainer}>
          <View style={styles.toggleLabelContainer}>
            <Ionicons name="filter-outline" size={20} color="#667085" />
            <Text style={styles.toggleLabel}>Show conflict-free only</Text>
          </View>
          <Switch
            value={showConflictFree}
            onValueChange={setShowConflictFree}
            trackColor={{ false: '#D0D5DD', true: '#4A3AFF' }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        {/* Group Options List[cite: 49, 50] */}
        {displayedGroups.map((group) => {
          const isSelected = selectedGroupId === group.id;
          return (
            <TouchableOpacity 
              key={group.id} 
              style={[styles.groupCard, isSelected && styles.groupCardSelected]}
              onPress={() => setSelectedGroupId(group.id)}
            >
              <View style={styles.groupHeader}>
                <View style={styles.groupNameRow}>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.groupName}>{group.name}</Text>
                  {group.isRecommended && (
                    <Text style={styles.recommendedBadge}>RECOMMENDED</Text>
                  )}
                </View>
                <View style={[styles.selectBtn, isSelected && styles.selectBtnActive]}>
                  <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextActive]}>
                    {isSelected ? 'Selected' : 'Select'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color="#667085" />
                <Text style={styles.detailText}>{group.time}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color="#667085" />
                <Text style={styles.detailText}>{group.venue}</Text>
              </View>

              <View style={styles.statusRow}>
                <View style={styles.conflictStatus}>
                  <Ionicons 
                    name={group.hasConflict ? "close-circle-outline" : "checkmark-circle-outline"} 
                    size={16} 
                    color={group.hasConflict ? "#D92D20" : "#039855"} 
                  />
                  <Text style={[styles.conflictStatusText, { color: group.hasConflict ? "#D92D20" : "#039855" }]}>
                    {group.hasConflict ? "Conflict detected" : "No conflict detected"}
                  </Text>
                </View>
                <Text style={styles.seatsText}>{group.seatsLeft} seats {group.seatsLeft > 10 ? 'available' : 'left'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Continue Button (Sticky at bottom)[cite: 50] */}
      {selectedGroupId && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              Continue with {MOCK_ALTERNATIVES.find(g => g.id === selectedGroupId)?.name}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#101828' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  
  // Current Course Styles[cite: 49]
  currentCourseContainer: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  badge: { backgroundColor: '#EEF2F6', color: '#4A3AFF', fontSize: 12, fontWeight: '600', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16, marginBottom: 12 },
  courseTitle: { fontSize: 18, fontWeight: 'bold', color: '#101828', marginBottom: 4 },
  allocationText: { fontSize: 14, color: '#475467', marginBottom: 16 },
  conflictAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3F2', borderColor: '#FEE4E2', borderWidth: 1, padding: 12, borderRadius: 8 },
  conflictTextContainer: { flex: 1, marginLeft: 12 },
  conflictTitle: { fontSize: 14, fontWeight: '600', color: '#B42318' },
  conflictSubtitle: { fontSize: 12, color: '#D92D20', marginTop: 2 },
  clashBadge: { backgroundColor: '#FEE4E2', color: '#B42318', fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },

  // Filter Styles[cite: 49]
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#101828' },
  availableCount: { fontSize: 14, color: '#4A3AFF', fontWeight: '600' },
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#EAECF0' },
  toggleLabelContainer: { flexDirection: 'row', alignItems: 'center' },
  toggleLabel: { fontSize: 14, color: '#344054', marginLeft: 8, fontWeight: '500' },

  // Group Card Styles[cite: 49, 50]
  groupCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EAECF0' },
  groupCardSelected: { borderColor: '#4A3AFF', borderWidth: 2, backgroundColor: '#F4F3FF' },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  groupNameRow: { flexDirection: 'row', alignItems: 'center' },
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D0D5DD', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  radioCircleSelected: { borderColor: '#4A3AFF' },
  radioInner: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#4A3AFF' },
  groupName: { fontSize: 16, fontWeight: '600', color: '#101828' },
  recommendedBadge: { backgroundColor: '#ECFDF3', color: '#027A48', fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  selectBtn: { backgroundColor: '#F2F4F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  selectBtnActive: { backgroundColor: '#4A3AFF' },
  selectBtnText: { fontSize: 12, fontWeight: '600', color: '#475467' },
  selectBtnTextActive: { color: '#FFFFFF' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginLeft: 28 },
  detailText: { fontSize: 14, color: '#475467', marginLeft: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginLeft: 28 },
  conflictStatus: { flexDirection: 'row', alignItems: 'center' },
  conflictStatusText: { fontSize: 14, fontWeight: '500', marginLeft: 4 },
  seatsText: { fontSize: 13, color: '#98A2B3' },

  // Footer Button[cite: 50]
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderColor: '#EAECF0' },
  continueButton: { backgroundColor: '#4A3AFF', flexDirection: 'row', paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginRight: 8 },
});
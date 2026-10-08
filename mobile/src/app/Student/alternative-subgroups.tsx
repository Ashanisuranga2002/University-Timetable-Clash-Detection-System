import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchSubgroupsApi, previewTimetableApi, submitAlternativeSubgroupRequest } from '@/services/api';

export default function AlternativeSubgroupsScreen() {
  const { studentId, clashCourseCode, courseIdsParam, selectedSlotsParam } = useLocalSearchParams();
  
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubgroup, setSelectedSubgroup] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);
  const [isConflictFree, setIsConflictFree] = useState<boolean | null>(null);
  const [clashes, setClashes] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!clashCourseCode) return;
    loadSubgroups();
  }, [clashCourseCode]);

  const loadSubgroups = async () => {
    try {
      const res = await fetchSubgroupsApi(clashCourseCode as string);
      if (res?.success) {
        setSubgroups(res.subgroups);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alternative Subgroups</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Select an alternative subgroup for {clashCourseCode} to resolve your timetable conflicts.
        </Text>

        {subgroups.length === 0 ? (
          <Text style={styles.noSubgroupsText}>No alternative subgroups available.</Text>
        ) : (
          subgroups.map((group) => {
            const isSelected = selectedSubgroup?._id === group._id;
            return (
              <TouchableOpacity
                key={group._id}
                style={[styles.subgroupCard, isSelected && styles.subgroupCardSelected]}
                onPress={() => {
                  setSelectedSubgroup(group);
                  setIsConflictFree(null); // reset preview state
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.groupName}>{group.groupName}</Text>
                  <Text style={styles.capacity}>
                    {group.enrolledCount}/{group.capacity} Enrolled
                  </Text>
                </View>
                <Text style={styles.timeInfo}>
                  <Ionicons name="time-outline" size={16} /> {group.day}, {group.startTime} - {group.endTime}
                </Text>
                <Text style={styles.roomInfo}>
                  <Ionicons name="location-outline" size={16} /> {group.venue}
                </Text>
              </TouchableOpacity>
            );
          })
        )}

        {selectedSubgroup && (
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.previewBtn} 
              onPress={handlePreview}
            >
              <Text style={styles.previewBtnText}>Preview Timetable</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  content: { padding: 20 },
  description: { fontSize: 16, color: '#64748B', marginBottom: 20, lineHeight: 24 },
  noSubgroupsText: { fontSize: 16, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center' },
  subgroupCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  subgroupCardSelected: { borderColor: '#6366F1' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  groupName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  capacity: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  timeInfo: { fontSize: 14, color: '#475569', marginBottom: 4 },
  roomInfo: { fontSize: 14, color: '#475569' },
  actionContainer: { marginTop: 24, paddingBottom: 40 },
  previewBtn: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  resultContainer: { marginTop: 20 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 12, marginBottom: 16 },
  successText: { marginLeft: 8, color: '#047857', fontSize: 15, fontWeight: '600' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12 },
  errorText: { marginLeft: 8, color: '#B91C1C', fontSize: 15, fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { submitAlternativeSubgroupRequest } from '@/services/api';
import { FooterTab } from '@/components/FooterTab';

export default function AdvisorRequestScreen() {
  const router = useRouter();
  const { studentId, proposedSubgroupsParam, previewConfirmed } = useLocalSearchParams();
  
  const [reason, setReason] = useState('I had a timetable conflict and selected this alternative subgroup to resolve it.');
  const [submitting, setSubmitting] = useState(false);

  const proposedSubgroups = proposedSubgroupsParam ? JSON.parse(proposedSubgroupsParam as string) : [];
  const proposal = proposedSubgroups.length > 0 ? proposedSubgroups[0] : null;
  const canSubmitRequest = previewConfirmed === 'true' && !!proposal;

  const handleSubmit = async () => {
    if (!canSubmitRequest) {
      Alert.alert('Preview required', 'Review and confirm a conflict-free timetable before submitting an advisor request.');
      return;
    }
    
    if (!reason.trim()) {
      Alert.alert('Required', 'Please provide a reason for your request.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitAlternativeSubgroupRequest(
        studentId as string,
        proposal.courseCode,
        'Original Group', // We don't necessarily have the original group stored, just pass a placeholder
        proposal.groupName,
        reason
      );
      if (!response) {
        throw new Error(response?.message || 'Request could not be submitted.');
      }
      
      Alert.alert(
        'Request Submitted', 
        'Your request has been sent to your advisor for review.',
        [{ text: 'OK', onPress: () => router.replace({ pathname: '/Student/requests', params: { studentId } }) }]
      );
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Failed to submit request to advisor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canSubmitRequest) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.center, { flex: 1 }]}>
          <Ionicons name="lock-closed-outline" size={30} color="#667085" />
          <Text style={styles.guardText}>Review and confirm a conflict-free timetable before opening the Advisor Request Form.</Text>
          <TouchableOpacity style={styles.guardButton} onPress={() => router.replace('/dashboard')}>
            <Text style={styles.submitBtnText}>Return to timetable</Text>
          </TouchableOpacity>
        </View>
        <FooterTab active="requests" studentId={(studentId as string) || 'IT21047138'} role="student" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#101828" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Advisor Approval</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="document-text-outline" size={24} color="#4A3AFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Review Request</Text>
              <Text style={styles.infoSub}>
                You are requesting to change your {proposal.courseCode} subgroup to <Text style={{fontWeight: '700'}}>{proposal.groupName}</Text> to resolve a timetable conflict.
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Reason for Request</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
            placeholder="Explain why you are requesting this change..."
            textAlignVertical="top"
          />

          <View style={styles.noticeBox}>
            <Ionicons name="information-circle-outline" size={18} color="#026AA2" />
            <Text style={styles.noticeText}>
              Your request will be reviewed by your academic advisor. You will be notified once a decision has been made.
            </Text>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Request to Advisor</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <FooterTab active="requests" studentId={(studentId as string) || 'IT21047138'} role="student" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  guardText: { marginTop: 12, marginHorizontal: 28, textAlign: 'center', color: '#475467', fontSize: 15, lineHeight: 22 },
  guardButton: { marginTop: 20, paddingHorizontal: 20, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4A3AFF' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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

  content: {
    padding: 16,
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF'
  },
  infoIconBox: {
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3730A3',
    marginBottom: 4,
  },
  infoSub: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },
  
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#334155',
    minHeight: 120,
    marginBottom: 24,
  },

  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B2DDFF',
  },
  noticeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#026AA2',
    lineHeight: 18,
  },

  bottomBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitBtn: {
    backgroundColor: '#4A3AFF',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

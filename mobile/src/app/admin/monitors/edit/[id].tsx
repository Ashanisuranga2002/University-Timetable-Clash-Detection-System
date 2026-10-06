import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AC, AR, AS } from '@/constants/adminTheme';
import {
  AdminMonitor,
  fetchMonitorByIdApi,
  updateMonitorApi,
} from '@/services/api';

const SERVICE_TYPES: AdminMonitor['serviceType'][] = [
  'Service',
  'Engine',
  'Database',
  'Gateway',
  'Queue',
  'Worker',
];

const INTERVAL_OPTIONS = ['10s', '15s', '30s', '60s', '5m'];

const HEALTH_OPTIONS: AdminMonitor['healthStatus'][] = ['Healthy', 'Warning', 'Critical', 'Offline'];

export default function EditMonitorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [monitorId, setMonitorId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState<AdminMonitor['serviceType']>('Service');
  const [description, setDescription] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [interval, setInterval] = useState('30s');
  const [healthStatus, setHealthStatus] = useState<AdminMonitor['healthStatus']>('Healthy');
  const [enabled, setEnabled] = useState(true);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    async function loadMonitor() {
      if (!id) return;
      try {
        const res = await fetchMonitorByIdApi(id);
        const data: AdminMonitor = res?.data || res;
        if (data) {
          setMonitorId(data.monitorId);
          setServiceName(data.serviceName);
          setServiceType(data.serviceType);
          setDescription(data.description || '');
          setEndpoint(data.endpoint || '');
          setInterval(data.interval || '30s');
          setHealthStatus(data.healthStatus || 'Healthy');
          setEnabled(data.enabled !== undefined ? data.enabled : true);
        }
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to load monitor details');
      } finally {
        setInitialLoading(false);
      }
    }
    loadMonitor();
  }, [id]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!serviceName.trim()) {
      newErrors.serviceName = 'Service name is required';
    }
    if (!endpoint.trim()) {
      newErrors.endpoint = 'Target endpoint or service identifier is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!id || !validate()) return;

    setSubmitting(true);
    try {
      await updateMonitorApi(id, {
        serviceName: serviceName.trim(),
        serviceType,
        description: description.trim(),
        endpoint: endpoint.trim(),
        interval,
        healthStatus,
        status: healthStatus === 'Healthy' ? 'online' : healthStatus === 'Warning' ? 'warning' : 'offline',
        enabled,
      });

      Alert.alert('Saved', 'Monitor configuration updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update monitor configuration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AdminHeader title="Edit Monitor" showBack onBack={() => router.back()} />

      {initialLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={AC.primary} />
          <Text style={styles.subText}>Loading monitor specs...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Monitor Specs ({monitorId})</Text>

              {/* Read-only Monitor ID */}
              <View style={styles.field}>
                <Text style={styles.label}>MONITOR ID (READ ONLY)</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={monitorId}
                  editable={false}
                />
              </View>

              {/* Service Name */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  SERVICE NAME <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.serviceName ? styles.inputError : null]}
                  value={serviceName}
                  onChangeText={(t) => {
                    setServiceName(t);
                    if (errors.serviceName) setErrors((prev) => ({ ...prev, serviceName: '' }));
                  }}
                />
                {errors.serviceName ? <Text style={styles.errorText}>{errors.serviceName}</Text> : null}
              </View>

              {/* Service Component Type */}
              <View style={styles.field}>
                <Text style={styles.label}>COMPONENT TYPE</Text>
                <View style={styles.chipGrid}>
                  {SERVICE_TYPES.map((t) => {
                    const active = serviceType === t;
                    return (
                      <Pressable
                        key={t}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setServiceType(t)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Target Endpoint */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  ENDPOINT TARGET <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.endpoint ? styles.inputError : null]}
                  value={endpoint}
                  onChangeText={(t) => {
                    setEndpoint(t);
                    if (errors.endpoint) setErrors((prev) => ({ ...prev, endpoint: '' }));
                  }}
                  autoCapitalize="none"
                />
                {errors.endpoint ? <Text style={styles.errorText}>{errors.endpoint}</Text> : null}
              </View>

              {/* Description */}
              <View style={styles.field}>
                <Text style={styles.label}>DESCRIPTION / ROLE NOTES</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Probing Interval */}
              <View style={styles.field}>
                <Text style={styles.label}>POLLING FREQUENCY</Text>
                <View style={styles.chipGrid}>
                  {INTERVAL_OPTIONS.map((opt) => {
                    const active = interval === opt;
                    return (
                      <Pressable
                        key={opt}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setInterval(opt)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Health Status */}
              <View style={styles.field}>
                <Text style={styles.label}>HEALTH CLASSIFICATION</Text>
                <View style={styles.chipGrid}>
                  {HEALTH_OPTIONS.map((h) => {
                    const active = healthStatus === h;
                    return (
                      <Pressable
                        key={h}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setHealthStatus(h)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{h}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Active Probing Switch */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Enable Active Monitoring</Text>
                  <Text style={styles.switchSub}>When paused, automated ping checks are halted</Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={setEnabled}
                  trackColor={{ false: '#CBD5E1', true: AC.primaryMid }}
                  thumbColor={enabled ? AC.primary : '#F1F5F9'}
                />
              </View>
            </View>

            {/* Action Row */}
            <View style={styles.actionRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => router.back()}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Changes</Text>
                )}
              </Pressable>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AC.bgApp },
  scroll: { flex: 1 },
  content: { padding: AS.screenH, gap: 16 },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  subText: { fontSize: 13, color: AC.textSecondary },
  formCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  field: { gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: AC.textSecondary,
    letterSpacing: 0.5,
  },
  required: { color: AC.danger },
  input: {
    backgroundColor: AC.bgApp,
    borderRadius: AR.button,
    borderWidth: 1,
    borderColor: AC.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: AC.textPrimary,
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: AC.textSecondary,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: AC.danger,
    backgroundColor: AC.dangerLight,
  },
  errorText: {
    fontSize: 11,
    color: AC.danger,
    fontWeight: '600',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: AR.pill,
    backgroundColor: AC.bgApp,
    borderWidth: 1,
    borderColor: AC.border,
  },
  chipActive: {
    backgroundColor: AC.primary,
    borderColor: AC.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AC.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: AC.borderLight,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  switchSub: {
    fontSize: 11,
    color: AC.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: AC.bgCard,
    borderWidth: 1,
    borderColor: AC.border,
    borderRadius: AR.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: AC.textSecondary,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: AC.primary,
    borderRadius: AR.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});

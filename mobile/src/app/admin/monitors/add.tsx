import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AC, AR, AS } from '@/constants/adminTheme';
import { AdminMonitor, createMonitorApi } from '@/services/api';

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

export default function AddMonitorScreen() {
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState<AdminMonitor['serviceType']>('Service');
  const [description, setDescription] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [interval, setInterval] = useState('30s');
  const [healthStatus, setHealthStatus] = useState<AdminMonitor['healthStatus']>('Healthy');
  const [enabled, setEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
    if (!validate()) return;

    setLoading(true);
    try {
      await createMonitorApi({
        serviceName: serviceName.trim(),
        serviceType,
        description: description.trim(),
        endpoint: endpoint.trim(),
        interval,
        healthStatus,
        status: healthStatus === 'Healthy' ? 'online' : healthStatus === 'Warning' ? 'warning' : 'offline',
        enabled,
      });

      Alert.alert('Success', `Monitor for "${serviceName}" configured successfully!`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create monitor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AdminHeader title="Configure Monitor" showBack onBack={() => router.back()} />

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
            <Text style={styles.sectionTitle}>Monitor Configuration</Text>

            {/* Service Name */}
            <View style={styles.field}>
              <Text style={styles.label}>
                SERVICE NAME <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.serviceName ? styles.inputError : null]}
                placeholder="e.g. Clash Detection Worker 05"
                placeholderTextColor={AC.textTertiary}
                value={serviceName}
                onChangeText={(t) => {
                  setServiceName(t);
                  if (errors.serviceName) setErrors((prev) => ({ ...prev, serviceName: '' }));
                }}
              />
              {errors.serviceName ? <Text style={styles.errorText}>{errors.serviceName}</Text> : null}
            </View>

            {/* Service Type Selection */}
            <View style={styles.field}>
              <Text style={styles.label}>SERVICE COMPONENT TYPE</Text>
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

            {/* Endpoint / Service Identifier */}
            <View style={styles.field}>
              <Text style={styles.label}>
                ENDPOINT / SERVICE IDENTIFIER <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.endpoint ? styles.inputError : null]}
                placeholder="e.g. https://api.university.edu/health"
                placeholderTextColor={AC.textTertiary}
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
              <Text style={styles.label}>DESCRIPTION / NOTES</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description of this component's role..."
                placeholderTextColor={AC.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Polling Interval */}
            <View style={styles.field}>
              <Text style={styles.label}>PROBE INTERVAL</Text>
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

            {/* Initial Health Status */}
            <View style={styles.field}>
              <Text style={styles.label}>INITIAL HEALTH STATUS</Text>
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
                <Text style={styles.switchTitle}>Enable Active Probing</Text>
                <Text style={styles.switchSub}>Automatically dispatch periodic health checks</Text>
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
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Add Monitor</Text>
              )}
            </Pressable>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AC.bgApp },
  scroll: { flex: 1 },
  content: { padding: AS.screenH, gap: 16 },
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

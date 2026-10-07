import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AC, AR, AS } from '@/constants/adminTheme';
import {
  AdminMonitor,
  deleteMonitorApi,
  fetchMonitorByIdApi,
  updateMonitorApi,
} from '@/services/api';

export default function MonitorDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [monitor, setMonitor] = useState<AdminMonitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMonitor = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMonitorByIdApi(id);
      setMonitor(res?.data || res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch monitor details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitor();
  }, [id]);

  const handleToggle = async () => {
    if (!monitor) return;
    const nextState = !monitor.enabled;
    try {
      await updateMonitorApi(monitor._id || monitor.monitorId, { enabled: nextState });
      setMonitor({ ...monitor, enabled: nextState });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update monitor state');
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!monitor) return;
    try {
      setDeleting(true);
      await deleteMonitorApi(monitor._id || monitor.monitorId);
      setShowDeleteModal(false);
      Alert.alert('Success', 'Monitor deleted successfully.');
      router.replace('/admin/monitors' as any);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to delete monitor');
    } finally {
      setDeleting(false);
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'Healthy':
        return { bg: AC.successLight, text: AC.successText, dot: AC.success };
      case 'Warning':
        return { bg: AC.warningLight, text: AC.warningText, dot: AC.warning };
      case 'Critical':
        return { bg: AC.dangerLight, text: AC.dangerText, dot: AC.danger };
      default:
        return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
    }
  };

  return (
    <View style={styles.screen}>
      <AdminHeader title="Monitor Details" showBack onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/monitors'))} />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={AC.primary} />
          <Text style={styles.subText}>Loading monitor specs...</Text>
        </View>
      ) : error || !monitor ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Monitor Not Found</Text>
          <Text style={styles.subText}>{error || 'The requested service monitor could not be found.'}</Text>
          <Pressable style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.push('/admin/monitors'))}>
            <Text style={styles.backBtnText}>Return to Monitors</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Header Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>{monitor.serviceName}</Text>
                <Text style={styles.heroSub}>ID: {monitor.monitorId}</Text>
              </View>
              {(() => {
                const b = getHealthBadge(monitor.healthStatus);
                return (
                  <View style={[styles.badge, { backgroundColor: b.bg }]}>
                    <View style={[styles.dot, { backgroundColor: b.dot }]} />
                    <Text style={[styles.badgeText, { color: b.text }]}>{monitor.healthStatus}</Text>
                  </View>
                );
              })()}
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>RESPONSE TIME</Text>
                <Text style={styles.metricVal}>{monitor.responseTime || '1.1s'}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>INTERVAL</Text>
                <Text style={styles.metricVal}>{monitor.interval || '30s'}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>COMPONENT</Text>
                <Text style={styles.metricVal}>{monitor.serviceType}</Text>
              </View>
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configuration & Probing</Text>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Endpoint Target</Text>
              <Text style={styles.rowVal} numberOfLines={2}>
                {monitor.endpoint || 'Internal Engine Endpoint'}
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Component Type</Text>
              <Text style={styles.rowVal}>{monitor.serviceType}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Description</Text>
              <Text style={styles.rowVal}>{monitor.description || 'No description provided'}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Probe State</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.rowVal, { fontWeight: '700' }]}>
                  {monitor.enabled ? 'Enabled' : 'Paused'}
                </Text>
                <Switch
                  value={monitor.enabled}
                  onValueChange={handleToggle}
                  trackColor={{ false: '#CBD5E1', true: AC.primaryMid }}
                  thumbColor={monitor.enabled ? AC.primary : '#F1F5F9'}
                />
              </View>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Last Evaluated</Text>
              <Text style={styles.rowVal}>
                {monitor.lastChecked
                  ? new Date(monitor.lastChecked).toLocaleTimeString('en-US')
                  : 'Active Now'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={styles.editBtn}
              onPress={() =>
                router.push(`/admin/monitors/edit/${monitor._id || monitor.monitorId}` as any)
              }
            >
              <Text style={styles.editBtnText}>✏️ Edit Configuration</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>🗑 Delete Monitor</Text>
            </Pressable>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Monitor?</Text>
            <Text style={styles.modalDesc}>
              Are you sure you want to delete monitor "{monitor?.serviceName}"? This action cannot be undone.
            </Text>
            <View style={styles.modalActionCol}>
              <Pressable
                style={[styles.modalActionBtn, { backgroundColor: AC.danger }]}
                disabled={deleting}
                onPress={confirmDelete}
              >
                <Text style={styles.modalBtnText}>Delete Monitor</Text>
              </Pressable>

              <Pressable
                style={styles.modalCancelBtn}
                disabled={deleting}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: AC.textPrimary },
  modalDesc: { fontSize: 13, color: AC.textSecondary, lineHeight: 18 },
  modalActionCol: { gap: 10, marginTop: 8 },
  modalActionBtn: {
    paddingVertical: 12,
    borderRadius: AR.button,
    alignItems: 'center',
  },
  modalBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: AC.border,
    paddingVertical: 12,
    borderRadius: AR.button,
    alignItems: 'center',
    backgroundColor: AC.bgApp,
  },
  modalCancelText: { color: AC.textSecondary, fontSize: 14, fontWeight: '600' },
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
  errorIcon: { fontSize: 36 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: AC.danger },
  backBtn: {
    marginTop: 8,
    backgroundColor: AC.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: AR.button,
  },
  backBtnText: { color: '#FFF', fontWeight: '700' },
  heroCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  heroSub: {
    fontSize: 12,
    color: AC.textTertiary,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AR.chip,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: AC.bgApp,
    borderRadius: AR.button,
    padding: 12,
    gap: 8,
  },
  metricBox: { flex: 1, alignItems: 'center', gap: 2 },
  metricLabel: { fontSize: 9, fontWeight: '800', color: AC.textTertiary, letterSpacing: 0.5 },
  metricVal: { fontSize: 14, fontWeight: '700', color: AC.textPrimary },
  card: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabel: { fontSize: 13, color: AC.textSecondary },
  rowVal: { fontSize: 13, fontWeight: '600', color: AC.textPrimary, maxWidth: '65%' },
  divider: { height: 1, backgroundColor: AC.borderLight },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editBtn: {
    flex: 1,
    backgroundColor: AC.primary,
    borderRadius: AR.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  deleteBtn: {
    flex: 1,
    backgroundColor: AC.dangerLight,
    borderRadius: AR.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: AC.dangerText, fontSize: 14, fontWeight: '700' },
});

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressBar } from '@/components/admin/ProgressBar';
import { AC, AR, AS } from '@/constants/adminTheme';
import {
  updateAlertStatusApi,
  deleteAlertApi,
  fetchAlertByIdApi,
  acknowledgeAlertApi,
  resolveAlertApi,
  reopenAlertApi,
  fetchAdminDashboardStatsApi,
  AdminDashboardStats,
} from '@/services/api';

type IncidentState = 'active' | 'resolved' | 'monitoring' | 'acknowledged';

function TelemetryMetricCard({
  label,
  value,
  unit,
  sub,
  progress,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  progress: number;
  color: string;
}) {
  return (
    <View style={tmStyles.card}>
      <Text style={tmStyles.label}>{label}</Text>
      <Text style={[tmStyles.value, { color }]}>
        {value}
        {unit ? <Text style={tmStyles.unit}>{unit}</Text> : null}
      </Text>
      <ProgressBar progress={progress} color={color} height={4} />
      <Text style={tmStyles.sub}>{sub}</Text>
    </View>
  );
}

const tmStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 10,
    gap: 4,
  },
  label: { fontSize: 9, fontWeight: '700', color: AC.textSecondary, letterSpacing: 0.5 },
  value: { fontSize: 22, fontWeight: '800' },
  unit: { fontSize: 13, fontWeight: '600' },
  sub: { fontSize: 9, color: AC.textSecondary, marginTop: 2 },
});

function ImpactItem({
  title,
  desc,
  color,
  bgColor,
}: {
  title: string;
  desc: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[impStyles.item, { backgroundColor: bgColor }]}>
      <View style={[impStyles.iconBox, { backgroundColor: color + '33' }]}>
        <Text style={[impStyles.iconText, { color }]}>!</Text>
      </View>
      <View style={impStyles.textBox}>
        <Text style={[impStyles.title, { color }]}>{title}</Text>
        <Text style={impStyles.desc}>{desc}</Text>
      </View>
    </View>
  );
}

const impStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    borderRadius: AR.card,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18, fontWeight: '800' },
  textBox: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  desc: { fontSize: 11, color: AC.textSecondary, marginTop: 3, lineHeight: 16 },
});

export default function IssueDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();

  const [loading, setLoading] = useState(true);
  const [alertData, setAlertData] = useState<any>(null);
  const [incidentState, setIncidentState] = useState<IncidentState>('active');
  const [monitoring, setMonitoring] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);

  const loadDetails = useCallback(async () => {
    if (!alertId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [alertRes, statsRes] = await Promise.all([
        fetchAlertByIdApi(alertId),
        fetchAdminDashboardStatsApi().catch(() => null),
      ]);

      if (alertRes && alertRes.data) {
        setAlertData(alertRes.data);
        setIncidentState(alertRes.data.state || 'active');
      }
      if (statsRes && statsRes.data) {
        setDashboardStats(statsRes.data);
      }
    } catch {
      // Alert could not be loaded
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const isResolved = incidentState === 'resolved';

  function handleResolve() {
    setShowResolveModal(true);
  }

  async function confirmResolve() {
    setShowResolveModal(false);
    setIncidentState('resolved');
    if (alertId) {
      try {
        await resolveAlertApi(alertId, 'Resolved by Administrator');
        Alert.alert('Incident Resolved', 'Incident marked as resolved in database.');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to update alert in database.');
      }
    }
  }

  async function handleAcknowledge() {
    setIncidentState('acknowledged');
    if (alertId) {
      try {
        await acknowledgeAlertApi(alertId);
        Alert.alert('Acknowledged', `Incident ${alertId} marked as acknowledged in database.`);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to acknowledge alert.');
      }
    }
  }

  async function handleReopen() {
    setIncidentState('active');
    if (alertId) {
      try {
        await reopenAlertApi(alertId);
        Alert.alert('Reopened', `Incident ${alertId} reopened in database.`);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to reopen alert.');
      }
    }
  }

  function handleDismiss() {
    setShowDismissModal(true);
  }

  async function confirmDismiss() {
    if (!alertId) return;
    try {
      setDismissing(true);
      await deleteAlertApi(alertId);
      setShowDismissModal(false);
      Alert.alert('Dismissed', 'Incident dismissed from database.');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/admin/alerts' as any);
      }
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('not found') || err?.message?.includes('404')) {
        setShowDismissModal(false);
        Alert.alert('Dismissed', 'Incident is already removed.');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push('/admin/alerts' as any);
        }
      } else {
        Alert.alert('Error', err.message || 'Failed to delete alert.');
      }
    } finally {
      setDismissing(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AC.primary} />
        <Text style={{ marginTop: 12, color: AC.textSecondary }}>Loading real incident record...</Text>
      </View>
    );
  }

  // Derive real values from database alert
  const idDisplay = alertData?.alertId || alertData?._id || alertId || 'UNKNOWN';
  const titleDisplay = alertData?.title || 'System Incident';
  const serviceDisplay = alertData?.service || alertData?.monitorId?.serviceName || 'Core Infrastructure';
  const workerDisplay = alertData?.worker || 'Operational Node';
  const severityDisplay = (alertData?.severity || 'HIGH').toUpperCase();
  const detectedAtDisplay = alertData?.createdAt
    ? new Date(alertData.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : alertData?.time || 'Live Record';

  const clusterStatus = isResolved
    ? 'RESOLVED'
    : severityDisplay === 'CRITICAL' || severityDisplay === 'HIGH'
    ? 'FAILING'
    : 'DEGRADED';

  // Real telemetry values
  const respTimeVal = dashboardStats?.systemHealth?.averageResponseTime || '--';
  const sysLoadVal = dashboardStats?.systemLoad
    ? `${dashboardStats.systemLoad.memoryUsagePercentage}`
    : '--';
  const sysLoadProgress = dashboardStats?.systemLoad
    ? Math.min(1, dashboardStats.systemLoad.memoryUsagePercentage / 100)
    : 0.5;
  const activeUsersVal = dashboardStats?.users
    ? `${dashboardStats.users.active}`
    : '--';
  const activeUsersProgress = dashboardStats?.users && dashboardStats.users.total > 0
    ? Math.min(1, dashboardStats.users.active / dashboardStats.users.total)
    : 0.5;

  const impactsList = [
    {
      id: 'impact-1',
      title: 'Service Incident Impact',
      desc: alertData?.impactNote || `${serviceDisplay} reported ${severityDisplay} severity disruption.`,
      color: '#EF4444',
      bgColor: '#FFF1F2',
    },
    ...(alertData?.metricLabel1
      ? [
          {
            id: 'impact-2',
            title: alertData.metricLabel1,
            desc: `Observed Metric: ${alertData.metricValue1 || 'Threshold exceeded'}`,
            color: '#F43F5E',
            bgColor: '#FFF1F2',
          },
        ]
      : []),
    {
      id: 'impact-3',
      title: 'Database Telemetry Audit',
      desc: alertData?.resolvedNote
        ? `Resolution Note: ${alertData.resolvedNote}`
        : 'Registered in monitoring ledger with live administrative tracking.',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/admin/alerts' as any))}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Issue Details</Text>
        </Pressable>
        <View style={styles.profileBtn}>
          <Text style={styles.profileText}>A</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav breadcrumb */}
        <View style={styles.section}>
          <View style={styles.navRow}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.push('/admin/alerts' as any))}
              accessibilityRole="button"
            >
              <Text style={styles.backNavText}>← Back to System Alerts</Text>
            </Pressable>
            <View style={styles.navRight}>
              <View style={styles.alertIdBadge}>
                <Text style={styles.alertIdText}>{idDisplay}</Text>
              </View>
              <View style={styles.liveIncidentBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveIncidentText}>LIVE INCIDENT</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Incident summary card */}
        <View style={styles.section}>
          <View style={styles.incidentCard}>
            <View style={styles.incidentTopRow}>
              <View style={[styles.severityBadge, isResolved ? styles.resolvedBadge : null]}>
                <Text style={[styles.severityText, isResolved ? { color: AC.success } : null]}>
                  {isResolved ? 'RESOLVED' : `${severityDisplay} SEVERITY`}
                </Text>
              </View>
              <View style={[styles.stateBadge, isResolved ? styles.stateResolvedBadge : null]}>
                <View
                  style={[
                    styles.stateDot,
                    isResolved ? { backgroundColor: AC.success } : null,
                  ]}
                />
                <Text
                  style={[styles.stateText, isResolved ? { color: AC.success } : null]}
                >
                  {isResolved ? 'Resolved' : incidentState.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.incidentTitle}>{titleDisplay}</Text>
            <Text style={styles.detectedText}>
              Detected: {detectedAtDisplay}
            </Text>
            <View style={styles.clusterCard}>
              <View style={styles.clusterIcon}>
                <Text style={styles.clusterIconText}>SRV</Text>
              </View>
              <View style={styles.clusterInfo}>
                <Text style={styles.clusterLabel}>AFFECTED NODE CLUSTER</Text>
                <Text style={styles.clusterName}>{serviceDisplay}</Text>
                <Text style={styles.clusterSub}>{workerDisplay}</Text>
              </View>
              <View
                style={[
                  styles.failingBadge,
                  isResolved ? styles.resolvedStatusBadge : null,
                ]}
              >
                <Text
                  style={[
                    styles.failingText,
                    isResolved ? { color: AC.success } : null,
                  ]}
                >
                  {clusterStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Real-Time Telemetry from Live Backend */}
        <View style={styles.section}>
          <View style={styles.telemetryHeader}>
            <Text style={styles.telemetryLabel}>REAL-TIME OCCURRENCE TELEMETRY</Text>
            <View style={styles.liveStreamBadge}>
              <View style={styles.liveStreamDot} />
              <Text style={styles.liveStreamText}>Live Stream</Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <TelemetryMetricCard
              label="RESP. TIME"
              value={respTimeVal}
              sub="Measured Avg"
              progress={respTimeVal !== '--' ? 0.6 : 0.1}
              color={AC.danger}
            />
            <TelemetryMetricCard
              label="SYS LOAD"
              value={sysLoadVal}
              unit="%"
              sub="Memory telemetry"
              progress={sysLoadProgress}
              color={AC.warning}
            />
            <TelemetryMetricCard
              label="ACTIVE USERS"
              value={activeUsersVal}
              sub="Active accounts"
              progress={activeUsersProgress}
              color={AC.primary}
            />
          </View>
        </View>

        {/* Incident Summary */}
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>INCIDENT SUMMARY</Text>
            <Text style={styles.summaryText}>
              {alertData?.impactNote || alertData?.description || `${titleDisplay} recorded in database for ${serviceDisplay}.`}
            </Text>
            <Text style={styles.automatedText}>
              {alertData?.resolvedNote
                ? `Resolution: ${alertData.resolvedNote}`
                : 'Automated monitoring probe captured this event directly from the database.'}
            </Text>
          </View>
        </View>

        {/* Impact Breakdown */}
        <View style={styles.section}>
          <View style={styles.impactCard}>
            <View style={styles.impactHeader}>
              <Text style={styles.impactTitle}>SYSTEM IMPACT BREAKDOWN</Text>
              <View style={styles.vectorsBadge}>
                <Text style={styles.vectorsText}>{impactsList.length} vectors</Text>
              </View>
            </View>
            <View style={styles.impactList}>
              {impactsList.map(impact => (
                <ImpactItem
                  key={impact.id}
                  title={impact.title}
                  desc={impact.desc}
                  color={impact.color}
                  bgColor={impact.bgColor}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.section, styles.btnSection]}>
          {!isResolved ? (
            <View style={{ gap: 8 }}>
              <Pressable
                style={styles.resolveBtn}
                onPress={handleResolve}
                accessibilityRole="button"
                accessibilityLabel="Mark as Resolved"
              >
                <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
              </Pressable>

              {incidentState !== 'acknowledged' && (
                <Pressable
                  style={[styles.resolveBtn, { backgroundColor: AC.warning }]}
                  onPress={handleAcknowledge}
                  accessibilityRole="button"
                  accessibilityLabel="Acknowledge Alert"
                >
                  <Text style={styles.resolveBtnText}>Acknowledge Alert</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <View style={styles.resolvedSuccessBtn}>
                <Text style={styles.resolvedSuccessText}>✓ Incident Resolved</Text>
              </View>
              <Pressable
                style={[styles.resolveBtn, { backgroundColor: AC.primary }]}
                onPress={handleReopen}
                accessibilityRole="button"
                accessibilityLabel="Reopen Incident"
              >
                <Text style={styles.resolveBtnText}>Reopen Incident</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={[styles.resolveBtn, { backgroundColor: AC.dangerLight, borderWidth: 1, borderColor: AC.danger }]}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss Incident"
          >
            <Text style={[styles.resolveBtnText, { color: AC.dangerText }]}>Dismiss / Delete Incident</Text>
          </Pressable>

          <Pressable
            style={[styles.monitorBtn, monitoring ? styles.monitoringBtn : null]}
            onPress={() => setMonitoring(m => !m)}
            accessibilityRole="button"
            accessibilityLabel={monitoring ? 'Stop Monitoring' : 'Monitor Issue'}
          >
            <Text style={[styles.monitorBtnText, monitoring ? { color: AC.primary } : null]}>
              {monitoring ? 'Monitoring Active' : 'Monitor Issue'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/admin/service-status')}
            accessibilityRole="link"
          >
            <Text style={styles.linkText}>View Service Status and Probes →</Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Resolve Modal */}
      <Modal
        visible={showResolveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResolveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Mark as Resolved?</Text>
            <Text style={styles.modalDesc}>Confirm marking this incident as resolved in database?</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setShowResolveModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={confirmResolve}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dismiss / Delete Modal */}
      <Modal
        visible={showDismissModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDismissModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Dismiss Incident?</Text>
            <Text style={styles.modalDesc}>
              Are you sure you want to permanently delete incident {idDisplay} from database?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                disabled={dismissing}
                onPress={() => setShowDismissModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, { backgroundColor: AC.danger }]}
                disabled={dismissing}
                onPress={confirmDismiss}
              >
                <Text style={styles.modalConfirmText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AC.bgApp },
  scroll: { flex: 1 },
  content: { paddingBottom: 8 },
  section: { paddingHorizontal: AS.screenH, marginTop: 12 },
  header: {
    backgroundColor: AC.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: AC.border,
    paddingHorizontal: AS.screenH,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backArrow: { fontSize: 18, color: AC.primary, fontWeight: '700' },
  backText: { fontSize: 18, fontWeight: '700', color: AC.textPrimary },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AC.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  backNavText: { fontSize: 12, fontWeight: '600', color: AC.primary },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertIdBadge: {
    borderWidth: 1,
    borderColor: AC.border,
    borderRadius: AR.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  alertIdText: { fontSize: 11, fontWeight: '700', color: AC.textSecondary },
  liveIncidentBadge: {
    backgroundColor: AC.dangerLight,
    borderRadius: AR.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AC.danger },
  liveIncidentText: { fontSize: 10, fontWeight: '700', color: AC.danger, letterSpacing: 0.4 },
  incidentCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 8,
  },
  incidentTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  severityBadge: {
    backgroundColor: AC.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AR.chip,
  },
  resolvedBadge: { backgroundColor: AC.successLight },
  severityText: { fontSize: 11, fontWeight: '800', color: AC.danger, letterSpacing: 0.3 },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AC.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AR.chip,
  },
  stateResolvedBadge: { backgroundColor: AC.successLight },
  stateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AC.danger },
  stateText: { fontSize: 11, fontWeight: '600', color: AC.danger },
  incidentTitle: { fontSize: 22, fontWeight: '800', color: AC.textPrimary, lineHeight: 28 },
  detectedText: { fontSize: 11, color: AC.textSecondary },
  clusterCard: {
    backgroundColor: AC.borderLight,
    borderRadius: AR.chip,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  clusterIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: AC.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterIconText: { fontSize: 10, color: AC.primary, fontWeight: '800' },
  clusterInfo: { flex: 1 },
  clusterLabel: { fontSize: 9, fontWeight: '700', color: AC.textSecondary, letterSpacing: 0.5 },
  clusterName: { fontSize: 13, fontWeight: '700', color: AC.textPrimary },
  clusterSub: { fontSize: 10, color: AC.textSecondary },
  failingBadge: {
    backgroundColor: AC.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AR.chip,
  },
  resolvedStatusBadge: { backgroundColor: AC.successLight },
  failingText: { fontSize: 10, fontWeight: '800', color: AC.danger, letterSpacing: 0.3 },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  telemetryLabel: { fontSize: 10, fontWeight: '700', color: AC.textSecondary, letterSpacing: 0.5 },
  liveStreamBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveStreamDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AC.success },
  liveStreamText: { fontSize: 11, fontWeight: '600', color: AC.success },
  metricsRow: { flexDirection: 'row', gap: 8 },
  summaryCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 8,
  },
  summaryTitle: { fontSize: 11, fontWeight: '800', color: AC.primary, letterSpacing: 0.5 },
  summaryText: { fontSize: 13, color: AC.textPrimary, lineHeight: 20 },
  automatedText: { fontSize: 11, color: AC.textSecondary },
  impactCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 10,
  },
  impactHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  impactTitle: { fontSize: 11, fontWeight: '800', color: AC.textSecondary, letterSpacing: 0.5 },
  vectorsBadge: {
    backgroundColor: AC.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AR.chip,
  },
  vectorsText: { fontSize: 10, fontWeight: '700', color: AC.danger },
  impactList: { gap: 8 },
  btnSection: { gap: 10, marginTop: 4 },
  resolveBtn: {
    backgroundColor: AC.success,
    borderRadius: AR.button,
    paddingVertical: 15,
    alignItems: 'center',
  },
  resolveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  resolvedSuccessBtn: {
    backgroundColor: AC.success,
    borderRadius: AR.button,
    paddingVertical: 15,
    alignItems: 'center',
    opacity: 0.85,
  },
  resolvedSuccessText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  monitorBtn: {
    borderWidth: 1.5,
    borderColor: AC.border,
    borderRadius: AR.button,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: AC.bgCard,
  },
  monitoringBtn: { borderColor: AC.primary, backgroundColor: AC.primaryLight },
  monitorBtnText: { fontSize: 14, fontWeight: '600', color: AC.textPrimary },
  linkText: { textAlign: 'center', fontSize: 12, fontWeight: '600', color: AC.primary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: AC.textPrimary },
  modalDesc: { fontSize: 14, color: AC.textSecondary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: AC.border,
    borderRadius: AR.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: AC.textSecondary },
  modalConfirm: {
    flex: 1,
    backgroundColor: AC.success,
    borderRadius: AR.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

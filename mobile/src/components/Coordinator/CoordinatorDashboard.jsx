import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ActionButton, CoordinatorIcon, CoordinatorScaffold, Panel, ProgressBar, SectionHeading, StatusBadge } from "@/components/Coordinator/CoordinatorUI";
import CoordinatorTheme from "@/constants/CoordinatorTheme";
import { api } from "@/services/api";
import { useCoordinatorAuth } from "@/services/CoordinatorAuth";
const {
  colors,
  radius,
  spacing
} = CoordinatorTheme;
function formatCount(value = 0) {
  return value.toLocaleString();
}
function formatBytes(value = 0) {
  return value >= 1048576 ? `${(value / 1048576).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`;
}
function relativeTime(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}
function TelemetryCard({
  value,
  label,
  caption,
  badge,
  icon,
  tone = "normal"
}) {
  return <View style={[styles.metricCard, tone === "danger" && styles.metricCardDanger]}>
      <View style={styles.metricTop}>
        <View style={[styles.metricIcon, tone === "danger" && styles.metricIconDanger]}>
          <CoordinatorIcon name={icon} color={tone === "danger" ? colors.red : colors.primary} size={17} />
        </View>
        {tone === "danger" ? <StatusBadge label={badge} tone="danger" /> : null}
      </View>
      <Text style={[styles.metricValue, tone === "danger" && styles.metricValueDanger]}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricCaption}>{caption}</Text>
      {tone !== "danger" ? <Text style={styles.metricBadge}>{badge}</Text> : null}
    </View>;
}
function RecentUploadRow({
  name,
  meta,
  status,
  danger = false,
  icon
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${name}, ${status}`} onPress={() => router.push(danger ? "/(tabs)/errors" : "/(tabs)/timetable")} style={({
    pressed
  }) => [styles.uploadRow, pressed && styles.pressed]}>
      <View style={[styles.uploadIcon, danger && styles.uploadIconDanger]}>
        <CoordinatorIcon name={icon} color={danger ? colors.red : colors.primary} size={18} />
      </View>
      <View style={styles.uploadCopy}>
        <Text numberOfLines={1} style={styles.uploadTitle}>
          {name}
        </Text>
        <Text numberOfLines={1} style={styles.uploadMeta}>
          {meta}
        </Text>
      </View>
      <StatusBadge label={status} tone={danger ? "danger" : "success"} />
    </Pressable>;
}
export default function CoordinatorDashboard() {
  const [stats, setStats] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [syncedAt, setSyncedAt] = useState(null);
  const {
    user
  } = useCoordinatorAuth();
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [dashboard, timetablePage] = await Promise.all([api.dashboard(), api.timetables("limit=100")]);
      setStats(dashboard.data);
      setTimetables(timetablePage.data);
      setSyncedAt(new Date());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));
  const latestPeriod = timetables[0];
  const recentUploads = stats?.recentUploads ?? [];
  return <CoordinatorScaffold title="Coordinator Dashboard" activeTab="Dashboard">
      <Pressable onPress={() => Alert.alert("Academic Period", latestPeriod ? `${latestPeriod.academicYear} — ${latestPeriod.semester}` : "No academic period has been uploaded yet.")} accessibilityRole="button" style={({
      pressed
    }) => [styles.periodStrip, pressed && styles.pressed]}>
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>{latestPeriod ? `${latestPeriod.academicYear} — ${latestPeriod.semester}` : "No active academic period"}</Text>
        </View>
        <View style={styles.syncedText}>
          <CoordinatorIcon name="sync" size={13} color={colors.muted} />
          <Text style={styles.metaText}>{syncedAt ? `Synced ${relativeTime(syncedAt)}` : "Not synced"}</Text>
        </View>
      </Pressable>

      <View style={styles.greetingBlock}>
        <Text style={styles.greeting}>Welcome, {user?.name ?? "Coordinator"}</Text>
        <Text style={styles.greetingHint}>
          Here is your campus schedule overview.
        </Text>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeading title="INSTITUTIONAL TELEMETRY" action="Live Feed  →" onPress={() => Alert.alert("Live Feed", loadError || `Dashboard data ${syncedAt ? `was synchronized ${relativeTime(syncedAt)}` : "is loading"}.`)} />
        {loading && !stats ? <ActivityIndicator color={colors.primary} /> : loadError && !stats ? <Panel><Text style={styles.greetingHint}>{loadError}</Text><ActionButton label="Retry" kind="secondary" icon="refresh" onPress={() => {
          void load();
        }} /></Panel> : <View style={styles.metricGrid}>
          <TelemetryCard value={formatCount(stats?.timetableFiles ?? 0)} label="Timetable Files" caption={`${stats?.activeSemesters ?? 0} Active Semesters`} badge="MongoDB" icon="calendar" />
          <TelemetryCard value={formatCount(stats?.subgroupData ?? 0)} label="Subgroup Data" caption="Allocated Cohorts" badge="Records" icon="group" />
          <TelemetryCard value={`${stats?.validMatrix ?? 0}%`} label="Valid Matrix" caption="Clean Schedule" badge={stats?.validationStatus.status === "not_run" ? "NOT RUN" : String(stats?.validationStatus.status ?? "—").replaceAll("_", " ").toUpperCase()} icon="validation" />
          <TelemetryCard value={formatCount(stats?.scheduleClashes ?? 0)} label="Schedule Clashes" caption="Action Required" badge={stats?.scheduleClashes ? "ACTION" : "CLEAR"} icon="warning" tone="danger" />
        </View>}
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Quick Actions" action="Workflow Operations" />
        <ActionButton label="Upload Master Timetable" icon="upload" onPress={() => router.push("/(tabs)/timetable")} />
        <ActionButton label="Upload Subgroup Data" icon="group" kind="secondary" onPress={() => router.push("/(tabs)/subgroups")} />
        <Pressable accessibilityRole="button" accessibilityLabel="Run Validation Engine" onPress={() => router.push("/(tabs)/validation")} style={({
        pressed
      }) => [styles.validationQuickAction, pressed && styles.pressed]}>
          <View style={styles.quickActionLeft}>
            <CoordinatorIcon name="validation" color={colors.primary} size={19} />
            <Text style={styles.validationActionText}>
              Run Validation Engine
            </Text>
          </View>
          <StatusBadge label="FAST SWEEP" tone="info" />
        </Pressable>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Recent Uploads" action="View all  →" onPress={() => router.push("/(tabs)/timetable")} />
        <Panel style={styles.uploadsPanel}>
          {recentUploads.length ? recentUploads.map((upload, index) => <View key={upload.id}>{index ? <View style={styles.rowDivider} /> : null}<RecentUploadRow name={upload.fileName} meta={`${formatBytes(upload.fileSize)}  •  ${formatCount(upload.recordCount)} ${upload.type === "timetable" ? "slots" : "rows"}  •  ${relativeTime(new Date(upload.createdAt))} ago`} status={upload.status.toUpperCase()} danger={upload.type === "subgroups" && (stats?.scheduleClashes ?? 0) > 0} icon={upload.type === "timetable" ? "calendar" : "group"} /></View>) : <Text style={styles.emptyText}>No uploads have been added yet.</Text>}
        </Panel>
      </View>

      <Panel style={styles.enginePanel}>
        <View style={styles.engineHeading}>
          <View style={styles.engineStatusDot} />
          <Text style={styles.engineTitle}>Validation Engine</Text>
          <StatusBadge label={stats?.validationStatus.status === "not_run" ? "READY" : "CONNECTED"} tone="success" />
        </View>
        <Text style={styles.engineCopy}>
          Validate uploaded timetable and subgroup records for student, venue, lecturer and capacity conflicts.
        </Text>
        <Text style={styles.nextSync}>
          {stats?.validationStatus.createdAt ? `Last run ${relativeTime(new Date(String(stats.validationStatus.createdAt)))} ago.` : "No validation run has been recorded yet."}
        </Text>
        <View style={styles.progressCaptionRow}>
          <Text style={styles.progressLabel}>{stats?.validationStatus.status === "not_run" ? "NO VALIDATION RUN" : "LATEST VALIDATION"}</Text>
          <Text style={styles.progressLabel}>{stats?.validMatrix ?? 0}%</Text>
        </View>
        <ProgressBar progress={stats?.validMatrix ?? 0} />
      </Panel>
    </CoordinatorScaffold>;
}
const styles = StyleSheet.create({
  periodStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.small
  },
  periodBadge: {
    backgroundColor: colors.lightPurple,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  periodText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700"
  },
  syncedText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  metaText: {
    color: colors.muted,
    fontSize: 10
  },
  emptyText: {
    color: colors.muted,
    fontSize: 11,
    paddingVertical: spacing.medium
  },
  greetingBlock: {
    gap: 4,
    marginTop: -spacing.small
  },
  greeting: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700"
  },
  greetingHint: {
    color: colors.muted,
    fontSize: 12
  },
  sectionBlock: {
    gap: spacing.medium
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.small
  },
  metricCard: {
    width: "48.5%",
    minHeight: 145,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    padding: spacing.medium
  },
  metricCardDanger: {
    backgroundColor: colors.redSurface,
    borderColor: "#F5C9CE"
  },
  metricTop: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  metricIcon: {
    width: 30,
    height: 30,
    backgroundColor: colors.lightPurple,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center"
  },
  metricIconDanger: {
    backgroundColor: "#FFE1E5"
  },
  metricValue: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    marginTop: 7
  },
  metricValueDanger: {
    color: colors.red
  },
  metricLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1
  },
  metricCaption: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 3
  },
  metricBadge: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 6
  },
  validationQuickAction: {
    minHeight: 52,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: "#DCE5FF",
    backgroundColor: colors.infoSurface,
    paddingHorizontal: spacing.medium,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.small
  },
  quickActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small
  },
  validationActionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700"
  },
  uploadsPanel: {
    paddingVertical: spacing.small
  },
  uploadRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.medium
  },
  uploadIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.infoSurface
  },
  uploadIconDanger: {
    backgroundColor: colors.redSurface
  },
  uploadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5
  },
  uploadTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700"
  },
  uploadMeta: {
    color: colors.muted,
    fontSize: 9
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border
  },
  enginePanel: {
    backgroundColor: colors.infoSurface,
    borderColor: "#DCE5FF",
    gap: spacing.small
  },
  engineHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small
  },
  engineStatusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.green
  },
  engineTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: "700"
  },
  engineCopy: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17
  },
  nextSync: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "600"
  },
  progressCaptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3
  },
  progressLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3
  },
  pressed: {
    opacity: 0.78
  }
});

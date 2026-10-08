import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import CoordinatorTheme from '@/constants/CoordinatorTheme';
import { ActionButton, CoordinatorIcon, CoordinatorScaffold, Panel, ProgressBar, SectionHeading, StatusBadge, WorkflowStepper } from '@/components/Coordinator/CoordinatorUI';
import { api } from '@/services/api';
import { useCoordinatorAuth } from '@/services/CoordinatorAuth';
const {
  colors,
  radius,
  spacing
} = CoordinatorTheme;
function toBackendSlotCode(slot) {
  const normalized = slot.trim().toUpperCase();
  return normalized.startsWith('SLOT-') ? normalized : `SLOT-${normalized}`;
}
function canonicalSlot(slot) {
  return toBackendSlotCode(slot);
}
function minutes(value) {
  const match = /^(?:([01]\d|2[0-3])):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
function schedulesOverlap(left, right) {
  const leftStart = minutes(left.startTime);
  const leftEnd = minutes(left.endTime);
  const rightStart = minutes(right.startTime);
  const rightEnd = minutes(right.endTime);
  return left.day === right.day && leftStart !== null && leftEnd !== null && rightStart !== null && rightEnd !== null && leftStart < rightEnd && rightStart < leftEnd;
}
function sessionKey(record) {
  return [record.moduleCode.trim().toUpperCase(), canonicalSlot(record.subgroup), record.day, record.startTime, record.endTime, record.venue.trim().toLowerCase()].join('|');
}
async function getAllTimetableSubgroups(timetableId) {
  const records = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await api.subgroups(`timetableId=${encodeURIComponent(timetableId)}&page=${page}&limit=500`);
    records.push(...result.data);
    totalPages = result.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);
  return records;
}
function validTargetSessions(masterSessions, records, current) {
  const currentSlot = canonicalSlot(current.currentSlot.subgroup);
  const currentRecordId = current.subgroupId;
  const currentSession = [current.moduleCode.trim().toUpperCase(), currentSlot, current.currentSlot.day, current.currentSlot.startTime, current.currentSlot.endTime, current.currentSlot.venue.trim().toLowerCase()].join('|');
  const candidates = masterSessions.filter(item => item.moduleCode.trim().toUpperCase() === current.moduleCode.trim().toUpperCase());
  const sessions = [...new Map(candidates.map(item => [sessionKey(item), item])).values()];
  const bySlot = new Map();
  for (const candidate of sessions) {
    const slotCode = canonicalSlot(candidate.subgroup);
    if (slotCode === currentSlot) continue;
    const sameSession = sessionKey(candidate);
    const otherSessions = [...new Map(masterSessions.filter(item => sessionKey(item) !== sameSession && sessionKey(item) !== currentSession).map(item => [sessionKey(item), item])).values()];
    const venueConflict = otherSessions.some(item => item.venue.trim().toLowerCase() === candidate.venue.trim().toLowerCase() && schedulesOverlap(item, candidate));
    const lecturerConflict = candidate.lecturerName?.trim() && otherSessions.some(item => item.lecturerName?.trim().toLowerCase() === candidate.lecturerName?.trim().toLowerCase() && schedulesOverlap(item, candidate));
    const studentConflict = records.some(item => item.status === 'active' && item.studentId.toUpperCase() === (current.studentId ?? '').toUpperCase() && item._id !== currentRecordId && sessionKey(item) !== currentSession && sessionKey(item) !== sameSession && schedulesOverlap(item, candidate));
    if (venueConflict || lecturerConflict || studentConflict) continue;
    if (!bySlot.has(slotCode)) bySlot.set(slotCode, {
      slot: slotCode,
      record: candidate
    });
  }
  return [...bySlot.values()];
}
function relativeTime(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}
function SummaryStat({
  value,
  label,
  hint,
  tone = 'normal'
}) {
  return <Panel style={[styles.summaryStat, tone === 'danger' && styles.summaryDanger, tone === 'success' && styles.summarySuccess]}>
      <Text style={[styles.summaryNumber, tone === 'danger' && styles.textDanger, tone === 'success' && styles.textSuccess]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      {hint ? <Text style={styles.summaryHint}>{hint}</Text> : null}
    </Panel>;
}
function RuleRow({
  title,
  result,
  tone
}) {
  const icons = {
    success: 'check',
    danger: 'warning',
    warning: 'info'
  };
  return <View style={styles.ruleRow}>
      <View style={[styles.ruleIcon, tone === 'success' && styles.ruleSuccess, tone === 'danger' && styles.ruleDanger, tone === 'warning' && styles.ruleWarning]}>
        <CoordinatorIcon name={icons[tone]} color={tone === 'success' ? colors.green : tone === 'danger' ? colors.red : colors.warning} size={15} />
      </View>
      <Text style={styles.ruleTitle}>{title}</Text>
      <StatusBadge label={result} tone={tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : 'warning'} />
    </View>;
}
export function ValidateDataScreen() {
  const params = useLocalSearchParams();
  const [timetables, setTimetables] = useState([]);
  const [timetableId, setTimetableId] = useState(params.timetableId ?? '');
  const [latest, setLatest] = useState(null);
  const [errors, setErrors] = useState([]);
  const [typeCounts, setTypeCounts] = useState({});
  const [runCount, setRunCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const selectedTimetable = timetables.find(item => item._id === timetableId);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const timetablePage = await api.timetables('limit=100');
      setTimetables(timetablePage.data);
      const activeId = timetableId || params.timetableId || timetablePage.data[0]?._id || '';
      if (activeId !== timetableId) setTimetableId(activeId);
      if (!activeId) {
        setLatest(null);
        setErrors([]);
        setTypeCounts({});
        setRunCount(0);
        return;
      }
      const [runs, allErrors, clashErrors, capacityErrors, lecturerErrors, venueErrors] = await Promise.all([api.validationRuns(activeId), api.errors(`timetableId=${encodeURIComponent(activeId)}&status=unresolved&limit=100`), api.errors(`timetableId=${encodeURIComponent(activeId)}&errorType=CLASH&status=unresolved&limit=1`), api.errors(`timetableId=${encodeURIComponent(activeId)}&errorType=CAPACITY&status=unresolved&limit=1`), api.errors(`timetableId=${encodeURIComponent(activeId)}&errorType=LECTURER_CONFLICT&status=unresolved&limit=1`), api.errors(`timetableId=${encodeURIComponent(activeId)}&errorType=VENUE_CONFLICT&status=unresolved&limit=1`)]);
      setLatest(runs.data[0] ?? null);
      setErrors(allErrors.data);
      setTypeCounts({
        CLASH: clashErrors.pagination.total,
        CAPACITY: capacityErrors.pagination.total,
        LECTURER_CONFLICT: lecturerErrors.pagination.total,
        VENUE_CONFLICT: venueErrors.pagination.total
      });
      setRunCount(runs.data.length);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load validation data.');
    } finally {
      setLoading(false);
    }
  }, [params.timetableId, timetableId]);
  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));
  const run = async () => {
    if (!timetableId) {
      setError('Upload a timetable before running validation.');
      return;
    }
    setRunning(true);
    setError('');
    try {
      await api.runValidation(timetableId);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Validation failed.');
    } finally {
      setRunning(false);
    }
  };
  const summary = latest;
  const clean = summary?.cleanPercentage ?? 0;
  const errorCount = summary?.errorRecords ?? 0;
  const topModule = useMemo(() => {
    const counts = new Map();
    for (const item of errors) {
      const current = counts.get(item.moduleCode);
      counts.set(item.moduleCode, {
        count: (current?.count ?? 0) + 1,
        record: item
      });
    }
    return [...counts.values()].sort((a, b) => b.count - a.count)[0];
  }, [errors]);
  return <CoordinatorScaffold title="Validate Data" activeTab="Validation">
      <WorkflowStepper currentStep={3} />
      <View style={styles.readyRow}>
        <View style={styles.readyLeft}><View style={[styles.readyDot, !summary && styles.readyDotIdle]} /><Text style={[styles.readyText, !summary && styles.readyTextIdle]}>{selectedTimetable ? 'Timetable Ready' : 'Waiting for timetable'}</Text></View>
        <Text style={styles.mutedMeta}>{summary ? `Last run ${relativeTime(summary.createdAt)}` : 'No validation run'}</Text>
      </View>

      {selectedTimetable ? <Panel><Text style={styles.moduleLabel}>SELECTED TIMETABLE</Text><Text style={styles.moduleTitle}>{selectedTimetable.fileName}</Text><Text style={styles.mutedMeta}>{selectedTimetable.academicYear} • {selectedTimetable.semester}</Text></Panel> : null}
      {error ? <Panel><Text style={styles.errorText}>{error}</Text></Panel> : null}
      {loading && !summary ? <ActivityIndicator color={colors.primary} /> : null}

      <Panel style={styles.runPanel}>
        <View style={styles.runPanelTop}>
          <View style={styles.runIcon}><CoordinatorIcon name="validation" color={colors.green} size={23} /></View>
          <View style={styles.runCopy}>
            <Text style={styles.runTitle}>{summary ? 'Run Complete' : 'Validation Not Run'}</Text>
            <Text style={styles.mutedMeta}>{summary ? `${summary.executionTime}ms  •  Engine v${summary.engineVersion}  •  ${runCount} saved run(s)` : 'Run validation to check this timetable.'}</Text>
          </View>
          <StatusBadge label={summary ? summary.status === 'completed' ? 'VERIFIED' : 'ISSUES FOUND' : 'PENDING'} tone={summary ? summary.status === 'completed' ? 'success' : 'warning' : 'neutral'} />
        </View>
        <View style={styles.cleanResult}>
          <Text style={styles.cleanPercent}>{clean}%</Text>
          <Text style={styles.cleanLabel}>Clean Records</Text>
          <Text style={styles.clashPercent}>{summary?.clashPercentage ?? 0}% With Issues</Text>
        </View>
        <View style={styles.stackedProgress}>
          <View style={[styles.cleanProgress, {
          width: `${clean}%`
        }]} />
          <View style={[styles.clashProgress, {
          flex: 1
        }]} />
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legend}><View style={styles.legendClean} /><Text style={styles.legendText}>{(summary?.validRecords ?? 0).toLocaleString()} Cleared</Text></View>
          <View style={styles.legend}><View style={styles.legendClash} /><Text style={styles.legendText}>{errorCount.toLocaleString()} Records With Issues</Text></View>
        </View>
      </Panel>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Validation Summary" />
        <View style={styles.summaryGrid}>
          <SummaryStat value={(summary?.totalRecords ?? 0).toLocaleString()} label="Academic Cohorts" />
          <SummaryStat value={(summary?.validRecords ?? 0).toLocaleString()} label="Cleared" hint={`${clean}%`} tone="success" />
          <SummaryStat value={errorCount.toLocaleString()} label="Action Required" hint={`${summary?.clashPercentage ?? 0}%`} tone="danger" />
          <SummaryStat value={runCount.toLocaleString()} label="Validation Runs" hint={summary ? `Engine ${summary.engineVersion}` : 'No saved runs'} tone="success" />
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Rule Verification Suite</Text>
          <StatusBadge label={summary ? 'RULES CHECKED' : 'WAITING FOR RUN'} tone={summary ? 'success' : 'neutral'} />
        </View>
        <Panel style={styles.rulesPanel}>
          <RuleRow title="Student Timetable Overlaps" result={`${typeCounts.CLASH ?? 0} ISSUES`} tone={typeCounts.CLASH ? 'danger' : 'success'} />
          <RuleRow title="Lecturer & Tutor Availability" result={`${typeCounts.LECTURER_CONFLICT ?? 0} ISSUES`} tone={typeCounts.LECTURER_CONFLICT ? 'warning' : 'success'} />
          <RuleRow title="Room Capacity" result={`${typeCounts.CAPACITY ?? 0} ISSUES`} tone={typeCounts.CAPACITY ? 'danger' : 'success'} />
          <RuleRow title="Venue Conflicts" result={`${typeCounts.VENUE_CONFLICT ?? 0} ISSUES`} tone={typeCounts.VENUE_CONFLICT ? 'danger' : 'success'} />
        </Panel>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Top Affected Modules" action="See all" onPress={() => router.push('/(tabs)/errors')} />
        <Panel style={styles.modulePanel}>
          {topModule ? <>
          <View style={styles.moduleTop}>
            <View style={styles.moduleIcon}><CoordinatorIcon name="calendar" color={colors.primary} size={18} /></View>
            <View style={styles.runCopy}>
              <Text style={styles.moduleTitle}>{topModule.record.moduleCode} {topModule.record.moduleName}</Text>
              <Text style={styles.mutedMeta}>{topModule.record.studentName} • {topModule.record.currentSlot.subgroup}</Text>
            </View>
            <StatusBadge label={topModule.record.severity} tone="danger" />
          </View>
          <Text style={styles.moduleCount}>{topModule.count} records with issues</Text>
          </> : <Text style={styles.mutedMeta}>No unresolved module errors to show.</Text>}
        </Panel>
      </View>

      <View style={styles.actions}>
        <ActionButton label={`View Validation Errors (${typeCounts.CLASH !== undefined ? Object.values(typeCounts).reduce((a, b) => a + b, 0) : 0})`} icon="arrow" disabled={!timetableId} onPress={() => router.push({
        pathname: '/(tabs)/errors',
        params: {
          timetableId
        }
      })} />
        <ActionButton label={running ? 'Validating…' : 'Run Validation Engine'} kind="secondary" icon="refresh" disabled={!timetableId || running} onPress={() => {
        void run();
      }} />
        <ActionButton label="Refresh Validation Data" kind="soft" icon="refresh" onPress={() => {
        void load();
      }} />
      </View>
    </CoordinatorScaffold>;
}
const filterOptions = ['All', 'Clashes', 'Capacity', 'Lecturer', 'Venue'];
const errorTypeForFilter = {
  Clashes: 'CLASH',
  Capacity: 'CAPACITY',
  Lecturer: 'LECTURER_CONFLICT',
  Venue: 'VENUE_CONFLICT'
};
function ErrorRecord({
  record,
  onEdit
}) {
  const name = record.studentName || record.studentId || 'Affected record';
  return <Panel style={styles.errorRecord}>
      <View style={styles.errorRecordHeader}>
        <View style={styles.studentAvatar}><CoordinatorIcon name="profile" color={colors.primary} size={20} /></View>
        <View style={styles.runCopy}>
          <Text style={styles.errorName}>{name}</Text>
          <Text style={styles.mutedMeta}>{record.moduleCode} {record.moduleName} • {record.currentSlot.subgroup}</Text>
        </View>
        <StatusBadge label={record.severity} tone={record.status === 'resolved' ? 'success' : 'danger'} />
      </View>
      <View style={styles.errorTypeLine}>
        <CoordinatorIcon name="warning" color={colors.red} size={15} />
        <Text style={styles.errorType}>{record.errorType.replaceAll('_', ' ')}</Text>
      </View>
      <Text style={styles.errorDescription}>{record.description}</Text>
      <View style={styles.advisorRow}>
        <CoordinatorIcon name="profile" color={colors.muted} size={14} />
        <Text style={styles.advisorText}>{record.status.replaceAll('_', ' ').toUpperCase()} • {record.currentSlot.day} {record.currentSlot.startTime}–{record.currentSlot.endTime}</Text>
      </View>
      {record.status !== 'resolved' ? <ActionButton label="Edit / Fix Record" icon="edit" kind="secondary" onPress={onEdit} /> : null}
    </Panel>;
}
export function ValidationErrorsScreen() {
  const params = useLocalSearchParams();
  const [filter, setFilter] = useState('All');
  const [status, setStatus] = useState('unresolved');
  const [severity, setSeverity] = useState('all');
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [allErrorsTotal, setAllErrorsTotal] = useState(0);
  const [resolvedTotal, setResolvedTotal] = useState(0);
  const [unresolvedTotal, setUnresolvedTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '20'
      });
      const unresolvedQuery = new URLSearchParams({
        status: 'unresolved',
        page: '1',
        limit: '1'
      });
      const allQuery = new URLSearchParams({
        page: '1',
        limit: '1'
      });
      const resolvedQuery = new URLSearchParams({
        status: 'resolved',
        page: '1',
        limit: '1'
      });
      if (params.timetableId) {
        query.set('timetableId', params.timetableId);
        unresolvedQuery.set('timetableId', params.timetableId);
      }
      if (params.timetableId) {
        allQuery.set('timetableId', params.timetableId);
        resolvedQuery.set('timetableId', params.timetableId);
      }
      if (status !== 'all') query.set('status', status);
      if (severity !== 'all') query.set('severity', severity);
      const type = errorTypeForFilter[filter];
      if (type) query.set('errorType', type);
      const [result, unresolved, all, resolved] = await Promise.all([api.errors(query.toString()), api.errors(unresolvedQuery.toString()), api.errors(allQuery.toString()), api.errors(resolvedQuery.toString())]);
      setRecords(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
      setUnresolvedTotal(unresolved.pagination.total);
      setAllErrorsTotal(all.pagination.total);
      setResolvedTotal(resolved.pagination.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load validation errors.');
    } finally {
      setLoading(false);
    }
  }, [filter, page, params.timetableId, severity, status]);
  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));
  const selectFilter = value => {
    setFilter(value);
    setPage(1);
  };
  const openError = record => router.push({
    pathname: '/(tabs)/update',
    params: {
      errorId: record._id,
      timetableId: record.timetableId
    }
  });
  const representative = records[0];
  return <CoordinatorScaffold title="View Errors" activeTab="Validation" onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/errors')} backLabel="Back to Validation">
      <WorkflowStepper currentStep={4} />
      <Panel style={styles.criticalGate}>
        <View style={styles.gateHeading}>
          <CoordinatorIcon name="warning" color={colors.red} size={17} />
          <Text style={styles.gateKicker}>CRITICAL INTEGRITY GATE</Text>
          <StatusBadge label="BLOCKING" tone="danger" />
        </View>
        <Text style={styles.gateTitle}>Validation Errors</Text>
        <Text style={styles.unresolved}><Text style={styles.unresolvedNumber}>{unresolvedTotal.toLocaleString()}</Text> Unresolved Errors</Text>
        <Text style={styles.gateCaption}>Requires mandatory sign-off before data is ready.</Text>
        <View style={styles.sweepHeader}>
          <Text style={styles.sweepLabel}>INTEGRITY RESOLUTION SWEEP</Text>
          <Text style={styles.sweepValue}>{resolvedTotal.toLocaleString()} of {allErrorsTotal.toLocaleString()} Resolved</Text>
        </View>
        <ProgressBar progress={allErrorsTotal ? resolvedTotal / allErrorsTotal * 100 : 0} color={colors.red} trackColor="#F7DADD" />
      </Panel>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Filter errors</Text>
          <CoordinatorIcon name="filter" color={colors.muted} size={17} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filterOptions.map(option => {
          const selected = option === filter;
          return <Pressable key={option} accessibilityRole="tab" accessibilityState={{
            selected
          }} onPress={() => selectFilter(option)} style={({
            pressed
          }) => [styles.filterPill, selected && styles.filterPillActive, pressed && styles.pressed]}>
                <Text style={[styles.filterText, selected && styles.filterTextActive]}>{option}</Text>
              </Pressable>;
        })}
        </ScrollView>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {['unresolved', 'in_progress', 'resolved', 'all'].map(item => <Pressable key={item} onPress={() => {
          setStatus(item);
          setPage(1);
        }} style={[styles.filterPill, status === item && styles.filterPillActive]}><Text style={[styles.filterText, status === item && styles.filterTextActive]}>{item === 'all' ? 'All statuses' : item.replaceAll('_', ' ')}</Text></Pressable>)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {['all', 'SEV-1', 'SEV-2', 'SEV-3'].map(item => <Pressable key={item} onPress={() => {
          setSeverity(item);
          setPage(1);
        }} style={[styles.filterPill, severity === item && styles.filterPillActive]}><Text style={[styles.filterText, severity === item && styles.filterTextActive]}>{item === 'all' ? 'All severity' : item}</Text></Pressable>)}
        </ScrollView>
      </View>

      <Panel style={styles.recommendation}>
        <View style={styles.recommendationHeader}>
          <StatusBadge label="CURRENT ISSUE" tone="info" />
          <CoordinatorIcon name="info" color={colors.primary} size={18} />
        </View>
        <Text style={styles.recommendationText}>{representative?.description ?? 'No unresolved issue is available for a correction recommendation.'}</Text>
        <View style={styles.recommendationAction}>
          <CoordinatorIcon name="sync" color={colors.primary} size={17} />
          <Text style={styles.recommendationActionText}>{representative?.recommendedSlot ? `Recommended: ${representative.recommendedSlot}` : `Review ${representative?.currentSlot.subgroup ?? 'assigned slot'}`}</Text>
        </View>
        <View style={styles.impactRow}>
          <Text style={styles.impactText}>ISSUES IN FILTER  <Text style={styles.impactStrong}>{total.toLocaleString()}</Text></Text>
          <Text style={styles.impactText}>STATUS  <Text style={styles.impactStrong}>{status.replaceAll('_', ' ').toUpperCase()}</Text></Text>
        </View>
        {representative && representative.status !== 'resolved' ? <ActionButton label="Review first listed error" icon="arrow" onPress={() => openError(representative)} /> : null}
      </Panel>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Error Queue" action={`${total.toLocaleString()} records • ${page} / ${Math.max(1, totalPages)}`} />
        {error ? <Panel><Text style={styles.errorText}>{error}</Text></Panel> : null}
        {loading ? <ActivityIndicator color={colors.primary} /> : records.length ? records.map(record => <ErrorRecord key={record._id} record={record} onEdit={() => openError(record)} />) : <Panel><Text style={styles.mutedMeta}>No validation errors match these filters.</Text></Panel>}
      </View>

      <View style={styles.pagination}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous page" onPress={() => setPage(value => Math.max(1, value - 1))} disabled={page <= 1} style={styles.pageControl}>
          <CoordinatorIcon name="back" color={page === 1 ? colors.border : colors.text} size={15} />
          <Text style={[styles.pageControlText, page === 1 && styles.pageDisabled]}>Prev</Text>
        </Pressable>
        {Array.from({
        length: Math.min(3, Math.max(1, totalPages))
      }, (_, index) => Math.max(1, Math.min(Math.max(1, totalPages) - 2, page - 1)) + index).map(item => <Pressable key={item} accessibilityRole="button" accessibilityLabel={`Page ${item}`} onPress={() => setPage(item)} style={[styles.pageNumber, page === item && styles.pageNumberActive]}>
            <Text style={[styles.pageNumberText, page === item && styles.pageNumberTextActive]}>{item}</Text>
          </Pressable>)}
        {totalPages > 3 ? <Text style={styles.pageEllipsis}>… {totalPages}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Next page" onPress={() => setPage(value => Math.min(Math.max(1, totalPages), value + 1))} disabled={page >= totalPages} style={styles.pageControl}>
          <Text style={styles.pageControlText}>Next</Text>
          <CoordinatorIcon name="arrow" color={colors.text} size={15} />
        </Pressable>
      </View>

      <ActionButton label="Refresh Error Queue" icon="refresh" kind="secondary" onPress={() => {
      void load();
    }} />
    </CoordinatorScaffold>;
}
export function UpdateDataScreen() {
  const params = useLocalSearchParams();
  const [record, setRecord] = useState(null);
  const [targetSlots, setTargetSlots] = useState([]);
  const [slot, setSlot] = useState('');
  const [changes, setChanges] = useState({});
  const [justification, setJustification] = useState('');
  const [notify, setNotify] = useState(true);
  const [cohortBatch, setCohortBatch] = useState(false);
  const [cohortCount, setCohortCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const {
    user
  } = useCoordinatorAuth();
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let current = params.errorId ? (await api.error(params.errorId)).data : undefined;
      if (!current) {
        const pending = await api.errors(`status=unresolved${params.timetableId ? `&timetableId=${encodeURIComponent(params.timetableId)}` : ''}&limit=1`);
        current = pending.data[0];
      }
      if (!current) {
        setRecord(null);
        setTargetSlots([]);
        return;
      }
      setRecord(current);
      setChanges({
        ...current.currentSlot
      });
      setJustification(current.justification ?? '');
      const affected = current.subgroupId ? await api.subgroup(current.subgroupId).catch(() => null) : null;
      if (affected) setChanges({
        subgroup: affected.data.subgroup,
        day: affected.data.day,
        startTime: affected.data.startTime,
        endTime: affected.data.endTime,
        venue: affected.data.venue,
        lecturerName: affected.data.lecturerName ?? ''
      });
      const timetableId = String(current.timetableId);
      const [allRecords, masterSessions] = await Promise.all([getAllTimetableSubgroups(timetableId), api.timetableSessions(timetableId).then(result => result.data)]);
      const uniqueSlots = validTargetSessions(masterSessions, allRecords, current);
      setTargetSlots(uniqueSlots);
      setSlot(previous => uniqueSlots.some(item => item.slot === previous) ? previous : uniqueSlots[0]?.slot ?? '');
      if (affected) {
        const cohort = allRecords.filter(item => item.status === 'active' && item.moduleCode === affected.data.moduleCode && item.subgroup === affected.data.subgroup && item.day === affected.data.day && item.startTime === affected.data.startTime && item.endTime === affected.data.endTime && item.venue === affected.data.venue && item.year === affected.data.year && item.semester === affected.data.semester);
        setCohortCount(new Set(cohort.map(item => item.studentId)).size);
      } else setCohortCount(1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load the selected validation error.');
    } finally {
      setLoading(false);
    }
  }, [params.errorId, params.timetableId]);
  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));
  const chooseTargetSlot = (index = 0) => {
    const option = targetSlots[index];
    if (!option) {
      setError('No parallel session is available. Edit the fields below.');
      return;
    }
    Alert.alert('Available parallel sessions', `${option.slot.replace(/^SLOT-/, '')} • ${option.record.day} ${option.record.startTime}–${option.record.endTime} • ${option.record.venue}`, [{
      text: 'Use this session',
      onPress: () => {
        setSlot(option.slot);
        setChanges({
          subgroup: option.record.subgroup,
          day: option.record.day,
          startTime: option.record.startTime,
          endTime: option.record.endTime,
          venue: option.record.venue,
          lecturerName: option.record.lecturerName ?? ''
        });
      }
    }, ...(index + 1 < targetSlots.length ? [{
      text: 'More sessions',
      onPress: () => chooseTargetSlot(index + 1)
    }] : []), {
      text: 'Cancel',
      style: 'cancel'
    }]);
  };
  const save = async (goNext = false) => {
    if (!record || saving) return;
    if (['subgroup', 'day', 'startTime', 'endTime', 'venue'].some(key => !changes[key]?.trim())) {
      setError('Complete all correction fields.');
      return;
    }
    if (!justification.trim()) {
      setError('Enter a justification before saving this correction.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const options = {
        changes,
        justification: justification.trim(),
        cohortBatch,
        sendNotification: notify
      };
      await api.resolveError(record._id, options);
      setRecord({
        ...record,
        status: 'resolved',
        justification: justification.trim()
      });
      Alert.alert('Correction saved', 'The record and justification were saved successfully.');
      if (goNext) {
        const next = await api.errors(`status=unresolved&timetableId=${encodeURIComponent(String(record.timetableId))}&limit=1`).catch(() => null);
        if (next?.data.length) {
          router.replace({
            pathname: '/(tabs)/update',
            params: {
              errorId: next.data[0]._id,
              timetableId: String(record.timetableId)
            }
          });
          return;
        }
      }
      router.replace({
        pathname: '/(tabs)/errors',
        params: {
          timetableId: String(record.timetableId)
        }
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this correction.');
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <CoordinatorScaffold title="Update Data" activeTab="Validation" onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/errors')} backLabel="Back to Error List"><ActivityIndicator color={colors.primary} /></CoordinatorScaffold>;
  if (!record) return <CoordinatorScaffold title="Update Data" activeTab="Validation" onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/errors')} backLabel="Back to Error List"><Panel><Text style={styles.errorText}>{error || 'There are no unresolved validation errors to update.'}</Text></Panel><ActionButton label="Return to Error List" icon="arrow" onPress={() => router.replace('/(tabs)/errors')} /></CoordinatorScaffold>;
  return <CoordinatorScaffold title="Update Data" activeTab="Validation" onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/errors')} backLabel="Back to Error List">
      <View style={styles.recordBadgeRow}><StatusBadge label={`${record.severity} • ${record.errorType.replaceAll('_', ' ')}`} tone="info" /></View>
      {error ? <Panel><Text style={styles.errorText}>{error}</Text></Panel> : null}

      <Panel style={styles.studentPanel}>
        <View style={styles.studentHeader}>
          <View style={styles.studentAvatarDark}><CoordinatorIcon name="profile" color={colors.white} size={22} /></View>
          <View style={styles.runCopy}>
            <Text style={styles.studentName}>{record.studentName ?? record.studentId ?? 'Affected student'}</Text>
            <Text style={styles.studentId}>{record.studentId ?? '—'}</Text>
          </View>
          <StatusBadge label="CORE" tone="info" />
        </View>
        <Text style={styles.studentProgram}>{record.moduleCode} {record.moduleName}</Text>
        <View style={styles.moduleDivider} />
        <Text style={styles.moduleLabel}>MODULE</Text>
        <Text style={styles.moduleName}>{record.moduleCode} {record.moduleName}</Text>
      </Panel>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>CURRENT ASSIGNED SUBGROUP (READ-ONLY)</Text>
        <Panel style={styles.currentSlot}>
          <View style={styles.currentSlotTop}>
            <View>
              <Text style={styles.slotName}>{record.currentSlot.subgroup}</Text>
              <Text style={styles.slotTime}>{record.currentSlot.day.toUpperCase()} {record.currentSlot.startTime} – {record.currentSlot.endTime}</Text>
            </View>
            <StatusBadge label="CURRENT" tone="neutral" />
          </View>
          <View style={styles.slotInfoLine}><CoordinatorIcon name="building" color={colors.muted} size={15} /><Text style={styles.slotInfo}>{record.currentSlot.venue}</Text></View>
        </Panel>
      </View>

      <Panel style={styles.collisionPanel}>
        <View style={styles.collisionHeading}>
          <CoordinatorIcon name="warning" color={colors.red} size={18} />
        <Text style={styles.collisionTitle}>{record.errorType.replaceAll('_', ' ')}</Text>
      </View>
        <Text style={styles.collisionCopy}>{record.description}</Text>
        <Text style={styles.collisionMeta}>{record.currentSlot.day} {record.currentSlot.startTime}–{record.currentSlot.endTime} • {record.currentSlot.venue}</Text>
      </Panel>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>TARGET REALLOCATION</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Target reallocation: ${slot}`} onPress={() => chooseTargetSlot()} style={({
        pressed
      }) => [styles.targetSelector, pressed && styles.pressed]}>
          <View style={styles.targetIcon}><CoordinatorIcon name="calendar" color={colors.primary} size={18} /></View>
          <View style={styles.runCopy}>
            <Text style={styles.moduleLabel}>AVAILABLE PARALLEL SESSION</Text>
          <Text style={styles.targetValue}>{slot ? slot.replace(/^SLOT-/, '') : 'No available slot'}</Text>
          </View>
          <CoordinatorIcon name="chevron" color={colors.muted} size={18} />
        </Pressable>
      </View>

      <Panel>
        <Text style={styles.sectionTitle}>CORRECT RECORD FIELDS</Text>
        {['subgroup', 'day', 'startTime', 'endTime', 'venue', 'lecturerName'].map(key => <View key={key} style={{
        gap: 6,
        marginTop: 12
      }}>
          <Text style={styles.slotInfo}>{{
            subgroup: 'Subgroup',
            day: 'Day (Monday–Sunday)',
            startTime: 'Start time (HH:mm)',
            endTime: 'End time (HH:mm)',
            venue: 'Venue',
            lecturerName: 'Lecturer (optional)'
          }[key]}</Text>
          <TextInput accessibilityLabel={`Correct ${key}`} editable={!saving} value={changes[key] ?? ''} onChangeText={value => setChanges(previous => ({
          ...previous,
          [key]: value
        }))} style={[styles.justificationInput, {
          minHeight: 44
        }]} />
        </View>)}
      </Panel>

      <View style={styles.sectionBlock}>
        <View style={styles.justificationLabelRow}>
          <Text style={styles.sectionTitle}>JUSTIFICATION</Text>
          <Text style={styles.moduleLabel}>ACADEMIC CODE</Text>
        </View>
        <TextInput accessibilityLabel="Reallocation justification" value={justification} onChangeText={setJustification} multiline textAlignVertical="top" placeholder="Enter the reason for this academic data correction" placeholderTextColor={colors.muted} style={styles.justificationInput} />
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>COORDINATOR REMARKS &amp; AUDIT LOG</Text>
        <Panel style={styles.auditPanel}>
          <Text style={styles.auditHint}>{record.auditLog.length ? `Latest audit by ${user?.name ?? 'coordinator'}: ${record.auditLog[record.auditLog.length - 1].details}` : 'Your correction and justification will be recorded in the coordinator audit log.'}</Text>
          <Pressable accessibilityRole="checkbox" accessibilityState={{
          checked: notify
        }} accessibilityLabel="Send automated notification push to student and advisor upon save" onPress={() => setNotify(value => !value)} style={styles.notifyRow}>
            <View style={[styles.checkbox, notify && styles.checkboxActive]}>{notify ? <CoordinatorIcon name="check" color={colors.white} size={12} /> : null}</View>
            <Text style={styles.notifyText}>Record a notification request for the student and advisor</Text>
          </Pressable>
        </Panel>
      </View>

      <Panel style={styles.batchPanel}>
        <View style={styles.batchHeader}>
          <View style={styles.batchIcon}><CoordinatorIcon name="group" color={colors.primary} size={18} /></View>
          <View style={styles.runCopy}>
            <Text style={styles.batchTitle}>Cohort Batch Optimization</Text>
          <Text style={styles.batchCount}>{cohortCount.toLocaleString()} impacted</Text>
          </View>
          <StatusBadge label="BATCH" tone="info" />
        </View>
        <Text style={styles.auditHint}>Apply this correction to records in the same module, subgroup and session.</Text>
        <Pressable accessibilityRole="checkbox" accessibilityState={{
        checked: cohortBatch
      }} onPress={() => setCohortBatch(value => !value)} style={styles.notifyRow}><View style={[styles.checkbox, cohortBatch && styles.checkboxActive]}>{cohortBatch ? <CoordinatorIcon name="check" color={colors.white} size={12} /> : null}</View><Text style={styles.notifyText}>Apply to matching cohort records</Text></Pressable>
        <View style={styles.capacityLine}><Text style={styles.capacityLabel}>Available target sessions</Text><Text style={styles.capacityValue}>{targetSlots.length}</Text></View>
      </Panel>

      <View style={styles.actions}>
        <ActionButton label={saving ? 'Saving…' : 'Save Changes'} icon="save" disabled={saving || record.status === 'resolved'} onPress={() => {
        void save(false);
      }} />
        <ActionButton label="Save & Proceed to Next" kind="navy" icon="arrow" disabled={saving || record.status === 'resolved'} onPress={() => {
        void save(true);
      }} />
        <ActionButton label="Cancel & Revert Changes" kind="secondary" icon="close" disabled={saving} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/errors')} />
      </View>
    </CoordinatorScaffold>;
}
const styles = StyleSheet.create({
  readyRow: {
    minHeight: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  readyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  readyDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.green
  },
  readyDotIdle: {
    backgroundColor: colors.muted
  },
  readyText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '700'
  },
  readyTextIdle: {
    color: colors.muted
  },
  errorText: {
    color: colors.red,
    fontSize: 10,
    lineHeight: 15
  },
  mutedMeta: {
    color: colors.muted,
    fontSize: 9
  },
  runPanel: {
    gap: spacing.medium,
    borderColor: '#D8EDE2',
    backgroundColor: '#FCFFFD'
  },
  runPanelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small
  },
  runIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.greenSurface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  runCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5
  },
  runTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700'
  },
  cleanResult: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
    flexWrap: 'wrap'
  },
  cleanPercent: {
    color: colors.green,
    fontSize: 27,
    fontWeight: '700'
  },
  cleanLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    flex: 1
  },
  clashPercent: {
    color: colors.red,
    fontSize: 10,
    fontWeight: '600'
  },
  stackedProgress: {
    height: 8,
    flexDirection: 'row',
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: '#F5D6DA'
  },
  cleanProgress: {
    backgroundColor: colors.green
  },
  clashProgress: {
    flex: 1,
    backgroundColor: colors.red
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.small
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendClean: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.green
  },
  legendClash: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.red
  },
  legendText: {
    color: colors.muted,
    fontSize: 9
  },
  sectionBlock: {
    gap: spacing.small
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
    justifyContent: 'space-between'
  },
  summaryStat: {
    width: '48.5%',
    minHeight: 93,
    gap: 3,
    padding: spacing.medium
  },
  summaryDanger: {
    borderColor: '#F5D0D4',
    backgroundColor: colors.redSurface
  },
  summarySuccess: {
    borderColor: '#D5EEE2',
    backgroundColor: '#FBFFFC'
  },
  summaryNumber: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700'
  },
  summaryLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600'
  },
  summaryHint: {
    color: colors.muted,
    fontSize: 9
  },
  textDanger: {
    color: colors.red
  },
  textSuccess: {
    color: colors.green
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.small
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700'
  },
  rulesPanel: {
    paddingVertical: spacing.small
  },
  ruleRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  ruleIcon: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  ruleSuccess: {
    backgroundColor: colors.greenSurface
  },
  ruleDanger: {
    backgroundColor: colors.redSurface
  },
  ruleWarning: {
    backgroundColor: colors.warningSurface
  },
  ruleTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    flex: 1
  },
  modulePanel: {
    gap: spacing.small
  },
  moduleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small
  },
  moduleIcon: {
    width: 37,
    height: 37,
    backgroundColor: colors.lightPurple,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  moduleTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700'
  },
  moduleCount: {
    color: colors.red,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 46
  },
  actions: {
    gap: spacing.small
  },
  pressed: {
    opacity: 0.8
  },
  criticalGate: {
    backgroundColor: colors.redSurface,
    borderColor: '#F2C7CC',
    gap: spacing.small
  },
  gateHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small
  },
  gateKicker: {
    flex: 1,
    color: colors.red,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.75
  },
  gateTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700'
  },
  unresolved: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600'
  },
  unresolvedNumber: {
    color: colors.red,
    fontSize: 20,
    fontWeight: '700'
  },
  gateCaption: {
    color: colors.muted,
    fontSize: 10
  },
  sweepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.small,
    marginTop: spacing.small
  },
  sweepLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.55
  },
  sweepValue: {
    color: colors.red,
    fontSize: 9,
    fontWeight: '700'
  },
  filterRow: {
    gap: spacing.small,
    paddingRight: spacing.large
  },
  filterPill: {
    minHeight: 36,
    paddingHorizontal: spacing.medium,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600'
  },
  filterTextActive: {
    color: colors.white
  },
  recommendation: {
    backgroundColor: colors.infoSurface,
    borderColor: '#D9E4FF',
    gap: spacing.small
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  recommendationText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600'
  },
  recommendationAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  recommendationActionText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700'
  },
  impactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.small,
    borderTopWidth: 1,
    borderTopColor: '#D8E3FC',
    paddingTop: spacing.small,
    marginTop: spacing.xsmall
  },
  impactText: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '600'
  },
  impactStrong: {
    color: colors.primary,
    fontWeight: '700'
  },
  errorRecord: {
    gap: spacing.medium
  },
  errorRecordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small
  },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightPurple
  },
  errorName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700'
  },
  errorTypeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  errorType: {
    color: colors.red,
    fontSize: 11,
    fontWeight: '700'
  },
  errorDescription: {
    color: colors.text,
    fontSize: 10,
    lineHeight: 16
  },
  advisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.small
  },
  advisorText: {
    color: colors.muted,
    fontSize: 9
  },
  pagination: {
    minHeight: 42,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4
  },
  pageControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4
  },
  pageControlText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '600'
  },
  pageDisabled: {
    color: colors.border
  },
  pageNumber: {
    width: 29,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  pageNumberActive: {
    backgroundColor: colors.primary
  },
  pageNumberText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600'
  },
  pageNumberTextActive: {
    color: colors.white
  },
  pageEllipsis: {
    color: colors.muted,
    paddingHorizontal: 2
  },
  recordBadgeRow: {
    alignItems: 'flex-start',
    marginTop: -spacing.small
  },
  studentPanel: {
    backgroundColor: colors.navySurface,
    borderColor: colors.navySurface,
    gap: spacing.medium
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small
  },
  studentAvatarDark: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: '#2D3B52',
    alignItems: 'center',
    justifyContent: 'center'
  },
  studentName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700'
  },
  studentId: {
    color: '#BBC8DA',
    fontSize: 10,
    marginTop: 3
  },
  studentProgram: {
    color: '#D2DBE8',
    fontSize: 10,
    lineHeight: 15
  },
  moduleDivider: {
    height: 1,
    backgroundColor: '#34445C'
  },
  moduleLabel: {
    color: colors.muted,
    fontSize: 8,
    letterSpacing: 0.6,
    fontWeight: '700'
  },
  moduleName: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600'
  },
  currentSlot: {
    gap: spacing.small
  },
  currentSlotTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.small
  },
  slotName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700'
  },
  slotTime: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.45
  },
  slotInfoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  slotInfo: {
    color: colors.muted,
    fontSize: 10
  },
  collisionPanel: {
    backgroundColor: colors.redSurface,
    borderColor: '#F3C5CA',
    gap: 6
  },
  collisionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  collisionTitle: {
    color: colors.red,
    fontSize: 11,
    fontWeight: '700',
    flex: 1
  },
  collisionCopy: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600'
  },
  collisionMeta: {
    color: colors.muted,
    fontSize: 9
  },
  targetSelector: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.medium
  },
  targetIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.lightPurple,
    alignItems: 'center',
    justifyContent: 'center'
  },
  targetValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4
  },
  justificationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  justificationInput: {
    minHeight: 100,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    padding: spacing.medium,
    color: colors.text,
    fontSize: 11,
    lineHeight: 17
  },
  auditPanel: {
    gap: spacing.medium
  },
  auditHint: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 16
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.small
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.3,
    borderColor: '#AEB8C8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  notifyText: {
    flex: 1,
    color: colors.text,
    fontSize: 10,
    lineHeight: 15
  },
  batchPanel: {
    backgroundColor: colors.infoSurface,
    borderColor: '#DCE5FF',
    gap: spacing.small
  },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small
  },
  batchIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  batchTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700'
  },
  batchCount: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600'
  },
  capacityLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3
  },
  capacityLabel: {
    color: colors.muted,
    fontSize: 9
  },
  capacityValue: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '700'
  }
});

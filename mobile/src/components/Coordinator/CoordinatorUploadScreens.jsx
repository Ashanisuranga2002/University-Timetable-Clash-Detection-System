import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import CoordinatorTheme from '@/constants/CoordinatorTheme';
import { ActionButton, CoordinatorIcon, CoordinatorScaffold, LabeledValue, Panel, SectionHeading, StatusBadge, WorkflowStepper } from '@/components/Coordinator/CoordinatorUI';
import { CoordinatorRecordEditor } from './CoordinatorRecordEditor';
import { api } from '@/services/api';
const spreadsheetMimeTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/csv', 'application/octet-stream'];
async function pickSpreadsheet() {
  const result = await DocumentPicker.getDocumentAsync({
    type: spreadsheetMimeTypes,
    copyToCacheDirectory: true,
    multiple: false
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (!/\.(xlsx|csv)$/i.test(asset.name)) throw new Error('Choose an .xlsx or .csv file.');
  if ((asset.size ?? 0) > 20 * 1024 * 1024) throw new Error('The selected file exceeds the 20 MB limit.');
  return asset;
}
function formatFileSize(size = 0) {
  return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;
}
const {
  colors,
  radius,
  spacing
} = CoordinatorTheme;
const timetableFields = [{
  key: 'academicYear',
  label: 'Academic year (2026/2027)'
}, {
  key: 'semester',
  label: 'Semester'
}, {
  key: 'faculty',
  label: 'Faculty'
}];
const subgroupFields = [{
  key: 'studentId',
  label: 'Student ID'
}, {
  key: 'studentName',
  label: 'Student name'
}, {
  key: 'program',
  label: 'Program'
}, {
  key: 'year',
  label: 'Year (1–8)',
  numeric: true
}, {
  key: 'semester',
  label: 'Semester (1–3)',
  numeric: true
}, {
  key: 'moduleCode',
  label: 'Module code'
}, {
  key: 'moduleName',
  label: 'Module name'
}, {
  key: 'subgroup',
  label: 'Subgroup'
}, {
  key: 'day',
  label: 'Day (Monday–Sunday)'
}, {
  key: 'startTime',
  label: 'Start time (HH:mm)'
}, {
  key: 'endTime',
  label: 'End time (HH:mm)'
}, {
  key: 'venue',
  label: 'Venue'
}, {
  key: 'lecturerName',
  label: 'Lecturer',
  optional: true
}];
export function UploadTimetableScreen() {
  const [scopeEditing, setScopeEditing] = useState(false);
  const [file, setFile] = useState(null);
  const [term, setTerm] = useState('2026/2027 — Semester 1 (Regular)');
  const [faculty, setFaculty] = useState('Faculty of Computing & Technology');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chooseFile = async () => {
    if (busy) return;
    try {
      setError('');
      const selected = await pickSpreadsheet();
      if (selected?.size === 0) throw new Error('The selected file is empty. Choose a timetable containing data.');
      if (selected) setFile(selected);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'File selection failed.');
    }
  };
  const upload = async () => {
    if (busy) return;
    if (!file) {
      setError('Choose a timetable file before uploading.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const [academicYear, semester] = term.split(' — ');
      const result = await api.uploadTimetableFile(file, {
        academicYear,
        semester,
        faculty
      });
      setFile(null);
      router.push({
        pathname: '/(tabs)/master-timetables',
        params: {
          uploadedId: result.data.timetable._id
        }
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Timetable upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return <CoordinatorScaffold title="Upload Master Timetable" activeTab="Timetable" backLabel="Back to Dashboard" onBack={() => {
    if (!busy) router.replace('/(tabs)/dashboard');
  }}>
      {scopeEditing ? <CoordinatorRecordEditor title="Scope Configuration" fields={timetableFields} initial={{
      academicYear: term.split(' — ')[0],
      semester: term.split(' — ')[1],
      faculty
    }} onClose={() => setScopeEditing(false)} onSave={async values => {
      if (!/^\d{4}\/\d{4}$/.test(values.academicYear)) throw new Error('Use an academic year such as 2026/2027.');
      setTerm(`${values.academicYear} — ${values.semester}`);
      setFaculty(values.faculty);
    }} /> : null}
      <View style={styles.eyebrowBlock}>
        <Text style={styles.kicker}>MASTER TIMETABLE</Text>
        <Text style={styles.subtitle}>Add the master timetable for this academic period.</Text>
      </View>

      <Panel style={styles.scopeCard}>
        <View style={styles.cardHeading}>
          <Text style={styles.cardTitle}>Scope Configuration</Text>
          <StatusBadge label="REQUIRED" tone="info" />
        </View>
        <LabeledValue label="FACULTY" value={faculty} onPress={() => {
        if (!busy) setScopeEditing(true);
      }} />
        <LabeledValue label="ACADEMIC PERIOD" value={term} onPress={() => {
        if (!busy) setScopeEditing(true);
      }} />
      </Panel>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Master timetable file" />
        <Pressable accessibilityRole="button" accessibilityLabel="Browse master timetable file" disabled={busy} onPress={() => {
        void chooseFile();
      }} style={({
        pressed
      }) => [styles.dropZone, pressed && styles.dropZonePressed]}>
          <View style={styles.uploadCloud}>
            <CoordinatorIcon name="upload" color={colors.primary} size={22} />
          </View>
          <Text style={styles.dropTitle}>Select master timetable</Text>
          <Text style={styles.dropHint}>XLSX or CSV file • Max 20 MB</Text>
          <View style={styles.browseButton}><Text style={styles.browseText}>Browse Timetable File</Text></View>
        </Pressable>
      </View>

      {file ? <Panel style={styles.fileCard}>
          <View style={styles.fileTopRow}>
            <View style={styles.fileIcon}><CoordinatorIcon name="file" color={colors.primary} size={21} /></View>
            <View style={styles.fileCopy}>
              <Text numberOfLines={1} style={styles.fileName}>{file.name}</Text>
              <Text style={styles.fileMeta}>{formatFileSize(file.size)}  •  Ready to upload</Text>
            </View>
            <StatusBadge label="SELECTED" tone="info" />
          </View>
          <View style={styles.validatedRow}>
            <CoordinatorIcon name="file" color={colors.primary} size={16} />
            <Text style={styles.validatedText}>The backend will inspect this file after upload.</Text>
          </View>
        </Panel> : null}

      {error ? <Panel><Text style={styles.errorText}>{error}</Text></Panel> : null}
      {busy ? <ActivityIndicator color={colors.primary} /> : null}
      <View style={styles.actions}>
        <ActionButton label={busy ? 'Uploading…' : 'Upload Master Timetable'} icon="upload" disabled={!file || busy} onPress={() => {
        void upload();
      }} />
        <ActionButton label="Uploaded Master Timetables" kind="secondary" icon="file" disabled={busy} onPress={() => router.push('/(tabs)/master-timetables')} />
        <ActionButton label="Cancel & Reset File" kind="secondary" icon="close" disabled={busy} onPress={() => {
        setFile(null);
        setError('');
      }} />
      </View>
    </CoordinatorScaffold>;
}
export function UploadSubgroupsScreen() {
  const params = useLocalSearchParams();
  const [editing, setEditing] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [timetableId, setTimetableId] = useState(params.timetableId ?? '');
  const [records, setRecords] = useState([]);
  const [recordTotal, setRecordTotal] = useState(0);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    setLoadingRecords(true);
    try {
      const page = await api.timetables('limit=100');
      setTimetables(page.data);
      const activeId = timetableId || params.timetableId || page.data[0]?._id || '';
      if (activeId !== timetableId) setTimetableId(activeId);
      if (activeId) {
        const subgroupPage = await api.subgroups(`timetableId=${encodeURIComponent(activeId)}&page=1&limit=50`);
        setRecords(subgroupPage.data);
        setRecordTotal(subgroupPage.pagination.total);
      } else {
        setRecords([]);
        setRecordTotal(0);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load subgroup records.');
    } finally {
      setLoadingRecords(false);
    }
  }, [params.timetableId, timetableId]);
  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));
  const timetable = timetables.find(item => item._id === timetableId);
  const activeRecords = records.filter(record => record.status === 'active');
  const venues = new Set(activeRecords.map(record => record.venue));
  const sourceName = file?.name ?? records[0]?.sourceFileName ?? '';
  const displayedRecords = expanded ? records : records.slice(0, 3);
  const loadMoreRecords = async () => {
    if (records.length >= recordTotal) {
      setExpanded(value => !value);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const nextPage = Math.ceil(records.length / 50) + 1;
      const page = await api.subgroups(`timetableId=${encodeURIComponent(timetableId)}&page=${nextPage}&limit=50`);
      setRecords(current => [...current, ...page.data]);
      setExpanded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load more subgroup records.');
    } finally {
      setBusy(false);
    }
  };
  const chooseTimetable = (index = 0) => {
    const item = timetables[index];
    if (!item) return;
    Alert.alert('Select timetable', item.fileName, [{
      text: 'Use this timetable',
      onPress: () => {
        setTimetableId(item._id);
        setRecords([]);
        setRecordTotal(0);
        setFile(null);
        setUploadSummary(null);
        setLoadingRecords(true);
      }
    }, ...(index + 1 < timetables.length ? [{
      text: 'More timetables',
      onPress: () => chooseTimetable(index + 1)
    }] : []), {
      text: 'Cancel',
      style: 'cancel'
    }]);
  };
  const updateRecord = record => Alert.alert(record.studentName, `${record.studentId} • ${record.moduleCode}`, [{
    text: 'Edit record',
    onPress: () => setEditing(record)
  }, {
    text: 'Delete',
    style: 'destructive',
    onPress: () => Alert.alert('Delete subgroup record?', 'This removes the record from the timetable data.', [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        void api.deleteSubgroup(record._id).then(() => {
          Alert.alert('Subgroup deleted', 'The record was removed from the timetable.');
          return load();
        }).catch(cause => setError(cause.message));
      }
    }])
  }, {
    text: 'Close',
    style: 'cancel'
  }]);
  const uploadSubgroups = async () => {
    if (!timetableId) {
      setError('Upload a timetable first or select an existing timetable.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const selected = await pickSpreadsheet();
      if (!selected) return;
      setFile(selected);
      const result = await api.uploadSubgroupFile(selected, timetableId);
      setUploadSummary({
        total: result.data.totalRecords,
        valid: result.data.validRecords,
        invalid: result.data.invalidRecords,
        inserted: result.data.insertedRecords,
        errors: result.data.errors.slice(0, 5)
      });
      setFile(selected);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Subgroup upload failed.');
    } finally {
      setBusy(false);
    }
  };
  return <CoordinatorScaffold title="Upload Subgroup Data" activeTab="Timetable">
      <WorkflowStepper currentStep={2} />
      {editing ? <CoordinatorRecordEditor title={editing === 'new' ? 'Add Subgroup Record' : 'Edit Subgroup Record'} fields={subgroupFields} initial={Object.fromEntries(subgroupFields.map(field => [field.key, editing === 'new' ? '' : String(editing[field.key] ?? '')]))} onClose={() => setEditing(null)} onSave={async values => {
      const input = {
        ...values,
        year: Number(values.year),
        semester: Number(values.semester),
        timetableId,
        status: 'active'
      };
      if (editing === 'new') await api.createSubgroup(input);else await api.updateSubgroup(editing._id, input);
      await load();
      Alert.alert('Subgroup saved', 'Your record was saved to the timetable.');
    }} /> : null}
      <ActionButton label="Add Subgroup Record" kind="secondary" disabled={!timetableId || busy} onPress={() => setEditing('new')} />
      <View style={styles.statusLine}>
        <Text style={styles.kicker}>COHORT INGESTION</Text>
        <View style={styles.liveStatus}><View style={styles.liveDot} /><Text style={styles.liveText}>MongoDB Records</Text></View>
      </View>

      <Panel style={styles.datasetPanel}>
        <View style={styles.fileTopRow}>
          <View style={styles.groupIcon}><CoordinatorIcon name="group" color={colors.primary} size={23} /></View>
          <View style={styles.fileCopy}>
          <Text numberOfLines={1} style={styles.fileName}>{loadingRecords ? 'Loading subgroup records…' : sourceName || 'No subgroup file uploaded'}</Text>
          <Text style={styles.fileMeta}>{loadingRecords ? 'Loading…' : recordTotal.toLocaleString()} Student Rows  •  {loadingRecords ? 'Loading…' : new Set(records.map(record => record.moduleCode)).size} Modules</Text>
        </View>
        <StatusBadge label={loadingRecords ? 'LOADING' : records.length ? 'SAVED' : 'EMPTY'} tone={loadingRecords ? 'info' : records.length ? 'success' : 'neutral'} />
        </View>
        <View style={styles.matchedBlock}>
          <Text style={styles.summaryLabel}>MATCHED TO MASTER</Text>
          <Pressable onPress={() => chooseTimetable()}><Text style={styles.matchedFile}>{timetable?.fileName ?? 'Select a timetable'}</Text></Pressable>
        </View>
        <ActionButton label={busy ? 'Uploading…' : 'Upload Another Dataset'} icon="upload" kind="secondary" disabled={busy || !timetableId} onPress={() => {
        void uploadSubgroups();
      }} />
      </Panel>

      <View style={styles.smallStatRow}>
        <Panel style={styles.smallStat}><Text style={styles.smallStatValue}>{records.length.toLocaleString()}</Text><Text style={styles.smallStatLabel}>Records Loaded</Text></Panel>
        <Panel style={styles.smallStat}><Text style={styles.smallStatValue}>{venues.size}</Text><Text style={styles.smallStatLabel}>Venues in Preview</Text></Panel>
        <Panel style={styles.smallStat}><Text style={styles.smallStatValue}>{uploadSummary ? `${uploadSummary.total ? Math.round(uploadSummary.valid / uploadSummary.total * 100) : 0}%` : '—'}</Text><Text style={styles.smallStatLabel}>Valid Coverage</Text></Panel>
      </View>

      {uploadSummary ? <Panel style={styles.fileCard}><Text style={styles.previewName}>Upload result</Text><Text style={styles.previewMeta}>{uploadSummary.inserted.toLocaleString()} inserted • {uploadSummary.valid.toLocaleString()} valid • {uploadSummary.invalid.toLocaleString()} invalid of {uploadSummary.total.toLocaleString()}</Text>{uploadSummary.errors.map(item => <Text key={`${item.row}-${item.message}`} style={styles.errorText}>Row {item.row}: {item.message}</Text>)}</Panel> : null}
      {error ? <Panel><Text style={styles.errorText}>{error}</Text></Panel> : null}
      {busy ? <ActivityIndicator color={colors.primary} /> : null}

      <View style={styles.sectionBlock}>
        <View>
          <SectionHeading title="Data Preview" />
          <Text style={styles.previewSubtitle}>Showing {displayedRecords.length} of {recordTotal.toLocaleString()} records</Text>
          <Text style={styles.previewSubtitle}>Tap a record to edit its fields or delete it. Use the error list to correct flagged records.</Text>
        </View>
        <Panel style={styles.previewPanel}>
          {loadingRecords ? <Text style={styles.previewMeta}>Loading subgroup records for this timetable…</Text> : displayedRecords.length ? displayedRecords.map((record, index) => <Pressable key={record._id} onPress={() => updateRecord(record)} style={[styles.previewRecord, index > 0 && styles.previewRecordBorder]}>
              <View style={styles.previewTop}>
                <Text style={styles.previewName}>{record.studentName}</Text>
                <StatusBadge label={record.subgroup} tone="info" />
              </View>
              <Text style={styles.previewMeta}>{record.studentId} • {record.moduleCode} {record.moduleName}</Text>
              <Text style={styles.previewMeta}>{record.day} {record.startTime}–{record.endTime} • {record.venue}</Text>
            </Pressable>) : <Text style={styles.previewMeta}>No subgroup records are stored for this timetable.</Text>}
          {recordTotal > 3 ? <Pressable onPress={() => {
          void loadMoreRecords();
        }} accessibilityRole="button" style={styles.loadMore}><Text style={styles.loadMoreText}>{expanded && records.length >= recordTotal ? 'Show fewer entries' : 'Load more entries'}  ↓</Text></Pressable> : null}
        </Panel>
      </View>

      <View style={styles.actions}>
        <ActionButton label="Save & Proceed to Validate Data" icon="arrow" disabled={!timetableId || busy} onPress={() => router.push({
        pathname: '/(tabs)/validation',
        params: {
          timetableId
        }
      })} />
        <ActionButton label="Cancel & Re-upload" kind="secondary" icon="close" onPress={() => router.replace('/(tabs)/timetable')} />
      </View>
    </CoordinatorScaffold>;
}
const styles = StyleSheet.create({
  eyebrowBlock: {
    gap: 4,
    marginTop: -spacing.small
  },
  kicker: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.85
  },
  subtitle: {
    color: colors.muted,
    fontSize: 11
  },
  scopeCard: {
    gap: spacing.medium
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700'
  },
  sectionBlock: {
    gap: spacing.small
  },
  dropZone: {
    minHeight: 166,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#B7C6E6',
    borderRadius: radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large
  },
  dropZonePressed: {
    backgroundColor: colors.infoSurface
  },
  uploadCloud: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.lightPurple,
    marginBottom: spacing.small
  },
  dropTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700'
  },
  dropHint: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 5
  },
  browseButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: 8,
    marginTop: spacing.medium,
    backgroundColor: colors.surface
  },
  browseText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700'
  },
  fileCard: {
    gap: spacing.medium
  },
  fileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  groupIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.lightPurple,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5
  },
  fileName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700'
  },
  fileMeta: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14
  },
  validatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  validatedText: {
    flex: 1,
    color: colors.green,
    fontSize: 10,
    fontWeight: '600'
  },
  percentText: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '700'
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.small
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    gap: 8,
    padding: spacing.medium
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.65
  },
  summaryValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700'
  },
  summaryUnit: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '500'
  },
  actions: {
    gap: spacing.small,
    marginTop: spacing.xsmall
  },
  statusLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -spacing.small
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.green
  },
  liveText: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '600'
  },
  datasetPanel: {
    gap: spacing.medium
  },
  matchedBlock: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.small,
    padding: spacing.medium,
    gap: 5
  },
  matchedFile: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600'
  },
  smallStatRow: {
    flexDirection: 'row',
    gap: spacing.small
  },
  smallStat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: spacing.medium,
    gap: 5
  },
  smallStatValue: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700'
  },
  smallStatLabel: {
    color: colors.muted,
    fontSize: 8,
    textAlign: 'center'
  },
  previewSubtitle: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4
  },
  previewPanel: {
    paddingVertical: spacing.small
  },
  previewRecord: {
    paddingVertical: spacing.medium,
    gap: 5
  },
  previewRecordBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  savedTimetableInfo: {
    gap: 5
  },
  savedTimetableActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2
  },
  deleteTimetableButton: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.medium,
    paddingVertical: 5
  },
  deleteTimetableButtonPressed: {
    opacity: 0.75,
    backgroundColor: '#FFF4F4'
  },
  deleteTimetableText: {
    color: colors.red,
    fontSize: 10,
    fontWeight: '700'
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.small
  },
  previewName: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700'
  },
  previewMeta: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14
  },
  loadMore: {
    minHeight: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700'
  },
  errorText: {
    color: colors.red,
    fontSize: 10,
    lineHeight: 15
  },
  pressed: {
    opacity: 0.8
  }
});

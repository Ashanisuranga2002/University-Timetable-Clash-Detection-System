import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActionButton, CoordinatorScaffold, Panel, StatusBadge } from './CoordinatorUI';
import CoordinatorTheme from '@/constants/CoordinatorTheme';
import { api } from '@/services/api';
const {
  colors,
  spacing
} = CoordinatorTheme;
const listRoute = '/(tabs)/master-timetables';
const sizeLabel = size => size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`;
const dateLabel = value => Number.isNaN(Date.parse(value)) ? 'Unavailable' : new Date(value).toLocaleString();
const message = (cause, fallback) => cause instanceof Error ? cause.message : fallback;
export function UploadedMasterTimetablesScreen() {
  const {
    uploadedId
  } = useLocalSearchParams();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(uploadedId ? 'Master timetable uploaded successfully.' : '');
  const [renaming, setRenaming] = useState(null);
  const [name, setName] = useState('');
  const [renameError, setRenameError] = useState('');
  const mutation = useRef(false);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const result = await api.timetables(`page=${page}&limit=20`);
      if (id !== requestId.current) return;
      if (page > Math.max(1, result.pagination.totalPages)) {
        setPage(Math.max(1, result.pagination.totalPages));
        return;
      }
      setItems(result.data);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (cause) {
      if (id === requestId.current) setError(message(cause, 'Could not load master timetables. Please try again.'));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [page]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => {
      requestId.current++;
    };
  }, [load]));
  const rename = async () => {
    if (!renaming || mutation.current) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setRenameError('Enter a new name.');
      return;
    }
    if (trimmed.length > 255 || /[\u0000-\u001f\u007f]/.test(trimmed)) {
      setRenameError('Use a name of 1–255 characters without line breaks.');
      return;
    }
    mutation.current = true;
    setBusy(true);
    setRenameError('');
    setError('');
    setNotice('');
    try {
      const result = await api.updateTimetable(renaming._id, {
        fileName: trimmed
      });
      setItems(previous => previous.map(item => item._id === result.data._id ? result.data : item));
      setRenaming(null);
      setNotice('Master timetable renamed successfully.');
    } catch (cause) {
      setRenameError(message(cause, 'Could not rename this timetable. Please try again.'));
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  };
  const remove = async item => {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api.deleteTimetable(item._id);
      setItems(previous => previous.filter(value => value._id !== item._id));
      setNotice('Master timetable deleted successfully.');
      await load();
    } catch (cause) {
      setError(message(cause, 'Could not delete this timetable. Please try again.'));
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  };
  const confirmDelete = item => Alert.alert('Delete timetable?', 'Are you sure you want to delete this timetable?\n\nIts linked subgroup records and validation data will also be removed.', [{
    text: 'Cancel',
    style: 'cancel'
  }, {
    text: 'Delete',
    style: 'destructive',
    onPress: () => {
      void remove(item);
    }
  }]);
  return <CoordinatorScaffold title="Uploaded Master Timetables" activeTab="Timetable" backLabel="Back to Upload" onBack={() => {
    if (!busy) router.replace('/(tabs)/timetable');
  }}>
    {notice ? <Panel><Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text></Panel> : null}
    {error ? <Panel><Text accessibilityRole="alert" style={styles.error}>{error}</Text></Panel> : null}
    {renaming ? <Modal animationType="slide" onRequestClose={() => {
      if (!busy) setRenaming(null);
    }}>
      <KeyboardAvoidingView style={{
        flex: 1
      }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.renameContent}>
      <Panel style={styles.card}>
      <Text style={styles.title}>Rename Master Timetable</Text>
      <Text style={styles.meta}>Current name: {renaming.fileName}</Text>
      <Text style={styles.meta}>New name</Text>
      <TextInput accessibilityLabel="New timetable name" value={name} onChangeText={setName} editable={!busy} maxLength={255} autoFocus autoCapitalize="sentences" style={styles.input} />
      {renameError ? <Text accessibilityRole="alert" style={styles.error}>{renameError}</Text> : null}
      <ActionButton label={busy ? 'Saving…' : 'Save'} icon="save" disabled={busy} onPress={() => {
              void rename();
            }} />
      <ActionButton label="Cancel" kind="secondary" disabled={busy} onPress={() => {
              setRenaming(null);
              setRenameError('');
            }} />
    </Panel></ScrollView></KeyboardAvoidingView></Modal> : null}
    <ActionButton label="Upload Master Timetable" icon="upload" disabled={busy || !!renaming} onPress={() => router.replace('/(tabs)/timetable')} />
    <ActionButton label="Refresh" kind="secondary" icon="refresh" disabled={loading || busy || !!renaming} onPress={() => {
      void load();
    }} />
    {loading ? <ActivityIndicator accessibilityLabel="Loading master timetables" color={colors.primary} /> : null}
    {!loading && !error && !items.length ? <Panel><Text style={styles.meta}>No master timetables uploaded yet.</Text></Panel> : null}
    {items.map(item => <Panel key={item._id} style={styles.card}>
      <Text style={styles.title}>{item.fileName}</Text>
      {item._id === uploadedId ? <StatusBadge label="UPLOADED" tone="success" /> : null}
      <Text style={styles.meta}>Uploaded: {dateLabel(item.createdAt)}</Text>
      <Text style={styles.meta}>{sizeLabel(item.fileSize)} • {item.allocatedSlots} sessions • {item.sheetsDetected} sheets</Text>
      <Text style={styles.meta}>{item.academicYear} • {item.semester}</Text>
      <View style={styles.actions}>
        <View style={styles.action}><ActionButton label="View" kind="secondary" disabled={busy || loading || !!renaming} onPress={() => router.push({
            pathname: '/(tabs)/master-view',
            params: {
              timetableId: item._id
            }
          })} /></View>
        <View style={styles.action}><ActionButton label="Rename" kind="secondary" disabled={busy || loading || !!renaming} onPress={() => {
            setRenaming(item);
            setName(item.fileName);
            setRenameError('');
            setNotice('');
          }} /></View>
        <View style={styles.action}><ActionButton label="Delete" kind="secondary" disabled={busy || loading || !!renaming} onPress={() => confirmDelete(item)} /></View>
      </View>
    </Panel>)}
    <Text style={styles.meta}>Page {page} of {totalPages}</Text>
    <View style={styles.actions}>
      <View style={styles.action}><ActionButton label="Previous" kind="secondary" disabled={page <= 1 || loading || busy || !!renaming} onPress={() => setPage(value => value - 1)} /></View>
      <View style={styles.action}><ActionButton label="Next" kind="secondary" disabled={page >= totalPages || loading || busy || !!renaming} onPress={() => setPage(value => value + 1)} /></View>
    </View>
  </CoordinatorScaffold>;
}
export function ViewMasterTimetableScreen() {
  const {
    timetableId
  } = useLocalSearchParams();
  const [timetable, setTimetable] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [visible, setVisible] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    setTimetable(null);
    setSessions([]);
    setVisible(30);
    try {
      if (!timetableId) throw new Error('Choose a master timetable from the uploaded files list.');
      const [record, rows] = await Promise.all([api.timetable(timetableId), api.timetableSessions(timetableId)]);
      if (id !== requestId.current) return;
      setTimetable(record.data);
      setSessions(rows.data);
    } catch (cause) {
      if (id === requestId.current) setError(message(cause, 'Could not open this timetable. Please try again.'));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [timetableId]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => {
      requestId.current++;
    };
  }, [load]));
  return <CoordinatorScaffold title="View Master Timetable" activeTab="Timetable" backLabel="Back to Uploaded Timetables" onBack={() => router.canGoBack() ? router.back() : router.replace(listRoute)}>
    {loading ? <ActivityIndicator accessibilityLabel="Loading timetable" color={colors.primary} /> : null}
    {error ? <Panel style={styles.card}><Text accessibilityRole="alert" style={styles.error}>{error}</Text>
      <ActionButton label="Retry" kind="secondary" onPress={() => {
        void load();
      }} /></Panel> : null}
    {timetable ? <Panel style={styles.card}>
      <Text style={styles.title}>{timetable.fileName}</Text>
      <Text style={styles.meta}>Uploaded: {dateLabel(timetable.createdAt)}</Text>
      <Text style={styles.meta}>{timetable.faculty} • {timetable.academicYear} • {timetable.semester}</Text>
      <Text style={styles.meta}>{sizeLabel(timetable.fileSize)} • {timetable.sheetsDetected} sheets • {sessions.length} sessions</Text>
    </Panel> : null}
    {sessions.slice(0, visible).map((row, index) => <Panel key={index} style={styles.card}>
      <Text style={styles.title}>{row.moduleCode} — {row.moduleName}</Text>
      <Text style={styles.meta}>Subgroup: {row.subgroup}</Text>
      <Text style={styles.meta}>{row.day} • {row.startTime}–{row.endTime}</Text>
      <Text style={styles.meta}>Venue: {row.venue}</Text>
      {row.lecturerName ? <Text style={styles.meta}>Lecturer: {row.lecturerName}</Text> : null}
    </Panel>)}
    {timetable && !sessions.length ? <Panel><Text style={styles.meta}>This timetable contains no stored sessions.</Text></Panel> : null}
    {sessions.length > visible ? <ActionButton label="Load More Sessions" kind="secondary" onPress={() => setVisible(value => value + 30)} /> : null}
    <ActionButton label="Uploaded Master Timetables" kind="secondary" onPress={() => router.replace(listRoute)} />
  </CoordinatorScaffold>;
}
const styles = StyleSheet.create({
  renameContent: {
    padding: spacing.large,
    paddingTop: 60,
    paddingBottom: 60,
    flexGrow: 1,
    backgroundColor: colors.pageBackground
  },
  card: {
    gap: spacing.small
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700'
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19
  },
  success: {
    color: colors.green,
    fontSize: 13,
    lineHeight: 20
  },
  error: {
    color: colors.red,
    fontSize: 13,
    lineHeight: 20
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small
  },
  action: {
    flex: 1,
    minWidth: 80
  }
});

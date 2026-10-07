import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { ActionButton, Panel } from './CoordinatorUI';
import CoordinatorTheme from '@/constants/CoordinatorTheme';
export function CoordinatorRecordEditor({
  title,
  fields,
  initial,
  onSave,
  onClose
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const {
    colors,
    spacing
  } = CoordinatorTheme;
  const save = async () => {
    if (busy) return;
    const trimmed = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]));
    const missing = fields.find(field => !field.optional && !trimmed[field.key]);
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave(trimmed);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return <Modal animationType="slide" onRequestClose={() => {
    if (!busy) onClose();
  }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{
      padding: spacing.large,
      paddingTop: 60,
      paddingBottom: 60,
      gap: spacing.medium,
      backgroundColor: colors.pageBackground
    }}>
      <Text style={{
        color: colors.text,
        fontSize: 20,
        fontWeight: '700'
      }}>{title}</Text>
      {fields.map(field => <View key={field.key} style={{
        gap: 6
      }}>
        <Text style={{
          color: colors.text
        }}>{field.label}{field.optional ? ' (optional)' : ''}</Text>
        <TextInput accessibilityLabel={field.label} editable={!busy} value={values[field.key] ?? ''} onChangeText={value => setValues(previous => ({
          ...previous,
          [field.key]: value
        }))} keyboardType={field.numeric ? 'number-pad' : 'default'} autoCapitalize="none" style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          padding: 12,
          color: colors.text,
          backgroundColor: colors.surface
        }} />
      </View>)}
      {error ? <Panel><Text accessibilityRole="alert" style={{
          color: colors.red
        }}>{error}</Text></Panel> : null}
      <ActionButton label={busy ? 'Saving…' : 'Save Changes'} disabled={busy} onPress={() => {
        void save();
      }} />
      <ActionButton label="Cancel" kind="secondary" disabled={busy} onPress={onClose} />
    </ScrollView>
  </Modal>;
}

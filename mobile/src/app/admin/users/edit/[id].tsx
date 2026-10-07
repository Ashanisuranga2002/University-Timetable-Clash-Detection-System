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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AC, AR, AS } from '@/constants/adminTheme';
import { fetchUserByIdApi, updateUserApi, AdminUser } from '@/services/api';

const AVAILABLE_ROLES: AdminUser['role'][] = [
  'Student',
  'Academic Advisor',
  'Monitor',
  'Coordinator',
  'Administrator',
];

const AVAILABLE_STATUSES: AdminUser['status'][] = ['Active', 'Inactive', 'Suspended'];

export default function EditUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminUser['role']>('Student');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<AdminUser['status']>('Active');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    async function loadUser() {
      if (!id) return;
      try {
        const res = await fetchUserByIdApi(id);
        const data: AdminUser = res?.data || res;
        if (data) {
          setUserId(data.userId);
          setName(data.name);
          setEmail(data.email);
          setRole(data.role);
          setDepartment(data.department || 'Faculty of Computing');
          setStatus(data.status);
        }
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to load user info');
      } finally {
        setInitialLoading(false);
      }
    }
    loadUser();
  }, [id]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!department.trim()) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!id || !validate()) return;

    setSubmitting(true);
    try {
      await updateUserApi(id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        department: department.trim(),
        status,
      });

      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/admin/users');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update user profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AdminHeader title="Edit User" showBack onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/users'))} />

      {initialLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={AC.primary} />
          <Text style={styles.subText}>Loading user profile...</Text>
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
              <Text style={styles.sectionTitle}>Edit Account ({userId})</Text>

              {/* Readonly User ID */}
              <View style={styles.field}>
                <Text style={styles.label}>USER ID (READ ONLY)</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={userId}
                  editable={false}
                />
              </View>

              {/* Full Name */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  FULL NAME <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              {/* Email Address */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  EMAIL ADDRESS <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              {/* Department */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  DEPARTMENT <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.department ? styles.inputError : null]}
                  value={department}
                  onChangeText={(t) => {
                    setDepartment(t);
                    if (errors.department) setErrors((prev) => ({ ...prev, department: '' }));
                  }}
                />
                {errors.department ? <Text style={styles.errorText}>{errors.department}</Text> : null}
              </View>

              {/* Role Selection */}
              <View style={styles.field}>
                <Text style={styles.label}>SYSTEM ROLE</Text>
                <View style={styles.chipGrid}>
                  {AVAILABLE_ROLES.map((r) => {
                    const active = role === r;
                    return (
                      <Pressable
                        key={r}
                        style={[styles.roleChip, active && styles.roleChipActive]}
                        onPress={() => setRole(r)}
                      >
                        <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                          {r}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Status Selection */}
              <View style={styles.field}>
                <Text style={styles.label}>ACCOUNT STATUS</Text>
                <View style={styles.chipGrid}>
                  {AVAILABLE_STATUSES.map((s) => {
                    const active = status === s;
                    return (
                      <Pressable
                        key={s}
                        style={[styles.statusChip, active && styles.statusChipActive]}
                        onPress={() => setStatus(s)}
                      >
                        <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                          {s}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => (router.canGoBack() ? router.back() : router.push('/admin/users'))}
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
    marginBottom: 4,
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
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: AR.pill,
    backgroundColor: AC.bgApp,
    borderWidth: 1,
    borderColor: AC.border,
  },
  roleChipActive: {
    backgroundColor: AC.primary,
    borderColor: AC.primary,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AC.textSecondary,
  },
  roleChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: AR.pill,
    backgroundColor: AC.bgApp,
    borderWidth: 1,
    borderColor: AC.border,
  },
  statusChipActive: {
    backgroundColor: AC.success,
    borderColor: AC.success,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AC.textSecondary,
  },
  statusChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
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
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});

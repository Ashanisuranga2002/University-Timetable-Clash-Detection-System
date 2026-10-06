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
} from 'react-native';
import { router } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AC, AR, AS } from '@/constants/adminTheme';
import { createUserApi, AdminUser } from '@/services/api';

const AVAILABLE_ROLES: AdminUser['role'][] = [
  'Student',
  'Academic Advisor',
  'Monitor',
  'Coordinator',
  'Administrator',
];

const AVAILABLE_STATUSES: AdminUser['status'][] = ['Active', 'Inactive', 'Suspended'];

export default function AddUserScreen() {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminUser['role']>('Student');
  const [department, setDepartment] = useState('Faculty of Computing');
  const [status, setStatus] = useState<AdminUser['status']>('Active');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!userId.trim()) {
      newErrors.userId = 'User ID is required (e.g. STU100, ADM002)';
    }

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
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

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await createUserApi({
        userId: userId.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        department: department.trim(),
        status,
      });

      Alert.alert('Success', `User ${name} has been added successfully!`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create user. Please check if ID/email is duplicate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AdminHeader title="Add New User" showBack onBack={() => router.back()} />

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
            <Text style={styles.sectionTitle}>User Credentials & Profile</Text>

            {/* User ID */}
            <View style={styles.field}>
              <Text style={styles.label}>
                USER ID <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.userId ? styles.inputError : null]}
                placeholder="e.g. STU002 or ADM002"
                placeholderTextColor={AC.textTertiary}
                value={userId}
                onChangeText={(t) => {
                  setUserId(t);
                  if (errors.userId) setErrors((prev) => ({ ...prev, userId: '' }));
                }}
                autoCapitalize="characters"
              />
              {errors.userId ? <Text style={styles.errorText}>{errors.userId}</Text> : null}
            </View>

            {/* Full Name */}
            <View style={styles.field}>
              <Text style={styles.label}>
                FULL NAME <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : null]}
                placeholder="e.g. Nuwan Wickramasinghe"
                placeholderTextColor={AC.textTertiary}
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
                placeholder="e.g. nuwan.w@sliit.lk"
                placeholderTextColor={AC.textTertiary}
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
                placeholder="e.g. Faculty of Computing"
                placeholderTextColor={AC.textTertiary}
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
              <Text style={styles.label}>ROLE</Text>
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
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Create User</Text>
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

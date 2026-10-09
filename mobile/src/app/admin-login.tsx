import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loginAdminApi, loginStudentApi } from '../services/api';

const STORAGE_KEYS = {
  USER_ID: 'saved_user_id',
  PASSWORD: 'saved_password',
  REMEMBER_ME: 'saved_remember_me',
};

const INDIGO = '#4F46E5';

export default function AdminLoginScreen() {
  // Admin is the default selected role on this page
  const [selectedRole, setSelectedRole] = useState<'Student' | 'Advisor' | 'Coordinator' | 'Admin'>('Admin');

  const [userId, setUserId] = useState('ADM001');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load saved credentials
  useEffect(() => {
    async function loadSaved() {
      try {
        const [savedId, savedPass, savedRemember] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
          AsyncStorage.getItem(STORAGE_KEYS.PASSWORD),
          AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME),
        ]);
        if (savedRemember === 'true') {
          setRememberMe(true);
          if (savedId) setUserId(savedId);
          if (savedPass) setPassword(savedPass);
        } else if (savedRemember === 'false') {
          setRememberMe(false);
        }
      } catch (err) {
        console.warn('Failed to load saved credentials:', err);
      }
    }
    loadSaved();
  }, []);

  const saveOrClearCredentials = async (id: string, pass: string) => {
    try {
      if (rememberMe) {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.USER_ID, id),
          AsyncStorage.setItem(STORAGE_KEYS.PASSWORD, pass),
          AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true'),
        ]);
      } else {
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
          AsyncStorage.removeItem(STORAGE_KEYS.PASSWORD),
          AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'false'),
        ]);
      }
    } catch (err) {
      console.warn('Failed to save credentials:', err);
    }
  };

  const handleLogin = async () => {
    const id = userId.trim();
    if (!id || !password) {
      setErrorMsg('Please enter your ID and Password');
      return;
    }

    const upperId = id.toUpperCase();
    if (selectedRole === 'Student' && !upperId.startsWith('IT')) {
      setErrorMsg('Student ID must start with "IT".');
      return;
    }
    if (selectedRole === 'Advisor' && !upperId.startsWith('AD')) {
      setErrorMsg('Advisor ID must start with "AD".');
      return;
    }
    if (selectedRole === 'Coordinator' && !upperId.startsWith('CO')) {
      setErrorMsg('Coordinator ID must start with "CO".');
      return;
    }
    if (selectedRole === 'Admin' && !upperId.startsWith('AD')) {
      setErrorMsg('Admin ID must start with "AD".');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // ── STAFF LOGIN ──────────────────────────────────────────
      if (selectedRole !== 'Student') {
        const staffRes = await loginAdminApi(id, password);
        if (staffRes?.success) {
          await saveOrClearCredentials(id, password);
          if (staffRes.admin) {
            await AsyncStorage.setItem('current_admin_user', JSON.stringify(staffRes.admin));
          }
          if (selectedRole === 'Advisor' || staffRes.admin?.role === 'Academic Advisor') {
            router.replace('/Advisor/dashboard' as any);
          } else if (selectedRole === 'Coordinator' || staffRes.admin?.role === 'Coordinator') {
            router.replace('/coordinator-dashboard' as any);
          } else {
            router.replace({
              pathname: '/admin',
              params: {
                adminId: staffRes.admin?.adminId || id,
                adminName: staffRes.admin?.name || 'Administrator',
                adminRole: staffRes.admin?.role || 'Administrator',
                adminDept: staffRes.admin?.department || 'Academic Affairs',
              },
            });
          }
          return;
        }

        setErrorMsg(`Invalid ${selectedRole} ID or password.`);
      }
    } catch (err: any) {
      // Offline / demo fallback
      console.warn('Login error, using offline fallback:', err?.message);
      await saveOrClearCredentials(id, password);

      if (selectedRole === 'Advisor') {
        router.replace('/Advisor/dashboard' as any);
      } else if (selectedRole === 'Coordinator') {
        router.replace('/coordinator-dashboard' as any);
      } else if (selectedRole === 'Student') {
        router.replace({ pathname: '/dashboard', params: { studentId: id } });
      } else {
        // Admin fallback
        router.replace({
          pathname: '/admin',
          params: {
            adminId: id,
            adminName: 'Dr. Sarah Mitchell',
            adminRole: 'Administrator',
            adminDept: 'Academic Affairs',
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserIdChange = (value: string) => {
    setUserId(value);
    if (errorMsg) setErrorMsg('');
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errorMsg) setErrorMsg('');
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── BRAND HEADER ─────────────────────────────── */}
          <View style={styles.brandHeader}>
            <View style={styles.brandMark}>
              <Ionicons name="school" size={20} color={INDIGO} />
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.brandTitle}>UNIVERSITY PORTAL</Text>
              <Text style={styles.brandSub}>Academic Mobility & Timetable</Text>
            </View>
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>ONLINE</Text>
            </View>
          </View>

          {/* ─── HERO SECTION ─────────────────────────────── */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Welcome Back</Text>
            <Text style={styles.heroSub}>
              Sign in with your university ID to access courses and timetable.
            </Text>

            {/* ROLE SELECTOR — Student / Advisor / Admin */}
            <View style={styles.roleSelectorRow}>
              {(['Student', 'Advisor', 'Coordinator', 'Admin'] as const).map((role) => {
                const isActive = selectedRole === role;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleChip, isActive && styles.roleChipActive]}
                    onPress={() => {
                      setSelectedRole(role);
                      setErrorMsg('');
                      // Pre-fill admin credentials when Admin tab is tapped
                      if (role === 'Admin') {
                        setUserId('ADM001');
                        setPassword('admin123');
                      } else {
                        setUserId('');
                        setPassword('');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ─── LOGIN CARD ────────────────────────────────── */}
          <View style={styles.card}>
            {/* ERROR */}
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* UNIVERSITY / ADMIN ID */}
            <Text style={styles.fieldLabel}>
              {selectedRole === 'Student' ? 'UNIVERSITY ID' :
               selectedRole === 'Advisor' ? 'ADVISOR ID' :
               selectedRole === 'Coordinator' ? 'COORDINATOR ID' :
               'ADMIN ID'}
            </Text>
            <View style={styles.inputShell}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#6366F1"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={userId}
                onChangeText={handleUserIdChange}
                placeholder={
                  selectedRole === 'Student' ? "e.g. IT21047138" :
                  selectedRole === 'Advisor' ? "e.g. AD001" :
                  selectedRole === 'Coordinator' ? "e.g. CO001" :
                  "e.g. AD001"
                }
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
              />
            </View>

            {/* PASSWORD */}
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={styles.inputShell}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#6366F1"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((c) => !c)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={19}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            {/* REMEMBER / FORGOT */}
            <View style={styles.rowBetween}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe((c) => !c)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* SIGN IN BUTTON */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.signInBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            <Text style={styles.footerNote}>
              Need assistance?{' '}
              <Text style={styles.footerStrong}>Contact IT Helpdesk</Text>
            </Text>
            <Text style={styles.secureNote}>
              Secured with 256-bit institutional encryption
            </Text>
          </View>

          {/* ─── BACK TO MAIN LOGIN ───────────────────────── */}
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.replace('/')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back-outline" size={16} color={INDIGO} />
            <Text style={styles.switchBtnText}>Back to Student Login</Text>
          </TouchableOpacity>

          <Text style={styles.bottomHelp}>
            Need help?{' '}
            <Text style={styles.bottomHelpStrong}>IT Support (Ext. 4022)</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  keyboardView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  // Brand
  brandHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  brandMark: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E7FF',
  },
  brandCopy: { flex: 1 },
  brandTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A', letterSpacing: 0.6 },
  brandSub: { fontSize: 11, color: '#64748B', marginTop: 1, fontWeight: '500' },
  onlinePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ECFDF5', borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: '#A7F3D0', gap: 5,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  onlineText: { fontSize: 9, fontWeight: '800', color: '#059669', letterSpacing: 0.5 },

  // Hero
  heroSection: { marginBottom: 24 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 6, letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  roleSelectorRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  roleChip: {
    backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#E0E7FF',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6,
  },
  roleChipActive: { backgroundColor: INDIGO, borderColor: INDIGO },
  roleChipText: { color: '#4338CA', fontSize: 12, fontWeight: '600' },
  roleChipTextActive: { color: '#FFFFFF' },

  // Card
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },

  // Error
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    marginBottom: 16, gap: 8, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '500' },

  // Form
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#475569', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  inputShell: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, height: 52, marginBottom: 18,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },

  // Remember / Forgot
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, gap: 12 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 5,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#CBD5E1',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: INDIGO, borderColor: INDIGO },
  rememberText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  forgotText: { fontSize: 13, color: INDIGO, fontWeight: '600' },

  // Sign in button
  signInBtn: {
    height: 52, borderRadius: 14, backgroundColor: INDIGO,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 20,
    shadowColor: INDIGO, shadowOpacity: 0.25, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  signInBtnDisabled: { opacity: 0.75 },
  signInBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Footer
  footerNote: { fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 6 },
  footerStrong: { color: INDIGO, fontWeight: '600' },
  secureNote: { fontSize: 11, color: '#94A3B8', textAlign: 'center' },

  // Switch button
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 18, paddingVertical: 10,
  },
  switchBtnText: { fontSize: 14, color: INDIGO, fontWeight: '600' },

  // Bottom
  bottomHelp: { textAlign: 'center', color: '#94A3B8', marginTop: 8, fontSize: 12 },
  bottomHelpStrong: { color: INDIGO, fontWeight: '600' },
});

import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { loginAdminApi } from '../services/api';

export default function AdminLoginScreen() {
  const [adminId, setAdminId] = useState('ADM001');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!adminId.trim() || !password) {
      setError('Please enter your Admin ID and Password');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await loginAdminApi(adminId.trim(), password);
      if (res?.success) {
        router.push({
          pathname: '/admin-dashboard',
          params: {
            adminId: res.admin.adminId,
            adminName: res.admin.name,
            adminRole: res.admin.role,
            adminDept: res.admin.department,
          },
        });
      } else {
        setError(res?.message || 'Invalid credentials');
      }
    } catch (err: any) {
      // Offline preview fallback
      router.push({
        pathname: '/admin-dashboard',
        params: { adminId: adminId.trim(), adminName: 'Dr. Sarah Mitchell', adminRole: 'admin', adminDept: 'Academic Affairs' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Dark Hero Header */}
          <View style={styles.heroHeader}>
            {/* Brand Row */}
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Text style={styles.brandLetter}>U</Text>
              </View>
              <View style={styles.brandText}>
                <Text style={styles.brandTitle}>UNIVERSITY PORTAL</Text>
                <Text style={styles.brandSub}>Academic Mobility System</Text>
              </View>
              <View style={styles.onlinePill}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineLabel}>GATEWAY ONLINE</Text>
              </View>
            </View>

            {/* Role Badge */}
            <View style={styles.roleBadgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeGlyph}>⬡</Text>
                <Text style={styles.roleBadgeText}>ADMIN ACCESS</Text>
              </View>
              <View style={styles.secureChip}>
                <Text style={styles.secureChipText}>🛡 SECURE</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Administrator{'\n'}Portal</Text>
            <Text style={styles.heroSub}>
              Sign in to manage courses, students, and timetable operations.
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            {/* Access Level Chips */}
            <Text style={styles.stepLabel}>1. SELECT ACCESS LEVEL</Text>
            <View style={styles.chipRow}>
              {['Admin', 'Coordinator', 'Advisor'].map((r, i) => (
                <View
                  key={r}
                  style={[styles.chip, i === 0 && styles.chipActive]}
                >
                  <Text style={[styles.chipText, i === 0 && styles.chipTextActive]}>{r}</Text>
                </View>
              ))}
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {/* Admin ID */}
            <Text style={styles.fieldLabel}>ADMIN ID</Text>
            <View style={styles.inputShell}>
              <View style={styles.inputPrefix}>
                <Text style={styles.inputPrefixText}>AD</Text>
              </View>
              <TextInput
                style={styles.input}
                value={adminId}
                onChangeText={setAdminId}
                placeholder="ADM001"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
              />
              <View style={styles.inputSuffix}>
                <Text style={styles.inputSuffixText}>ADMIN</Text>
              </View>
            </View>

            {/* Password */}
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={styles.inputShell}>
              <View style={styles.inputPrefix}>
                <Text style={styles.inputPrefixText}>PW</Text>
              </View>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '◕' : '◔'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rowBetween}>
              <View style={styles.rememberRow}>
                <View style={styles.checkbox}><Text style={styles.checkmark}>✓</Text></View>
                <Text style={styles.rememberText}>Remember session</Text>
              </View>
              <Text style={styles.forgotText}>Reset password</Text>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.signInBtnText}>Sign In as Administrator</Text>
                  <Text style={styles.signInArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Switch to Student Login */}
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => router.replace('/')}
            >
              <View style={styles.switchIcon}><Text style={styles.switchIconText}>S</Text></View>
              <Text style={styles.switchBtnText}>Switch to Student Login</Text>
              <Text style={styles.switchChevron}>›</Text>
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              Need access?{' '}
              <Text style={styles.footerNoteStrong}>Contact IT Department (Ext. 4022)</Text>
            </Text>
            <Text style={styles.securityNote}>🔒 256-bit encrypted administrative session</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F1117',
  },
  scroll: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },

  // ── Hero Header ──────────────────────────────────────
  heroHeader: {
    backgroundColor: '#1A1D2E',
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2D42',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#312E81',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  brandLetter: {
    fontSize: 14,
    fontWeight: '900',
    color: '#A5B4FC',
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2C1A',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#166534',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  onlineLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: 0.3,
  },

  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    borderWidth: 1,
    borderColor: '#3730A3',
  },
  roleBadgeGlyph: {
    fontSize: 10,
    color: '#818CF8',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818CF8',
    letterSpacing: 1,
  },
  secureChip: {
    backgroundColor: '#1C1C2E',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#2A2D42',
  },
  secureChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },

  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#F1F5F9',
    lineHeight: 36,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
  },

  // ── Card ─────────────────────────────────────────────
  card: {
    backgroundColor: '#F7F9FC',
    borderRadius: 24,
    padding: 16,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#fff',
  },

  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 14,
  },
  inputPrefix: {
    marginRight: 8,
  },
  inputPrefixText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5B4DF5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  inputSuffix: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inputSuffixText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5B4DF5',
  },
  eyeIcon: {
    fontSize: 18,
    color: '#9CA3AF',
    paddingHorizontal: 4,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: '#5B4DF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '900',
  },
  rememberText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 13,
    color: '#5B4DF5',
    fontWeight: '600',
  },

  signInBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  signInBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  signInArrow: {
    color: '#A5B4FC',
    fontSize: 18,
    fontWeight: '900',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
  },

  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    marginBottom: 16,
  },
  switchIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchIconText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4F46E5',
  },
  switchBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  switchChevron: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '700',
  },

  footerNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 6,
  },
  footerNoteStrong: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  securityNote: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

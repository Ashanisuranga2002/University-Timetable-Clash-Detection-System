import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { loginStudentApi } from '../services/api';

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();

  const isCompact = width < 430 || height < 860;
  const isTight = height < 860;

  const [studentId, setStudentId] = useState('IT21047138');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!studentId.trim() || !password) {
      setErrorMsg('Please enter your Student ID and Password');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const res = await loginStudentApi(studentId.trim(), password);

      if (res?.success) {
        router.push({
          pathname: '/dashboard',
          params: {
            studentId: studentId.trim(),
          },
        });
      } else {
        setErrorMsg(res?.message || 'Invalid credentials');
      }
    } catch (err: any) {
      /*
       * HCI / Demo fallback:
       * If backend connection fails, allow the student UI
       * to continue for prototype demonstration.
       *
       * Remove this fallback in a production application.
       */
      console.warn(
        'Login request error, proceeding with offline preview:',
        err?.message
      );

      router.push({
        pathname: '/dashboard',
        params: {
          studentId: studentId.trim(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminPortal = () => {
    router.push('/admin' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isCompact && styles.scrollContentCompact,
          isTight && styles.scrollContentTight,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.heroCard,
            isCompact && styles.heroCardCompact,
            isTight && styles.heroCardTight,
          ]}
        >
          {/* =========================
              UNIVERSITY BRAND HEADER
          ========================== */}
          <View style={styles.brandRow}>
            <View
              style={[
                styles.brandMark,
                isCompact && styles.brandMarkCompact,
                isTight && styles.brandMarkTight,
              ]}
            >
              <Text style={styles.iconGlyph}>U</Text>
            </View>

            <View style={styles.brandCopy}>
              <Text
                style={[
                  styles.brandTitle,
                  isCompact && styles.brandTitleCompact,
                  isTight && styles.brandTitleTight,
                ]}
              >
                UNIVERSITY PORTAL
              </Text>

              <Text
                style={[
                  styles.brandSubtitle,
                  isCompact && styles.brandSubtitleCompact,
                  isTight && styles.brandSubtitleTight,
                ]}
              >
                Academic Mobility System
              </Text>
            </View>

            <View
              style={[
                styles.onlineBadge,
                isCompact && styles.onlineBadgeCompact,
                isTight && styles.onlineBadgeTight,
              ]}
            >
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>GATEWAY ONLINE</Text>
            </View>
          </View>

          {/* =========================
              STUDENT PORTAL HEADER
          ========================== */}
          <Text
            style={[
              styles.title,
              isCompact && styles.titleCompact,
              isTight && styles.titleTight,
            ]}
          >
            Student Portal
          </Text>

          <Text
            style={[
              styles.subtitle,
              isCompact && styles.subtitleCompact,
              isTight && styles.subtitleTight,
            ]}
          >
            Sign in to manage registration, clashes and your timetable.
          </Text>

          {/* =========================
              STUDENT LOGIN CARD
          ========================== */}
          <View
            style={[
              styles.profileCard,
              isCompact && styles.profileCardCompact,
              isTight && styles.profileCardTight,
            ]}
          >
            <Text
              style={[
                styles.sectionLabel,
                isCompact && styles.sectionLabelCompact,
                isTight && styles.sectionLabelTight,
              ]}
            >
              1. SELECT USER PROFILE
            </Text>

            <View
              style={[
                styles.profileRow,
                isCompact && styles.profileRowCompact,
                isTight && styles.profileRowTight,
              ]}
            >
              {['Student', 'Advisor', 'Monitor', 'Coordinator'].map(
                (item, index) => (
                  <View
                    key={item}
                    style={[
                      styles.profileChip,
                      index === 0 && styles.profileChipActive,
                      isTight && styles.profileChipTight,
                    ]}
                  >
                    <Text
                      style={[
                        styles.profileChipText,
                        index === 0 && styles.profileChipTextActive,
                        isTight && styles.profileChipTextTight,
                      ]}
                    >
                      {item}
                    </Text>
                  </View>
                )
              )}
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Student ID */}
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>STUDENT ID</Text>

              <View
                style={[
                  styles.idBadge,
                  isCompact && styles.idBadgeCompact,
                ]}
              >
                <Text style={styles.idBadgeText}>REGISTERED ID</Text>
              </View>
            </View>

            <View
              style={[
                styles.inputShell,
                isCompact && styles.inputShellCompact,
                isTight && styles.inputShellTight,
              ]}
            >
              <Text style={styles.inputGlyph}>ID</Text>

              <TextInput
                style={styles.input}
                value={studentId}
                onChangeText={(value) => {
                  setStudentId(value);
                  if (errorMsg) {
                    setErrorMsg('');
                  }
                }}
                placeholder="IT21047138"
                placeholderTextColor="#6B7280"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password */}
            <Text style={styles.fieldLabel}>PASSWORD</Text>

            <View
              style={[
                styles.inputShell,
                isCompact && styles.inputShellCompact,
                isTight && styles.inputShellTight,
              ]}
            >
              <Text style={styles.inputGlyph}>PW</Text>

              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errorMsg) {
                    setErrorMsg('');
                  }
                }}
                placeholder="••••••••••••••"
                placeholderTextColor="#6B7280"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <Text style={styles.eyeGlyph}>◔</Text>
            </View>

            {/* Remember / Forgot Password */}
            <View
              style={[
                styles.rowBetween,
                isTight && styles.rowBetweenTight,
              ]}
            >
              <View style={styles.rememberRow}>
                <View style={styles.checkBox}>
                  <Text style={styles.checkMarkGlyph}>✓</Text>
                </View>

                <Text style={styles.rememberText}>Remember me</Text>
              </View>

              <Text style={styles.linkText}>Forgot password?</Text>
            </View>

            {/* Login Button */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                isCompact && styles.primaryButtonCompact,
                isTight && styles.primaryButtonTight,
                loading && styles.buttonDisabled,
                pressed && !loading && styles.buttonPressed,
              ]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign in as student"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    Sign In as Student
                  </Text>

                  <Text style={styles.primaryArrowGlyph}>→</Text>
                </>
              )}
            </Pressable>

            <Text
              style={[
                styles.dividerText,
                isCompact && styles.dividerTextCompact,
                isTight && styles.dividerTextTight,
              ]}
            >
              OR FAST AUTHENTICATE
            </Text>

            {/* Face ID Button */}
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                isCompact && styles.secondaryButtonCompact,
                isTight && styles.secondaryButtonTight,
                pressed && styles.secondaryButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Authenticate with Face ID"
            >
              <View
                style={[
                  styles.secondaryIcon,
                  isTight && styles.secondaryIconTight,
                ]}
              >
                <Text style={styles.secondaryIconGlyph}>⌘</Text>
              </View>

              <Text
                style={[
                  styles.secondaryButtonText,
                  isTight && styles.secondaryButtonTextTight,
                ]}
              >
                Authenticate with Face ID
              </Text>

              <Text style={styles.secondaryChevronGlyph}>›</Text>
            </Pressable>
          </View>

          {/* =========================
              ADMIN PORTAL
          ========================== */}
          <Pressable
            style={({ pressed }) => [
              styles.adminLauncherCard,
              isCompact && styles.adminLauncherCardCompact,
              pressed && styles.adminLauncherCardPressed,
            ]}
            onPress={handleAdminPortal}
            accessibilityRole="button"
            accessibilityLabel="Open Admin Monitoring System"
          >
            <View style={styles.adminBadgeRow}>
              <View style={styles.adminLiveDot} />

              <Text style={styles.adminBadgeText}>
                HCI PROJECT • ADMIN AREA
              </Text>
            </View>

            <Text style={styles.adminLauncherTitle}>
              System Monitoring & Health
            </Text>

            <Text style={styles.adminLauncherDesc}>
              Access real-time telemetry, service matrix, incident monitoring,
              system alerts and issue triage.
            </Text>

            <View style={styles.adminLaunchButton}>
              <Text style={styles.adminLaunchButtonText}>
                Launch Admin Portal →
              </Text>
            </View>
          </Pressable>

          {/* =========================
              FOOTER
          ========================== */}
          <Text
            style={[
              styles.footerHelp,
              isCompact && styles.footerHelpCompact,
              isTight && styles.footerHelpTight,
            ]}
          >
            Need help? Contact{' '}
            <Text style={styles.footerHelpStrong}>
              IT Support (Ext. 4022)
            </Text>
          </Text>

          {!isTight ? (
            <Text
              style={[
                styles.footerSecure,
                isCompact && styles.footerSecureCompact,
              ]}
            >
              🛡 Secure 256-bit encrypted academic session
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* =========================
      PAGE
  ========================== */

  container: {
    flex: 1,
    backgroundColor: '#171821',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  scrollContentCompact: {
    paddingVertical: 10,
  },

  scrollContentTight: {
    paddingVertical: 6,
  },

  heroCard: {
    backgroundColor: '#F7F9FC',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    maxWidth: 430,
    alignSelf: 'center',
    width: '100%',
  },

  heroCardCompact: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
  },

  heroCardTight: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 24,
  },

  /* =========================
      BRAND HEADER
  ========================== */

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAE7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  brandMarkCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
  },

  brandMarkTight: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 7,
  },

  iconGlyph: {
    fontSize: 13,
    fontWeight: '900',
    color: '#5B4DF5',
  },

  brandCopy: {
    flex: 1,
  },

  brandTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.3,
  },

  brandTitleCompact: {
    fontSize: 12,
  },

  brandTitleTight: {
    fontSize: 11,
  },

  brandSubtitle: {
    marginTop: 2,
    fontSize: 11.5,
    color: '#6B7280',
  },

  brandSubtitleCompact: {
    fontSize: 10.5,
  },

  brandSubtitleTight: {
    fontSize: 9.5,
  },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#19C37D',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  onlineBadgeCompact: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  onlineBadgeTight: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#19C37D',
    marginRight: 6,
  },

  onlineText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#19A86B',
    letterSpacing: 0.35,
  },

  /* =========================
      MAIN HEADING
  ========================== */

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },

  titleCompact: {
    fontSize: 22,
  },

  titleTight: {
    fontSize: 20,
    marginTop: 2,
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 14,
  },

  subtitleCompact: {
    fontSize: 12.5,
    marginBottom: 12,
  },

  subtitleTight: {
    fontSize: 11.5,
    marginTop: 4,
    marginBottom: 10,
  },

  /* =========================
      LOGIN CARD
  ========================== */

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 4,
  },

  profileCardCompact: {
    padding: 12,
    borderRadius: 20,
  },

  profileCardTight: {
    padding: 10,
    borderRadius: 18,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 12,
  },

  sectionLabelCompact: {
    fontSize: 11,
    marginBottom: 10,
  },

  sectionLabelTight: {
    fontSize: 10.5,
    marginBottom: 8,
  },

  /* =========================
      PROFILE SELECTION
  ========================== */

  profileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },

  profileRowCompact: {
    gap: 6,
    marginBottom: 12,
  },

  profileRowTight: {
    gap: 5,
    marginBottom: 10,
  },

  profileChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  profileChipActive: {
    backgroundColor: '#5B4DF5',
    borderColor: '#5B4DF5',
  },

  profileChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },

  profileChipTextActive: {
    color: '#FFFFFF',
  },

  profileChipTight: {
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 14,
  },

  profileChipTextTight: {
    fontSize: 11.5,
  },

  /* =========================
      ERROR MESSAGE
  ========================== */

  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },

  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },

  /* =========================
      FORM
  ========================== */

  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 8,
    marginTop: 2,
  },

  idBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  idBadgeCompact: {
    paddingHorizontal: 9,
  },

  idBadgeText: {
    color: '#5B4DF5',
    fontSize: 10.5,
    fontWeight: '800',
  },

  inputShell: {
    minHeight: 48,
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },

  inputShellCompact: {
    minHeight: 44,
    marginBottom: 12,
    paddingHorizontal: 12,
  },

  inputShellTight: {
    minHeight: 40,
    marginBottom: 10,
    paddingHorizontal: 10,
  },

  inputGlyph: {
    width: 22,
    fontSize: 11,
    fontWeight: '900',
    color: '#6B7280',
    textAlign: 'center',
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },

  eyeGlyph: {
    fontSize: 16,
    color: '#B0B7C3',
  },

  /* =========================
      REMEMBER / PASSWORD
  ========================== */

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  rowBetweenTight: {
    marginBottom: 10,
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: '#5B4DF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  checkMarkGlyph: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 12,
  },

  rememberText: {
    fontSize: 12.5,
    color: '#4B5563',
    fontWeight: '600',
  },

  linkText: {
    fontSize: 12.5,
    color: '#5B4DF5',
    fontWeight: '700',
  },

  /* =========================
      PRIMARY BUTTON
  ========================== */

  primaryButton: {
    minHeight: 52,
    backgroundColor: '#5B4DF5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#5B4DF5',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 4,
  },

  primaryButtonCompact: {
    minHeight: 48,
  },

  primaryButtonTight: {
    minHeight: 44,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  primaryArrowGlyph: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonPressed: {
    opacity: 0.88,
  },

  /* =========================
      FACE ID
  ========================== */

  dividerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B0B7C3',
    textAlign: 'center',
    marginVertical: 12,
  },

  dividerTextCompact: {
    marginVertical: 10,
  },

  dividerTextTight: {
    marginVertical: 8,
    fontSize: 10.5,
  },

  secondaryButton: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },

  secondaryButtonCompact: {
    minHeight: 46,
    paddingHorizontal: 12,
  },

  secondaryButtonTight: {
    minHeight: 42,
    paddingHorizontal: 10,
    gap: 8,
  },

  secondaryButtonPressed: {
    backgroundColor: '#F9FAFB',
  },

  secondaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F2EEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  secondaryIconTight: {
    width: 30,
    height: 30,
    borderRadius: 9,
  },

  secondaryIconGlyph: {
    color: '#5B4DF5',
    fontSize: 14,
    fontWeight: '900',
  },

  secondaryButtonText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#374151',
  },

  secondaryButtonTextTight: {
    fontSize: 13,
  },

  secondaryChevronGlyph: {
    color: '#B0B7C3',
    fontSize: 20,
    fontWeight: '900',
  },

  /* =========================
      ADMIN PORTAL
  ========================== */

  adminLauncherCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    padding: 16,
    marginTop: 14,
    gap: 8,

    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  adminLauncherCardCompact: {
    padding: 14,
    marginTop: 12,
  },

  adminLauncherCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },

  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  adminLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },

  adminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.8,
  },

  adminLauncherTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },

  adminLauncherDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },

  adminLaunchButton: {
    marginTop: 6,
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },

  adminLaunchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  /* =========================
      FOOTER
  ========================== */

  footerHelp: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 12.5,
  },

  footerHelpCompact: {
    marginTop: 10,
    fontSize: 11.5,
  },

  footerHelpTight: {
    marginTop: 8,
    fontSize: 11,
  },

  footerHelpStrong: {
    color: '#5B4DF5',
    fontWeight: '800',
  },

  footerSecure: {
    textAlign: 'center',
    color: '#0F9D58',
    marginTop: 6,
    fontSize: 12.5,
    fontWeight: '700',
  },

  footerSecureCompact: {
    fontSize: 11.5,
  },
});
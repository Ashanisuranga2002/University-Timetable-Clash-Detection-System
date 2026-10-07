import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import CoordinatorTheme from '@/constants/CoordinatorTheme';
import { useCoordinatorAuth } from '@/services/CoordinatorAuth';
import { api } from '@/services/api';
const {
  colors,
  radius,
  spacing,
  controlHeight
} = CoordinatorTheme;
const profiles = ['Student', 'Advisor', 'Monitor', 'Coordinator'];
function LineIcon({
  name,
  color = colors.muted,
  size = 20
}) {
  const stroke = Math.max(1.5, size * 0.085);
  if (name === 'person') {
    return <View style={[iconStyles.box, {
      width: size,
      height: size
    }]}>
        <View style={[iconStyles.personHead, {
        borderColor: color,
        borderWidth: stroke,
        width: size * 0.34,
        height: size * 0.34
      }]} />
        <View style={[iconStyles.personBody, {
        borderColor: color,
        borderWidth: stroke,
        width: size * 0.72,
        height: size * 0.38
      }]} />
      </View>;
  }
  if (name === 'university' || name === 'building') {
    return <View style={[iconStyles.box, {
      width: size,
      height: size
    }]}>
        <View style={[iconStyles.roof, {
        borderBottomColor: color,
        borderBottomWidth: size * 0.26,
        borderLeftWidth: size * 0.34,
        borderRightWidth: size * 0.34
      }]} />
        <View style={[iconStyles.buildingBody, {
        borderColor: color,
        borderWidth: stroke,
        width: size * 0.72,
        height: size * 0.54
      }]}>
          {[0, 1, 2].map(item => <View key={item} style={{
          width: stroke,
          height: size * 0.19,
          backgroundColor: color,
          marginHorizontal: size * 0.045
        }} />)}
        </View>
      </View>;
  }
  if (name === 'id') {
    return <View style={[iconStyles.idCard, {
      width: size,
      height: size * 0.72,
      borderColor: color,
      borderWidth: stroke,
      borderRadius: size * 0.12
    }]}>
        <View style={[iconStyles.idPhoto, {
        width: size * 0.22,
        height: size * 0.22,
        borderRadius: size,
        backgroundColor: color
      }]} />
        <View style={{
        flex: 1,
        marginLeft: size * 0.12,
        gap: size * 0.08
      }}>
          <View style={{
          width: '82%',
          height: stroke,
          backgroundColor: color,
          borderRadius: radius.pill
        }} />
          <View style={{
          width: '58%',
          height: stroke,
          backgroundColor: color,
          opacity: 0.58,
          borderRadius: radius.pill
        }} />
        </View>
      </View>;
  }
  if (name === 'lock' || name === 'shield') {
    return <View style={[iconStyles.box, {
      width: size,
      height: size
    }]}>
        <View style={[iconStyles.lockShackle, {
        width: size * 0.42,
        height: size * 0.4,
        borderColor: color,
        borderWidth: stroke,
        borderBottomWidth: 0,
        borderTopLeftRadius: size,
        borderTopRightRadius: size
      }]} />
        <View style={[iconStyles.lockBody, {
        width: size * 0.68,
        height: size * 0.46,
        borderColor: color,
        borderWidth: stroke,
        borderRadius: size * 0.12
      }]}>
          <View style={{
          width: stroke * 1.4,
          height: stroke * 1.4,
          borderRadius: radius.pill,
          backgroundColor: color
        }} />
        </View>
      </View>;
  }
  if (name === 'eye') {
    return <View style={[iconStyles.eye, {
      width: size * 0.9,
      height: size * 0.56,
      borderColor: color,
      borderWidth: stroke,
      borderRadius: size
    }]}>
        <View style={{
        width: size * 0.24,
        height: size * 0.24,
        borderColor: color,
        borderWidth: stroke,
        borderRadius: radius.pill
      }} />
      </View>;
  }
  if (name === 'check') {
    return <View style={[iconStyles.check, {
      width: size * 0.6,
      height: size * 0.35
    }]}>
        <View style={[iconStyles.checkShort, {
        backgroundColor: color,
        height: stroke * 1.3
      }]} />
        <View style={[iconStyles.checkLong, {
        backgroundColor: color,
        height: stroke * 1.3
      }]} />
      </View>;
  }
  if (name === 'fingerprint') {
    return <View style={[iconStyles.fingerprint, {
      width: size * 0.68,
      height: size * 0.78,
      borderColor: color,
      borderWidth: stroke,
      borderRadius: size
    }]} />;
  }
  return <View style={[iconStyles.box, {
    width: size,
    height: size
  }]}>
      <View style={[iconStyles.arrowStem, {
      width: size * 0.54,
      height: stroke,
      backgroundColor: color,
      borderRadius: radius.pill
    }]} />
      <View style={[iconStyles.arrowHeadTop, {
      width: size * 0.33,
      height: stroke,
      backgroundColor: color,
      borderRadius: radius.pill
    }]} />
      <View style={[iconStyles.arrowHeadBottom, {
      width: size * 0.33,
      height: stroke,
      backgroundColor: color,
      borderRadius: radius.pill
    }]} />
    </View>;
}
function ProfileSelector({
  value,
  onChange
}) {
  return <View style={styles.profileSegment} accessibilityRole="radiogroup" accessibilityLabel="Select user profile">
      {profiles.map(profile => {
      const selected = value === profile;
      return <Pressable key={profile} accessibilityRole="radio" accessibilityState={{
        selected
      }} accessibilityLabel={profile} onPress={() => onChange(profile)} style={({
        pressed
      }) => [styles.profileOption, selected && styles.profileOptionSelected, pressed && styles.pressed]}>
            <LineIcon name="person" color={selected ? colors.white : colors.muted} size={12} />
            <Text numberOfLines={1} style={[styles.profileText, selected && styles.profileTextSelected]}>{profile}</Text>
          </Pressable>;
    })}
    </View>;
}
function FieldLabel({
  children,
  badge
}) {
  return <View style={styles.labelRow}>
      <Text style={styles.fieldLabel}>{children}</Text>
      {badge ? <Text style={styles.registeredBadge}>{badge}</Text> : null}
    </View>;
}
function CoordinatorLoginScreen() {
  const [profile, setProfile] = useState('Coordinator');
  const [studentId, setStudentId] = useState('IT20601828');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [apiOnline, setApiOnline] = useState(null);
  const {
    signIn,
    message: sessionMessage,
    clearMessage
  } = useCoordinatorAuth();
  useEffect(() => {
    let active = true;
    void api.health().then(() => {
      if (active) setApiOnline(true);
    }).catch(() => {
      if (active) setApiOnline(false);
    });
    return () => {
      active = false;
    };
  }, []);
  const showMessage = message => Alert.alert('University Portal', message);
  const submitLogin = async () => {
    if (profile !== 'Coordinator') {
      setLoginError('Only coordinator accounts can access this module.');
      return;
    }
    setLoginError('');
    clearMessage();
    setSigningIn(true);
    try {
      await signIn(studentId.trim(), password, rememberMe);
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Sign in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };
  return <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.page}>
              <Text style={styles.pageHeading}>Coordinator Login</Text>

              <View style={styles.portalCard}>
                <View style={styles.brandRow}>
                  <View style={styles.brandMark}>
                    <LineIcon name="university" color={colors.blue} size={27} />
                  </View>
                  <View style={styles.brandCopy}>
                    <Text style={styles.brandTitle}>UNIVERSITY PORTAL</Text>
                    <Text style={styles.brandSubtitle}>Academic Mobility System</Text>
                  </View>
                  <View style={[styles.onlineBadge, apiOnline === false && styles.offlineBadge]}>
                    <View style={[styles.onlineDot, apiOnline === false && styles.offlineDot]} />
                    <Text style={[styles.onlineText, apiOnline === false && styles.offlineText]}>{apiOnline === null ? 'CHECKING API' : apiOnline ? 'API ONLINE' : 'API OFFLINE'}</Text>
                  </View>
                </View>

                <View style={styles.introSection}>
                  <Text style={styles.portalTitle}>Student Portal</Text>
                  <Text style={styles.portalDescription}>Sign in to access course registration, elective slots &amp; timetable</Text>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>1. SELECT USER PROFILE</Text>
                  <ProfileSelector value={profile} onChange={setProfile} />
                </View>

                <View style={styles.fieldGroup}>
                  <FieldLabel badge="REGISTERED ID">STUDENT ID</FieldLabel>
                  <View style={styles.inputShell}>
                    <LineIcon name="id" color={colors.muted} size={21} />
                    <TextInput accessibilityLabel="Student ID" value={studentId} onChangeText={setStudentId} autoCapitalize="characters" autoCorrect={false} returnKeyType="next" placeholder="Enter your student ID" placeholderTextColor={colors.muted} style={styles.input} />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <FieldLabel>PASSWORD</FieldLabel>
                  <View style={styles.inputShell}>
                    <LineIcon name="lock" color={colors.muted} size={21} />
                    <TextInput accessibilityLabel="Password" value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} autoCapitalize="none" autoCorrect={false} returnKeyType="done" placeholder="Enter your password" placeholderTextColor={colors.muted} style={styles.input} />
                    <Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'} onPress={() => setPasswordVisible(visible => !visible)} hitSlop={10} style={styles.eyeButton}>
                      <LineIcon name="eye" color={colors.muted} size={21} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.optionsRow}>
                  <Pressable accessibilityRole="checkbox" accessibilityState={{
                  checked: rememberMe
                }} accessibilityLabel="Remember me" onPress={() => setRememberMe(checked => !checked)} style={styles.rememberButton}>
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe ? <LineIcon name="check" color={colors.white} size={12} /> : null}
                    </View>
                    <Text style={styles.rememberText}>Remember Me</Text>
                  </Pressable>
                  <Pressable onPress={() => showMessage('Please contact IT Support for password assistance.')} accessibilityRole="button">
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </Pressable>
                </View>

                <Pressable accessibilityRole="button" accessibilityLabel={`Sign in as ${profile}`} onPress={() => {
                void submitLogin();
              }} disabled={signingIn} style={({
                pressed
              }) => [styles.primaryButton, pressed && styles.primaryButtonPressed, signingIn && styles.disabledButton]}>
                  {signingIn ? <ActivityIndicator color={colors.white} /> : <><Text style={styles.primaryButtonText}>Sign In as {profile}</Text><LineIcon name="arrow" color={colors.white} size={20} /></>}
                </Pressable>
                {loginError || sessionMessage ? <Text accessibilityRole="alert" style={styles.loginError}>{loginError || sessionMessage}</Text> : null}

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR FAST AUTHENTICATE</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable accessibilityRole="button" onPress={() => showMessage('Institutional SSO will be available soon.')} style={({
                pressed
              }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
                  <View style={styles.secondaryIcon}><LineIcon name="building" color={colors.primary} size={20} /></View>
                  <Text style={styles.secondaryButtonText}>Sign in with Institutional SSO</Text>
                  <LineIcon name="arrow" color={colors.muted} size={17} />
                </Pressable>

                <Pressable accessibilityRole="button" onPress={() => showMessage('Touch ID / Face ID authentication will be available soon.')} style={({
                pressed
              }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
                  <View style={styles.secondaryIcon}><LineIcon name="fingerprint" color={colors.primary} size={20} /></View>
                  <Text style={styles.secondaryButtonText}>Authenticate with Touch ID / Face ID</Text>
                  <LineIcon name="arrow" color={colors.muted} size={17} />
                </Pressable>

                <View style={styles.footer}>
                  <View style={styles.helpRow}>
                    <Text style={styles.footerText}>Need help? Contact </Text>
                    <Pressable onPress={() => showMessage('IT Support: Extension 4022')} accessibilityRole="button">
                      <Text style={styles.supportLink}>IT Support (Ext. 4022)</Text>
                    </Pressable>
                  </View>
                  <View style={styles.secureRow}>
                    <LineIcon name="shield" color={colors.green} size={15} />
                    <Text style={styles.secureText}>Coordinator sign-in protected with token authentication</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>;
}
export default CoordinatorLoginScreen;
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboardContainer: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.small,
    paddingBottom: spacing.large
  },
  page: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center'
  },
  pageHeading: {
    color: colors.blue,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.medium,
    marginLeft: 2
  },
  portalCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: radius.large,
    padding: spacing.large
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderColor: '#D8EAFE',
    borderWidth: 1,
    backgroundColor: '#F4F9FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandCopy: {
    flex: 1,
    marginLeft: spacing.medium
  },
  brandTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.55
  },
  brandSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenSurface,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginLeft: spacing.small
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.green,
    marginRight: 5
  },
  onlineText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.green,
    letterSpacing: 0.35
  },
  offlineBadge: {
    backgroundColor: colors.warningSurface
  },
  offlineDot: {
    backgroundColor: colors.warning
  },
  offlineText: {
    color: colors.warning
  },
  introSection: {
    marginTop: spacing.xlarge,
    marginBottom: spacing.xlarge
  },
  portalTitle: {
    color: colors.text,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '700',
    letterSpacing: -0.65
  },
  portalDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 330
  },
  formSection: {
    marginBottom: spacing.large
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.55,
    marginBottom: spacing.small
  },
  profileSegment: {
    width: '100%',
    flexDirection: 'row',
    borderRadius: radius.medium,
    backgroundColor: colors.surfaceSubtle,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border
  },
  profileOption: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2
  },
  profileOptionSelected: {
    backgroundColor: colors.primary
  },
  profileText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '600',
    flexShrink: 1
  },
  profileTextSelected: {
    color: colors.white
  },
  fieldGroup: {
    marginBottom: spacing.medium
  },
  labelRow: {
    minHeight: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.65
  },
  registeredBadge: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
    backgroundColor: '#F0EFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  inputShell: {
    minHeight: controlHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.medium
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 12
  },
  eyeButton: {
    minWidth: 28,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionsRow: {
    minHeight: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 1,
    marginBottom: spacing.medium
  },
  rememberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingRight: 8
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.4,
    borderColor: '#AAB3C2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  rememberText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500'
  },
  forgotText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600'
  },
  primaryButton: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.medium,
    backgroundColor: colors.primary,
    borderRadius: radius.medium
  },
  primaryButtonPressed: {
    backgroundColor: '#4038CB',
    opacity: 0.94
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700'
  },
  disabledButton: {
    opacity: 0.65
  },
  loginError: {
    color: colors.red,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.small
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginVertical: spacing.large
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border
  },
  dividerText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  secondaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.small
  },
  secondaryButtonPressed: {
    backgroundColor: colors.surfaceSubtle
  },
  secondaryIcon: {
    width: 28,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: spacing.small
  },
  footer: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
    marginTop: spacing.medium,
    paddingTop: spacing.medium
  },
  helpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    color: colors.muted,
    fontSize: 11
  },
  supportLink: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600'
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.small
  },
  secureText: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '500'
  },
  pressed: {
    opacity: 0.8
  }
});
const iconStyles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  personHead: {
    borderRadius: 999,
    marginBottom: 1
  },
  personBody: {
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomWidth: 0
  },
  roof: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid'
  },
  buildingBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 0
  },
  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3
  },
  idPhoto: {},
  lockShackle: {},
  lockBody: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -1
  },
  eye: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  check: {
    position: 'relative'
  },
  checkShort: {
    position: 'absolute',
    width: '42%',
    left: 0,
    top: '50%',
    transform: [{
      rotate: '45deg'
    }]
  },
  checkLong: {
    position: 'absolute',
    width: '66%',
    right: -1,
    top: '34%',
    transform: [{
      rotate: '-48deg'
    }]
  },
  fingerprint: {
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{
      rotate: '-14deg'
    }]
  },
  arrowStem: {},
  arrowHeadTop: {
    position: 'absolute',
    right: 1,
    top: '31%',
    transform: [{
      rotate: '45deg'
    }]
  },
  arrowHeadBottom: {
    position: 'absolute',
    right: 1,
    bottom: '31%',
    transform: [{
      rotate: '-45deg'
    }]
  }
});

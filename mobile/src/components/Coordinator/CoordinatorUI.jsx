import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import CoordinatorTheme from '@/constants/CoordinatorTheme';
const {
  colors,
  radius,
  spacing
} = CoordinatorTheme;

const ioniconMap = {
  dashboard: 'grid-outline',
  calendar: 'calendar-outline',
  validation: 'shield-checkmark-outline',
  profile: 'person-circle-outline',
  upload: 'cloud-upload-outline',
  group: 'people-outline',
  check: 'checkmark-circle-outline',
  warning: 'warning-outline',
  file: 'document-text-outline',
  sync: 'sync-outline',
  arrow: 'arrow-forward-outline',
  back: 'arrow-back-outline',
  refresh: 'refresh-outline',
  edit: 'create-outline',
  building: 'business-outline',
  clock: 'time-outline',
  download: 'download-outline',
  filter: 'options-outline',
  info: 'information-circle-outline',
  chevron: 'chevron-down-outline',
  close: 'close-outline',
  history: 'time-outline',
  shield: 'shield-outline',
  more: 'ellipsis-horizontal-outline',
  save: 'save-outline',
  trash: 'trash-outline',
};

export function CoordinatorIcon({
  name,
  color = colors.muted,
  size = 20
}) {
  const iconName = ioniconMap[name] || 'ellipse-outline';
  return <Ionicons name={iconName} size={size} color={color} />;
}

export function CoordinatorBottomNav({
  activeTab = 'Dashboard',
  onTabChange
}) {
  const tabs = ['Dashboard', 'Timetable', 'Clashes', 'Profile'];
  const tabIcons = {
    Dashboard: 'dashboard',
    Timetable: 'calendar',
    Clashes: 'warning',
    Profile: 'profile'
  };

  return (
    <View style={styles.bottomNav} accessibilityRole="tablist" accessibilityLabel="Coordinator navigation">
      {tabs.map(tab => {
        const active = tab === activeTab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${tab} tab`}
            onPress={() => {
              if (onTabChange) {
                onTabChange(tab);
              }
            }}
            style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
          >
            <CoordinatorIcon name={tabIcons[tab] || 'dashboard'} color={active ? colors.primary : colors.muted} size={20} />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CoordinatorScaffold({
  title,
  eyebrow = 'ACADEMIA REGISTRAR',
  activeTab,
  onTabChange,
  children,
  onBack,
  backLabel
}) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.pageBackground} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.topBar}>
            <View style={styles.topBarCopy}>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              {onBack && backLabel ? (
                <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} style={styles.backLink}>
                  <CoordinatorIcon name="back" color={colors.primary} size={16} />
                  <Text style={styles.backLabel}>{backLabel}</Text>
                </Pressable>
              ) : null}
              <Text style={styles.screenTitle}>{title}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open coordinator profile"
              onPress={() => {
                if (onTabChange) onTabChange('Profile');
                else router.push('/profile');
              }}
              style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
            >
              <CoordinatorIcon name="profile" color={colors.primary} size={22} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pageContent}>{children}</View>
          </ScrollView>
          <CoordinatorBottomNav activeTab={activeTab} onTabChange={onTabChange} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export function SectionHeading({
  title,
  action,
  onPress
}) {
  return <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onPress ? <Pressable onPress={onPress} accessibilityRole="button" style={({
      pressed
    }) => pressed && styles.pressed}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable> : action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>;
}
export function Panel({
  children,
  style
}) {
  return <View style={[styles.panel, style]}>{children}</View>;
}
export function StatusBadge({
  label,
  tone = 'info',
  icon
}) {
  const tones = {
    info: {
      color: colors.primary,
      bg: colors.lightPurple
    },
    success: {
      color: colors.green,
      bg: colors.greenSurface
    },
    danger: {
      color: colors.red,
      bg: colors.redSurface
    },
    warning: {
      color: colors.warning,
      bg: colors.warningSurface
    },
    neutral: {
      color: colors.muted,
      bg: colors.surfaceSubtle
    }
  };
  const style = tones[tone];
  return <View style={[styles.badge, {
    backgroundColor: style.bg
  }]}>
      {icon ? <CoordinatorIcon name={icon} color={style.color} size={12} /> : null}
      <Text style={[styles.badgeText, {
      color: style.color
    }]}>{label}</Text>
    </View>;
}
export function ActionButton({
  label,
  onPress,
  icon,
  kind = 'primary',
  disabled = false
}) {
  const kindStyles = {
    primary: {
      container: styles.buttonPrimary,
      text: styles.buttonPrimaryText,
      icon: colors.white
    },
    secondary: {
      container: styles.buttonSecondary,
      text: styles.buttonSecondaryText,
      icon: colors.primary
    },
    soft: {
      container: styles.buttonSoft,
      text: styles.buttonSoftText,
      icon: colors.primary
    },
    danger: {
      container: styles.buttonDanger,
      text: styles.buttonDangerText,
      icon: colors.red
    },
    navy: {
      container: styles.buttonNavy,
      text: styles.buttonNavyText,
      icon: colors.white
    }
  }[kind];
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{
    disabled
  }} disabled={disabled} onPress={onPress} style={({
    pressed
  }) => [styles.buttonBase, kindStyles.container, pressed && styles.pressed, disabled && styles.disabled]}>
      {icon ? <CoordinatorIcon name={icon} color={kindStyles.icon} size={18} /> : null}
      <Text style={[styles.buttonText, kindStyles.text]}>{label}</Text>
    </Pressable>;
}
export function ProgressBar({
  progress,
  color = colors.primary,
  trackColor = colors.border
}) {
  const width = `${Math.max(0, Math.min(100, progress))}%`;
  return <View accessibilityRole="progressbar" accessibilityValue={{
    min: 0,
    max: 100,
    now: progress
  }} style={[styles.progressTrack, {
    backgroundColor: trackColor
  }]}>
      <View style={[styles.progressFill, {
      width,
      backgroundColor: color
    }]} />
    </View>;
}
export function WorkflowStepper({
  currentStep
}) {
  const steps = ['Upload', 'Subgroups', 'Validate', 'Errors'];
  return <View style={styles.stepper} accessibilityLabel={`Workflow step ${currentStep} of 4`}>
      {steps.map((step, index) => {
      const number = index + 1;
      const complete = number < currentStep;
      const active = number === currentStep;
      return <View key={step} style={styles.stepItem}>
            <View style={styles.stepLineRow}>
              {index > 0 ? <View style={[styles.stepLine, number <= currentStep && styles.stepLineDone]} /> : null}
              <View style={[styles.stepDot, active && styles.stepDotActive, complete && styles.stepDotComplete]}>
                <Text style={[styles.stepNumber, (active || complete) && styles.stepNumberActive]}>{complete ? '✓' : number}</Text>
              </View>
              {index < steps.length - 1 ? <View style={[styles.stepLine, number < currentStep && styles.stepLineDone]} /> : null}
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{step}</Text>
          </View>;
    })}
    </View>;
}
export function LabeledValue({
  label,
  value,
  onPress,
  icon = 'chevron'
}) {
  const content = <>
      <View style={styles.labeledValueCopy}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.labeledValueText}>{value}</Text>
      </View>
      {onPress ? <CoordinatorIcon name={icon} color={colors.muted} size={17} /> : null}
    </>;
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={styles.labeledValue}>{content}</Pressable> : <View style={styles.labeledValue}>{content}</View>;
}
const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBackground
  },
  topBar: {
    minHeight: 84,
    paddingHorizontal: spacing.large,
    paddingTop: spacing.small,
    paddingBottom: spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  topBarCopy: {
    flex: 1,
    minWidth: 0
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.05
  },
  screenTitle: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '700',
    marginTop: 4
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.medium
  },
  backLink: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6
  },
  backLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600'
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.large
  },
  pageContent: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    gap: spacing.large
  },
  bottomNav: {
    minHeight: CoordinatorTheme.navigationHeight,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.small
  },
  navItem: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3
  },
  navLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '500'
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700'
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600'
  },
  panel: {
    width: '100%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.medium,
    padding: spacing.large
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  buttonBase: {
    minHeight: 50,
    width: '100%',
    borderRadius: radius.medium,
    paddingHorizontal: spacing.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.small,
    borderWidth: 1
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  buttonPrimaryText: {
    color: colors.white
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border
  },
  buttonSecondaryText: {
    color: colors.text
  },
  buttonSoft: {
    backgroundColor: colors.infoSurface,
    borderColor: '#DCE5FF'
  },
  buttonSoftText: {
    color: colors.primary
  },
  buttonDanger: {
    backgroundColor: colors.redSurface,
    borderColor: '#FBCBD0'
  },
  buttonDangerText: {
    color: colors.red
  },
  buttonNavy: {
    backgroundColor: colors.navySurface,
    borderColor: colors.navySurface
  },
  buttonNavyText: {
    color: colors.white
  },
  pressed: {
    opacity: 0.78
  },
  disabled: {
    opacity: 0.5
  },
  progressTrack: {
    height: 7,
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill
  },
  stepper: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: spacing.small
  },
  stepItem: {
    flex: 1,
    alignItems: 'center'
  },
  stepLineRow: {
    width: '100%',
    height: 24,
    flexDirection: 'row',
    alignItems: 'center'
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border
  },
  stepLineDone: {
    backgroundColor: colors.primary
  },
  stepDot: {
    width: 23,
    height: 23,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  stepDotComplete: {
    backgroundColor: colors.green,
    borderColor: colors.green
  },
  stepNumber: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700'
  },
  stepNumberActive: {
    color: colors.white
  },
  stepLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '500',
    marginTop: 4
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  labeledValue: {
    minHeight: 58,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.small
  },
  labeledValueCopy: {
    flex: 1,
    gap: 3
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.65
  },
  labeledValueText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600'
  }
});

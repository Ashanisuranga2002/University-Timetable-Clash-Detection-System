import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import CoordinatorTheme from '@/constants/CoordinatorTheme';
import { ActionButton, CoordinatorIcon, CoordinatorScaffold, Panel, SectionHeading, StatusBadge } from '@/components/Coordinator/CoordinatorUI';
import { useCoordinatorAuth } from '@/services/CoordinatorAuth';
const {
  colors,
  radius,
  spacing
} = CoordinatorTheme;
export default function CoordinatorProfileScreen() {
  const {
    user,
    signOut
  } = useCoordinatorAuth();
  return <CoordinatorScaffold title="Coordinator Profile" activeTab="Profile">
      <Panel style={styles.profileCard}>
        <View style={styles.avatar}><CoordinatorIcon name="profile" color={colors.primary} size={30} /></View>
        <Text style={styles.name}>{user?.name ?? 'Coordinator'}</Text>
        <Text style={styles.role}>Academic Data Coordinator</Text>
        <StatusBadge label="COORDINATOR ACCESS" tone="success" />
      </Panel>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Account Details" />
        <Panel style={styles.detailsPanel}>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>COORDINATOR ID</Text><Text style={styles.detailValue}>{user?.studentId ?? '—'}</Text></View>
          <View style={styles.divider} />
          <View style={styles.detailRow}><Text style={styles.detailLabel}>ROLE</Text><Text style={styles.detailValue}>Coordinator</Text></View>
          <View style={styles.divider} />
          <View style={styles.detailRow}><Text style={styles.detailLabel}>SESSION</Text><Text style={styles.detailValue}>Authenticated coordinator session</Text></View>
        </Panel>
      </View>

      <Panel style={styles.securityPanel}>
        <View style={styles.securityIcon}><CoordinatorIcon name="shield" color={colors.green} size={19} /></View>
        <View style={styles.securityCopy}>
          <Text style={styles.securityTitle}>Secure coordinator session</Text>
          <Text style={styles.securityText}>Your coordinator session is protected by your authenticated account.</Text>
        </View>
      </Panel>

      <ActionButton label="Return to Dashboard" icon="dashboard" kind="secondary" onPress={() => router.replace('/(tabs)/dashboard')} />
      <ActionButton label="Sign Out" icon="close" kind="danger" onPress={() => Alert.alert('Sign out', 'End the current coordinator session?', [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Sign Out',
      style: 'destructive',
      onPress: () => {
        void signOut().then(() => router.replace('/(tabs)'));
      }
    }])} />
    </CoordinatorScaffold>;
}
const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    gap: spacing.small,
    paddingVertical: spacing.xxlarge
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: radius.pill,
    backgroundColor: colors.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.small
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700'
  },
  role: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: spacing.small
  },
  sectionBlock: {
    gap: spacing.small
  },
  detailsPanel: {
    gap: spacing.medium
  },
  detailRow: {
    minHeight: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.small
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.55
  },
  detailValue: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1
  },
  divider: {
    height: 1,
    backgroundColor: colors.border
  },
  securityPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.medium,
    backgroundColor: colors.greenSurface,
    borderColor: '#D5EEE2'
  },
  securityIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  securityCopy: {
    flex: 1,
    gap: 4
  },
  securityTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700'
  },
  securityText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14
  }
});

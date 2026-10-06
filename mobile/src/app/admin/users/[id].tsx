import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AC, AR, AS } from '@/constants/adminTheme';
import { AdminUser, deleteUserApi, fetchUserByIdApi } from '@/services/api';

export default function UserDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUserByIdApi(id);
      if (res && res.data) {
        setUser(res.data);
      } else {
        setUser(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [id]);

  const handleDelete = () => {
    if (!user) return;
    Alert.alert(
      'User Management Action',
      `Choose an action for ${user.name}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          onPress: async () => {
            try {
              await deleteUserApi(user._id || user.userId, true);
              Alert.alert('Success', 'User status set to Inactive.');
              loadUser();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to deactivate user');
            }
          },
        },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserApi(user._id || user.userId, false);
              Alert.alert('Success', 'User deleted successfully.');
              router.replace('/admin/users' as any);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'System Initialized';

  return (
    <View style={styles.screen}>
      <AdminHeader title="User Profile" showBack onBack={() => router.back()} />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={AC.primary} />
          <Text style={styles.subText}>Loading user profile...</Text>
        </View>
      ) : error || !user ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>User Not Found</Text>
          <Text style={styles.subText}>{error || 'Could not find the requested user.'}</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Return to Users</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Main Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>
                {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.heroName}>{user.name}</Text>
            <Text style={styles.heroEmail}>{user.email}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{user.role}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  user.status === 'Active'
                    ? styles.statusActive
                    : user.status === 'Suspended'
                    ? styles.statusSuspended
                    : styles.statusInactive,
                ]}
              >
                <Text style={styles.statusBadgeText}>{user.status}</Text>
              </View>
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Specifications</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>User ID</Text>
              <Text style={styles.detailValue}>{user.userId}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Department</Text>
              <Text style={styles.detailValue}>{user.department}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Primary Email</Text>
              <Text style={styles.detailValue}>{user.email}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned Role</Text>
              <Text style={styles.detailValue}>{user.role}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Status</Text>
              <Text style={styles.detailValue}>{user.status}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created Date</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable
              style={styles.editBtn}
              onPress={() => router.push(`/admin/users/edit/${user._id || user.userId}` as any)}
            >
              <Text style={styles.editBtnText}>✏️ Edit User</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>🗑 Delete / Deactivate</Text>
            </Pressable>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
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
  errorIcon: { fontSize: 36 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: AC.danger },
  backBtn: {
    marginTop: 8,
    backgroundColor: AC.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: AR.button,
  },
  backBtnText: { color: '#FFF', fontWeight: '700' },
  heroCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: AC.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: AC.primary,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  heroEmail: {
    fontSize: 13,
    color: AC.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  roleBadge: {
    backgroundColor: AC.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AR.chip,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: AC.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AR.chip,
  },
  statusActive: {
    backgroundColor: AC.successLight,
  },
  statusInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusSuspended: {
    backgroundColor: AC.dangerLight,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  card: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: AC.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: AC.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: AC.borderLight,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editBtn: {
    flex: 1,
    backgroundColor: AC.primary,
    borderRadius: AR.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: AC.dangerLight,
    borderRadius: AR.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: AC.dangerText,
    fontSize: 14,
    fontWeight: '700',
  },
});

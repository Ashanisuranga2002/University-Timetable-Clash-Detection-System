import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AC, AR, AS } from '@/constants/adminTheme';
import { AdminUser, deleteUserApi, fetchUsersApi } from '@/services/api';

const ROLES = ['All', 'Student', 'Academic Advisor', 'Monitor', 'Coordinator', 'Administrator'] as const;
const STATUSES = ['All', 'Active', 'Inactive', 'Suspended'] as const;

export default function UsersListScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const loadUsers = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchUsersApi({
        search: search.trim() || undefined,
        role: selectedRole !== 'All' ? selectedRole : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      });
      if (res && res.data) {
        setUsers(res.data);
      } else if (Array.isArray(res)) {
        setUsers(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedRole, selectedStatus]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleDelete = (user: AdminUser) => {
    Alert.alert(
      'Delete or Deactivate User',
      `Choose an action for ${user.name} (${user.userId}):`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          onPress: async () => {
            try {
              await deleteUserApi(user._id || user.userId, true);
              Alert.alert('Success', 'User has been deactivated.');
              loadUsers();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to deactivate user');
            }
          },
        },
        {
          text: 'Permanent Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserApi(user._id || user.userId, false);
              Alert.alert('Success', 'User permanently deleted.');
              loadUsers();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Administrator':
        return { bg: '#FEE2E2', text: '#991B1B' };
      case 'Academic Advisor':
        return { bg: '#E0E7FF', text: '#3730A3' };
      case 'Coordinator':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'Monitor':
        return { bg: '#ECFDF5', text: '#065F46' };
      default:
        return { bg: '#F1F5F9', text: '#334155' };
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Active':
        return { bg: AC.successLight, text: AC.successText, dot: AC.success };
      case 'Inactive':
        return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
      case 'Suspended':
        return { bg: AC.dangerLight, text: AC.dangerText, dot: AC.danger };
      default:
        return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
    }
  };

  return (
    <View style={styles.screen}>
      <AdminHeader title="User Management" showBack onBack={() => router.push('/admin')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Action & Search Bar */}
        <View style={styles.topBar}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, ID, email, dept..."
              placeholderTextColor={AC.textTertiary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={loadUsers}
            />
            {search.length > 0 && (
              <Pressable onPress={() => { setSearch(''); }} hitSlop={8}>
                <Text style={styles.clearIcon}>✕</Text>
              </Pressable>
            )}
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push('/admin/users/add')}
            accessibilityRole="button"
            accessibilityLabel="Add New User"
          >
            <Text style={styles.addBtnText}>+ Add User</Text>
          </Pressable>
        </View>

        {/* Role Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>ROLE FILTER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {ROLES.map((r) => {
              const active = selectedRole === r;
              return (
                <Pressable
                  key={r}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedRole(r)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{r}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Status Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>STATUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {STATUSES.map((s) => {
              const active = selectedStatus === s;
              return (
                <Pressable
                  key={s}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedStatus(s)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{s}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* User Count Heading */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Showing <Text style={styles.countBold}>{users.length}</Text> system users
          </Text>
        </View>

        {/* Loading / Error / Empty / List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={AC.primary} />
            <Text style={styles.loadingText}>Loading system users...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Error Loading Users</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={loadUsers}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySub}>Try adjusting your search criteria or add a new user.</Text>
            <Pressable style={styles.addBtn} onPress={() => router.push('/admin/users/add')}>
              <Text style={styles.addBtnText}>+ Add First User</Text>
            </Pressable>
          </View>
        ) : (
          users.map((user) => {
            const roleBadge = getRoleBadgeStyle(user.role);
            const statusBadge = getStatusBadgeStyle(user.status);
            const targetId = user._id || user.userId;

            return (
              <Pressable
                key={targetId}
                style={styles.userCard}
                onPress={() => router.push(`/admin/users/${targetId}` as any)}
              >
                <View style={styles.userCardTop}>
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>
                      {user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userIdBadge}>ID: {user.userId}</Text>
                  </View>
                </View>

                <View style={styles.userCardMiddle}>
                  <View style={[styles.badge, { backgroundColor: roleBadge.bg }]}>
                    <Text style={[styles.badgeText, { color: roleBadge.text }]}>{user.role}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusBadge.dot }]} />
                    <Text style={[styles.badgeText, { color: statusBadge.text }]}>{user.status}</Text>
                  </View>
                  <Text style={styles.deptText} numberOfLines={1}>{user.department}</Text>
                </View>

                <View style={styles.userCardActions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => router.push(`/admin/users/${targetId}` as any)}
                  >
                    <Text style={styles.actionBtnText}>Details</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => router.push(`/admin/users/edit/${targetId}` as any)}
                  >
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(user)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AC.bgApp },
  scroll: { flex: 1 },
  content: { padding: AS.screenH, gap: 12 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AC.bgCard,
    borderRadius: AR.button,
    borderWidth: 1,
    borderColor: AC.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: AC.textPrimary,
  },
  clearIcon: { fontSize: 13, color: AC.textTertiary, paddingHorizontal: 4 },
  addBtn: {
    backgroundColor: AC.primary,
    borderRadius: AR.button,
    paddingHorizontal: 14,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterSection: { gap: 4 },
  filterSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: AC.textSecondary,
    letterSpacing: 0.6,
  },
  filterRow: { gap: 6, paddingVertical: 2 },
  filterChip: {
    backgroundColor: AC.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: AR.pill,
    borderWidth: 1,
    borderColor: AC.border,
  },
  filterChipActive: {
    backgroundColor: AC.primary,
    borderColor: AC.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AC.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  countRow: {
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    color: AC.textSecondary,
  },
  countBold: {
    fontWeight: '700',
    color: AC.textPrimary,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: AC.textSecondary,
  },
  errorIcon: { fontSize: 32 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: AC.danger },
  errorSub: { fontSize: 13, color: AC.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    backgroundColor: AC.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: AR.button,
  },
  retryBtnText: { color: '#FFF', fontWeight: '700' },
  emptyCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: AC.textPrimary },
  emptySub: { fontSize: 13, color: AC.textSecondary, textAlign: 'center', marginBottom: 8 },
  userCard: {
    backgroundColor: AC.bgCard,
    borderRadius: AR.card,
    borderWidth: 1,
    borderColor: AC.border,
    padding: AS.cardH,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AC.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: AC.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  userInfo: { flex: 1, gap: 1 },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: AC.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: AC.textSecondary,
  },
  userIdBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: AC.textTertiary,
    marginTop: 2,
  },
  userCardMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: AC.borderLight,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AR.chip,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deptText: {
    fontSize: 11,
    color: AC.textSecondary,
    marginLeft: 'auto',
  },
  userCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AC.borderLight,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: AR.chip,
    backgroundColor: AC.borderLight,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: AC.textPrimary,
  },
  deleteBtn: {
    backgroundColor: AC.dangerLight,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: AC.dangerText,
  },
});

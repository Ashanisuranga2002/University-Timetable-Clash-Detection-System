// mobile/src/app/(advisor)/dashboard.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllRequests } from '@/services/advisorService';
import { useFocusEffect } from 'expo-router';

export default function AdvisorDashboardScreen() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('PENDING');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadRequests = async () => {
    try {
      const data = await getAllRequests();
      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch (error) {
      console.warn("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  // Filter requests based on the active tab and search query
  const displayedRequests = requests.filter(req => {
    const matchesTab = req.status === activeTab;
    const matchesSearch = 
      (req.studentId?.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (req.courseCode?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });

  const pendingCount = requests.filter(req => req.status === 'PENDING').length;
  const approvedCount = requests.filter(req => req.status === 'APPROVED').length;
  const rejectedCount = requests.filter(req => req.status === 'REJECTED').length;

  const handleReviewPress = (request: any) => {
    // Navigate to the Review Request screen
    router.push({
      pathname: '/Advisor/review-request',
      params: { requestData: JSON.stringify(request) }
    });
  };

  const getInitials = (id: string) => {
    if (!id) return 'ST';
    return id.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="menu" size={28} color="#101828" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advisor Dashboard</Text>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>AD</Text>
          <View style={styles.statusDot} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        
        {/* Advisory Portal Overview Banner */}
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerTitle}>Advisory Portal Overview</Text>
            <Text style={styles.bannerSubtitle}>Resolve module clashes & student requests</Text>
          </View>
          <Ionicons name="ribbon-outline" size={24} color="#FFFFFF" />
        </View>

        {/* Summary Metric Cards */}
        <View style={styles.metricsContainer}>
          {/* Pending Card */}
          <TouchableOpacity 
            style={[styles.metricCard, activeTab === 'PENDING' && styles.metricCardActivePending]}
            onPress={() => setActiveTab('PENDING')}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>PENDING</Text>
              <Ionicons name="time" size={16} color="#DC6803" />
            </View>
            <Text style={styles.metricValue}>{pendingCount < 10 ? `0${pendingCount}` : pendingCount}</Text>
          </TouchableOpacity>

          {/* Approved Card */}
          <TouchableOpacity 
            style={[styles.metricCard, activeTab === 'APPROVED' && styles.metricCardActiveApproved]}
            onPress={() => setActiveTab('APPROVED')}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>APPROVED</Text>
              <Ionicons name="checkmark-circle" size={16} color="#039855" />
            </View>
            <Text style={styles.metricValue}>{approvedCount < 10 ? `0${approvedCount}` : approvedCount}</Text>
          </TouchableOpacity>

          {/* Rejected Card */}
          <TouchableOpacity 
            style={[styles.metricCard, activeTab === 'REJECTED' && styles.metricCardActiveRejected]}
            onPress={() => setActiveTab('REJECTED')}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>REJECTED</Text>
              <Ionicons name="close-circle" size={16} color="#D92D20" />
            </View>
            <Text style={styles.metricValue}>{rejectedCount < 10 ? `0${rejectedCount}` : rejectedCount}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#98A2B3" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Student ID or Course Code..."
            placeholderTextColor="#98A2B3"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Requests</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {displayedRequests.length} {activeTab === 'PENDING' ? 'NEW' : 'RECENT'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.filterText}>{searchQuery ? 'Clear Search' : 'Filter'}</Text>
          </TouchableOpacity>
        </View>

        {/* Requests List */}
        {loading ? (
          <ActivityIndicator size="large" color="#4A3AFF" style={{ marginTop: 40 }} />
        ) : displayedRequests.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIconCircle}>
              <Ionicons 
                name={searchQuery ? 'search-outline' : (activeTab === 'PENDING' ? 'file-tray-outline' : 'checkmark-done-circle-outline')} 
                size={32} 
                color="#4A3AFF" 
              />
            </View>
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No results found' : `No ${activeTab.toLowerCase()} requests`}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery 
                ? 'Try adjusting your search query.' 
                : "You're all caught up! New requests will appear here."}
            </Text>
          </View>
        ) : (
          displayedRequests.map((request) => (
            <View key={request._id} style={styles.requestCard}>
              
              <View style={styles.requestHeaderRow}>
                <View style={styles.studentInfo}>
                  <View style={[styles.initialsCircle, { backgroundColor: activeTab === 'PENDING' ? '#EEF2F6' : '#F9FAFB' }]}>
                    <Text style={styles.initialsText}>{getInitials(request.studentId)}</Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{request.studentId}</Text>
                    <Text style={styles.studentId}>{new Date(request.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>

                {/* Dynamic Badge based on status */}
                <View style={[
                  styles.typeBadge, 
                  activeTab === 'APPROVED' ? styles.typeBadgeApproved : 
                  activeTab === 'REJECTED' ? styles.typeBadgeRejected : {}
                ]}>
                  <Text style={[
                    styles.typeBadgeText,
                    activeTab === 'APPROVED' ? styles.typeBadgeTextApproved : 
                    activeTab === 'REJECTED' ? styles.typeBadgeTextRejected : {}
                  ]}>
                    {activeTab === 'PENDING' ? 'SUBGROUP SWAP' : activeTab}
                  </Text>
                </View>
              </View>

              <View style={styles.requestBodyRow}>
                <View style={styles.courseDetails}>
                  <Text style={styles.courseTitle}>{request.courseCode}</Text>
                  <Text style={styles.courseSubtitle}>{request.requestedGroup} • {request.conflictDetails || 'Timetable Clash'}</Text>
                </View>
                
                {/* Dynamic Button based on status */}
                <TouchableOpacity 
                  style={activeTab === 'PENDING' ? styles.primaryButton : styles.secondaryButton}
                  onPress={() => handleReviewPress(request)}
                >
                  <Text style={activeTab === 'PENDING' ? styles.primaryButtonText : styles.secondaryButtonText}>
                    {activeTab === 'PENDING' ? 'Review' : 'Details'}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF' },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2F6', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { color: '#4A3AFF', fontWeight: 'bold', fontSize: 14 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#12B76A', position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#FFFFFF' },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Banner
  banner: { backgroundColor: '#4A3AFF', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  bannerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  bannerSubtitle: { color: '#E0DFFF', fontSize: 13 },

  // Summary Metrics
  metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginHorizontal: 4, borderWidth: 1, borderColor: '#EAECF0', elevation: 1 },
  metricCardActivePending: { borderColor: '#F79009', borderWidth: 1.5 },
  metricCardActiveApproved: { borderColor: '#12B76A', borderWidth: 1.5 },
  metricCardActiveRejected: { borderColor: '#F04438', borderWidth: 1.5 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricLabel: { fontSize: 11, fontWeight: '600', color: '#667085' },
  metricValue: { fontSize: 24, fontWeight: '700', color: '#101828' },

  // Search Bar
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, borderWidth: 1, borderColor: '#EAECF0', elevation: 1 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#101828' },

  // Empty State
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyStateIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEF2F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyStateTitle: { fontSize: 16, fontWeight: '700', color: '#101828', marginBottom: 8 },
  emptyStateSubtitle: { fontSize: 14, color: '#667085', textAlign: 'center', lineHeight: 20 },

  // Section Header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#101828', marginRight: 8 },
  countBadge: { backgroundColor: '#EEF2F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { color: '#4A3AFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  filterText: { color: '#4A3AFF', fontSize: 14, fontWeight: '600' },

  // Request Cards
  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EAECF0', elevation: 1 },
  requestHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  studentInfo: { flexDirection: 'row', alignItems: 'center' },
  initialsCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  initialsText: { color: '#4A3AFF', fontWeight: 'bold', fontSize: 14 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#101828' },
  studentId: { fontSize: 13, color: '#667085', marginTop: 2 },
  
  // Badges
  typeBadge: { backgroundColor: '#FFFAEB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  typeBadgeText: { color: '#B54708', fontSize: 10, fontWeight: '700' },
  typeBadgeSecondary: { backgroundColor: '#EEF2F6' },
  typeBadgeTextSecondary: { color: '#4A3AFF' },
  typeBadgeApproved: { backgroundColor: '#ECFDF3' },
  typeBadgeTextApproved: { color: '#027A48' },
  typeBadgeRejected: { backgroundColor: '#FEF3F2' },
  typeBadgeTextRejected: { color: '#B42318' },

  // Body and Buttons
  requestBodyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  courseDetails: { flex: 1, paddingRight: 12 },
  courseTitle: { fontSize: 14, fontWeight: '600', color: '#344054', marginBottom: 4 },
  courseSubtitle: { fontSize: 12, color: '#667085' },
  
  primaryButton: { backgroundColor: '#4A3AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  secondaryButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  secondaryButtonText: { color: '#344054', fontSize: 13, fontWeight: '600' },
});
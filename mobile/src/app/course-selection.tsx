import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CourseSelectionScreen() {
  const [search, setSearch] = useState('');

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Ionicons name="school-outline" size={20} color="#FFFFFF" />
          </View>

          <Text style={styles.headerTitle}>Course Selection</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.notification}>
            <Ionicons name="notifications-outline" size={22} color="#374151" />
            <View style={styles.notificationDot} />
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={21} color="#7B8190" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search module code, name or lecturer..."
            placeholderTextColor="#8B8F9B"
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-outline" size={21} color="#7B8190" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <View style={[styles.tab, styles.activeTab]}>
            <Text style={styles.activeTabText}>All (4)</Text>
          </View>

          <View style={styles.tab}>
            <Text style={styles.tabText}>Core (2)</Text>
          </View>

          <View style={styles.tab}>
            <Text style={styles.tabText}>Electives (2)</Text>
          </View>
        </View>

        {/* Academic Load */}
        <View style={styles.loadCard}>
          <View style={styles.loadHeader}>
            <View style={styles.loadTitleRow}>
              <View style={styles.loadIcon}>
                <Ionicons
                  name="trending-up-outline"
                  size={19}
                  color="#4338CA"
                />
              </View>

              <Text style={styles.loadTitle}>Academic Load</Text>
            </View>

            <View style={styles.optimalBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.optimalText}>Optimal Load</Text>
            </View>
          </View>

          <View style={styles.creditRow}>
            <Text style={styles.creditLabel}>Enrolled Credit Ratio</Text>

            <View style={styles.creditValueRow}>
              <Text style={styles.creditValue}>16</Text>
              <Text style={styles.creditMax}> / 20 Credits</Text>
            </View>
          </View>

          <View style={styles.progressBackground}>
            <View style={styles.progressFill} />
          </View>

          <View style={styles.loadScale}>
            <Text style={styles.scaleText}>Min 12 cr</Text>
            <Text style={styles.targetText}>Target 16–18 cr</Text>
            <Text style={styles.scaleText}>Max 20 cr</Text>
          </View>
        </View>

        {/* Course 1 */}
        <View style={styles.courseCard}>
          <View style={styles.courseTopRow}>
            <View style={styles.courseMeta}>
              <View style={styles.coreBadge}>
                <Text style={styles.coreText}>CORE</Text>
              </View>

              <Text style={styles.courseCredits}>4.0 cr</Text>
            </View>

            <View style={styles.enrolledBadge}>
              <Ionicons name="checkmark" size={14} color="#059669" />
              <Text style={styles.enrolledText}>Enrolled</Text>
            </View>
          </View>

          <Text style={styles.courseTitle}>
            IT3060 Human Computer{'\n'}Interaction
          </Text>

          <Text style={styles.lecturer}>
            Prof. Diana Jenkins • Dept of Informatics
          </Text>

          <View style={styles.divider} />

          <View style={styles.scheduleRow}>
            <Ionicons name="time-outline" size={17} color="#737986" />
            <Text style={styles.scheduleText}>
              Mon 09:00 - 12:00 (Auditorium East)
            </Text>
          </View>

          <View style={styles.scheduleRow}>
            <Ionicons name="flask-outline" size={17} color="#737986" />
            <Text style={styles.scheduleText}>
              Wed 14:00 - 16:00 (Graphics Lab T-302)
            </Text>
          </View>
        </View>

        {/* Course 2 */}
        <View style={styles.courseCard}>
          <View style={styles.courseTopRow}>
            <View style={styles.courseMeta}>
              <View style={styles.coreBadge}>
                <Text style={styles.coreText}>CORE</Text>
              </View>

              <Text style={styles.courseCredits}>4.0 cr</Text>
            </View>

            <View style={styles.enrolledBadge}>
              <Ionicons name="checkmark" size={14} color="#059669" />
              <Text style={styles.enrolledText}>Enrolled</Text>
            </View>
          </View>

          <Text style={styles.courseTitle}>
            IT3040 Distributed Systems &{'\n'}Cloud
          </Text>

          <Text style={styles.lecturer}>
            Dr. Aaron Vance • Systems Engineering
          </Text>

          <View style={styles.divider} />

          <View style={styles.scheduleRow}>
            <Ionicons name="time-outline" size={17} color="#737986" />
            <Text style={styles.scheduleText}>
              Tue 10:00 - 13:00 (Turing Hall B-201)
            </Text>
          </View>
        </View>

        {/* Course 3 */}
        <View style={styles.courseCard}>
          <View style={styles.courseTopRow}>
            <View style={styles.courseMeta}>
              <View style={styles.electiveBadge}>
                <Text style={styles.electiveText}>ELECTIVE</Text>
              </View>

              <Text style={styles.courseCredits}>4.0 cr</Text>
            </View>

            <View style={styles.chooseBadge}>
              <Text style={styles.chooseText}>Choose Slot</Text>
            </View>
          </View>

          <Text style={styles.courseTitle}>
            IT3080 Machine Learning{'\n'}Applications
          </Text>

          <Text style={styles.lecturer}>
            Assoc. Prof. Elena Wu • AI Lab
          </Text>

          {/* Slot A */}
          <TouchableOpacity style={styles.selectedSlot}>
            <View style={styles.radioOuter}>
              <View style={styles.radioInner} />
            </View>

            <View style={styles.slotContent}>
              <Text style={styles.slotTitle}>Slot A: Thu 09:00 - 12:00</Text>
              <Text style={styles.slotRoom}>Robotics Center R-12</Text>
            </View>

            <View style={styles.selectedBadge}>
              <Text style={styles.selectedText}>Selected ✓</Text>
            </View>
          </TouchableOpacity>

          {/* Slot B */}
          <TouchableOpacity style={styles.conflictSlot}>
            <View style={styles.radioEmpty}>
              <View />
            </View>

            <View style={styles.slotContent}>
              <Text style={styles.slotTitle}>Slot B: Fri 10:00 - 13:00</Text>

              <View style={styles.warningRow}>
                <Ionicons
                  name="warning-outline"
                  size={14}
                  color="#DC2626"
                />

                <Text style={styles.conflictText}>
                  Conflict detected with HCI Lab
                </Text>
              </View>
            </View>

            <Ionicons name="warning-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* Course 4 */}
        <View style={styles.courseCard}>
          <View style={styles.courseTopRow}>
            <View style={styles.courseMeta}>
              <View style={styles.electiveBadge}>
                <Text style={styles.electiveText}>ELECTIVE</Text>
              </View>

              <Text style={styles.courseCredits}>4.0 cr</Text>
            </View>

            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.courseTitle}>
            IT3090 Mobile Application{'\n'}Development
          </Text>

          <Text style={styles.lecturer}>
            Lecturer Marcus Lin • Fri 14:00 - 17:00
          </Text>
        </View>

      </ScrollView>

      {/* Bottom Register Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => router.push('/review-confirm')}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.reviewButtonText}>
            Review & Confirm (3 Courses)
          </Text>

          <Ionicons
            name="arrow-forward"
            size={21}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="grid-outline" size={22} color="#5B5F6B" />
          <Text style={styles.navText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="book-outline" size={22} color="#4338CA" />
          <Text style={styles.navActiveText}>Courses</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={22} color="#5B5F6B" />
          <Text style={styles.navText}>Timetable</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <View>
            <Ionicons name="warning-outline" size={22} color="#5B5F6B" />
            <View style={styles.navNotificationDot} />
          </View>

          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },

  header: {
    height: 72,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E9F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 23,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#172033',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  notification: {
    position: 'relative',
  },

  notificationDot: {
    position: 'absolute',
    right: 0,
    top: 1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },

  avatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#E4E2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#4338CA',
    fontWeight: '700',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 175,
  },

  searchBox: {
    height: 45,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDFE8',
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 11,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
    color: '#1F2937',
  },

  tabs: {
    height: 32,
    backgroundColor: '#E3ECFF',
    borderRadius: 9,
    flexDirection: 'row',
    padding: 3,
    marginBottom: 16,
  },

  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
  },

  activeTab: {
    backgroundColor: '#4338CA',
  },

  activeTabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  tabText: {
    color: '#4B5563',
    fontSize: 12,
  },

  loadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E4EB',
    marginBottom: 12,
  },

  loadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  loadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  loadIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#EEECFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  loadTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#172033',
  },

  optimalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },

  optimalText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },

  creditRow: {
    marginTop: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  creditLabel: {
    fontSize: 12,
    color: '#4B5563',
  },

  creditValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  creditValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4338CA',
  },

  creditMax: {
    fontSize: 12,
    color: '#6B7280',
  },

  progressBackground: {
    height: 8,
    borderRadius: 5,
    backgroundColor: '#DFE8F8',
    marginTop: 8,
    overflow: 'hidden',
  },

  progressFill: {
    width: '80%',
    height: '100%',
    backgroundColor: '#4338CA',
    borderRadius: 5,
  },

  loadScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  scaleText: {
    fontSize: 10,
    color: '#737986',
  },

  targetText: {
    fontSize: 10,
    color: '#172033',
    fontWeight: '600',
  },

  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E4EB',
    padding: 15,
    marginBottom: 12,
  },

  courseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  coreBadge: {
    backgroundColor: '#EAE8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },

  coreText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '700',
  },

  electiveBadge: {
    backgroundColor: '#B9F5DD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },

  electiveText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },

  courseCredits: {
    marginLeft: 9,
    color: '#737986',
    fontSize: 13,
  },

  enrolledBadge: {
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  enrolledText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },

  chooseBadge: {
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  chooseText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '600',
  },

  courseTitle: {
    color: '#172033',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 8,
  },

  lecturer: {
    color: '#5F6470',
    fontSize: 12,
    marginTop: 6,
  },

  divider: {
    height: 1,
    backgroundColor: '#E9EBF0',
    marginVertical: 10,
  },

  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  scheduleText: {
    color: '#5F6470',
    fontSize: 11,
    marginLeft: 7,
  },

  selectedSlot: {
    borderWidth: 2,
    borderColor: '#4338CA',
    borderRadius: 9,
    padding: 9,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  conflictSlot: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF7F7',
    borderRadius: 9,
    padding: 9,
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4338CA',
  },

  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C7CBD5',
  },

  slotContent: {
    flex: 1,
    marginLeft: 8,
  },

  slotTitle: {
    color: '#172033',
    fontSize: 11,
    fontWeight: '700',
  },

  slotRoom: {
    color: '#5F6470',
    fontSize: 10,
    marginTop: 3,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  conflictText: {
    color: '#DC2626',
    fontSize: 10,
    marginLeft: 3,
  },

  selectedBadge: {
    borderWidth: 1,
    borderColor: '#C4C0FF',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  selectedText: {
    color: '#4338CA',
    fontSize: 9,
    fontWeight: '600',
  },

  addButton: {
    borderWidth: 2,
    borderColor: '#4338CA',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  addButtonText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '700',
  },

  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 62,
    backgroundColor: '#F7F8FC',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },

  reviewButton: {
    height: 44,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 62,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  navText: {
    fontSize: 9,
    color: '#5B5F6B',
    marginTop: 3,
  },

  navActiveText: {
    fontSize: 9,
    color: '#4338CA',
    fontWeight: '600',
    marginTop: 3,
  },

  navNotificationDot: {
    position: 'absolute',
    right: -1,
    top: -1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
});
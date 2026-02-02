
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Session } from '@/types/conference';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function ScheduleScreen() {
  const { sessions, loading } = useConferenceData();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { 
    scheduleNotification, 
    cancelNotification, 
    isNotificationScheduled,
    scheduledNotifications,
    loading: notificationsLoading 
  } = usePushNotifications();
  const [selectedDay, setSelectedDay] = useState<'day1' | 'day2'>('day1');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationModal, setNotificationModal] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const day1Sessions = sessions.filter(s => s.start_time.includes('2026-03-24'));
  const day2Sessions = sessions.filter(s => s.start_time.includes('2026-03-25'));

  const currentSessions = selectedDay === 'day1' ? day1Sessions : day2Sessions;

  const filteredSessions = currentSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      const hoursText = `${hours}h`;
      const minsText = `${mins}m`;
      return `${hoursText} ${minsText}`;
    }
    if (hours > 0) {
      const hoursText = `${hours}h`;
      return hoursText;
    }
    const minsText = `${minutes}m`;
    return minsText;
  };

  const handleToggleNotification = async (session: Session) => {
    const hasNotification = isNotificationScheduled(session.id);
    
    if (hasNotification) {
      // Cancel notification
      const notification = scheduledNotifications.find(n => n.sessionId === session.id);
      if (notification) {
        console.log('[Schedule] Canceling notification for session:', session.title);
        const success = await cancelNotification(notification.id);
        if (success) {
          setNotificationModal({
            visible: true,
            message: `Notification canceled for "${session.title}"`,
            type: 'success',
          });
        } else {
          setNotificationModal({
            visible: true,
            message: 'Failed to cancel notification. Please try again.',
            type: 'error',
          });
        }
      }
    } else {
      // Schedule notification (15 minutes before)
      console.log('[Schedule] Scheduling notification for session:', session.title);
      const success = await scheduleNotification(session.id, session.title, session.start_time, 15);
      if (success) {
        setNotificationModal({
          visible: true,
          message: `You'll be notified 15 minutes before "${session.title}" starts`,
          type: 'success',
        });
      } else {
        setNotificationModal({
          visible: true,
          message: 'Failed to schedule notification. Please enable notifications in your device settings.',
          type: 'error',
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol
          ios_icon_name="search"
          android_material_icon_name="search"
          size={20}
          color={colors.textSecondary}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sessions..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Day Tabs */}
      <View style={styles.dayTabs}>
        <TouchableOpacity
          style={[styles.dayTab, selectedDay === 'day1' && styles.dayTabActive]}
          onPress={() => setSelectedDay('day1')}
        >
          <Text style={[styles.dayTabText, selectedDay === 'day1' && styles.dayTabTextActive]}>
            Day 1
          </Text>
          <Text style={[styles.dayTabSubtext, selectedDay === 'day1' && styles.dayTabSubtextActive]}>
            March 24
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dayTab, selectedDay === 'day2' && styles.dayTabActive]}
          onPress={() => setSelectedDay('day2')}
        >
          <Text style={[styles.dayTabText, selectedDay === 'day2' && styles.dayTabTextActive]}>
            Day 2
          </Text>
          <Text style={[styles.dayTabSubtext, selectedDay === 'day2' && styles.dayTabSubtextActive]}>
            March 25
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sessions List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredSessions.map((session, index) => {
          const bookmarked = isBookmarked(session.id);
          const hasNotification = isNotificationScheduled(session.id);
          const typeColor = getTypeColor(session.type);
          const startTime = formatTime(session.start_time);
          const endTime = formatTime(session.end_time);
          const duration = getDuration(session.start_time, session.end_time);
          const speakerNames = session.speakers.map(s => s.name).join(', ');
          const roomName = session.room?.name || '';
          const trackName = session.track;
          
          return (
            <React.Fragment key={index}>
              <View style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionTimeContainer}>
                    <Text style={styles.sessionTime}>
                      {startTime}
                    </Text>
                    <Text style={styles.sessionTimeSeparator}>-</Text>
                    <Text style={styles.sessionTime}>
                      {endTime}
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => handleToggleNotification(session)}
                      style={styles.notificationButton}
                      disabled={notificationsLoading}
                    >
                      {notificationsLoading ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <IconSymbol
                          ios_icon_name={hasNotification ? 'notifications' : 'notifications'}
                          android_material_icon_name={hasNotification ? 'notifications' : 'notifications'}
                          size={22}
                          color={hasNotification ? colors.secondary : colors.textSecondary}
                        />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        console.log('[Schedule] Toggling bookmark for session:', session.title);
                        toggleBookmark(session.id, session.title, session.start_time);
                      }}
                      style={styles.bookmarkButton}
                    >
                      <IconSymbol
                        ios_icon_name={bookmarked ? 'favorite' : 'favorite-border'}
                        android_material_icon_name={bookmarked ? 'favorite' : 'favorite-border'}
                        size={24}
                        color={bookmarked ? colors.primary : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.sessionMeta}>
                  <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                    <Text style={styles.typeBadgeText}>{session.type}</Text>
                  </View>
                  <Text style={styles.sessionDuration}>{duration}</Text>
                </View>

                <Text style={styles.sessionTitle}>{session.title}</Text>

                {session.speakers.length > 0 && (
                  <View style={styles.speakersContainer}>
                    <IconSymbol
                      ios_icon_name="person"
                      android_material_icon_name="person"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.speakersText}>
                      {speakerNames}
                    </Text>
                  </View>
                )}

                <View style={styles.sessionFooter}>
                  <View style={styles.roomContainer}>
                    <IconSymbol
                      ios_icon_name="location"
                      android_material_icon_name="place"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.roomText}>{roomName}</Text>
                  </View>
                  {trackName && (
                    <View style={styles.trackBadge}>
                      <Text style={styles.trackText}>{trackName}</Text>
                    </View>
                  )}
                </View>
              </View>
            </React.Fragment>
          );
        })}

        {filteredSessions.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="search"
              android_material_icon_name="search"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>No sessions found</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <ConfirmModal
        visible={notificationModal.visible}
        title={notificationModal.type === 'success' ? 'Notification Set' : 'Notification Error'}
        message={notificationModal.message}
        type={notificationModal.type}
        confirmText="OK"
        onConfirm={() => setNotificationModal({ visible: false, message: '', type: 'success' })}
        onClose={() => setNotificationModal({ visible: false, message: '', type: 'success' })}
      />
    </SafeAreaView>
  );
}

function getTypeColor(type: string): string {
  const typeColors: Record<string, string> = {
    keynote: colors.primary,
    panel: colors.secondary,
    networking: '#10B981',
  };
  return typeColors[type] || colors.textSecondary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  dayTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  dayTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dayTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayTabText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  dayTabTextActive: {
    color: '#FFFFFF',
  },
  dayTabSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  dayTabSubtextActive: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sessionTimeSeparator: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    padding: 4,
  },
  bookmarkButton: {
    padding: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  sessionDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 24,
  },
  speakersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  speakersText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  trackBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.highlight,
  },
  trackText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 16,
  },
});

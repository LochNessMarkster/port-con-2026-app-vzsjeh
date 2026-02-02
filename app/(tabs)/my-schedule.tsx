
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function MyScheduleScreen() {
  const { sessions, isOffline, lastSyncTime } = useConferenceData();
  const { bookmarkedSessions, toggleBookmark } = useBookmarks();
  const { 
    scheduleNotification, 
    cancelNotification, 
    isNotificationScheduled,
    scheduledNotifications,
    sessionChanges,
    dismissSessionChange,
    loading: notificationsLoading 
  } = usePushNotifications();
  
  const [notificationModal, setNotificationModal] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [processingNotification, setProcessingNotification] = useState<string | null>(null);

  const bookmarkedSessionsList = sessions
    .filter(s => bookmarkedSessions.has(s.id))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    return `${minutes} min`;
  };

  const handleToggleNotification = async (sessionId: string, sessionTitle: string, sessionStartTime: string) => {
    setProcessingNotification(sessionId);
    
    try {
      const existingNotification = scheduledNotifications.find(n => n.sessionId === sessionId);
      
      if (existingNotification) {
        // Cancel the existing notification
        const success = await cancelNotification(existingNotification.id);
        if (success) {
          setNotificationModal({
            visible: true,
            message: 'Notification reminder removed',
            type: 'success',
          });
        } else {
          setNotificationModal({
            visible: true,
            message: 'Failed to remove notification',
            type: 'error',
          });
        }
      } else {
        // Schedule a new notification (15 minutes before)
        const success = await scheduleNotification(sessionId, sessionTitle, sessionStartTime, 15);
        if (success) {
          setNotificationModal({
            visible: true,
            message: 'You will be notified 15 minutes before this session',
            type: 'success',
          });
        } else {
          setNotificationModal({
            visible: true,
            message: 'Failed to schedule notification. Please enable notifications in settings.',
            type: 'error',
          });
        }
      }
    } catch (error) {
      console.error('[MySchedule] Error toggling notification:', error);
      setNotificationModal({
        visible: true,
        message: 'An error occurred. Please try again.',
        type: 'error',
      });
    } finally {
      setProcessingNotification(null);
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const sessionCount = bookmarkedSessionsList.length;
  const sessionCountText = `${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'} bookmarked`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header" accessibilityLevel={1}>
          My Schedule
        </Text>
        <Text style={styles.headerSubtitle} accessibilityLabel={sessionCountText}>
          {sessionCountText}
        </Text>
        {isOffline && (
          <View style={styles.offlineBanner} accessibilityRole="alert">
            <IconSymbol
              ios_icon_name="cloud-off"
              android_material_icon_name="cloud-off"
              size={16}
              color={colors.warning}
            />
            <Text style={styles.offlineBannerText}>
              Offline Mode
            </Text>
            <Text style={styles.offlineBannerSubtext}>
              Last synced: {formatLastSync()}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sessionChanges.length > 0 && (
          <View style={styles.changesSection}>
            <Text style={styles.changesSectionTitle} accessibilityRole="header" accessibilityLevel={2}>
              Session Updates
            </Text>
            {sessionChanges.map((change, index) => {
              const changeIcon = change.changeType === 'cancellation' ? 'cancel' : 
                                change.changeType === 'time_change' ? 'schedule' : 'place';
              const changeColor = change.changeType === 'cancellation' ? colors.error : colors.warning;
              
              let changeDescription = '';
              if (change.changeType === 'time_change') {
                changeDescription = `Time changed from ${change.oldValue} to ${change.newValue}`;
              } else if (change.changeType === 'room_change') {
                changeDescription = `Room changed from ${change.oldValue} to ${change.newValue}`;
              } else if (change.changeType === 'cancellation') {
                changeDescription = 'This session has been cancelled';
              }
              
              return (
                <React.Fragment key={index}>
                  <View style={[styles.changeCard, { borderLeftColor: changeColor }]} accessibilityRole="alert">
                    <View style={styles.changeHeader}>
                      <IconSymbol
                        ios_icon_name={changeIcon}
                        android_material_icon_name={changeIcon}
                        size={20}
                        color={changeColor}
                      />
                      <Text style={styles.changeTitle} numberOfLines={1}>
                        {change.sessionTitle}
                      </Text>
                      <TouchableOpacity
                        onPress={() => dismissSessionChange(change.id)}
                        style={styles.dismissButton}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss notification"
                      >
                        <IconSymbol
                          ios_icon_name="close"
                          android_material_icon_name="close"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.changeDescription}>
                      {changeDescription}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        )}

        {bookmarkedSessionsList.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="favorite"
              android_material_icon_name="favorite-border"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>No bookmarked sessions</Text>
            <Text style={styles.emptyStateText}>
              Browse the schedule and bookmark sessions you want to attend
            </Text>
          </View>
        ) : (
          <>
            {bookmarkedSessionsList.map((session, index) => {
              const isNewDay = index === 0 || 
                formatDate(session.start_time) !== formatDate(bookmarkedSessionsList[index - 1].start_time);

              return (
                <React.Fragment key={index}>
                  {isNewDay && (
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayHeaderText}>{formatDate(session.start_time)}</Text>
                    </View>
                  )}
                  <View style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionTimeContainer}>
                        <Text style={styles.sessionTime}>
                          {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </Text>
                        <Text style={styles.sessionDuration}>
                          {getDuration(session.start_time, session.end_time)}
                        </Text>
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => handleToggleNotification(session.id, session.title, session.start_time)}
                          style={styles.notificationButton}
                          disabled={processingNotification === session.id}
                          accessibilityRole="button"
                          accessibilityLabel={isNotificationScheduled(session.id) ? 'Cancel notification reminder' : 'Set notification reminder'}
                          accessibilityHint="Receive a notification 15 minutes before this session starts"
                        >
                          {processingNotification === session.id ? (
                            <ActivityIndicator size="small" color={colors.secondary} />
                          ) : (
                            <IconSymbol
                              ios_icon_name={isNotificationScheduled(session.id) ? 'notifications' : 'notifications-none'}
                              android_material_icon_name={isNotificationScheduled(session.id) ? 'notifications' : 'notifications-none'}
                              size={26}
                              color={isNotificationScheduled(session.id) ? colors.secondary : colors.textSecondary}
                            />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => toggleBookmark(session.id)}
                          style={styles.bookmarkButton}
                          accessibilityRole="button"
                          accessibilityLabel="Remove from My Schedule"
                          accessibilityHint="Remove this session from your bookmarked sessions"
                        >
                          <IconSymbol
                            ios_icon_name="favorite"
                            android_material_icon_name="favorite"
                            size={26}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(session.type) }]}>
                      <Text style={styles.typeBadgeText}>{session.type}</Text>
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
                          {session.speakers.map(s => s.name).join(', ')}
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
                        <Text style={styles.roomText}>{session.room?.name}</Text>
                      </View>
                      <View style={styles.trackBadge}>
                        <Text style={styles.trackText}>{session.track}</Text>
                      </View>
                    </View>
                  </View>
                </React.Fragment>
              );
            })}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <ConfirmModal
        visible={notificationModal.visible}
        title={notificationModal.type === 'success' ? 'Success' : 'Error'}
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
    workshop: colors.accent,
    networking: '#10B981',
    breakout: '#8B5CF6',
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
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  offlineBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  offlineBannerSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
    opacity: 0.8,
    marginLeft: 'auto',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dayHeader: {
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  dayHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionTimeContainer: {
    flex: 1,
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sessionDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  notificationButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
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
  changesSection: {
    marginBottom: 24,
  },
  changesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  changeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  changeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  changeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dismissButton: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});


import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';
import { useBookmarks } from '@/hooks/useBookmarks';

export default function MyScheduleScreen() {
  const { sessions } = useConferenceData();
  const { bookmarkedSessions, toggleBookmark } = useBookmarks();

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <Text style={styles.headerSubtitle}>
          {bookmarkedSessionsList.length} {bookmarkedSessionsList.length === 1 ? 'session' : 'sessions'} bookmarked
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                      <TouchableOpacity
                        onPress={() => toggleBookmark(session.id)}
                        style={styles.bookmarkButton}
                      >
                        <IconSymbol
                          ios_icon_name="favorite"
                          android_material_icon_name="favorite"
                          size={24}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
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
  bookmarkButton: {
    padding: 4,
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
});

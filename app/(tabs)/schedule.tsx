
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Session } from '@/types/conference';

export default function ScheduleScreen() {
  const { sessions, loading } = useConferenceData();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [selectedDay, setSelectedDay] = useState<'day1' | 'day2'>('day1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const day1Sessions = sessions.filter(s => s.start_time.includes('2026-03-24'));
  const day2Sessions = sessions.filter(s => s.start_time.includes('2026-03-25'));

  const currentSessions = selectedDay === 'day1' ? day1Sessions : day2Sessions;

  const filteredSessions = currentSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || session.type === selectedType;
    return matchesSearch && matchesType;
  });

  const sessionTypes = ['keynote', 'panel', 'workshop', 'networking', 'breakout'];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
            Day 1 - March 24
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dayTab, selectedDay === 'day2' && styles.dayTabActive]}
          onPress={() => setSelectedDay('day2')}
        >
          <Text style={[styles.dayTabText, selectedDay === 'day2' && styles.dayTabTextActive]}>
            Day 2 - March 25
          </Text>
        </TouchableOpacity>
      </View>

      {/* Type Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, !selectedType && styles.filterChipActive]}
          onPress={() => setSelectedType(null)}
        >
          <Text style={[styles.filterChipText, !selectedType && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {sessionTypes.map((type, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === type && styles.filterChipActive]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[styles.filterChipText, selectedType === type && styles.filterChipTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </ScrollView>

      {/* Sessions List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredSessions.map((session, index) => (
          <React.Fragment key={index}>
            <View style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionTimeContainer}>
                  <Text style={styles.sessionTime}>
                    {formatTime(session.start_time)} - {formatTime(session.end_time)}
                  </Text>
                  <Text style={styles.sessionDuration}>{getDuration(session.start_time, session.end_time)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleBookmark(session.id)}
                  style={styles.bookmarkButton}
                >
                  <IconSymbol
                    ios_icon_name={isBookmarked(session.id) ? 'favorite' : 'favorite-border'}
                    android_material_icon_name={isBookmarked(session.id) ? 'favorite' : 'favorite-border'}
                    size={24}
                    color={isBookmarked(session.id) ? colors.primary : colors.textSecondary}
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
        ))}

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
    borderRadius: 8,
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dayTabTextActive: {
    color: '#FFFFFF',
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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

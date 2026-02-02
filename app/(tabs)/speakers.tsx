
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';
import { apiGet } from '@/utils/api';
import { Speaker } from '@/types/conference';

export default function SpeakersScreen() {
  const router = useRouter();
  const { speakers, loading, setSpeakers } = useConferenceData();
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-fetch from Airtable on mount
  React.useEffect(() => {
    const fetchFromAirtable = async () => {
      try {
        console.log('[Speakers] Auto-fetching from Airtable...');
        const airtableSpeakers = await apiGet<Speaker[]>('/api/speakers/airtable');
        
        if (airtableSpeakers && airtableSpeakers.length > 0) {
          const validSpeakers = airtableSpeakers.filter(s => s.name && s.name.trim() !== '');
          if (validSpeakers.length > 0) {
            setSpeakers(airtableSpeakers);
            console.log('[Speakers] Auto-fetched', airtableSpeakers.length, 'speakers from Airtable');
          }
        }
      } catch (error) {
        console.error('[Speakers] Error auto-fetching from Airtable:', error);
      }
    };

    fetchFromAirtable();
  }, [setSpeakers]);

  // Sort speakers alphabetically by last name
  const sortedSpeakers = React.useMemo(() => {
    return [...speakers].sort((a, b) => {
      // Extract last name (second word in name)
      const getLastName = (name: string) => {
        const parts = name.trim().split(' ');
        return parts.length > 1 ? parts[parts.length - 1] : parts[0];
      };
      
      const lastNameA = getLastName(a.name).toLowerCase();
      const lastNameB = getLastName(b.name).toLowerCase();
      
      return lastNameA.localeCompare(lastNameB);
    });
  }, [speakers]);

  const filteredSpeakers = sortedSpeakers.filter(speaker =>
    speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    speaker.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    speaker.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Speakers</Text>
        <Text style={styles.headerSubtitle}>{speakers.length} industry experts</Text>
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
          placeholder="Search speakers..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredSpeakers.map((speaker, index) => {
          const speakingTopicDisplay = speaker.speakingTopic || '';
          
          return (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.speakerCard}
                onPress={() => router.push(`/(tabs)/speaker/${speaker.id}` as any)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: speaker.photo }}
                  style={styles.speakerPhoto}
                />
                <View style={styles.speakerInfo}>
                  <Text style={styles.speakerName}>{speaker.name}</Text>
                  <Text style={styles.speakerTitle}>{speaker.title}</Text>
                  <Text style={styles.speakerCompany}>{speaker.company}</Text>
                  {speakingTopicDisplay ? (
                    <View style={styles.topicContainer}>
                      <IconSymbol
                        ios_icon_name="mic"
                        android_material_icon_name="mic"
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={styles.topicText} numberOfLines={1}>{speakingTopicDisplay}</Text>
                    </View>
                  ) : null}
                </View>
                <IconSymbol
                  ios_icon_name="chevron-right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </React.Fragment>
          );
        })}

        {filteredSpeakers.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="search"
              android_material_icon_name="search"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>No speakers found</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  speakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  speakerPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border,
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  speakerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  speakerCompany: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  topicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
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

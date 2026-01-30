
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
  const [fetchingAirtable, setFetchingAirtable] = useState(false);
  const [airtableMessage, setAirtableMessage] = useState('');

  const filteredSpeakers = speakers.filter(speaker =>
    speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    speaker.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    speaker.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFetchFromAirtable = async () => {
    try {
      setFetchingAirtable(true);
      setAirtableMessage('Fetching latest speakers from Airtable...');
      console.log('[Speakers] Fetching from Airtable...');
      
      const airtableSpeakers = await apiGet<Speaker[]>('/api/speakers/airtable');
      
      console.log('[Speakers] Raw response:', JSON.stringify(airtableSpeakers, null, 2));
      
      if (airtableSpeakers && airtableSpeakers.length > 0) {
        // Check if speakers have valid names
        const validSpeakers = airtableSpeakers.filter(s => s.name && s.name.trim() !== '');
        const emptyNameCount = airtableSpeakers.length - validSpeakers.length;
        
        if (validSpeakers.length > 0) {
          setSpeakers(airtableSpeakers);
          const message = emptyNameCount > 0 
            ? `✓ Loaded ${validSpeakers.length} speakers (${emptyNameCount} with missing names)`
            : `✓ Loaded ${validSpeakers.length} speakers from Airtable`;
          setAirtableMessage(message);
          console.log('[Speakers] Fetched', airtableSpeakers.length, 'speakers from Airtable');
          console.log('[Speakers] Valid speakers with names:', validSpeakers.length);
        } else {
          setAirtableMessage(`⚠️ Fetched ${airtableSpeakers.length} records but all have empty names. Check Airtable field mapping.`);
          console.warn('[Speakers] All speakers have empty names. Field mapping may be incorrect.');
        }
      } else {
        setAirtableMessage('No speakers found in Airtable');
      }
    } catch (error) {
      console.error('[Speakers] Error fetching from Airtable:', error);
      setAirtableMessage(`Error: ${error instanceof Error ? error.message : 'Failed to fetch from Airtable'}`);
    } finally {
      setFetchingAirtable(false);
      setTimeout(() => setAirtableMessage(''), 8000);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Speakers</Text>
            <Text style={styles.headerSubtitle}>{speakers.length} industry experts</Text>
          </View>
          <TouchableOpacity
            style={[styles.airtableButton, fetchingAirtable && styles.airtableButtonDisabled]}
            onPress={handleFetchFromAirtable}
            disabled={fetchingAirtable}
          >
            {fetchingAirtable ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol
                ios_icon_name="arrow.triangle.2.circlepath"
                android_material_icon_name="sync"
                size={16}
                color="#fff"
              />
            )}
            <Text style={styles.airtableButtonText}>
              {fetchingAirtable ? 'Loading...' : 'Fetch from Airtable'}
            </Text>
          </TouchableOpacity>
        </View>
        {airtableMessage ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{airtableMessage}</Text>
          </View>
        ) : null}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  airtableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  airtableButtonDisabled: {
    opacity: 0.6,
  },
  airtableButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  messageContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
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

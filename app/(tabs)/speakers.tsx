
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';

export default function SpeakersScreen() {
  const router = useRouter();
  const { speakers, loading } = useConferenceData();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSpeakers = speakers.filter(speaker =>
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
        {filteredSpeakers.map((speaker, index) => (
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
                {speaker.linkedin_url && (
                  <View style={styles.linkedinContainer}>
                    <IconSymbol
                      ios_icon_name="link"
                      android_material_icon_name="link"
                      size={14}
                      color={colors.secondary}
                    />
                    <Text style={styles.linkedinText}>LinkedIn</Text>
                  </View>
                )}
              </View>
              <IconSymbol
                ios_icon_name="chevron-right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </React.Fragment>
        ))}

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
  linkedinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkedinText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
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

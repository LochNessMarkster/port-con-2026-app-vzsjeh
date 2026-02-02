
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';

export default function ExhibitorsScreen() {
  const { exhibitors, loading } = useConferenceData();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExhibitors = exhibitors.filter(exhibitor => {
    const matchesSearch = exhibitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exhibitor.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const openWebsite = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exhibitors</Text>
        <Text style={styles.headerSubtitle}>{exhibitors.length} exhibitors</Text>
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
          placeholder="Search exhibitors..."
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
        {filteredExhibitors.map((exhibitor, index) => (
          <React.Fragment key={index}>
            <View style={styles.exhibitorCard}>
              <View style={styles.exhibitorHeader}>
                <Image
                  source={{ uri: exhibitor.logo }}
                  style={styles.exhibitorLogo}
                  resizeMode="contain"
                />
                <View style={styles.boothBadge}>
                  <Text style={styles.boothBadgeText}>Booth {exhibitor.booth_number}</Text>
                </View>
              </View>

              <Text style={styles.exhibitorName}>{exhibitor.name}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{exhibitor.category}</Text>
              </View>
              <Text style={styles.exhibitorDescription}>{exhibitor.description}</Text>

              <View style={styles.exhibitorFooter}>
                {exhibitor.website && (
                  <TouchableOpacity
                    style={styles.websiteButton}
                    onPress={() => openWebsite(exhibitor.website)}
                  >
                    <IconSymbol
                      ios_icon_name="link"
                      android_material_icon_name="link"
                      size={16}
                      color={colors.secondary}
                    />
                    <Text style={styles.websiteButtonText}>Visit Website</Text>
                  </TouchableOpacity>
                )}
                {exhibitor.map_x && exhibitor.map_y && (
                  <TouchableOpacity style={styles.mapButton}>
                    <IconSymbol
                      ios_icon_name="map"
                      android_material_icon_name="map"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.mapButtonText}>View on Map</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </React.Fragment>
        ))}

        {filteredExhibitors.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="search"
              android_material_icon_name="search"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>No exhibitors found</Text>
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
  exhibitorCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exhibitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exhibitorLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  boothBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  boothBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exhibitorName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: colors.highlight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  exhibitorDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  exhibitorFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  websiteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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

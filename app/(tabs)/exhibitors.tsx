
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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';
import { useFavoriteExhibitors } from '@/hooks/useBookmarks';
import { SkeletonLoader } from '@/components/ui/ConfirmModal';

export default function ExhibitorsScreen() {
  const { exhibitors, loading, refetch, isOffline, lastSyncTime } = useConferenceData();
  const { isFavorite, toggleFavorite, loading: favoritesLoading } = useFavoriteExhibitors();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    console.log('[Exhibitors] Pull to refresh triggered');
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleToggleFavorite = async (exhibitorId: string) => {
    try {
      console.log('[Exhibitors] Toggling favorite for exhibitor:', exhibitorId);
      await toggleFavorite(exhibitorId);
    } catch (error) {
      console.error('[Exhibitors] Error toggling favorite:', error);
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

  const exhibitorCount = exhibitors.length;
  const exhibitorCountText = `${exhibitorCount} exhibitors`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header" accessibilityLevel={1}>
          Exhibitors
        </Text>
        <Text style={styles.headerSubtitle} accessibilityLabel={exhibitorCountText}>
          {exhibitorCountText}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          // Skeleton loaders
          <>
            {[1, 2, 3].map((_, index) => (
              <React.Fragment key={index}>
                <View style={styles.exhibitorCard}>
                  <View style={styles.exhibitorHeader}>
                    <SkeletonLoader width={80} height={80} borderRadius={8} />
                    <SkeletonLoader width={100} height={32} borderRadius={8} />
                  </View>
                  <SkeletonLoader width="70%" height={24} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width={80} height={24} borderRadius={12} style={{ marginBottom: 12 }} />
                  <SkeletonLoader width="100%" height={60} style={{ marginBottom: 16 }} />
                  <View style={styles.exhibitorFooter}>
                    <SkeletonLoader width={120} height={36} borderRadius={8} />
                    <SkeletonLoader width={120} height={36} borderRadius={8} />
                  </View>
                </View>
              </React.Fragment>
            ))}
          </>
        ) : (
          <>
            {filteredExhibitors.map((exhibitor, index) => {
              const favorited = isFavorite(exhibitor.id);
              
              return (
                <React.Fragment key={index}>
                  <View style={styles.exhibitorCard}>
                    <View style={styles.exhibitorHeader}>
                      <Image
                        source={{ uri: exhibitor.logo }}
                        style={styles.exhibitorLogo}
                        resizeMode="contain"
                      />
                      <View style={styles.headerRight}>
                        <View style={styles.boothBadge}>
                          <Text style={styles.boothBadgeText}>Booth {exhibitor.booth_number}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleToggleFavorite(exhibitor.id)}
                          style={styles.favoriteButton}
                          disabled={favoritesLoading}
                          accessibilityRole="button"
                          accessibilityLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}
                          accessibilityHint="Mark this exhibitor as a favorite"
                        >
                          {favoritesLoading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <IconSymbol
                              ios_icon_name={favorited ? 'favorite' : 'favorite-border'}
                              android_material_icon_name={favorited ? 'favorite' : 'favorite-border'}
                              size={26}
                              color={favorited ? colors.primary : colors.textSecondary}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.exhibitorName}>{exhibitor.name}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{exhibitor.category}</Text>
                    </View>
                    <Text style={styles.exhibitorDescription}>{exhibitor.description}</Text>

                    <View style={styles.exhibitorFooter}>
                      <TouchableOpacity
                        style={styles.visitBoothButton}
                        onPress={() => {
                          console.log('[Exhibitors] Visit Booth pressed for:', exhibitor.name);
                          // Navigate to map or booth details
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Visit booth ${exhibitor.booth_number}`}
                        accessibilityHint="Navigate to the exhibitor's booth location on the map"
                      >
                        <IconSymbol
                          ios_icon_name="store"
                          android_material_icon_name="store"
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text style={styles.visitBoothButtonText}>Visit Booth</Text>
                      </TouchableOpacity>
                      {exhibitor.website && (
                        <TouchableOpacity
                          style={styles.websiteButton}
                          onPress={() => openWebsite(exhibitor.website)}
                          accessibilityRole="button"
                          accessibilityLabel="Visit website"
                          accessibilityHint={`Open ${exhibitor.name}'s website in your browser`}
                        >
                          <IconSymbol
                            ios_icon_name="link"
                            android_material_icon_name="link"
                            size={18}
                            color={colors.secondary}
                          />
                          <Text style={styles.websiteButtonText}>Website</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </React.Fragment>
              );
            })}

            {filteredExhibitors.length === 0 && !loading && (
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
          </>
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
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
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
  favoriteButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  visitBoothButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    minHeight: 44,
  },
  visitBoothButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.secondary,
    minHeight: 44,
  },
  websiteButtonText: {
    fontSize: 14,
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

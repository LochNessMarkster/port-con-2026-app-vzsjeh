
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';
import { Session } from '@/types/conference';

export default function HomeScreen() {
  const router = useRouter();
  const { sessions, speakers, exhibitors, sponsors, loading } = useConferenceData();

  const upcomingSessions = sessions
    .filter(s => new Date(s.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3);

  // Get random featured sponsor from platinum tier
  const featuredSponsor = useMemo(() => {
    const platinumSponsors = sponsors.filter(s => s.tier === 'platinum');
    if (platinumSponsors.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * platinumSponsors.length);
    return platinumSponsors[randomIndex];
  }, [sponsors]);

  // Get random featured exhibitor
  const featuredExhibitor = useMemo(() => {
    if (exhibitors.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * exhibitors.length);
    return exhibitors[randomIndex];
  }, [exhibitors]);

  const navButtons = [
    { title: 'Schedule', icon: 'calendar-today', route: '/(tabs)/schedule', color: colors.primary },
    { title: 'Speakers', icon: 'person', route: '/(tabs)/speakers', color: colors.secondary },
    { title: 'Exhibitors', icon: 'store', route: '/(tabs)/exhibitors', color: colors.accent },
    { title: 'Sponsors', icon: 'star', route: '/(tabs)/sponsors', color: colors.primary },
    { title: 'Ports', icon: 'directions-boat', route: '/(tabs)/ports', color: colors.secondary },
    { title: 'My Schedule', icon: 'favorite', route: '/(tabs)/my-schedule', color: colors.accent },
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const openWebsite = (url: string | undefined) => {
    if (url) {
      console.log('Opening website:', url);
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <ImageBackground
          source={{ uri: 'https://portofthefutureconference.com/wp-content/uploads/2023/05/port-of-houston-1.jpg' }}
          style={styles.hero}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(174, 43, 53, 0.85)', 'rgba(15, 76, 129, 0.85)']}
            style={styles.heroOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <Image
                source={{ uri: 'https://portofthefutureconference.com/wp-content/themes/port-of-the-future/img/POFC-logo.jpg' }}
                style={styles.heroLogo}
                resizeMode="contain"
              />
              <View style={styles.heroDetails}>
                <View style={styles.heroDetailItem}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.heroDetailText}>March 24–25, 2026</Text>
                </View>
                <View style={styles.heroDetailItem}>
                  <IconSymbol
                    ios_icon_name="location"
                    android_material_icon_name="place"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.heroDetailText}>Houston, TX</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Navigation Grid */}
        <View style={styles.section}>
          <View style={styles.navGrid}>
            {navButtons.map((button, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => router.push(button.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.navIconContainer, { backgroundColor: button.color }]}>
                    <IconSymbol
                      ios_icon_name={button.icon}
                      android_material_icon_name={button.icon}
                      size={28}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.navButtonText}>{button.title}</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{sessions.length}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{speakers.length}</Text>
              <Text style={styles.statLabel}>Speakers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{exhibitors.length}</Text>
              <Text style={styles.statLabel}>Exhibitors</Text>
            </View>
          </View>
        </View>

        {/* Featured Sponsor */}
        {featuredSponsor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Sponsor</Text>
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => openWebsite(featuredSponsor.website)}
              activeOpacity={0.7}
            >
              <View style={styles.featuredHeader}>
                <Image
                  source={{ uri: featuredSponsor.logo }}
                  style={styles.featuredLogo}
                  resizeMode="contain"
                />
                <View style={[styles.tierBadge, { backgroundColor: getTierColor(featuredSponsor.tier) }]}>
                  <Text style={styles.tierBadgeText}>{featuredSponsor.tier.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.featuredName}>{featuredSponsor.name}</Text>
              <Text style={styles.featuredDescription}>{featuredSponsor.description}</Text>
              {featuredSponsor.website && (
                <View style={styles.featuredFooter}>
                  <IconSymbol
                    ios_icon_name="link"
                    android_material_icon_name="link"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.featuredWebsite}>Visit Website</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Featured Exhibitor */}
        {featuredExhibitor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Exhibitor</Text>
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => openWebsite(featuredExhibitor.website)}
              activeOpacity={0.7}
            >
              <View style={styles.featuredHeader}>
                <Image
                  source={{ uri: featuredExhibitor.logo }}
                  style={styles.featuredLogo}
                  resizeMode="contain"
                />
                <View style={[styles.categoryBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.categoryBadgeText}>{featuredExhibitor.category}</Text>
                </View>
              </View>
              <Text style={styles.featuredName}>{featuredExhibitor.name}</Text>
              <Text style={styles.featuredDescription}>{featuredExhibitor.description}</Text>
              <View style={styles.exhibitorDetails}>
                <View style={styles.exhibitorDetailItem}>
                  <IconSymbol
                    ios_icon_name="location"
                    android_material_icon_name="place"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.exhibitorDetailText}>Booth {featuredExhibitor.booth_number}</Text>
                </View>
                {featuredExhibitor.website && (
                  <View style={styles.featuredFooter}>
                    <IconSymbol
                      ios_icon_name="link"
                      android_material_icon_name="link"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.featuredWebsite}>Visit Website</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          {upcomingSessions.map((session, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.sessionCard}
                activeOpacity={0.7}
              >
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionTime}>
                    <Text style={styles.sessionTimeText}>
                      {formatTime(session.start_time)}
                    </Text>
                    <Text style={styles.sessionDate}>
                      {formatDate(session.start_time)}
                    </Text>
                  </View>
                  <View style={[styles.sessionTypeBadge, { backgroundColor: getTypeColor(session.type) }]}>
                    <Text style={styles.sessionTypeBadgeText}>{session.type}</Text>
                  </View>
                </View>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                {session.speakers.length > 0 && (
                  <Text style={styles.sessionSpeakers}>
                    {session.speakers.map(s => s.name).join(', ')}
                  </Text>
                )}
                <View style={styles.sessionFooter}>
                  <View style={styles.sessionRoom}>
                    <IconSymbol
                      ios_icon_name="location"
                      android_material_icon_name="place"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.sessionRoomText}>{session.room?.name}</Text>
                  </View>
                  <View style={[styles.trackBadge, { backgroundColor: colors.highlight }]}>
                    <Text style={styles.trackBadgeText}>{session.track}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Bottom padding for tab bar */}
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

function getTierColor(tier: string): string {
  const tierColors: Record<string, string> = {
    platinum: '#E5E7EB',
    gold: '#FCD34D',
    silver: '#D1D5DB',
    bronze: '#CD7F32',
  };
  return tierColors[tier] || colors.textSecondary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  hero: {
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroOverlay: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroLogo: {
    width: 280,
    height: 120,
    marginBottom: 20,
  },
  heroDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  heroDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroDetailText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  navButton: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  featuredCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featuredLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featuredName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredWebsite: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  exhibitorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exhibitorDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exhibitorDetailText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
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
  sessionTime: {
    flex: 1,
  },
  sessionTimeText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  sessionTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  sessionSpeakers: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionRoom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionRoomText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  trackBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
});

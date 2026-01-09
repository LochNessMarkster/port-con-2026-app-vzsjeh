
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';
import { SponsorTier } from '@/types/conference';

export default function SponsorsScreen() {
  const { sponsors, loading } = useConferenceData();

  const tierOrder: SponsorTier[] = ['platinum', 'gold', 'silver', 'bronze'];
  const tierColors: Record<SponsorTier, string> = {
    platinum: '#E5E4E2',
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
  };

  const sponsorsByTier = tierOrder.map(tier => ({
    tier,
    sponsors: sponsors
      .filter(s => s.tier === tier)
      .sort((a, b) => a.display_order - b.display_order),
  }));

  const openWebsite = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sponsors</Text>
        <Text style={styles.headerSubtitle}>Thank you to our sponsors</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sponsorsByTier.map((tierGroup, tierIndex) => {
          if (tierGroup.sponsors.length === 0) return null;

          return (
            <React.Fragment key={tierIndex}>
              <View style={styles.tierSection}>
                <View style={styles.tierHeader}>
                  <View style={[styles.tierBadge, { backgroundColor: tierColors[tierGroup.tier] }]}>
                    <Text style={[
                      styles.tierBadgeText,
                      { color: tierGroup.tier === 'gold' || tierGroup.tier === 'bronze' ? '#000000' : '#FFFFFF' }
                    ]}>
                      {tierGroup.tier.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {tierGroup.sponsors.map((sponsor, sponsorIndex) => (
                  <React.Fragment key={sponsorIndex}>
                    <View style={styles.sponsorCard}>
                      <Image
                        source={{ uri: sponsor.logo }}
                        style={styles.sponsorLogo}
                        resizeMode="contain"
                      />
                      <Text style={styles.sponsorName}>{sponsor.name}</Text>
                      <Text style={styles.sponsorDescription}>{sponsor.description}</Text>
                      {sponsor.website && (
                        <TouchableOpacity
                          style={styles.websiteButton}
                          onPress={() => openWebsite(sponsor.website)}
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
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </React.Fragment>
          );
        })}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  tierSection: {
    marginBottom: 32,
  },
  tierHeader: {
    marginBottom: 16,
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tierBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sponsorCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sponsorLogo: {
    width: 200,
    height: 100,
    marginBottom: 16,
  },
  sponsorName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  sponsorDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
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
});

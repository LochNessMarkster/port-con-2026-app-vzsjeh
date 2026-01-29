
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useConferenceData } from '@/hooks/useConferenceData';

export default function SpeakerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { speakers, sessions, loading } = useConferenceData();

  const speaker = speakers.find(s => s.id === id);
  const speakerSessions = sessions.filter(s => 
    s.speakers.some(sp => sp.id === id)
  );

  // Also try to fetch individual speaker if not found in list
  React.useEffect(() => {
    if (!loading && !speaker && id) {
      console.log('[Speaker Detail] Speaker not found in list, fetching from API...');
      // Could fetch individual speaker here if needed
      // const fetchSpeaker = async () => {
      //   try {
      //     const data = await apiGet(`/api/speakers/${id}`);
      //     // Handle individual speaker data
      //   } catch (error) {
      //     console.error('Error fetching speaker:', error);
      //   }
      // };
      // fetchSpeaker();
    }
  }, [loading, speaker, id]);

  if (!speaker) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Speaker' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Speaker not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openLinkedIn = () => {
    if (speaker.linkedin_url) {
      Linking.openURL(speaker.linkedin_url);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: speaker.name,
          headerBackTitle: 'Back',
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={{ uri: speaker.photo }}
              style={styles.photo}
            />
            <Text style={styles.name}>{speaker.name}</Text>
            <Text style={styles.title}>{speaker.title}</Text>
            <Text style={styles.company}>{speaker.company}</Text>

            {speaker.linkedin_url && (
              <TouchableOpacity
                style={styles.linkedinButton}
                onPress={openLinkedIn}
              >
                <IconSymbol
                  ios_icon_name="link"
                  android_material_icon_name="link"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.linkedinButtonText}>Connect on LinkedIn</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biography</Text>
            <Text style={styles.bio}>{speaker.bio}</Text>
          </View>

          {speakerSessions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sessions</Text>
              {speakerSessions.map((session, index) => (
                <React.Fragment key={index}>
                  <View style={styles.sessionCard}>
                    <View style={styles.sessionTime}>
                      <Text style={styles.sessionTimeText}>
                        {formatTime(session.start_time)}
                      </Text>
                      <Text style={styles.sessionDate}>
                        {formatDate(session.start_time)}
                      </Text>
                    </View>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <View style={styles.sessionFooter}>
                      <View style={styles.roomContainer}>
                        <IconSymbol
                          ios_icon_name="location"
                          android_material_icon_name="place"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.roomText}>{session.room?.name}</Text>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(session.type) }]}>
                        <Text style={styles.typeBadgeText}>{session.type}</Text>
                      </View>
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: colors.border,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  company: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  linkedinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  linkedinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  bio: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 24,
  },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionTime: {
    marginBottom: 8,
  },
  sessionTimeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 24,
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
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

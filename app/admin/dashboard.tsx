
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import ProtectedRoute from '@/components/ProtectedRoute';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

function DashboardContent() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSyncAirtable = () => {
    console.log('[Dashboard] Navigating to Airtable info');
    router.push('/admin/airtable-info' as any);
  };

  const handleSignOut = async () => {
    try {
      console.log('[Dashboard] User signing out');
      await signOut();
      router.replace('/admin/login' as any);
    } catch (error) {
      console.error('[Dashboard] Sign out error:', error);
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.text}>Admin panel is only available on web</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <IconSymbol
            ios_icon_name="exit"
            android_material_icon_name="exit-to-app"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to the Admin Panel</Text>
          <Text style={styles.welcomeText}>
            Manage conference data, sync with Airtable, and configure the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Management</Text>
          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/admin/speakers' as any)}
            >
              <IconSymbol
                ios_icon_name="person"
                android_material_icon_name="person"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>Speakers</Text>
              <Text style={styles.cardDescription}>Manage speaker profiles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/admin/sessions' as any)}
            >
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>Sessions</Text>
              <Text style={styles.cardDescription}>Manage conference sessions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/admin/exhibitors' as any)}
            >
              <IconSymbol
                ios_icon_name="store"
                android_material_icon_name="store"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>Exhibitors</Text>
              <Text style={styles.cardDescription}>Manage exhibitor booths</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/admin/sponsors' as any)}
            >
              <IconSymbol
                ios_icon_name="star"
                android_material_icon_name="star"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>Sponsors</Text>
              <Text style={styles.cardDescription}>Manage sponsor tiers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/admin/rooms' as any)}
            >
              <IconSymbol
                ios_icon_name="location"
                android_material_icon_name="place"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>Rooms</Text>
              <Text style={styles.cardDescription}>Manage venue rooms</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Airtable Integration</Text>
          <View style={styles.airtableCard}>
            <IconSymbol
              ios_icon_name="cloud"
              android_material_icon_name="cloud"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.airtableTitle}>Sync Data from Airtable</Text>
            <Text style={styles.airtableDescription}>
              Import speakers, sessions, and other conference data from your Airtable base.
            </Text>
            <View style={styles.airtableButtons}>
              <TouchableOpacity
                style={styles.airtableButton}
                onPress={handleSyncAirtable}
              >
                <IconSymbol
                  ios_icon_name="info"
                  android_material_icon_name="info"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.airtableButtonText}>View Integration Guide</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.diagnosticButton}
                onPress={() => router.push('/admin/check-airtable-fields' as any)}
              >
                <IconSymbol
                  ios_icon_name="magnifyingglass"
                  android_material_icon_name="search"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.diagnosticButtonText}>Check Field Mapping</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute redirectTo="/admin/login">
      <DashboardContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    width: 'calc(33.333% - 11px)',
    minWidth: 200,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  airtableCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  airtableTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  airtableDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  airtableButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  airtableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  airtableButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  diagnosticButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  diagnosticButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});

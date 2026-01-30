
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import ProtectedRoute from '@/components/ProtectedRoute';

function AirtableInfoContent() {
  const router = useRouter();

  const infoSections = [
    {
      title: 'What is Airtable Integration?',
      content: 'The Airtable integration allows you to sync conference data (speakers, sessions, etc.) from your Airtable database directly into the app. This ensures that any updates made in Airtable are reflected in the mobile app.',
    },
    {
      title: 'Airtable Configuration',
      content: 'Base ID: appkKjciinTlnsbkd\nTable ID: tblxn3Yie523MallN\n\nThese IDs are pre-configured in the backend and connect to your Port of the Future Conference 2026 Airtable base.',
    },
    {
      title: 'Two Ways to Access Airtable Data',
      content: '1. Admin Sync (Database): Use the "Sync to Database" button in the Admin Dashboard to permanently store speakers in the app\'s database. This is recommended for production use.\n\n2. Direct Fetch (Real-time): Users can click "Fetch from Airtable" on the Speakers page to see the latest data directly from Airtable without admin access. This is useful for testing and seeing immediate updates.',
    },
    {
      title: 'How to Sync Data to Database',
      content: '1. Navigate to the Admin Dashboard\n2. Click the "Sync to Database" button in the Airtable Integration section\n3. Wait for the sync to complete\n4. Check the success message to confirm data was synced\n5. View updated data in the app',
    },
    {
      title: 'What Data Gets Synced?',
      content: '• Speakers: Names, titles, companies, bios, photos, LinkedIn profiles\n• Field Mapping:\n  - Name → name\n  - Title → title\n  - Company → company\n  - Bio → bio\n  - Photo (attachment) → photo (first attachment URL)\n  - LinkedIn → linkedinUrl',
    },
    {
      title: 'Sync Frequency',
      content: 'You can sync data as often as needed. It\'s recommended to sync:\n• After adding new speakers or sessions in Airtable\n• Before major conference announcements\n• Daily during the week leading up to the conference\n• Immediately before the conference starts',
    },
    {
      title: 'Troubleshooting',
      content: 'If sync fails:\n• Check that your Airtable API key is configured correctly in the backend\n• Verify the Base ID and Table ID are correct\n• Ensure your Airtable fields match the expected format (Name, Title, Company, Bio, Photo, LinkedIn)\n• Check the backend logs for detailed error messages\n• Try using the "Fetch from Airtable" button on the Speakers page to test the connection\n• Contact support if issues persist',
    },
  ];

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mobileWarning}>
          <IconSymbol
            ios_icon_name="info"
            android_material_icon_name="info"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.mobileWarningTitle}>Admin Panel</Text>
          <Text style={styles.mobileWarningText}>
            The admin panel is only available on web. Please access this page from a desktop browser.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="arrow-back"
            android_material_icon_name="arrow-back"
            size={20}
            color={colors.text}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Airtable Integration Guide</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introCard}>
          <IconSymbol
            ios_icon_name="info"
            android_material_icon_name="info"
            size={32}
            color={colors.primary}
          />
          <Text style={styles.introTitle}>About Airtable Integration</Text>
          <Text style={styles.introText}>
            This guide explains how to use the Airtable integration to keep your conference data up-to-date.
          </Text>
        </View>

        {infoSections.map((section, index) => (
          <React.Fragment key={index}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          </React.Fragment>
        ))}

        <View style={styles.linkCard}>
          <Text style={styles.linkTitle}>Quick Links</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/admin/dashboard' as any)}
          >
            <IconSymbol
              ios_icon_name="home"
              android_material_icon_name="home"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.linkButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              // Open Airtable in new tab
              if (Platform.OS === 'web') {
                window.open('https://airtable.com/appkKjciinTlnsbkd/shrDhhVoXnWHC0oWj', '_blank');
              }
            }}
          >
            <IconSymbol
              ios_icon_name="link"
              android_material_icon_name="link"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.linkButtonText}>Open Airtable</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AirtableInfo() {
  return (
    <ProtectedRoute redirectTo="/admin/login">
      <AirtableInfoContent />
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  introCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  linkCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    marginTop: 8,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  mobileWarning: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  mobileWarningTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  mobileWarningText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

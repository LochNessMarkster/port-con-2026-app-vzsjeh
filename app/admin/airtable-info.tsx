
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
        <Text style={styles.headerTitle}>Airtable Configuration</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Required Airtable Columns</Text>
          <Text style={styles.text}>
            Your Airtable base must have these exact column names (case-sensitive):
          </Text>
          
          <View style={styles.columnList}>
            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>1.</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Speaker Name</Text>
                <Text style={styles.columnType}>Type: Single line text</Text>
                <Text style={styles.columnDescription}>The full name of the speaker</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>2.</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Speaker Title</Text>
                <Text style={styles.columnType}>Type: Single line text</Text>
                <Text style={styles.columnDescription}>Job title or role (e.g., "CEO", "Director of Operations")</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>3.</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Speaking Topic</Text>
                <Text style={styles.columnType}>Type: Single line text or Long text</Text>
                <Text style={styles.columnDescription}>The title or topic of their presentation</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>4.</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Synopsis of speaking topic</Text>
                <Text style={styles.columnType}>Type: Long text</Text>
                <Text style={styles.columnDescription}>A brief description or summary of the speaking topic</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>5.</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Bio</Text>
                <Text style={styles.columnType}>Type: Long text</Text>
                <Text style={styles.columnDescription}>Speaker biography or background information</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>6.</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Photo</Text>
                <Text style={styles.columnType}>Type: Attachment</Text>
                <Text style={styles.columnDescription}>Speaker headshot or profile photo (the first attachment will be used)</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Connection Details</Text>
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Base ID:</Text>
              <Text style={styles.detailValue}>appkKjciinTlnsbkd</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Table ID:</Text>
              <Text style={styles.detailValue}>tblxn3Yie523MallN</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ How to Sync</Text>
          <Text style={styles.text}>
            1. Make sure your Airtable has all the required columns listed above{'\n'}
            2. Fill in the speaker data in Airtable{'\n'}
            3. Go to the Admin Dashboard{'\n'}
            4. Click "Sync from Airtable"{'\n'}
            5. The system will fetch all records and create/update speakers in the database
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Troubleshooting</Text>
          <Text style={styles.text}>
            If the sync isn't working:{'\n'}
            {'\n'}
            1. Check that column names match EXACTLY (including spaces and capitalization){'\n'}
            2. Use the "Check Airtable Fields" tool to see what field names are being detected{'\n'}
            3. Make sure the Photo field is an Attachment type (not a URL field){'\n'}
            4. Verify that at least the "Speaker Name" field has data{'\n'}
            {'\n'}
            Common mistakes:{'\n'}
            • Using "Name" instead of "Speaker Name"{'\n'}
            • Using "Title" instead of "Speaker Title"{'\n'}
            • Using "Synopsis" instead of "Synopsis of speaking topic"{'\n'}
            • Having extra spaces in column names
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/admin/check-airtable-fields')}
          >
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={20}
              color="#fff"
            />
            <Text style={styles.primaryButtonText}>Check Field Mapping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/admin/dashboard')}
          >
            <IconSymbol
              ios_icon_name="arrow-back"
              android_material_icon_name="arrow-back"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
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
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 24,
  },
  columnList: {
    marginTop: 16,
    gap: 16,
  },
  columnItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  columnNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 24,
  },
  columnDetails: {
    flex: 1,
    gap: 4,
  },
  columnName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  columnType: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  columnDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  detailsBox: {
    marginTop: 12,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionButtons: {
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
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

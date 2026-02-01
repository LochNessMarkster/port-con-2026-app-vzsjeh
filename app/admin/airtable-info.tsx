
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authenticatedPost } from '@/utils/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

function AirtableInfoContent() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncError, setSyncError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleSyncAirtable = async () => {
    try {
      setSyncing(true);
      setSyncError('');
      setSyncResult(null);
      console.log('[Airtable Sync] Starting sync...');
      
      const result = await authenticatedPost('/api/admin/sync-airtable', {});
      console.log('[Airtable Sync] Success:', result);
      
      setSyncResult(result);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('[Airtable Sync] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync from Airtable';
      setSyncError(errorMessage);
      setShowErrorModal(true);
    } finally {
      setSyncing(false);
    }
  };

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
          <Text style={styles.sectionTitle}>🚀 Sync from Airtable</Text>
          <Text style={styles.text}>
            Click the button below to sync speakers, sponsors, and ports from your Airtable base. This will create or update records in the database.
          </Text>
          
          <TouchableOpacity
            style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
            onPress={handleSyncAirtable}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol
                ios_icon_name="cloud-download"
                android_material_icon_name="cloud-download"
                size={20}
                color="#fff"
              />
            )}
            <Text style={styles.syncButtonText}>
              {syncing ? 'Syncing...' : 'Sync from Airtable'}
            </Text>
          </TouchableOpacity>

          {syncResult && (
            <View style={styles.syncResultBox}>
              <Text style={styles.syncResultTitle}>✓ Sync Completed Successfully</Text>
              <Text style={styles.syncResultText}>
                Speakers: {syncResult.speakersCreated || 0} created, {syncResult.speakersUpdated || 0} updated
              </Text>
              {syncResult.sponsorsCreated !== undefined && (
                <Text style={styles.syncResultText}>
                  Sponsors: {syncResult.sponsorsCreated || 0} created, {syncResult.sponsorsUpdated || 0} updated
                </Text>
              )}
              {syncResult.portsCreated !== undefined && (
                <Text style={styles.syncResultText}>
                  Ports: {syncResult.portsCreated || 0} created, {syncResult.portsUpdated || 0} updated
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Speakers Table Configuration</Text>
          <Text style={styles.text}>
            Table ID: tblNp1JZk4ARZZZlT{'\n'}
            Required columns (case-sensitive):
          </Text>
          
          <View style={styles.columnList}>
            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Speaker Name</Text>
                <Text style={styles.columnType}>Type: Single line text</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Speaker Title</Text>
                <Text style={styles.columnType}>Type: Single line text</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Speaking Topic</Text>
                <Text style={styles.columnType}>Type: Single line text or Long text</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Synopsis of speaking topic</Text>
                <Text style={styles.columnType}>Type: Long text</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Bio</Text>
                <Text style={styles.columnType}>Type: Long text</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Photo</Text>
                <Text style={styles.columnType}>Type: Attachment</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏢 Sponsors Table Configuration</Text>
          <Text style={styles.text}>
            Table ID: tblgWrwRvpdcVG8sB{'\n'}
            Required columns (case-sensitive):
          </Text>
          
          <View style={styles.columnList}>
            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Sponsor Name</Text>
                <Text style={styles.columnType}>Type: Single line text</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Sponsor Level</Text>
                <Text style={styles.columnType}>Type: Single select (platinum/gold/silver/bronze)</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Sponsor Bio</Text>
                <Text style={styles.columnType}>Type: Long text</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Companylink</Text>
                <Text style={styles.columnType}>Type: URL</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>LogoGraphic</Text>
                <Text style={styles.columnType}>Type: Attachment</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚓ Ports Table Configuration</Text>
          <Text style={styles.text}>
            Table ID: tblrXosiVXKhJHYLu{'\n'}
            Required columns (case-sensitive):
          </Text>
          
          <View style={styles.columnList}>
            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Port Name</Text>
                <Text style={styles.columnType}>Type: Single line text</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Port Link</Text>
                <Text style={styles.columnType}>Type: URL</Text>
              </View>
            </View>

            <View style={styles.columnItem}>
              <Text style={styles.columnNumber}>•</Text>
              <View style={styles.columnDetails}>
                <Text style={styles.columnName}>Logo Graphic</Text>
                <Text style={styles.columnType}>Type: Attachment</Text>
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
              <Text style={styles.detailLabel}>Speakers Table:</Text>
              <Text style={styles.detailValue}>tblNp1JZk4ARZZZlT</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sponsors Table:</Text>
              <Text style={styles.detailValue}>tblgWrwRvpdcVG8sB</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ports Table:</Text>
              <Text style={styles.detailValue}>tblrXosiVXKhJHYLu</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ How to Sync</Text>
          <Text style={styles.text}>
            1. Make sure your Airtable has all the required columns listed above{'\n'}
            2. Fill in the data in Airtable (speakers, sponsors, and ports){'\n'}
            3. Click the "Sync from Airtable" button at the top of this page{'\n'}
            4. The system will fetch all records and create/update them in the database{'\n'}
            5. Check the sync results to see how many records were created or updated
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Troubleshooting</Text>
          <Text style={styles.text}>
            If the sync isn't working:{'\n'}
            {'\n'}
            1. Check that column names match EXACTLY (including spaces and capitalization){'\n'}
            2. Use the "Check Airtable Fields" tool to see what field names are being detected{'\n'}
            3. Make sure attachment fields (Photo, LogoGraphic, Logo Graphic) are Attachment type{'\n'}
            4. Verify that required fields have data (Speaker Name, Sponsor Name, Port Name){'\n'}
            5. For Sponsor Level, use lowercase: platinum, gold, silver, or bronze{'\n'}
            {'\n'}
            Common mistakes:{'\n'}
            • Using "Name" instead of "Speaker Name" or "Sponsor Name"{'\n'}
            • Using "Title" instead of "Speaker Title"{'\n'}
            • Using "Synopsis" instead of "Synopsis of speaking topic"{'\n'}
            • Using "Link" instead of "Port Link" or "Companylink"{'\n'}
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

      <ConfirmModal
        visible={showSuccessModal}
        title="Sync Successful"
        message={`Successfully synced data from Airtable!\n\nSpeakers: ${syncResult?.speakersCreated || 0} created, ${syncResult?.speakersUpdated || 0} updated\nSponsors: ${syncResult?.sponsorsCreated || 0} created, ${syncResult?.sponsorsUpdated || 0} updated\nPorts: ${syncResult?.portsCreated || 0} created, ${syncResult?.portsUpdated || 0} updated`}
        type="success"
        confirmText="OK"
        onConfirm={() => setShowSuccessModal(false)}
        onClose={() => setShowSuccessModal(false)}
      />

      <ConfirmModal
        visible={showErrorModal}
        title="Sync Failed"
        message={syncError || 'An error occurred while syncing from Airtable. Please check your configuration and try again.'}
        type="error"
        confirmText="OK"
        onConfirm={() => setShowErrorModal(false)}
        onClose={() => setShowErrorModal(false)}
      />
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
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  syncResultBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  syncResultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 8,
  },
  syncResultText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#065F46',
    marginBottom: 4,
  },
});

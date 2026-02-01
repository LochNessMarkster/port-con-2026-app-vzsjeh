
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
import { apiGet } from '@/utils/api';

function CheckAirtableFieldsContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldData, setFieldData] = useState<any>(null);
  const [error, setError] = useState('');

  const checkAirtableFields = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[Airtable Check] Fetching from Airtable...');
      
      const response = await apiGet<any[]>('/api/speakers/airtable');
      
      if (response && response.length > 0) {
        const firstRecord = response[0];
        const fieldNames = Object.keys(firstRecord);
        const sampleData = firstRecord;
        
        setFieldData({
          totalRecords: response.length,
          fieldNames,
          sampleRecord: sampleData,
          allRecords: response,
        });
        
        console.log('[Airtable Check] Field names:', fieldNames);
        console.log('[Airtable Check] Sample record:', sampleData);
      } else {
        setError('No records found in Airtable');
      }
    } catch (err) {
      console.error('[Airtable Check] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch from Airtable';
      setError(errorMessage);
    } finally {
      setLoading(false);
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
        <Text style={styles.headerTitle}>Check Airtable Field Mapping</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnostic Tool</Text>
          <Text style={styles.text}>
            Click the button below to fetch a sample record from Airtable and see exactly what field names are being used. This will help you verify that your Airtable field names match what the backend expects.
          </Text>
          
          <TouchableOpacity
            style={[styles.checkButton, loading && styles.checkButtonDisabled]}
            onPress={checkAirtableFields}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol
                ios_icon_name="magnifyingglass"
                android_material_icon_name="search"
                size={20}
                color="#fff"
              />
            )}
            <Text style={styles.checkButtonText}>
              {loading ? 'Checking...' : 'Check Airtable Fields'}
            </Text>
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {fieldData ? (
            <View style={styles.resultsBox}>
              <Text style={styles.resultsTitle}>✓ Results:</Text>
              <Text style={styles.resultsText}>
                Total Records: {fieldData.totalRecords}
              </Text>
              
              <Text style={styles.resultsSubtitle}>Field Names Found in Airtable:</Text>
              {fieldData.fieldNames.map((fieldName: string, index: number) => (
                <Text key={index} style={styles.fieldName}>• {fieldName}</Text>
              ))}
              
              <Text style={styles.resultsSubtitle}>Sample Record Data:</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>
                  {JSON.stringify(fieldData.sampleRecord, null, 2)}
                </Text>
              </View>

              <Text style={styles.resultsSubtitle}>All Records Preview (first 5):</Text>
              {fieldData.allRecords.slice(0, 5).map((record: any, index: number) => {
                const recordName = record.name || '(no name)';
                const recordId = record.id || '(no id)';
                
                return (
                  <View key={index} style={styles.recordPreview}>
                    <Text style={styles.recordText}>
                      {index + 1}. ID: {recordId}
                    </Text>
                    <Text style={styles.recordText}>
                      Name: {recordName}
                    </Text>
                  </View>
                );
              })}
              {fieldData.allRecords.length > 5 ? (
                <Text style={styles.moreText}>
                  ... and {fieldData.allRecords.length - 5} more records
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Field Mapping</Text>
          <Text style={styles.text}>
            The backend now expects these EXACT Airtable field names:
          </Text>
          <View style={styles.mappingTable}>
            <View style={styles.mappingRow}>
              <Text style={styles.mappingHeader}>Airtable Field</Text>
              <Text style={styles.mappingHeader}>Maps To</Text>
            </View>
            <View style={styles.mappingRow}>
              <Text style={styles.mappingCell}>Speaker Name</Text>
              <Text style={styles.mappingCell}>speaker.name</Text>
            </View>
            <View style={styles.mappingRow}>
              <Text style={styles.mappingCell}>Speaker Title</Text>
              <Text style={styles.mappingCell}>speaker.title</Text>
            </View>
            <View style={styles.mappingRow}>
              <Text style={styles.mappingCell}>Speaking Topic</Text>
              <Text style={styles.mappingCell}>speaker.speakingTopic</Text>
            </View>
            <View style={styles.mappingRow}>
              <Text style={styles.mappingCell}>Synopsis of speaking topic</Text>
              <Text style={styles.mappingCell}>speaker.synopsis</Text>
            </View>
            <View style={styles.mappingRow}>
              <Text style={styles.mappingCell}>Bio</Text>
              <Text style={styles.mappingCell}>speaker.bio</Text>
            </View>
            <View style={styles.mappingRow}>
              <Text style={styles.mappingCell}>Photo (attachment)</Text>
              <Text style={styles.mappingCell}>speaker.photo</Text>
            </View>
          </View>
          <Text style={[styles.text, { marginTop: 12 }]}>
            Note: The "Company" field is not used since it doesn't exist in your Airtable.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <Text style={styles.text}>
            Base ID: appkKjciinTlnsbkd{'\n'}
            Table ID: tblxn3Yie523MallN
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Verify the Mapping</Text>
          <Text style={styles.text}>
            1. Click "Check Airtable Fields" above to see your current field names{'\n'}
            2. Compare the "Field Names Found" with the "Expected Field Mapping"{'\n'}
            3. The field names should match exactly (case-sensitive){'\n'}
            {'\n'}
            Your Airtable columns should be:{'\n'}
            • Speaker Name{'\n'}
            • Speaker Title{'\n'}
            • Speaking Topic{'\n'}
            • Synopsis of speaking topic{'\n'}
            • Bio{'\n'}
            • Photo{'\n'}
            {'\n'}
            If they match, the sync should work correctly!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function CheckAirtableFields() {
  return (
    <ProtectedRoute redirectTo="/admin/login">
      <CheckAirtableFieldsContent />
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
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  checkButtonDisabled: {
    opacity: 0.6,
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  resultsBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  resultsSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 8,
    marginBottom: 4,
  },
  codeBox: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  codeText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#D4D4D4',
  },
  recordPreview: {
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  mappingTable: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mappingRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mappingHeader: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.background,
  },
  mappingCell: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
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

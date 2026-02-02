
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import ProtectedRoute from '@/components/ProtectedRoute';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedPost, authenticatedGet } from '@/utils/api';

type SyncType = 'exhibitors' | 'schedule';

interface PreviewData {
  headers: string[];
  rows: any[][];
  valid: boolean;
  errors: string[];
}

interface SyncResult {
  success: boolean;
  imported: number;
  errors: string[];
}

function GoogleSheetsSyncContent() {
  const router = useRouter();
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [syncType, setSyncType] = useState<SyncType>('exhibitors');
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState('');

  const extractSpreadsheetId = (input: string): string => {
    // Extract spreadsheet ID from URL or return as-is if already an ID
    const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const idFromUrlMatch = urlMatch ? urlMatch[1] : input;
    return idFromUrlMatch;
  };

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      setError('');
      setPreviewData(null);
      setSyncResult(null);

      const idFromUrl = extractSpreadsheetId(spreadsheetId);
      console.log('[Google Sheets] Previewing sheet:', idFromUrl, sheetName || 'Sheet1');

      const params = new URLSearchParams({
        spreadsheetId: idFromUrl,
        type: syncType,
      });
      
      if (sheetName) {
        params.append('sheetName', sheetName);
      }

      const preview = await authenticatedGet<PreviewData>(
        `/api/admin/sync/google-sheets-preview?${params.toString()}`
      );

      console.log('[Google Sheets] Preview result:', preview);
      setPreviewData(preview);

      if (!preview.valid) {
        setError(preview.errors.join(', '));
      }
    } catch (err) {
      console.error('[Google Sheets] Preview error:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview sheet');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      setError('');
      setSyncResult(null);

      const idFromUrl = extractSpreadsheetId(spreadsheetId);
      console.log('[Google Sheets] Syncing', syncType, 'from sheet:', idFromUrl);

      const endpoint = syncType === 'exhibitors' 
        ? '/api/admin/sync/google-sheets-exhibitors'
        : '/api/admin/sync/google-sheets-schedule';

      const body: any = { spreadsheetId: idFromUrl };
      if (sheetName) {
        body.sheetName = sheetName;
      }

      const result = await authenticatedPost<SyncResult>(endpoint, body);

      console.log('[Google Sheets] Sync result:', result);
      setSyncResult(result);

      if (!result.success) {
        setError(result.errors.join(', '));
      }
    } catch (err) {
      console.error('[Google Sheets] Sync error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync data');
    } finally {
      setLoading(false);
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

  const spreadsheetIdValue = spreadsheetId;
  const sheetNameValue = sheetName;
  const syncTypeValue = syncType;
  const loadingValue = loading;
  const previewingValue = previewing;
  const errorValue = error;
  const previewDataValue = previewData;
  const syncResultValue = syncResult;

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
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Google Sheets Sync</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>How to use Google Sheets Sync</Text>
            <Text style={styles.infoText}>
              1. Create a Google Sheet with your exhibitors or schedule data{'\n'}
              2. Make the sheet publicly viewable (Share → Anyone with the link can view){'\n'}
              3. Copy the spreadsheet URL or ID{'\n'}
              4. Paste it below and click Preview to validate{'\n'}
              5. Click Sync to import the data
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Configuration</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data Type</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  syncTypeValue === 'exhibitors' && styles.typeButtonActive,
                ]}
                onPress={() => setSyncType('exhibitors')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    syncTypeValue === 'exhibitors' && styles.typeButtonTextActive,
                  ]}
                >
                  Exhibitors
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  syncTypeValue === 'schedule' && styles.typeButtonActive,
                ]}
                onPress={() => setSyncType('schedule')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    syncTypeValue === 'schedule' && styles.typeButtonTextActive,
                  ]}
                >
                  Schedule
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Spreadsheet URL or ID</Text>
            <TextInput
              style={styles.input}
              placeholder="https://docs.google.com/spreadsheets/d/... or spreadsheet ID"
              placeholderTextColor={colors.textSecondary}
              value={spreadsheetIdValue}
              onChangeText={setSpreadsheetId}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              Paste the full Google Sheets URL or just the spreadsheet ID
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sheet Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Sheet1"
              placeholderTextColor={colors.textSecondary}
              value={sheetNameValue}
              onChangeText={setSheetName}
            />
            <Text style={styles.hint}>
              Leave empty to use the first sheet
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.previewButton, previewingValue && styles.buttonDisabled]}
              onPress={handlePreview}
              disabled={previewingValue || !spreadsheetIdValue}
            >
              {previewingValue ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="eye"
                    android_material_icon_name="visibility"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>Preview Data</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.syncButton, loadingValue && styles.buttonDisabled]}
              onPress={handleSync}
              disabled={loadingValue || !spreadsheetIdValue}
            >
              {loadingValue ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="sync"
                    android_material_icon_name="sync"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>Sync Data</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {errorValue ? (
          <View style={styles.errorCard}>
            <IconSymbol
              ios_icon_name="error"
              android_material_icon_name="error"
              size={24}
              color="#DC2626"
            />
            <Text style={styles.errorText}>{errorValue}</Text>
          </View>
        ) : null}

        {syncResultValue && syncResultValue.success ? (
          <View style={styles.successCard}>
            <IconSymbol
              ios_icon_name="check"
              android_material_icon_name="check-circle"
              size={24}
              color="#059669"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Sync Successful!</Text>
              <Text style={styles.successText}>
                Imported {syncResultValue.imported} {syncTypeValue} successfully.
              </Text>
              {syncResultValue.errors.length > 0 && (
                <Text style={styles.warningText}>
                  {syncResultValue.errors.length} rows had errors and were skipped.
                </Text>
              )}
            </View>
          </View>
        ) : null}

        {previewDataValue ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview (First 5 Rows)</Text>
            <View style={styles.previewCard}>
              <ScrollView horizontal>
                <View>
                  <View style={styles.previewRow}>
                    {previewDataValue.headers.map((header, index) => (
                      <View key={index} style={styles.previewHeaderCell}>
                        <Text style={styles.previewHeaderText}>{header}</Text>
                      </View>
                    ))}
                  </View>
                  {previewDataValue.rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.previewRow}>
                      {row.map((cell, cellIndex) => (
                        <View key={cellIndex} style={styles.previewCell}>
                          <Text style={styles.previewCellText}>
                            {cell !== null && cell !== undefined ? String(cell) : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Column Format</Text>
          <View style={styles.formatCard}>
            <Text style={styles.formatTitle}>
              {syncTypeValue === 'exhibitors' ? 'Exhibitors' : 'Schedule'}
            </Text>
            {syncTypeValue === 'exhibitors' ? (
              <Text style={styles.formatText}>
                • Name (required){'\n'}
                • Description{'\n'}
                • Logo URL{'\n'}
                • Booth Number{'\n'}
                • Category{'\n'}
                • Website{'\n'}
                • Map X (number){'\n'}
                • Map Y (number)
              </Text>
            ) : (
              <Text style={styles.formatText}>
                • Title (required){'\n'}
                • Description{'\n'}
                • Start Time (ISO 8601 format, e.g., 2026-03-24T10:00:00Z){'\n'}
                • End Time (ISO 8601 format){'\n'}
                • Room Name{'\n'}
                • Type (e.g., Keynote, Panel, Workshop){'\n'}
                • Track{'\n'}
                • Speaker Names (comma-separated)
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function GoogleSheetsSync() {
  return (
    <ProtectedRoute redirectTo="/admin/login">
      <GoogleSheetsSyncContent />
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
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
  infoCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1E40AF',
    lineHeight: 20,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 8,
  },
  syncButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  successCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#047857',
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#D97706',
    marginTop: 4,
  },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  previewRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  previewHeaderCell: {
    width: 150,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  previewHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  previewCell: {
    width: 150,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  previewCellText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
  },
  formatCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  formatText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

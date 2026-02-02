
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import ProtectedRoute from '@/components/ProtectedRoute';
import { IconSymbol } from '@/components/IconSymbol';
import { Exhibitor } from '@/types/conference';
import { apiGet, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import * as DocumentPicker from 'expo-document-picker';

function ExhibitorsManagementContent() {
  const router = useRouter();
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExhibitor, setEditingExhibitor] = useState<Exhibitor | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; exhibitor: Exhibitor | null }>({
    visible: false,
    exhibitor: null,
  });
  const [importResultModal, setImportResultModal] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    boothNumber: '',
    category: '',
    website: '',
    mapX: '',
    mapY: '',
  });

  useEffect(() => {
    fetchExhibitors();
  }, []);

  const fetchExhibitors = async () => {
    try {
      setLoading(true);
      console.log('[Admin] Fetching exhibitors...');
      const data = await apiGet<Exhibitor[]>('/api/exhibitors');
      setExhibitors(data);
      console.log('[Admin] Fetched', data.length, 'exhibitors');
    } catch (error) {
      console.error('[Admin] Error fetching exhibitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = async () => {
    try {
      console.log('[Admin] Opening document picker for CSV import...');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('[Admin] CSV import canceled');
        return;
      }

      const file = result.assets[0];
      console.log('[Admin] Selected file:', file.name);

      setImporting(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: 'text/csv',
      } as any);

      console.log('[Admin] Uploading CSV to backend...');
      
      // Upload CSV to backend
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BACKEND_URL, getBearerToken } = require('@/utils/api');
      const response = await fetch(`${BACKEND_URL}/api/admin/exhibitors/import-csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getBearerToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const importResult = await response.json();
      console.log('[Admin] CSV import result:', importResult);

      const errorMessages = importResult.errors && importResult.errors.length > 0 
        ? `\n\nErrors:\n${importResult.errors.join('\n')}` 
        : '';

      setImportResultModal({
        visible: true,
        message: `Successfully imported exhibitors!\n\nCreated: ${importResult.created}\nUpdated: ${importResult.updated}${errorMessages}`,
        type: importResult.errors && importResult.errors.length > 0 ? 'error' : 'success',
      });

      console.log('[Admin] CSV import initiated');
    } catch (error) {
      console.error('[Admin] Error importing CSV:', error);
      setImportResultModal({
        visible: true,
        message: error instanceof Error ? error.message : 'Failed to import CSV',
        type: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleAdd = () => {
    setEditingExhibitor(null);
    setFormData({
      name: '',
      description: '',
      logo: '',
      boothNumber: '',
      category: '',
      website: '',
      mapX: '',
      mapY: '',
    });
    setIsEditing(true);
  };

  const handleEdit = (exhibitor: Exhibitor) => {
    setEditingExhibitor(exhibitor);
    setFormData({
      name: exhibitor.name,
      description: exhibitor.description,
      logo: exhibitor.logo,
      boothNumber: exhibitor.booth_number,
      category: exhibitor.category,
      website: exhibitor.website || '',
      mapX: exhibitor.map_x?.toString() || '',
      mapY: exhibitor.map_y?.toString() || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      console.log('[Admin] Saving exhibitor...');
      const payload = {
        name: formData.name,
        description: formData.description,
        logo: formData.logo,
        boothNumber: formData.boothNumber,
        category: formData.category,
        website: formData.website || undefined,
        mapX: formData.mapX ? parseInt(formData.mapX, 10) : undefined,
        mapY: formData.mapY ? parseInt(formData.mapY, 10) : undefined,
      };

      if (editingExhibitor) {
        await authenticatedPut(`/api/admin/exhibitors/${editingExhibitor.id}`, payload);
        console.log('[Admin] Exhibitor updated');
      } else {
        await authenticatedPost('/api/admin/exhibitors', payload);
        console.log('[Admin] Exhibitor created');
      }

      setIsEditing(false);
      fetchExhibitors();
    } catch (error) {
      console.error('[Admin] Error saving exhibitor:', error);
      alert(error instanceof Error ? error.message : 'Failed to save exhibitor');
    }
  };

  const handleDelete = async (exhibitor: Exhibitor) => {
    setDeleteModal({ visible: true, exhibitor });
  };

  const confirmDelete = async () => {
    if (!deleteModal.exhibitor) return;

    try {
      console.log('[Admin] Deleting exhibitor:', deleteModal.exhibitor.id);
      await authenticatedDelete(`/api/admin/exhibitors/${deleteModal.exhibitor.id}`);
      console.log('[Admin] Exhibitor deleted');
      setDeleteModal({ visible: false, exhibitor: null });
      fetchExhibitors();
    } catch (error) {
      console.error('[Admin] Error deleting exhibitor:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete exhibitor');
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

  if (isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setIsEditing(false)}
          >
            <IconSymbol
              ios_icon_name="arrow-back"
              android_material_icon_name="arrow-back"
              size={20}
              color={colors.text}
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editingExhibitor ? 'Edit Exhibitor' : 'Add Exhibitor'}
          </Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Exhibitor name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Exhibitor description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Logo URL</Text>
            <TextInput
              style={styles.input}
              value={formData.logo}
              onChangeText={(text) => setFormData({ ...formData, logo: text })}
              placeholder="https://example.com/logo.jpg"
              placeholderTextColor={colors.textSecondary}
            />
            {formData.logo && (
              <Image source={{ uri: formData.logo }} style={styles.logoPreview} />
            )}
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Booth Number</Text>
              <TextInput
                style={styles.input}
                value={formData.boothNumber}
                onChangeText={(text) => setFormData({ ...formData, boothNumber: text })}
                placeholder="e.g., A101"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
                placeholder="e.g., Technology"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(text) => setFormData({ ...formData, website: text })}
              placeholder="https://example.com"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Map X Coordinate</Text>
              <TextInput
                style={styles.input}
                value={formData.mapX}
                onChangeText={(text) => setFormData({ ...formData, mapX: text })}
                placeholder="e.g., 100"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Map Y Coordinate</Text>
              <TextInput
                style={styles.input}
                value={formData.mapY}
                onChangeText={(text) => setFormData({ ...formData, mapY: text })}
                placeholder="e.g., 150"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>
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
        <Text style={styles.headerTitle}>Manage Exhibitors</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.importButton} 
            onPress={handleImportCSV}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="cloud-upload"
                  android_material_icon_name="cloud-upload"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.importButtonText}>Import CSV</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <IconSymbol
              ios_icon_name="add"
              android_material_icon_name="add"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.addButtonText}>Add Exhibitor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Exhibitor</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Booth</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Category</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Actions</Text>
            </View>

            {exhibitors.map((exhibitor) => (
              <View key={exhibitor.id} style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Image source={{ uri: exhibitor.logo }} style={styles.exhibitorLogo} />
                  <View>
                    <Text style={styles.exhibitorName}>{exhibitor.name}</Text>
                    <Text style={styles.exhibitorDescription} numberOfLines={1}>
                      {exhibitor.description}
                    </Text>
                  </View>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Text style={styles.tableCellText}>{exhibitor.booth_number}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{exhibitor.category}</Text>
                  </View>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(exhibitor)}
                    >
                      <IconSymbol
                        ios_icon_name="edit"
                        android_material_icon_name="edit"
                        size={18}
                        color={colors.secondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(exhibitor)}
                    >
                      <IconSymbol
                        ios_icon_name="delete"
                        android_material_icon_name="delete"
                        size={18}
                        color="#DC2626"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <ConfirmModal
        visible={deleteModal.visible}
        title="Delete Exhibitor"
        message={`Are you sure you want to delete ${deleteModal.exhibitor?.name}? This action cannot be undone.`}
        type="error"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDeleteModal({ visible: false, exhibitor: null })}
      />

      <ConfirmModal
        visible={importResultModal.visible}
        title={importResultModal.type === 'success' ? 'Import Status' : 'Import Failed'}
        message={importResultModal.message}
        type={importResultModal.type}
        confirmText="OK"
        onConfirm={() => {
          setImportResultModal({ visible: false, message: '', type: 'success' });
          if (importResultModal.type === 'success') {
            fetchExhibitors();
          }
        }}
        onClose={() => setImportResultModal({ visible: false, message: '', type: 'success' })}
      />
    </SafeAreaView>
  );
}

export default function ExhibitorsManagement() {
  return (
    <ProtectedRoute redirectTo="/admin/login">
      <ExhibitorsManagementContent />
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
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
  formContent: {
    padding: 24,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  logoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: colors.border,
  },
  tableContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tableCellText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  exhibitorLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  exhibitorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  exhibitorDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.highlight,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
});

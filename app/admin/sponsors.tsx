
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useConferenceData } from '@/hooks/useConferenceData';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

function SponsorsManagementContent() {
  const router = useRouter();
  const { sponsors, refetch } = useConferenceData();

  const [isEditing, setIsEditing] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; sponsor: any | null }>({
    visible: false,
    sponsor: null,
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tier: 'gold' as 'platinum' | 'gold' | 'silver' | 'bronze',
    logo: '',
    website: '',
    displayOrder: '',
  });

  const handleAdd = () => {
    console.log('[Admin] Add sponsor');
    setEditingSponsor(null);
    setFormData({
      name: '',
      description: '',
      tier: 'gold',
      logo: '',
      website: '',
      displayOrder: '',
    });
    setIsEditing(true);
  };

  const handleEdit = (sponsor: any) => {
    console.log('[Admin] Edit sponsor:', sponsor.id);
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      description: sponsor.description,
      tier: sponsor.tier,
      logo: sponsor.logo,
      website: sponsor.website || '',
      displayOrder: sponsor.display_order.toString(),
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      console.log('[Admin] Saving sponsor...');
      const { authenticatedPost, authenticatedPut } = await import('@/utils/api');
      const payload = {
        name: formData.name,
        description: formData.description,
        tier: formData.tier,
        logo: formData.logo,
        website: formData.website || undefined,
        displayOrder: parseInt(formData.displayOrder, 10),
      };

      if (editingSponsor) {
        await authenticatedPut(`/api/admin/sponsors/${editingSponsor.id}`, payload);
        console.log('[Admin] Sponsor updated');
      } else {
        await authenticatedPost('/api/admin/sponsors', payload);
        console.log('[Admin] Sponsor created');
      }

      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error('[Admin] Error saving sponsor:', error);
      alert(error instanceof Error ? error.message : 'Failed to save sponsor');
    }
  };

  const handleDelete = (sponsor: any) => {
    console.log('[Admin] Delete sponsor:', sponsor.id);
    setDeleteModal({ visible: true, sponsor });
  };

  const confirmDelete = async () => {
    if (!deleteModal.sponsor) return;

    try {
      console.log('[Admin] Deleting sponsor:', deleteModal.sponsor.id);
      const { authenticatedDelete } = await import('@/utils/api');
      await authenticatedDelete(`/api/admin/sponsors/${deleteModal.sponsor.id}`);
      console.log('[Admin] Sponsor deleted');
      setDeleteModal({ visible: false, sponsor: null });
      refetch();
    } catch (error) {
      console.error('[Admin] Error deleting sponsor:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete sponsor');
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mobileWarning}>
          <Text style={styles.mobileWarningText}>
            Admin panel is only available on web
          </Text>
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
            {editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}
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
              placeholder="Sponsor name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Sponsor description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tier *</Text>
            <View style={styles.tierOptions}>
              {['platinum', 'gold', 'silver', 'bronze'].map((tier) => (
                <TouchableOpacity
                  key={tier}
                  style={[
                    styles.tierOption,
                    formData.tier === tier && styles.tierOptionActive,
                    { backgroundColor: getTierColor(tier) },
                  ]}
                  onPress={() => setFormData({ ...formData, tier: tier as any })}
                >
                  <Text
                    style={[
                      styles.tierOptionText,
                      formData.tier === tier && styles.tierOptionTextActive,
                    ]}
                  >
                    {tier.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Display Order</Text>
            <TextInput
              style={styles.input}
              value={formData.displayOrder}
              onChangeText={(text) => setFormData({ ...formData, displayOrder: text })}
              placeholder="e.g., 1"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
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
        <Text style={styles.headerTitle}>Manage Sponsors</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <IconSymbol
            ios_icon_name="add"
            android_material_icon_name="add"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.addButtonText}>Add Sponsor</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Tier</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Order</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Actions</Text>
          </View>

          {sponsors.map((sponsor, index) => (
            <React.Fragment key={index}>
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Image source={{ uri: sponsor.logo }} style={styles.sponsorLogo} />
                  <View>
                    <Text style={styles.sponsorName}>{sponsor.name}</Text>
                    <Text style={styles.sponsorDescription} numberOfLines={1}>
                      {sponsor.description}
                    </Text>
                  </View>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <View style={[styles.tierBadge, { backgroundColor: getTierColor(sponsor.tier) }]}>
                    <Text style={styles.tierBadgeText}>{sponsor.tier}</Text>
                  </View>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <Text style={styles.tableCellText}>{sponsor.display_order}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(sponsor)}
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
                      onPress={() => handleDelete(sponsor)}
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
            </React.Fragment>
          ))}
        </View>

      </ScrollView>

      <ConfirmModal
        visible={deleteModal.visible}
        title="Delete Sponsor"
        message={`Are you sure you want to delete ${deleteModal.sponsor?.name}? This action cannot be undone.`}
        type="error"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDeleteModal({ visible: false, sponsor: null })}
      />
    </SafeAreaView>
  );
}

function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    platinum: '#E5E4E2',
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
  };
  return colors[tier] || '#999999';
}

export default function SponsorsManagement() {
  return (
    <ProtectedRoute redirectTo="/admin/login">
      <SponsorsManagementContent />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  tableContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 24,
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
  sponsorLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  sponsorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sponsorDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    textTransform: 'uppercase',
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
  mobileWarning: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  mobileWarningText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
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
  formContent: {
    padding: 24,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  formGroup: {
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tierOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  tierOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 0.6,
  },
  tierOptionActive: {
    opacity: 1,
    borderWidth: 3,
    borderColor: colors.text,
  },
  tierOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  tierOptionTextActive: {
    fontSize: 16,
  },
  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: colors.border,
  },
});

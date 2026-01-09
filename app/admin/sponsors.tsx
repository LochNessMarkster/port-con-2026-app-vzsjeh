
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

function SponsorsManagementContent() {
  const router = useRouter();
  const { sponsors, refetch } = useConferenceData();
  const [isAdding, setIsAdding] = useState(false);

  // TODO: Backend Integration - Implement CRUD operations
  const handleAdd = () => {
    console.log('Add sponsor');
    setIsAdding(true);
  };

  const handleEdit = (id: string) => {
    console.log('Edit sponsor:', id);
    // TODO: Backend Integration - Open edit modal/form
  };

  const handleDelete = (id: string) => {
    console.log('Delete sponsor:', id);
    // TODO: Backend Integration - Call DELETE /api/sponsors/:id
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
                      onPress={() => handleEdit(sponsor.id)}
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
                      onPress={() => handleDelete(sponsor.id)}
                    >
                      <IconSymbol
                        ios_icon_name="delete"
                        android_material_icon_name="delete"
                        size={18}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.infoBox}>
          <IconSymbol
            ios_icon_name="info"
            android_material_icon_name="info"
            size={20}
            color={colors.secondary}
          />
          <Text style={styles.infoText}>
            TODO: Backend Integration - CRUD operations will be connected to the backend API. 
            Features include: Add/Edit/Delete sponsors, image upload, CSV import, and drag-to-reorder.
          </Text>
        </View>
      </ScrollView>
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
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#1E40AF',
    lineHeight: 20,
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
});

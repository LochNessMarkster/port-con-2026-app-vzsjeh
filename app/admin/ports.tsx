
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
import { apiGet, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/api';
import { useRouter } from 'expo-router';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Port } from '@/types/conference';
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  portCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  portHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  portInfo: {
    flex: 1,
  },
  portName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  portLink: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  portActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  portLogo: {
    width: 120,
    height: 60,
    borderRadius: 8,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
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
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: colors.text,
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

function PortsManagementContent() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    logo: '',
  });
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [portToDelete, setPortToDelete] = useState<Port | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPorts();
  }, []);

  const fetchPorts = async () => {
    try {
      console.log('Fetching ports from API...');
      setLoading(true);
      const data = await apiGet<Port[]>('/api/ports');
      console.log('Ports fetched:', data.length);
      setPorts(data);
    } catch (error) {
      console.error('Error fetching ports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    console.log('User tapped Add Port button');
    setEditingPort(null);
    setFormData({
      name: '',
      link: '',
      logo: '',
    });
    setIsModalVisible(true);
  };

  const handleEdit = (port: Port) => {
    console.log('User tapped Edit button for port:', port.name);
    setEditingPort(port);
    setFormData({
      name: port.name,
      link: port.link || '',
      logo: port.logo || '',
    });
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    try {
      console.log('Saving port:', formData);
      
      if (!formData.name.trim()) {
        console.warn('Port name is required');
        return;
      }

      if (editingPort) {
        const updated = await authenticatedPut<Port>(`/api/admin/ports/${editingPort.id}`, formData);
        console.log('Port updated successfully:', updated);
        setPorts(ports.map(p => p.id === editingPort.id ? updated : p));
      } else {
        const created = await authenticatedPost<Port>('/api/admin/ports', formData);
        console.log('Port created successfully:', created);
        setPorts([...ports, created]);
      }
      
      setIsModalVisible(false);
      setEditingPort(null);
    } catch (error) {
      console.error('Error saving port:', error);
    }
  };

  const handleDelete = (port: Port) => {
    console.log('User tapped Delete button for port:', port.name);
    setPortToDelete(port);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!portToDelete) return;
    
    try {
      console.log('Deleting port:', portToDelete.name);
      await authenticatedDelete(`/api/admin/ports/${portToDelete.id}`);
      console.log('Port deleted successfully');
      setPorts(ports.filter(p => p.id !== portToDelete.id));
      setDeleteConfirmVisible(false);
      setPortToDelete(null);
    } catch (error) {
      console.error('Error deleting port:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Ports</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Add Port</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No ports yet. Tap "Add Port" to create one.
            </Text>
          </View>
        ) : (
          ports.map((port, index) => {
            const portName = port.name;
            const portLink = port.link || 'No link';
            const hasLogo = !!port.logo;
            
            return (
              <React.Fragment key={index}>
                <View style={styles.portCard}>
                  <View style={styles.portHeader}>
                    <View style={styles.portInfo}>
                      <Text style={styles.portName}>{portName}</Text>
                      <Text style={styles.portLink}>{portLink}</Text>
                    </View>
                    <View style={styles.portActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEdit(port)}
                      >
                        <IconSymbol
                          ios_icon_name="pencil"
                          android_material_icon_name="edit"
                          size={20}
                          color={colors.secondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(port)}
                      >
                        <IconSymbol
                          ios_icon_name="trash"
                          android_material_icon_name="delete"
                          size={20}
                          color="#FF3B30"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {hasLogo && (
                    <Image
                      source={{ uri: port.logo }}
                      style={styles.portLogo}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </React.Fragment>
            );
          })
        )}
      </ScrollView>

      {isModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingPort ? 'Edit Port' : 'Add Port'}
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Port name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Link</Text>
                <TextInput
                  style={styles.input}
                  value={formData.link}
                  onChangeText={(text) => setFormData({ ...formData, link: text })}
                  placeholder="https://example.com"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Logo URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.logo}
                  onChangeText={(text) => setFormData({ ...formData, logo: text })}
                  placeholder="https://example.com/logo.png"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Delete Port"
        message={`Are you sure you want to delete "${portToDelete?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setPortToDelete(null);
        }}
      />
    </View>
  );
}

function PortsManagement() {
  return (
    <ProtectedRoute>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <PortsManagementContent />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

export default PortsManagement;

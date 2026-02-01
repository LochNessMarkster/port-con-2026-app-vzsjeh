
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
import { Speaker } from '@/types/conference';
import { apiGet, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

function SpeakersManagementContent() {
  const router = useRouter();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; speaker: Speaker | null }>({
    visible: false,
    speaker: null,
  });
  const [errorModal, setErrorModal] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    bio: '',
    photo: '',
    speakingTopic: '',
    synopsis: '',
  });

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const fetchSpeakers = async () => {
    try {
      setLoading(true);
      console.log('[Admin] Fetching speakers...');
      const data = await apiGet<Speaker[]>('/api/speakers');
      setSpeakers(data);
      console.log('[Admin] Fetched', data.length, 'speakers');
    } catch (error) {
      console.error('[Admin] Error fetching speakers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSpeaker(null);
    setFormData({
      name: '',
      title: '',
      company: '',
      bio: '',
      photo: '',
      speakingTopic: '',
      synopsis: '',
    });
    setIsEditing(true);
  };

  const handleEdit = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    setFormData({
      name: speaker.name,
      title: speaker.title,
      company: speaker.company,
      bio: speaker.bio,
      photo: speaker.photo,
      speakingTopic: speaker.speakingTopic || '',
      synopsis: speaker.synopsis || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      console.log('[Admin] Saving speaker...');
      const payload = {
        name: formData.name,
        title: formData.title,
        company: formData.company,
        bio: formData.bio,
        photo: formData.photo,
        speakingTopic: formData.speakingTopic,
        synopsis: formData.synopsis,
      };

      if (editingSpeaker) {
        await authenticatedPut(`/api/admin/speakers/${editingSpeaker.id}`, payload);
        console.log('[Admin] Speaker updated');
      } else {
        await authenticatedPost('/api/admin/speakers', payload);
        console.log('[Admin] Speaker created');
      }

      setIsEditing(false);
      fetchSpeakers();
    } catch (error) {
      console.error('[Admin] Error saving speaker:', error);
      setErrorModal({
        visible: true,
        message: error instanceof Error ? error.message : 'Failed to save speaker',
      });
    }
  };

  const handleDelete = async (speaker: Speaker) => {
    setDeleteModal({ visible: true, speaker });
  };

  const confirmDelete = async () => {
    if (!deleteModal.speaker) return;

    try {
      console.log('[Admin] Deleting speaker:', deleteModal.speaker.id);
      await authenticatedDelete(`/api/admin/speakers/${deleteModal.speaker.id}`);
      console.log('[Admin] Speaker deleted');
      setDeleteModal({ visible: false, speaker: null });
      fetchSpeakers();
    } catch (error) {
      console.error('[Admin] Error deleting speaker:', error);
      setErrorModal({
        visible: true,
        message: error instanceof Error ? error.message : 'Failed to delete speaker',
      });
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
            {editingSpeaker ? 'Edit Speaker' : 'Add Speaker'}
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
              placeholder="Speaker name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Job title"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Company</Text>
            <TextInput
              style={styles.input}
              value={formData.company}
              onChangeText={(text) => setFormData({ ...formData, company: text })}
              placeholder="Company name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              placeholder="Speaker biography"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Photo URL</Text>
            <TextInput
              style={styles.input}
              value={formData.photo}
              onChangeText={(text) => setFormData({ ...formData, photo: text })}
              placeholder="https://example.com/photo.jpg"
              placeholderTextColor={colors.textSecondary}
            />
            {formData.photo && (
              <Image source={{ uri: formData.photo }} style={styles.photoPreview} />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Speaking Topic</Text>
            <TextInput
              style={styles.input}
              value={formData.speakingTopic}
              onChangeText={(text) => setFormData({ ...formData, speakingTopic: text })}
              placeholder="Topic of presentation"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Synopsis of Speaking Topic</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.synopsis}
              onChangeText={(text) => setFormData({ ...formData, synopsis: text })}
              placeholder="Brief description of the speaking topic"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
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
        <Text style={styles.headerTitle}>Manage Speakers</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <IconSymbol
            ios_icon_name="add"
            android_material_icon_name="add"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.addButtonText}>Add Speaker</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Speaker</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Title & Company</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Speaking Topic</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Actions</Text>
            </View>

            {speakers.map((speaker) => {
              const speakerTopicDisplay = speaker.speakingTopic || 'No topic';
              
              return (
                <View key={speaker.id} style={styles.tableRow}>
                  <View style={[styles.tableCell, { flex: 2 }]}>
                    <Image source={{ uri: speaker.photo }} style={styles.speakerPhoto} />
                    <Text style={styles.speakerName}>{speaker.name}</Text>
                  </View>
                  <View style={[styles.tableCell, { flex: 2 }]}>
                    <Text style={styles.tableCellText}>{speaker.title}</Text>
                    <Text style={styles.tableCellSubtext}>{speaker.company}</Text>
                  </View>
                  <View style={[styles.tableCell, { flex: 2 }]}>
                    <Text style={styles.tableCellText} numberOfLines={2}>{speakerTopicDisplay}</Text>
                  </View>
                  <View style={[styles.tableCell, { flex: 1 }]}>
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEdit(speaker)}
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
                        onPress={() => handleDelete(speaker)}
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
              );
            })}
          </View>
        </ScrollView>
      )}

      <ConfirmModal
        visible={deleteModal.visible}
        title="Delete Speaker"
        message={`Are you sure you want to delete ${deleteModal.speaker?.name}? This action cannot be undone.`}
        type="error"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDeleteModal({ visible: false, speaker: null })}
      />

      <ConfirmModal
        visible={errorModal.visible}
        title="Error"
        message={errorModal.message}
        type="error"
        confirmText="OK"
        onConfirm={() => setErrorModal({ visible: false, message: '' })}
        onClose={() => setErrorModal({ visible: false, message: '' })}
      />
    </SafeAreaView>
  );
}

export default function SpeakersManagement() {
  return (
    <ProtectedRoute redirectTo="/admin/login">
      <SpeakersManagementContent />
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  tableCellSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  speakerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
  },
  speakerName: {
    fontSize: 14,
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

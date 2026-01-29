
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import ProtectedRoute from '@/components/ProtectedRoute';
import { IconSymbol } from '@/components/IconSymbol';
import { Session, Room, Speaker } from '@/types/conference';
import { apiGet, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

function SessionsManagementContent() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; session: Session | null }>({
    visible: false,
    session: null,
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    roomId: '',
    type: 'panel' as 'keynote' | 'panel' | 'networking',
    track: '',
    speakerIds: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('[Admin] Fetching sessions data...');
      const [sessionsData, roomsData, speakersData] = await Promise.all([
        apiGet<Session[]>('/api/sessions'),
        apiGet<Room[]>('/api/rooms'),
        apiGet<Speaker[]>('/api/speakers'),
      ]);
      setSessions(sessionsData);
      setRooms(roomsData);
      setSpeakers(speakersData);
      console.log('[Admin] Fetched', sessionsData.length, 'sessions');
    } catch (error) {
      console.error('[Admin] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSession(null);
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      roomId: rooms[0]?.id || '',
      type: 'panel',
      track: '',
      speakerIds: [],
    });
    setIsEditing(true);
  };

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description,
      startTime: session.start_time,
      endTime: session.end_time,
      roomId: session.room_id,
      type: session.type,
      track: session.track,
      speakerIds: session.speakers.map(s => s.id),
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      console.log('[Admin] Saving session...');
      const payload = {
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        roomId: formData.roomId,
        type: formData.type,
        track: formData.track,
        speakerIds: formData.speakerIds,
      };

      if (editingSession) {
        await authenticatedPut(`/api/admin/sessions/${editingSession.id}`, payload);
        console.log('[Admin] Session updated');
      } else {
        await authenticatedPost('/api/admin/sessions', payload);
        console.log('[Admin] Session created');
      }

      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error('[Admin] Error saving session:', error);
      alert(error instanceof Error ? error.message : 'Failed to save session');
    }
  };

  const handleDelete = async (session: Session) => {
    setDeleteModal({ visible: true, session });
  };

  const confirmDelete = async () => {
    if (!deleteModal.session) return;

    try {
      console.log('[Admin] Deleting session:', deleteModal.session.id);
      await authenticatedDelete(`/api/admin/sessions/${deleteModal.session.id}`);
      console.log('[Admin] Session deleted');
      setDeleteModal({ visible: false, session: null });
      fetchData();
    } catch (error) {
      console.error('[Admin] Error deleting session:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete session');
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
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
            {editingSession ? 'Edit Session' : 'Add Session'}
          </Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Session title"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Session description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Start Time *</Text>
              <TextInput
                style={styles.input}
                value={formatDateTime(formData.startTime)}
                onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                placeholder="2026-03-24T09:00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>End Time *</Text>
              <TextInput
                style={styles.input}
                value={formatDateTime(formData.endTime)}
                onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                placeholder="2026-03-24T10:00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Room</Text>
              <View style={styles.pickerContainer}>
                {rooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={[
                      styles.pickerOption,
                      formData.roomId === room.id && styles.pickerOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, roomId: room.id })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.roomId === room.id && styles.pickerOptionTextActive,
                      ]}
                    >
                      {room.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.pickerContainer}>
                {['keynote', 'panel', 'networking'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pickerOption,
                      formData.type === type && styles.pickerOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: type as any })}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.type === type && styles.pickerOptionTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Track</Text>
            <TextInput
              style={styles.input}
              value={formData.track}
              onChangeText={(text) => setFormData({ ...formData, track: text })}
              placeholder="e.g., Leadership, Operations"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Speakers</Text>
            <View style={styles.speakersList}>
              {speakers.map((speaker) => {
                const isSelected = formData.speakerIds.includes(speaker.id);
                return (
                  <TouchableOpacity
                    key={speaker.id}
                    style={[
                      styles.speakerChip,
                      isSelected && styles.speakerChipActive,
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setFormData({
                          ...formData,
                          speakerIds: formData.speakerIds.filter(id => id !== speaker.id),
                        });
                      } else {
                        setFormData({
                          ...formData,
                          speakerIds: [...formData.speakerIds, speaker.id],
                        });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.speakerChipText,
                        isSelected && styles.speakerChipTextActive,
                      ]}
                    >
                      {speaker.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
        <Text style={styles.headerTitle}>Manage Sessions</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <IconSymbol
            ios_icon_name="add"
            android_material_icon_name="add"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.addButtonText}>Add Session</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.tableContainer}>
            {sessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <Text style={styles.sessionMeta}>
                      {new Date(session.start_time).toLocaleString()} • {session.room?.name}
                    </Text>
                    <View style={styles.sessionTags}>
                      <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.typeBadgeText}>{session.type}</Text>
                      </View>
                      {session.track && (
                        <View style={styles.trackBadge}>
                          <Text style={styles.trackBadgeText}>{session.track}</Text>
                        </View>
                      )}
                    </View>
                    {session.speakers.length > 0 && (
                      <Text style={styles.speakersText}>
                        Speakers: {session.speakers.map(s => s.name).join(', ')}
                      </Text>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(session)}
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
                      onPress={() => handleDelete(session)}
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
        title="Delete Session"
        message={`Are you sure you want to delete "${deleteModal.session?.title}"? This action cannot be undone.`}
        type="error"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDeleteModal({ visible: false, session: null })}
      />
    </SafeAreaView>
  );
}

export default function SessionsManagement() {
  return (
    <ProtectedRoute redirectTo="/admin/login">
      <SessionsManagementContent />
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
    maxWidth: 1000,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pickerOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  pickerOptionTextActive: {
    color: '#FFFFFF',
  },
  speakersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speakerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  speakerChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  speakerChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  speakerChipTextActive: {
    color: '#FFFFFF',
  },
  tableContainer: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sessionMeta: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  sessionTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  trackBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.highlight,
  },
  trackBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  speakersText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
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

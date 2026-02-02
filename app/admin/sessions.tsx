
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
import { apiGet, authenticatedPost, authenticatedPut, authenticatedDelete, BACKEND_URL, getBearerToken } from '@/utils/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import * as DocumentPicker from 'expo-document-picker';

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
  const [scraping, setScraping] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scrapeResultModal, setScrapeResultModal] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [importResultModal, setImportResultModal] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [errorModal, setErrorModal] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
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
      setErrorModal({
        visible: true,
        message: error instanceof Error ? error.message : 'Failed to save session',
      });
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
      setErrorModal({
        visible: true,
        message: error instanceof Error ? error.message : 'Failed to delete session',
      });
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
      const response = await fetch(`${BACKEND_URL}/api/admin/sessions/import-csv`, {
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
        message: `Successfully imported sessions!\n\nCreated: ${importResult.created}\nUpdated: ${importResult.updated}${errorMessages}`,
        type: importResult.errors && importResult.errors.length > 0 ? 'error' : 'success',
      });

      console.log('[Admin] CSV import completed');
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

  const handleScrapeSchedule = async () => {
    try {
      setScraping(true);
      console.log('[Admin] Scraping schedule from conference website...');
      
      const response = await apiGet<{ sessions: any[] }>('/api/admin/scrape-schedule');
      
      if (response.sessions && response.sessions.length > 0) {
        console.log('[Admin] Scraped', response.sessions.length, 'sessions');
        
        // Create sessions from scraped data
        for (const scrapedSession of response.sessions) {
          try {
            // Find or create room
            let roomId = rooms[0]?.id || '';
            if (scrapedSession.room) {
              const existingRoom = rooms.find(r => 
                r.name.toLowerCase().includes(scrapedSession.room.toLowerCase())
              );
              if (existingRoom) {
                roomId = existingRoom.id;
              }
            }

            // Find speakers by name
            const speakerIds: string[] = [];
            if (scrapedSession.speakers && scrapedSession.speakers.length > 0) {
              for (const speakerName of scrapedSession.speakers) {
                const speaker = speakers.find(s => 
                  s.name.toLowerCase().includes(speakerName.toLowerCase()) ||
                  speakerName.toLowerCase().includes(s.name.toLowerCase())
                );
                if (speaker) {
                  speakerIds.push(speaker.id);
                }
              }
            }

            const payload = {
              title: scrapedSession.title,
              description: scrapedSession.description || '',
              startTime: scrapedSession.startTime,
              endTime: scrapedSession.endTime,
              roomId: roomId,
              type: scrapedSession.type || 'panel',
              track: scrapedSession.track || '',
              speakerIds: speakerIds,
            };

            await authenticatedPost('/api/admin/sessions', payload);
          } catch (error) {
            console.error('[Admin] Error creating session:', scrapedSession.title, error);
          }
        }

        setScrapeResultModal({
          visible: true,
          message: `Successfully imported ${response.sessions.length} sessions from the conference website!`,
          type: 'success',
        });
        fetchData();
      } else {
        setScrapeResultModal({
          visible: true,
          message: 'No sessions found on the conference website.',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('[Admin] Error scraping schedule:', error);
      setScrapeResultModal({
        visible: true,
        message: error instanceof Error ? error.message : 'Failed to scrape schedule',
        type: 'error',
      });
    } finally {
      setScraping(false);
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
          <TouchableOpacity 
            style={styles.scrapeButton} 
            onPress={handleScrapeSchedule}
            disabled={scraping}
          >
            {scraping ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="cloud-download"
                  android_material_icon_name="cloud-download"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.scrapeButtonText}>Import from Website</Text>
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
            <Text style={styles.addButtonText}>Add Session</Text>
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

      <ConfirmModal
        visible={scrapeResultModal.visible}
        title={scrapeResultModal.type === 'success' ? 'Import Successful' : 'Import Failed'}
        message={scrapeResultModal.message}
        type={scrapeResultModal.type === 'success' ? 'success' : 'error'}
        confirmText="OK"
        onConfirm={() => setScrapeResultModal({ visible: false, message: '', type: 'success' })}
        onClose={() => setScrapeResultModal({ visible: false, message: '', type: 'success' })}
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

      <ConfirmModal
        visible={importResultModal.visible}
        title={importResultModal.type === 'success' ? 'Import Status' : 'Import Failed'}
        message={importResultModal.message}
        type={importResultModal.type}
        confirmText="OK"
        onConfirm={() => {
          setImportResultModal({ visible: false, message: '', type: 'success' });
          if (importResultModal.type === 'success') {
            fetchData();
          }
        }}
        onClose={() => setImportResultModal({ visible: false, message: '', type: 'success' })}
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrapeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  scrapeButtonText: {
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

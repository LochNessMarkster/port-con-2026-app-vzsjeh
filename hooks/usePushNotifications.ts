
import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { authenticatedPost, authenticatedGet, authenticatedDelete } from '@/utils/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface ScheduledNotification {
  id: string;
  sessionId: string;
  sessionTitle: string;
  scheduledFor: string;
}

export interface SessionChange {
  id: string;
  sessionId: string;
  sessionTitle: string;
  changeType: 'time_change' | 'room_change' | 'cancellation';
  oldValue: string;
  newValue: string;
  createdAt: string;
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [sessionChanges, setSessionChanges] = useState<SessionChange[]>([]);
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    registerForPushNotificationsAsync();
    loadScheduledNotifications();
    loadSessionChanges();

    // Listen for notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notifications] Notification received:', notification);
      // Reload session changes when a notification is received
      loadSessionChanges();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[Notifications] Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      if (!Device.isDevice) {
        console.log('[Notifications] Must use physical device for Push Notifications');
        setLoading(false);
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted for push notifications');
        setLoading(false);
        return;
      }

      // Get project ID from app.json
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.log('[Notifications] No project ID found - push notifications will work locally only');
        setLoading(false);
        return;
      }

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        const token = tokenData.data;
        
        console.log('[Notifications] Expo push token:', token);
        setExpoPushToken(token);

        // Register token with backend
        try {
          const result = await authenticatedPost('/api/notifications/register', {
            token,
            platform: Platform.OS,
          });
          console.log('[Notifications] Token registered with backend:', result);
        } catch (error) {
          console.log('[Notifications] Could not register token with backend (backend may not be available):', error);
          // Don't throw - continue even if registration fails
        }
      } catch (tokenError: any) {
        console.log('[Notifications] Could not get push token (this is normal in Expo Go):', tokenError.message);
        // Don't throw - this is expected in Expo Go
      }

      setLoading(false);
    } catch (error: any) {
      console.log('[Notifications] Error setting up push notifications:', error.message);
      setLoading(false);
    }
  };

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await authenticatedGet<any[]>('/api/notifications/scheduled');
      
      // Transform backend response to match our interface
      const transformedNotifications: ScheduledNotification[] = notifications.map(n => ({
        id: n.id,
        sessionId: n.sessionId,
        sessionTitle: n.session?.title || 'Unknown Session',
        scheduledFor: n.scheduledFor,
      }));
      
      setScheduledNotifications(transformedNotifications);
      console.log('[Notifications] Loaded', transformedNotifications.length, 'scheduled notifications');
    } catch (error) {
      console.log('[Notifications] Could not load scheduled notifications (backend may not be available)');
      // Set empty array on error
      setScheduledNotifications([]);
    }
  };

  const scheduleNotification = async (sessionId: string, sessionTitle: string, sessionStartTime: string, minutesBefore: number = 15) => {
    try {
      console.log('[Notifications] Scheduling notification for session:', sessionTitle);
      
      const result = await authenticatedPost<any>('/api/notifications/schedule', {
        sessionId,
        minutesBefore,
      });

      console.log('[Notifications] Notification scheduled:', result);
      await loadScheduledNotifications();
      return true;
    } catch (error) {
      console.log('[Notifications] Could not schedule notification (backend may not be available)');
      return false;
    }
  };

  const cancelNotification = async (notificationId: string) => {
    try {
      console.log('[Notifications] Canceling notification:', notificationId);
      
      await authenticatedDelete(`/api/notifications/scheduled/${notificationId}`);
      
      await loadScheduledNotifications();
      console.log('[Notifications] Notification canceled');
      return true;
    } catch (error) {
      console.log('[Notifications] Could not cancel notification (backend may not be available)');
      return false;
    }
  };

  const loadSessionChanges = async () => {
    try {
      console.log('[Notifications] Loading session changes...');
      const changes = await authenticatedGet<SessionChange[]>('/api/notifications/session-changes');
      setSessionChanges(changes);
      console.log('[Notifications] Loaded', changes.length, 'session changes');
    } catch (error) {
      console.log('[Notifications] Could not load session changes (backend may not be available)');
      setSessionChanges([]);
    }
  };

  const dismissSessionChange = async (changeId: string) => {
    try {
      console.log('[Notifications] Dismissing session change:', changeId);
      // Remove from local state immediately (optimistic update)
      setSessionChanges(prev => prev.filter(c => c.id !== changeId));
      
      // Note: Session changes are informational only and don't need to be marked as read on the backend
      // The backend will automatically clean up old session changes after a certain period
    } catch (error) {
      console.log('[Notifications] Could not dismiss session change');
    }
  };

  const isNotificationScheduled = (sessionId: string): boolean => {
    return scheduledNotifications.some(n => n.sessionId === sessionId);
  };

  return {
    expoPushToken,
    scheduledNotifications,
    sessionChanges,
    loading,
    scheduleNotification,
    cancelNotification,
    isNotificationScheduled,
    refreshScheduledNotifications: loadScheduledNotifications,
    refreshSessionChanges: loadSessionChanges,
    dismissSessionChange,
  };
}


import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
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

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    registerForPushNotificationsAsync();
    loadScheduledNotifications();

    // Listen for notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notifications] Notification received:', notification);
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
        console.log('[Notifications] Failed to get push token for push notification!');
        setLoading(false);
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // This will be configured in app.json
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
        console.error('[Notifications] Error registering token:', error);
        // Don't throw - continue even if registration fails
      }

      setLoading(false);
    } catch (error) {
      console.error('[Notifications] Error setting up push notifications:', error);
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
      console.error('[Notifications] Error loading scheduled notifications:', error);
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
      console.error('[Notifications] Error scheduling notification:', error);
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
      console.error('[Notifications] Error canceling notification:', error);
      return false;
    }
  };

  const isNotificationScheduled = (sessionId: string): boolean => {
    return scheduledNotifications.some(n => n.sessionId === sessionId);
  };

  return {
    expoPushToken,
    scheduledNotifications,
    loading,
    scheduleNotification,
    cancelNotification,
    isNotificationScheduled,
    refreshScheduledNotifications: loadScheduledNotifications,
  };
}


import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from './usePushNotifications';
import { authenticatedGet, authenticatedPost, authenticatedDelete } from '@/utils/api';

const BOOKMARKS_KEY = '@conference_bookmarks';

export function useBookmarks() {
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { scheduleNotification, cancelNotification, isNotificationScheduled } = usePushNotifications();

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      // Note: Session bookmarks are stored locally for now
      // Future enhancement: Sync with backend API
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        setBookmarkedSessions(new Set(JSON.parse(stored)));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setLoading(false);
    }
  };

  const toggleBookmark = async (sessionId: string, sessionTitle?: string, sessionStartTime?: string) => {
    try {
      const newBookmarks = new Set(bookmarkedSessions);
      
      if (newBookmarks.has(sessionId)) {
        newBookmarks.delete(sessionId);
        console.log('[Bookmarks] Removed bookmark for session:', sessionId);
        
        // Cancel notification if scheduled
        if (isNotificationScheduled(sessionId)) {
          // Find the notification ID and cancel it
          // This will be handled by the backend
        }
        
        // Note: Session bookmarks are stored locally for now
        // Future enhancement: Sync with backend API
      } else {
        newBookmarks.add(sessionId);
        console.log('[Bookmarks] Added bookmark for session:', sessionId);
        
        // Schedule notification 15 minutes before session
        if (sessionTitle && sessionStartTime) {
          await scheduleNotification(sessionId, sessionTitle, sessionStartTime, 15);
        }
        
        // Note: Session bookmarks are stored locally for now
        // Future enhancement: Sync with backend API
      }
      
      setBookmarkedSessions(newBookmarks);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(newBookmarks)));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const isBookmarked = (sessionId: string) => {
    return bookmarkedSessions.has(sessionId);
  };

  return {
    bookmarkedSessions,
    toggleBookmark,
    isBookmarked,
    loading,
  };
}

// Hook for managing favorite exhibitors
export function useFavoriteExhibitors() {
  const [favoriteExhibitors, setFavoriteExhibitors] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      console.log('[Favorites] Loading favorite exhibitors...');
      const response = await authenticatedGet<{ exhibitorId: string }[]>('/api/favorites/exhibitors');
      const favoriteIds = response.map(f => f.exhibitorId);
      setFavoriteExhibitors(new Set(favoriteIds));
      console.log('[Favorites] Loaded', favoriteIds.length, 'favorite exhibitors');
      setLoading(false);
    } catch (error) {
      console.error('[Favorites] Error loading favorites:', error);
      setLoading(false);
    }
  };

  const toggleFavorite = async (exhibitorId: string) => {
    try {
      const newFavorites = new Set(favoriteExhibitors);
      
      if (newFavorites.has(exhibitorId)) {
        newFavorites.delete(exhibitorId);
        console.log('[Favorites] Removed favorite exhibitor:', exhibitorId);
        await authenticatedDelete(`/api/favorites/exhibitors/${exhibitorId}`);
      } else {
        newFavorites.add(exhibitorId);
        console.log('[Favorites] Added favorite exhibitor:', exhibitorId);
        await authenticatedPost(`/api/favorites/exhibitors/${exhibitorId}`, {});
      }
      
      setFavoriteExhibitors(newFavorites);
    } catch (error) {
      console.error('[Favorites] Error toggling favorite:', error);
      throw error;
    }
  };

  const isFavorite = (exhibitorId: string) => {
    return favoriteExhibitors.has(exhibitorId);
  };

  return {
    favoriteExhibitors,
    toggleFavorite,
    isFavorite,
    loading,
    refetch: loadFavorites,
  };
}

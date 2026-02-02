
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from './usePushNotifications';
import { authenticatedGet, authenticatedPost, authenticatedDelete } from '@/utils/api';

const BOOKMARKS_KEY = '@conference_bookmarks';

export function useBookmarks() {
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { scheduleNotification, cancelNotification, isNotificationScheduled, scheduledNotifications } = usePushNotifications();

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      console.log('[Bookmarks] Loading bookmarked sessions...');
      
      // Try to load from backend first
      try {
        const response = await authenticatedGet<{ sessionId: string }[]>('/api/bookmarks/sessions');
        const bookmarkIds = response.map(b => b.sessionId);
        setBookmarkedSessions(new Set(bookmarkIds));
        console.log('[Bookmarks] Loaded', bookmarkIds.length, 'bookmarked sessions from backend');
        
        // Save to local storage as cache
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarkIds));
      } catch (error) {
        console.log('[Bookmarks] Could not load from backend, using local cache');
        
        // Fallback to local storage
        const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
        if (stored) {
          setBookmarkedSessions(new Set(JSON.parse(stored)));
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('[Bookmarks] Error loading bookmarks:', error);
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
          const notification = scheduledNotifications.find(n => n.sessionId === sessionId);
          if (notification) {
            await cancelNotification(notification.id);
          }
        }
        
        // Remove from backend
        try {
          await authenticatedDelete(`/api/bookmarks/sessions/${sessionId}`);
          console.log('[Bookmarks] Removed bookmark from backend');
        } catch (error) {
          console.log('[Bookmarks] Could not remove bookmark from backend (will sync later)');
        }
      } else {
        newBookmarks.add(sessionId);
        console.log('[Bookmarks] Added bookmark for session:', sessionId);
        
        // Schedule notification 15 minutes before session
        if (sessionTitle && sessionStartTime) {
          await scheduleNotification(sessionId, sessionTitle, sessionStartTime, 15);
        }
        
        // Add to backend
        try {
          await authenticatedPost(`/api/bookmarks/sessions/${sessionId}`, {});
          console.log('[Bookmarks] Added bookmark to backend');
        } catch (error) {
          console.log('[Bookmarks] Could not add bookmark to backend (will sync later)');
        }
      }
      
      setBookmarkedSessions(newBookmarks);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(newBookmarks)));
    } catch (error) {
      console.error('[Bookmarks] Error toggling bookmark:', error);
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
    refetch: loadBookmarks,
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

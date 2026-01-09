
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@conference_bookmarks';

export function useBookmarks() {
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      // TODO: Backend Integration - Fetch bookmarks from API
      // const response = await fetch('/api/bookmarks');
      // const data = await response.json();
      
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

  const toggleBookmark = async (sessionId: string) => {
    try {
      const newBookmarks = new Set(bookmarkedSessions);
      
      if (newBookmarks.has(sessionId)) {
        newBookmarks.delete(sessionId);
        // TODO: Backend Integration - Remove bookmark via API
        // await fetch(`/api/bookmarks/${sessionId}`, { method: 'DELETE' });
      } else {
        newBookmarks.add(sessionId);
        // TODO: Backend Integration - Add bookmark via API
        // await fetch('/api/bookmarks', { method: 'POST', body: JSON.stringify({ sessionId }) });
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

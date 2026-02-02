
import { useState, useEffect } from 'react';
import { Session, Speaker, Exhibitor, Sponsor, Room, Port } from '@/types/conference';
import { apiGet, isBackendConfigured } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Offline cache keys
const CACHE_KEYS = {
  SESSIONS: '@conference_cache_sessions',
  SPEAKERS: '@conference_cache_speakers',
  EXHIBITORS: '@conference_cache_exhibitors',
  SPONSORS: '@conference_cache_sponsors',
  ROOMS: '@conference_cache_rooms',
  PORTS: '@conference_cache_ports',
  LAST_SYNC: '@conference_cache_last_sync',
};

// Cache expiry time (24 hours)
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

export function useConferenceData() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('[Offline] Network state changed:', state.isConnected);
      setIsOffline(!state.isConnected);
    });

    fetchData();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadFromCache = async () => {
    try {
      console.log('[Offline] Loading data from cache...');
      const [cachedSessions, cachedSpeakers, cachedExhibitors, cachedSponsors, cachedRooms, cachedPorts, lastSync] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.SESSIONS),
        AsyncStorage.getItem(CACHE_KEYS.SPEAKERS),
        AsyncStorage.getItem(CACHE_KEYS.EXHIBITORS),
        AsyncStorage.getItem(CACHE_KEYS.SPONSORS),
        AsyncStorage.getItem(CACHE_KEYS.ROOMS),
        AsyncStorage.getItem(CACHE_KEYS.PORTS),
        AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC),
      ]);

      if (cachedSessions) setSessions(JSON.parse(cachedSessions));
      if (cachedSpeakers) setSpeakers(JSON.parse(cachedSpeakers));
      if (cachedExhibitors) setExhibitors(JSON.parse(cachedExhibitors));
      if (cachedSponsors) setSponsors(JSON.parse(cachedSponsors));
      if (cachedRooms) setRooms(JSON.parse(cachedRooms));
      if (cachedPorts) setPorts(JSON.parse(cachedPorts));
      if (lastSync) setLastSyncTime(new Date(lastSync));

      console.log('[Offline] Data loaded from cache');
      return true;
    } catch (err) {
      console.error('[Offline] Error loading from cache:', err);
      return false;
    }
  };

  const saveToCache = async (data: {
    sessions: Session[];
    speakers: Speaker[];
    exhibitors: Exhibitor[];
    sponsors: Sponsor[];
    rooms: Room[];
    ports: Port[];
  }) => {
    try {
      console.log('[Offline] Saving data to cache...');
      const now = new Date().toISOString();
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.SESSIONS, JSON.stringify(data.sessions)),
        AsyncStorage.setItem(CACHE_KEYS.SPEAKERS, JSON.stringify(data.speakers)),
        AsyncStorage.setItem(CACHE_KEYS.EXHIBITORS, JSON.stringify(data.exhibitors)),
        AsyncStorage.setItem(CACHE_KEYS.SPONSORS, JSON.stringify(data.sponsors)),
        AsyncStorage.setItem(CACHE_KEYS.ROOMS, JSON.stringify(data.rooms)),
        AsyncStorage.setItem(CACHE_KEYS.PORTS, JSON.stringify(data.ports)),
        AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, now),
      ]);
      setLastSyncTime(new Date(now));
      console.log('[Offline] Data saved to cache successfully');
    } catch (err) {
      console.error('[Offline] Error saving to cache:', err);
    }
  };

  const isCacheExpired = async (): Promise<boolean> => {
    try {
      const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      if (!lastSync) return true;
      
      const lastSyncTime = new Date(lastSync).getTime();
      const now = Date.now();
      const isExpired = (now - lastSyncTime) > CACHE_EXPIRY_MS;
      
      console.log('[Offline] Cache expired:', isExpired);
      return isExpired;
    } catch (err) {
      console.error('[Offline] Error checking cache expiry:', err);
      return true;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('[ConferenceData] Fetching conference data...');
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected;
      
      console.log('[ConferenceData] Network connected:', isConnected);
      
      // If offline, load from cache
      if (!isConnected) {
        console.log('[Offline] Device is offline, loading from cache');
        setIsOffline(true);
        const cacheLoaded = await loadFromCache();
        
        if (!cacheLoaded) {
          // No cache available, show empty state
          console.log('[Offline] No cache available, showing empty state');
          setSessions([]);
          setSpeakers([]);
          setExhibitors([]);
          setSponsors([]);
          setPorts([]);
          setRooms([]);
        }
        
        setLoading(false);
        return;
      }
      
      setIsOffline(false);
      
      // Check if cache is still valid
      const cacheExpired = await isCacheExpired();
      
      if (!cacheExpired) {
        console.log('[Offline] Cache is still valid, loading from cache');
        await loadFromCache();
        setLoading(false);
        return;
      }
      
      // Check if backend is configured
      if (!isBackendConfigured()) {
        console.log('[ConferenceData] Backend not configured, no data to display');
        const emptyData = {
          sessions: [],
          speakers: [],
          exhibitors: [],
          sponsors: [],
          rooms: [],
          ports: [],
        };
        
        setSessions(emptyData.sessions);
        setSpeakers(emptyData.speakers);
        setExhibitors(emptyData.exhibitors);
        setSponsors(emptyData.sponsors);
        setPorts(emptyData.ports);
        setRooms(emptyData.rooms);
        
        setLoading(false);
        return;
      }

      // Fetch data from API endpoints
      console.log('[ConferenceData] Fetching from API...');
      const [sessionsData, speakersData, exhibitorsData, sponsorsData, portsData, roomsData] = await Promise.all([
        apiGet<Session[]>('/api/sessions').catch(err => {
          console.error('[ConferenceData] Error fetching sessions:', err);
          return getMockSessions();
        }),
        apiGet<Speaker[]>('/api/speakers').catch(err => {
          console.error('[ConferenceData] Error fetching speakers:', err);
          return getMockSpeakers();
        }),
        apiGet<Exhibitor[]>('/api/exhibitors').catch(err => {
          console.error('[ConferenceData] Error fetching exhibitors:', err);
          return getMockExhibitors();
        }),
        apiGet<Sponsor[]>('/api/sponsors').catch(err => {
          console.error('[ConferenceData] Error fetching sponsors:', err);
          return getMockSponsors();
        }),
        apiGet<Port[]>('/api/ports').catch(err => {
          console.error('[ConferenceData] Error fetching ports:', err);
          return getMockPorts();
        }),
        apiGet<Room[]>('/api/rooms').catch(err => {
          console.error('[ConferenceData] Error fetching rooms:', err);
          return getMockRooms();
        }),
      ]);

      console.log('[ConferenceData] Data fetched successfully');
      console.log('[ConferenceData] Sessions:', sessionsData.length);
      console.log('[ConferenceData] Speakers:', speakersData.length);
      console.log('[ConferenceData] Exhibitors:', exhibitorsData.length);
      console.log('[ConferenceData] Sponsors:', sponsorsData.length);
      console.log('[ConferenceData] Ports:', portsData.length);
      console.log('[ConferenceData] Rooms:', roomsData.length);
      
      // Use API data directly (no fallback to mock data)
      setSessions(sessionsData);
      setSpeakers(speakersData);
      setExhibitors(exhibitorsData);
      setSponsors(sponsorsData);
      setPorts(portsData);
      setRooms(roomsData);
      
      // Save to cache for offline access
      await saveToCache({
        sessions: sessionsData,
        speakers: speakersData,
        exhibitors: exhibitorsData,
        sponsors: sponsorsData,
        rooms: roomsData,
        ports: portsData,
      });
      
      setLoading(false);
    } catch (err) {
      console.error('[ConferenceData] Error fetching conference data:', err);
      setError('Failed to load conference data');
      
      // Try to load from cache as fallback
      const cacheLoaded = await loadFromCache();
      
      if (!cacheLoaded) {
        // Show empty state on error if no cache available
        console.log('[ConferenceData] No cache available after error, showing empty state');
        setSessions([]);
        setSpeakers([]);
        setExhibitors([]);
        setSponsors([]);
        setPorts([]);
        setRooms([]);
      }
      
      setLoading(false);
    }
  };

  const refetch = () => {
    console.log('[ConferenceData] Refetching conference data...');
    fetchData();
  };

  return {
    sessions,
    speakers,
    exhibitors,
    sponsors,
    ports,
    rooms,
    loading,
    error,
    refetch,
    setSpeakers,
    setSessions,
    setExhibitors,
    setSponsors,
    setPorts,
    setRooms,
    isOffline,
    lastSyncTime,
  };
}

// Mock data functions - now return empty arrays (no placeholder data)
function getMockRooms(): Room[] {
  return [];
}

function getMockSpeakers(): Speaker[] {
  return [];
}

function getMockSessions(): Session[] {
  return [];
}

function getMockExhibitors(): Exhibitor[] {
  return [];
}

function getMockSponsors(): Sponsor[] {
  return [];
}

function getMockPorts(): Port[] {
  return [];
}

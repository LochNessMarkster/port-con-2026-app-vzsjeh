
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
          // No cache available, use mock data
          console.log('[Offline] No cache available, using mock data');
          setSessions(getMockSessions());
          setSpeakers(getMockSpeakers());
          setExhibitors(getMockExhibitors());
          setSponsors(getMockSponsors());
          setPorts(getMockPorts());
          setRooms(getMockRooms());
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
        console.log('[ConferenceData] Backend not configured, using mock data');
        const mockData = {
          sessions: getMockSessions(),
          speakers: getMockSpeakers(),
          exhibitors: getMockExhibitors(),
          sponsors: getMockSponsors(),
          rooms: getMockRooms(),
          ports: getMockPorts(),
        };
        
        setSessions(mockData.sessions);
        setSpeakers(mockData.speakers);
        setExhibitors(mockData.exhibitors);
        setSponsors(mockData.sponsors);
        setPorts(mockData.ports);
        setRooms(mockData.rooms);
        
        // Save mock data to cache for offline access
        await saveToCache(mockData);
        
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
      
      // If API returns empty data, use mock data as fallback
      const finalData = {
        sessions: sessionsData.length > 0 ? sessionsData : getMockSessions(),
        speakers: speakersData.length > 0 ? speakersData : getMockSpeakers(),
        exhibitors: exhibitorsData.length > 0 ? exhibitorsData : getMockExhibitors(),
        sponsors: sponsorsData.length > 0 ? sponsorsData : getMockSponsors(),
        rooms: roomsData.length > 0 ? roomsData : getMockRooms(),
        ports: portsData.length > 0 ? portsData : getMockPorts(),
      };
      
      setSessions(finalData.sessions);
      setSpeakers(finalData.speakers);
      setExhibitors(finalData.exhibitors);
      setSponsors(finalData.sponsors);
      setPorts(finalData.ports);
      setRooms(finalData.rooms);
      
      // Save to cache for offline access
      await saveToCache(finalData);
      
      setLoading(false);
    } catch (err) {
      console.error('[ConferenceData] Error fetching conference data:', err);
      setError('Failed to load conference data');
      
      // Try to load from cache as fallback
      const cacheLoaded = await loadFromCache();
      
      if (!cacheLoaded) {
        // Fallback to mock data on error
        setSessions(getMockSessions());
        setSpeakers(getMockSpeakers());
        setExhibitors(getMockExhibitors());
        setSponsors(getMockSponsors());
        setPorts(getMockPorts());
        setRooms(getMockRooms());
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

// Mock data functions
function getMockRooms(): Room[] {
  return [
    { id: '1', name: 'Grand Ballroom', location: 'Level 1', capacity: 500 },
    { id: '2', name: 'Harbor View', location: 'Level 2', capacity: 200 },
    { id: '3', name: 'Maritime Hall', location: 'Level 2', capacity: 150 },
    { id: '4', name: 'Innovation Lab', location: 'Level 3', capacity: 100 },
  ];
}

function getMockSpeakers(): Speaker[] {
  return [
    {
      id: '1',
      name: 'Roger Guenther',
      title: 'Executive Director',
      company: 'Port of Houston Authority',
      bio: 'Leading the Port of Houston Authority with extensive experience in maritime operations and strategic development.',
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
      speakingTopic: 'The Future of Port Operations',
      synopsis: 'Exploring innovations and strategic initiatives transforming modern port operations.',
    },
    {
      id: '2',
      name: 'John Moseley',
      title: 'Chief Operating Officer',
      company: 'Port of Houston Authority',
      bio: 'Overseeing operational excellence and innovation at the Port of Houston.',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      speakingTopic: 'Operational Excellence in Maritime Logistics',
      synopsis: 'Best practices and innovations in port operations management.',
    },
    {
      id: '3',
      name: 'Ricky Kunz',
      title: 'Chief Commercial Officer',
      company: 'Port of Houston Authority',
      bio: 'Driving commercial growth and strategic partnerships for the Port of Houston.',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
      speakingTopic: 'Commercial Strategy and Growth',
      synopsis: 'Strategies for expanding port business and building strategic partnerships.',
    },
    {
      id: '4',
      name: 'Erica Ramos',
      title: 'Chief Financial Officer',
      company: 'Port of Houston Authority',
      bio: 'Managing financial strategy and operations for the Port of Houston Authority.',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
      speakingTopic: 'Financial Planning for Port Infrastructure',
      synopsis: 'Financial strategies supporting sustainable port development and growth.',
    },
    {
      id: '5',
      name: 'Trey Howell',
      title: 'Chief Legal Officer',
      company: 'Port of Houston Authority',
      bio: 'Providing legal guidance and oversight for the Port of Houston Authority.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      speakingTopic: 'Legal Frameworks for Maritime Operations',
      synopsis: 'Navigating legal and regulatory challenges in modern port operations.',
    },
    {
      id: '6',
      name: 'Ric Campo',
      title: 'Chairman',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Leading the Port Commission with strategic vision and industry expertise.',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      speakingTopic: 'Strategic Vision for Port Development',
      synopsis: 'Long-term strategic planning and vision for the Port of Houston.',
    },
    {
      id: '7',
      name: 'Clint Carlson',
      title: 'Vice Chairman',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Supporting the Port Commission with extensive maritime industry knowledge.',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      speakingTopic: 'Maritime Industry Trends',
      synopsis: 'Current trends and future outlook for the maritime industry.',
    },
    {
      id: '8',
      name: 'Wendy Montoya Cloonan',
      title: 'Commissioner',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Contributing strategic insights and governance to the Port Commission.',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
      speakingTopic: 'Governance and Strategic Planning',
      synopsis: 'Effective governance models for port authorities.',
    },
    {
      id: '9',
      name: 'Roy D. Mease',
      title: 'Commissioner',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Providing leadership and strategic direction for port development.',
      photo: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400',
      speakingTopic: 'Infrastructure Development',
      synopsis: 'Planning and executing major port infrastructure projects.',
    },
    {
      id: '10',
      name: 'Dean E. Corgey',
      title: 'Commissioner',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Bringing industry expertise and strategic vision to the Port Commission.',
      photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
      speakingTopic: 'Industry Collaboration',
      synopsis: 'Building partnerships across the maritime industry.',
    },
    {
      id: '11',
      name: 'Cheryl Creuzot',
      title: 'Commissioner',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Contributing to the strategic development and governance of the Port of Houston.',
      photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
      speakingTopic: 'Community Engagement',
      synopsis: 'Strengthening relationships between ports and local communities.',
    },
    {
      id: '12',
      name: 'Stephen DonCarlos',
      title: 'Commissioner',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Supporting port operations and strategic initiatives with industry knowledge.',
      photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400',
      speakingTopic: 'Technology and Innovation',
      synopsis: 'Leveraging technology to enhance port operations and efficiency.',
    },
  ];
}

function getMockSessions(): Session[] {
  const speakers = getMockSpeakers();
  const rooms = getMockRooms();
  
  return [
    {
      id: '1',
      title: 'Opening Keynote: The Future of Port Operations',
      description: 'Join us for an inspiring keynote on the latest innovations transforming port operations worldwide.',
      start_time: '2026-03-24T09:00:00',
      end_time: '2026-03-24T10:00:00',
      room_id: '1',
      room: rooms[0],
      type: 'keynote',
      track: 'Leadership',
      speakers: [speakers[0]],
    },
    {
      id: '2',
      title: 'Panel: Strategic Vision for Maritime Excellence',
      description: 'Port Commission leaders discuss the strategic direction and future of the Port of Houston.',
      start_time: '2026-03-24T10:30:00',
      end_time: '2026-03-24T11:30:00',
      room_id: '2',
      room: rooms[1],
      type: 'panel',
      track: 'Strategy',
      speakers: [speakers[5], speakers[6], speakers[7]],
    },
    {
      id: '3',
      title: 'Panel: Operational Excellence and Innovation',
      description: 'Executive leadership discusses operational strategies and technological innovation at the Port of Houston.',
      start_time: '2026-03-24T13:00:00',
      end_time: '2026-03-24T14:30:00',
      room_id: '2',
      room: rooms[1],
      type: 'panel',
      track: 'Operations',
      speakers: [speakers[1], speakers[2], speakers[3]],
    },
    {
      id: '4',
      title: 'Networking Reception',
      description: 'Connect with fellow attendees, speakers, and exhibitors in a relaxed setting.',
      start_time: '2026-03-24T17:00:00',
      end_time: '2026-03-24T19:00:00',
      room_id: '1',
      room: rooms[0],
      type: 'networking',
      track: 'Networking',
      speakers: [],
    },
    {
      id: '5',
      title: 'Day 2 Keynote: Legal and Financial Frameworks for Port Development',
      description: 'Exploring the legal and financial strategies that support modern port operations.',
      start_time: '2026-03-25T09:00:00',
      end_time: '2026-03-25T10:00:00',
      room_id: '1',
      room: rooms[0],
      type: 'keynote',
      track: 'Finance & Legal',
      speakers: [speakers[4]],
    },
    {
      id: '6',
      title: 'Panel: Governance and Commission Leadership',
      description: 'Port Commissioners share insights on governance, strategic planning, and industry collaboration.',
      start_time: '2026-03-25T10:30:00',
      end_time: '2026-03-25T12:00:00',
      room_id: '2',
      room: rooms[1],
      type: 'panel',
      track: 'Governance',
      speakers: [speakers[8], speakers[9], speakers[10], speakers[11]],
    },
  ];
}

function getMockExhibitors(): Exhibitor[] {
  return [
    {
      id: '1',
      name: 'Maritime Tech Solutions',
      description: 'Leading provider of port automation and IoT solutions.',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
      booth_number: 'A101',
      category: 'Technology',
      website: 'https://maritimetech.example.com',
      map_x: 100,
      map_y: 150,
    },
    {
      id: '2',
      name: 'Green Shipping Co.',
      description: 'Sustainable shipping solutions and carbon-neutral logistics.',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200',
      booth_number: 'B205',
      category: 'Sustainability',
      website: 'https://greenshipping.example.com',
      map_x: 250,
      map_y: 150,
    },
    {
      id: '3',
      name: 'Port Equipment Inc.',
      description: 'Heavy machinery and equipment for modern port operations.',
      logo: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200',
      booth_number: 'C310',
      category: 'Equipment',
      website: 'https://portequipment.example.com',
      map_x: 400,
      map_y: 150,
    },
  ];
}

function getMockSponsors(): Sponsor[] {
  return [
    {
      id: '1',
      name: 'Port of Houston Authority',
      description: 'Proud host of the Port of the Future Conference 2026.',
      tier: 'platinum',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300',
      website: 'https://portofhouston.com',
      display_order: 1,
    },
    {
      id: '2',
      name: 'Global Maritime Alliance',
      description: 'Supporting innovation in the maritime industry worldwide.',
      tier: 'gold',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300',
      website: 'https://globalmaritimealliance.com',
      display_order: 2,
    },
    {
      id: '3',
      name: 'Tech Innovations Ltd.',
      description: 'Advancing technology solutions for modern ports.',
      tier: 'silver',
      logo: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300',
      website: 'https://techinnovations.com',
      display_order: 3,
    },
  ];
}

function getMockPorts(): Port[] {
  return [
    {
      id: '1',
      name: 'Port of Houston',
      link: 'https://portofhouston.com',
      logo: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=300',
    },
    {
      id: '2',
      name: 'Port of Long Beach',
      link: 'https://polb.com',
      logo: 'https://images.unsplash.com/photo-1605648916319-cf082f7524a1?w=300',
    },
    {
      id: '3',
      name: 'Port of Los Angeles',
      link: 'https://portoflosangeles.org',
      logo: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=300',
    },
    {
      id: '4',
      name: 'Port of New York and New Jersey',
      link: 'https://panynj.gov',
      logo: 'https://images.unsplash.com/photo-1546436836-07a91091f160?w=300',
    },
  ];
}

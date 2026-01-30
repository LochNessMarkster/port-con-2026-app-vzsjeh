
import { useState, useEffect } from 'react';
import { Session, Speaker, Exhibitor, Sponsor, Room } from '@/types/conference';
import { apiGet, isBackendConfigured } from '@/utils/api';

export function useConferenceData() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching conference data from API...');
      
      // Check if backend is configured
      if (!isBackendConfigured()) {
        console.log('Backend not configured, using mock data');
        setSessions(getMockSessions());
        setSpeakers(getMockSpeakers());
        setExhibitors(getMockExhibitors());
        setSponsors(getMockSponsors());
        setRooms(getMockRooms());
        setLoading(false);
        return;
      }

      // Fetch data from API endpoints
      const [sessionsData, speakersData, exhibitorsData, sponsorsData, roomsData] = await Promise.all([
        apiGet<Session[]>('/api/sessions').catch(err => {
          console.error('Error fetching sessions:', err);
          return getMockSessions();
        }),
        apiGet<Speaker[]>('/api/speakers').catch(err => {
          console.error('Error fetching speakers:', err);
          return getMockSpeakers();
        }),
        apiGet<Exhibitor[]>('/api/exhibitors').catch(err => {
          console.error('Error fetching exhibitors:', err);
          return getMockExhibitors();
        }),
        apiGet<Sponsor[]>('/api/sponsors').catch(err => {
          console.error('Error fetching sponsors:', err);
          return getMockSponsors();
        }),
        apiGet<Room[]>('/api/rooms').catch(err => {
          console.error('Error fetching rooms:', err);
          return getMockRooms();
        }),
      ]);

      console.log('Conference data fetched successfully');
      console.log('Sessions:', sessionsData.length);
      console.log('Speakers:', speakersData.length);
      console.log('Exhibitors:', exhibitorsData.length);
      console.log('Sponsors:', sponsorsData.length);
      console.log('Rooms:', roomsData.length);
      
      // If API returns empty data, use mock data as fallback
      setSessions(sessionsData.length > 0 ? sessionsData : getMockSessions());
      setSpeakers(speakersData.length > 0 ? speakersData : getMockSpeakers());
      setExhibitors(exhibitorsData.length > 0 ? exhibitorsData : getMockExhibitors());
      setSponsors(sponsorsData.length > 0 ? sponsorsData : getMockSponsors());
      setRooms(roomsData.length > 0 ? roomsData : getMockRooms());
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conference data:', err);
      setError('Failed to load conference data');
      // Fallback to mock data on error
      setSessions(getMockSessions());
      setSpeakers(getMockSpeakers());
      setExhibitors(getMockExhibitors());
      setSponsors(getMockSponsors());
      setRooms(getMockRooms());
      setLoading(false);
    }
  };

  const refetch = () => {
    console.log('Refetching conference data...');
    fetchData();
  };

  return {
    sessions,
    speakers,
    exhibitors,
    sponsors,
    rooms,
    loading,
    error,
    refetch,
    setSpeakers,
    setSessions,
    setExhibitors,
    setSponsors,
    setRooms,
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
      linkedin_url: '',
    },
    {
      id: '2',
      name: 'John Moseley',
      title: 'Chief Operating Officer',
      company: 'Port of Houston Authority',
      bio: 'Overseeing operational excellence and innovation at the Port of Houston.',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      linkedin_url: '',
    },
    {
      id: '3',
      name: 'Ricky Kunz',
      title: 'Chief Commercial Officer',
      company: 'Port of Houston Authority',
      bio: 'Driving commercial growth and strategic partnerships for the Port of Houston.',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
      linkedin_url: '',
    },
    {
      id: '4',
      name: 'Erica Ramos',
      title: 'Chief Financial Officer',
      company: 'Port of Houston Authority',
      bio: 'Managing financial strategy and operations for the Port of Houston Authority.',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
      linkedin_url: '',
    },
    {
      id: '5',
      name: 'Trey Howell',
      title: 'Chief Legal Officer',
      company: 'Port of Houston Authority',
      bio: 'Providing legal guidance and oversight for the Port of Houston Authority.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      linkedin_url: '',
    },
    {
      id: '6',
      name: 'Ric Campo',
      title: 'Chairman',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Leading the Port Commission with strategic vision and industry expertise.',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      linkedin_url: '',
    },
    {
      id: '7',
      name: 'Clint Carlson',
      title: 'Vice Chairman',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Supporting the Port Commission with extensive maritime industry knowledge.',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      linkedin_url: '',
    },
    {
      id: '8',
      name: 'Wendy Montoya Cloonan',
      title: 'Commissioner',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Contributing strategic insights and governance to the Port Commission.',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
      linkedin_url: '',
    },
    {
      id: '9',
      name: 'Roy D. Mease',
      title: 'Commissioner',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Providing leadership and strategic direction for port development.',
      photo: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400',
      linkedin_url: '',
    },
    {
      id: '10',
      name: 'Dean E. Corgey',
      title: 'Commissioner',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Bringing industry expertise and strategic vision to the Port Commission.',
      photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
      linkedin_url: '',
    },
    {
      id: '11',
      name: 'Cheryl Creuzot',
      title: 'Commissioner',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Contributing to the strategic development and governance of the Port of Houston.',
      photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
      linkedin_url: '',
    },
    {
      id: '12',
      name: 'Stephen DonCarlos',
      title: 'Commissioner',
      company: 'Port Commission of the Port of Houston Authority',
      bio: 'Supporting port operations and strategic initiatives with industry knowledge.',
      photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400',
      linkedin_url: '',
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

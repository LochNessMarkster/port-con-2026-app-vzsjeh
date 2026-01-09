
import { useState, useEffect } from 'react';
import { Session, Speaker, Exhibitor, Sponsor, Room } from '@/types/conference';

// TODO: Backend Integration - Replace mock data with API calls
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
      // TODO: Backend Integration - Fetch data from API endpoints
      // const [sessionsRes, speakersRes, exhibitorsRes, sponsorsRes, roomsRes] = await Promise.all([
      //   fetch('/api/sessions'),
      //   fetch('/api/speakers'),
      //   fetch('/api/exhibitors'),
      //   fetch('/api/sponsors'),
      //   fetch('/api/rooms'),
      // ]);
      
      // Mock data for now
      setSessions(getMockSessions());
      setSpeakers(getMockSpeakers());
      setExhibitors(getMockExhibitors());
      setSponsors(getMockSponsors());
      setRooms(getMockRooms());
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conference data:', err);
      setError('Failed to load conference data');
      setLoading(false);
    }
  };

  const refetch = () => {
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
      name: 'Dr. Sarah Chen',
      title: 'Chief Innovation Officer',
      company: 'Port of Houston Authority',
      bio: 'Leading digital transformation initiatives in port operations with over 15 years of experience in maritime technology.',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
      linkedin_url: 'https://linkedin.com/in/sarahchen',
    },
    {
      id: '2',
      name: 'Michael Rodriguez',
      title: 'VP of Operations',
      company: 'Global Shipping Solutions',
      bio: 'Expert in supply chain optimization and sustainable port operations.',
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
      linkedin_url: 'https://linkedin.com/in/mrodriguez',
    },
    {
      id: '3',
      name: 'Jennifer Park',
      title: 'Director of Sustainability',
      company: 'Green Maritime Alliance',
      bio: 'Passionate about environmental initiatives in the maritime industry.',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    },
  ];
}

function getMockSessions(): Session[] {
  const speakers = getMockSpeakers();
  const rooms = getMockRooms();
  
  return [
    {
      id: '1',
      title: 'Opening Keynote: The Future of Maritime Technology',
      description: 'Join us for an inspiring keynote on the latest innovations transforming port operations worldwide.',
      start_time: '2026-03-24T09:00:00',
      end_time: '2026-03-24T10:00:00',
      room_id: '1',
      room: rooms[0],
      type: 'keynote',
      track: 'Technology',
      speakers: [speakers[0]],
    },
    {
      id: '2',
      title: 'Panel: Sustainable Port Operations',
      description: 'Industry leaders discuss strategies for reducing environmental impact while maintaining efficiency.',
      start_time: '2026-03-24T10:30:00',
      end_time: '2026-03-24T11:30:00',
      room_id: '2',
      room: rooms[1],
      type: 'panel',
      track: 'Sustainability',
      speakers: [speakers[1], speakers[2]],
    },
    {
      id: '3',
      title: 'Workshop: AI in Supply Chain Management',
      description: 'Hands-on workshop exploring practical applications of artificial intelligence in logistics.',
      start_time: '2026-03-24T13:00:00',
      end_time: '2026-03-24T15:00:00',
      room_id: '4',
      room: rooms[3],
      type: 'workshop',
      track: 'Technology',
      speakers: [speakers[0]],
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
      title: 'Day 2 Keynote: Digital Transformation in Ports',
      description: 'Exploring how digital technologies are revolutionizing port operations and logistics.',
      start_time: '2026-03-25T09:00:00',
      end_time: '2026-03-25T10:00:00',
      room_id: '1',
      room: rooms[0],
      type: 'keynote',
      track: 'Technology',
      speakers: [speakers[1]],
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

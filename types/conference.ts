
export interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  photo: string;
  speakingTopic?: string;
  synopsis?: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  room_id: string;
  room?: Room;
  type: 'keynote' | 'panel' | 'networking';
  track: string;
  speakers: Speaker[];
  isBookmarked?: boolean;
}

export interface Exhibitor {
  id: string;
  name: string;
  description: string;
  logo: string;
  booth_number: string;
  category: string;
  website?: string;
  map_x?: number;
  map_y?: number;
}

export interface Sponsor {
  id: string;
  name: string;
  description: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  logo: string;
  website?: string;
  display_order: number;
}

export interface Port {
  id: string;
  name: string;
  link?: string;
  logo?: string;
}

export type SessionType = Session['type'];
export type SponsorTier = Sponsor['tier'];

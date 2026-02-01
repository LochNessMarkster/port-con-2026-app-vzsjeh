import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export interface ScrapedSession {
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  type: string | null;
  track: string | null;
  speakers: string[];
  room: string | null;
}

export async function scrapeSchedule(): Promise<ScrapedSession[]> {
  try {
    const url = 'https://portofthefutureconference.com/conference-agenda/shedule-of-events/';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch schedule: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const sessions: ScrapedSession[] = [];

    // Try multiple selectors to find session elements
    const sessionSelectors = [
      '.schedule-item',
      '.session',
      '.event-item',
      '[data-schedule]',
      '.agenda-item',
      '.schedule-row',
    ];

    let sessionElements: cheerio.Cheerio<any> | null = null;
    for (const selector of sessionSelectors) {
      sessionElements = $(selector);
      if (sessionElements.length > 0) {
        break;
      }
    }

    if (!sessionElements || sessionElements.length === 0) {
      throw new Error('No session elements found on the page. The page structure may have changed.');
    }

    sessionElements.each((index, element) => {
      const $el = $(element);

      // Extract title
      const titleSelectors = ['.title', '.session-title', 'h3', 'h4', '[data-title]', '.event-name'];
      let title = '';
      for (const sel of titleSelectors) {
        const titleEl = $el.find(sel).first();
        if (titleEl.length > 0) {
          title = titleEl.text().trim();
          break;
        }
        if (title.length === 0) {
          const directTitle = $el.children('h3, h4').first().text().trim();
          if (directTitle.length > 0) {
            title = directTitle;
            break;
          }
        }
      }

      // Extract time information
      const timeSelectors = [
        '.time',
        '.start-time',
        '.event-time',
        '[data-time]',
        '.time-slot',
      ];
      let timeText = '';
      for (const sel of timeSelectors) {
        const timeEl = $el.find(sel).first();
        if (timeEl.length > 0) {
          timeText = timeEl.text().trim();
          break;
        }
      }

      // Extract description
      const descSelectors = [
        '.description',
        '.event-description',
        '.summary',
        '.details',
        'p',
      ];
      let description = '';
      for (const sel of descSelectors) {
        const descEl = $el.find(sel).first();
        if (descEl.length > 0) {
          description = descEl.text().trim();
          break;
        }
      }

      // Extract speakers
      const speakersText = $el
        .find('.speaker, .speakers, .presenter, [data-speakers]')
        .text()
        .trim();
      const speakers = speakersText
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Extract room/location
      const roomSelectors = ['.room', '.location', '.venue', '[data-room]'];
      let room = '';
      for (const sel of roomSelectors) {
        const roomEl = $el.find(sel).first();
        if (roomEl.length > 0) {
          room = roomEl.text().trim();
          break;
        }
      }

      // Parse time and create ISO 8601 format
      const { startTime, endTime } = parseSessionTime(timeText);

      // Infer session type based on title
      const type = inferSessionType(title);

      // Extract or infer track
      const track = inferTrack(title, description);

      if (title.length > 0) {
        sessions.push({
          title,
          description: description.length > 0 ? description : null,
          startTime,
          endTime,
          type,
          track,
          speakers,
          room: room.length > 0 ? room : null,
        });
      }
    });

    if (sessions.length === 0) {
      throw new Error('No sessions could be extracted from the page.');
    }

    return sessions;
  } catch (error) {
    throw error;
  }
}

function parseSessionTime(timeText: string): { startTime: string; endTime: string } {
  // Parse time formats like "9:00 AM - 10:00 AM" or "09:00-10:00"
  const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
  const match = timeText.match(timeRegex);

  // Default to 9:00 AM - 10:00 AM if parsing fails
  let startHour = 9;
  let startMinute = 0;
  let endHour = 10;
  let endMinute = 0;

  if (match) {
    startHour = parseInt(match[1], 10);
    startMinute = parseInt(match[2], 10);
    const startPeriod = match[3]?.toUpperCase();
    endHour = parseInt(match[4], 10);
    endMinute = parseInt(match[5], 10);
    const endPeriod = match[6]?.toUpperCase();

    // Convert to 24-hour format
    if (startPeriod === 'PM' && startHour !== 12) {
      startHour += 12;
    } else if (startPeriod === 'AM' && startHour === 12) {
      startHour = 0;
    }

    if (endPeriod === 'PM' && endHour !== 12) {
      endHour += 12;
    } else if (endPeriod === 'AM' && endHour === 12) {
      endHour = 0;
    }
  }

  // Create ISO 8601 timestamps for March 24, 2026 (UTC)
  const startTime = new Date(2026, 2, 24, startHour, startMinute, 0, 0).toISOString();
  const endTime = new Date(2026, 2, 24, endHour, endMinute, 0, 0).toISOString();

  return { startTime, endTime };
}

function inferSessionType(title: string): string {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('keynote')) return 'keynote';
  if (titleLower.includes('panel')) return 'panel';
  if (titleLower.includes('workshop')) return 'workshop';
  if (titleLower.includes('networking')) return 'networking';
  if (titleLower.includes('breakfast')) return 'breakfast';
  if (titleLower.includes('lunch')) return 'lunch';
  if (titleLower.includes('coffee')) return 'break';
  if (titleLower.includes('break')) return 'break';
  if (titleLower.includes('reception')) return 'reception';
  if (titleLower.includes('dinner')) return 'dinner';

  return 'session';
}

function inferTrack(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase();

  if (
    text.includes('port') ||
    text.includes('shipping') ||
    text.includes('logistics') ||
    text.includes('maritime')
  ) {
    return 'Ports & Maritime';
  }
  if (text.includes('technology') || text.includes('digital') || text.includes('innovation')) {
    return 'Technology';
  }
  if (text.includes('sustainability') || text.includes('environment') || text.includes('green')) {
    return 'Sustainability';
  }
  if (text.includes('leadership') || text.includes('strategy') || text.includes('management')) {
    return 'Leadership';
  }
  if (text.includes('business') || text.includes('commerce') || text.includes('trade')) {
    return 'Business';
  }

  return null;
}

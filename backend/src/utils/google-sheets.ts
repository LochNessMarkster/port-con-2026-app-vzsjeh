/**
 * Google Sheets integration utilities
 * Fetches data from Google Sheets using the public API
 */

interface GoogleSheetsResponse {
  values: string[][];
}

interface PreviewResult {
  headers: string[];
  rows: any[][];
  valid: boolean;
  errors: string[];
}

/**
 * Fetch data from a public Google Sheet
 */
export async function fetchGoogleSheetData(
  spreadsheetId: string,
  sheetName: string = 'Sheet1'
): Promise<GoogleSheetsResponse> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;

    if (!data.values || data.values.length === 0) {
      throw new Error('No data found in sheet');
    }

    return { values: data.values as string[][] };
  } catch (error) {
    throw new Error(
      `Failed to fetch Google Sheet: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get a preview of Google Sheet data
 */
export async function previewGoogleSheetData(
  spreadsheetId: string,
  sheetName: string = 'Sheet1',
  maxRows: number = 5
): Promise<PreviewResult> {
  const errors: string[] = [];

  try {
    const data = await fetchGoogleSheetData(spreadsheetId, sheetName);
    const rows = data.values.slice(0, maxRows + 1); // +1 for header

    if (rows.length === 0) {
      return {
        headers: [],
        rows: [],
        valid: false,
        errors: ['No data found in sheet'],
      };
    }

    const headers = rows[0] || [];
    const previewRows = rows.slice(1).map(row => {
      // Ensure all columns are present
      return headers.map((_, idx) => row[idx] || '');
    });

    return {
      headers,
      rows: previewRows,
      valid: true,
      errors,
    };
  } catch (error) {
    return {
      headers: [],
      rows: [],
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Validate exhibitor row data
 */
export function validateExhibitorRow(
  row: string[],
  requiredColumns: {
    name: number;
    description?: number;
    logo?: number;
    boothNumber?: number;
    category?: number;
    website?: number;
    mapX?: number;
    mapY?: number;
  }
): { valid: boolean; error?: string } {
  // Check if required name column exists and has value
  if (requiredColumns.name >= row.length || !row[requiredColumns.name]?.trim()) {
    return { valid: false, error: 'Name is required' };
  }

  return { valid: true };
}

/**
 * Validate session row data
 */
export function validateSessionRow(
  row: string[],
  requiredColumns: {
    title: number;
    startTime: number;
    endTime: number;
    description?: number;
    roomName?: number;
    type?: number;
    track?: number;
    speakers?: number;
  }
): { valid: boolean; error?: string } {
  // Check title
  if (requiredColumns.title >= row.length || !row[requiredColumns.title]?.trim()) {
    return { valid: false, error: 'Title is required' };
  }

  // Check startTime
  if (requiredColumns.startTime >= row.length || !row[requiredColumns.startTime]?.trim()) {
    return { valid: false, error: 'Start Time is required' };
  }

  // Check endTime
  if (requiredColumns.endTime >= row.length || !row[requiredColumns.endTime]?.trim()) {
    return { valid: false, error: 'End Time is required' };
  }

  // Validate ISO 8601 format for times
  const startTime = row[requiredColumns.startTime]?.trim();
  const endTime = row[requiredColumns.endTime]?.trim();

  if (startTime && isNaN(new Date(startTime).getTime())) {
    return { valid: false, error: `Invalid Start Time format: ${startTime}` };
  }

  if (endTime && isNaN(new Date(endTime).getTime())) {
    return { valid: false, error: `Invalid End Time format: ${endTime}` };
  }

  return { valid: true };
}

/**
 * Parse exhibitor row from Google Sheet
 */
export function parseExhibitorRow(
  row: string[],
  columnMap: Record<string, number>
): {
  name: string;
  description: string | null;
  logo: string | null;
  boothNumber: string | null;
  category: string | null;
  website: string | null;
  mapX: number | null;
  mapY: number | null;
} {
  const getValue = (key: string) => {
    const idx = columnMap[key];
    if (idx === undefined || idx >= row.length) return null;
    const val = row[idx]?.trim();
    return val && val !== '' ? val : null;
  };

  const mapX = getValue('Map X');
  const mapY = getValue('Map Y');

  return {
    name: row[columnMap['Name']].trim(),
    description: getValue('Description'),
    logo: getValue('Logo URL'),
    boothNumber: getValue('Booth Number'),
    category: getValue('Category'),
    website: getValue('Website'),
    mapX: mapX ? parseInt(mapX, 10) : null,
    mapY: mapY ? parseInt(mapY, 10) : null,
  };
}

/**
 * Parse time string to ISO format
 * Supports: "10:00 AM", "10:00", "2026-03-24", "2026-03-24T10:00:00Z", etc.
 */
function parseTimeToISO(timeStr: string, dateStr?: string): string {
  if (!timeStr) return new Date().toISOString();

  timeStr = timeStr.trim();

  // If already ISO 8601 format, return as-is
  if (timeStr.includes('T') && (timeStr.includes('Z') || timeStr.includes('+'))) {
    return timeStr;
  }

  let dateForParsing = dateStr?.trim();

  // If date is provided, combine date and time
  if (dateForParsing) {
    // Normalize date format (support YYYY-MM-DD, M/D/YYYY, etc)
    if (dateForParsing.includes('/')) {
      const parts = dateForParsing.split('/');
      if (parts.length === 3) {
        // Handle M/D/YYYY format
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        dateForParsing = `${year}-${month}-${day}`;
      }
    }

    // Combine date with time
    let isoTime = timeStr;

    // Convert 12-hour format to 24-hour if needed
    if (timeStr.match(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)/i)) {
      isoTime = convertTo24HourFormat(timeStr);
    } else if (!timeStr.includes(':')) {
      // If just a number, assume hours
      isoTime = `${timeStr}:00`;
    }

    return `${dateForParsing}T${isoTime}:00Z`;
  }

  // If no date, use today and parse time
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];

  // Convert 12-hour format to 24-hour if needed
  let isoTime = timeStr;
  if (timeStr.match(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)/i)) {
    isoTime = convertTo24HourFormat(timeStr);
  } else if (!timeStr.includes(':')) {
    isoTime = `${timeStr}:00`;
  }

  // Ensure proper format
  if (!isoTime.includes(':')) {
    isoTime = `${isoTime}:00`;
  }

  return `${todayISO}T${isoTime}:00Z`;
}

/**
 * Convert 12-hour format time to 24-hour format
 */
function convertTo24HourFormat(time12: string): string {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (!match) return time12;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

/**
 * Parse session row from Google Sheet
 * Supports both formats: (Title, Description, Start Time, End Time, ...) and
 * (Title, Date, Start Time, Room, Type/Track, Session Description, Speaker's First, Speaker's Last)
 */
export function parseSessionRow(
  row: string[],
  columnMap: Record<string, number>
): {
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  roomName: string | null;
  type: string | null;
  track: string | null;
  speakers: string[];
} {
  const getValue = (key: string) => {
    const idx = columnMap[key];
    if (idx === undefined || idx >= row.length) return null;
    const val = row[idx]?.trim();
    return val && val !== '' ? val : null;
  };

  // Get title (required)
  const title = row[columnMap['Title']]?.trim() || '';

  // Get description (try both column names)
  const description = getValue('Description');

  // Get date if available (for combining with start time)
  const dateValue = getValue('Date');

  // Get start time (required)
  const startTimeValue = getValue('Start Time') || '';
  const startTime = parseTimeToISO(startTimeValue, dateValue);

  // Get end time - if not provided, default to 1 hour after start
  let endTime = getValue('End Time');
  if (!endTime) {
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
    endTime = endDate.toISOString();
  } else {
    endTime = parseTimeToISO(endTime, dateValue);
  }

  // Get room (try both column names)
  const roomName = getValue('Room Name');

  // Get type and track
  // Check for Type/Track combined column first
  const typeTrackValue = getValue('Type');
  let type: string | null = null;
  let track: string | null = null;

  if (typeTrackValue && typeTrackValue.includes('/')) {
    // Split Type/Track format
    const [t, tr] = typeTrackValue.split('/').map(s => s.trim());
    type = t || null;
    track = tr || null;
  } else {
    // Individual Type and Track columns
    type = typeTrackValue;
    track = getValue('Track');
  }

  // Get speakers (support both formats)
  let speakers: string[] = [];

  // Format 1: Speaker Names (comma-separated)
  const speakersValue = getValue('Speaker Names');
  if (speakersValue) {
    speakers = speakersValue
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '');
  } else {
    // Format 2: Speaker's First and Speaker's Last
    const firstName = getValue('Speakers First');
    const lastName = getValue('Speakers Last');

    if (firstName || lastName) {
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      if (fullName) {
        speakers = [fullName];
      }
    }
  }

  return {
    title,
    description,
    startTime,
    endTime,
    roomName,
    type,
    track,
    speakers,
  };
}

/**
 * Find column indices by header names with alias support
 */
export function findColumnIndices(
  headers: string[],
  columnNames: {
    required: string[];
    optional: string[];
  }
): { valid: boolean; indices: Record<string, number>; errors: string[] } {
  const errors: string[] = [];
  const indices: Record<string, number> = {};

  // Normalize header for comparison (lowercase, remove spaces and special chars)
  const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Define column aliases for flexible matching
  const columnAliases: Record<string, string[]> = {
    'Description': ['Description', 'Session Description', 'SessionDescription'],
    'Room Name': ['Room Name', 'Room', 'RoomName'],
    'Type': ['Type', 'Type/Track', 'Type/track', 'TypeTrack'],
    'Track': ['Track'],
    'Speaker Names': ['Speaker Names', 'SpeakerNames'],
    'Speakers First': ["Speaker's First", 'Speakers First', 'SpeakersFirst', "Speaker'sFirst"],
    'Speakers Last': ["Speaker's Last", 'Speakers Last', 'SpeakersLast', "Speaker'sLast"],
    'Start Time': ['Start Time', 'StartTime'],
    'End Time': ['End Time', 'EndTime'],
    'Date': ['Date'],
    'Title': ['Title'],
  };

  // Find required columns
  for (const colName of columnNames.required) {
    let found = false;
    const aliases = columnAliases[colName] || [colName];
    const normalizedAliases = aliases.map(normalizeHeader);

    for (let i = 0; i < headers.length; i++) {
      if (normalizedAliases.includes(normalizeHeader(headers[i]))) {
        indices[colName] = i;
        found = true;
        break;
      }
    }

    if (!found) {
      errors.push(`Required column not found: "${colName}"`);
    }
  }

  // Find optional columns (try all aliases)
  for (const colName of columnNames.optional) {
    if (!indices[colName]) {
      const aliases = columnAliases[colName] || [colName];
      const normalizedAliases = aliases.map(normalizeHeader);

      for (let i = 0; i < headers.length; i++) {
        if (normalizedAliases.includes(normalizeHeader(headers[i]))) {
          indices[colName] = i;
          break;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    indices,
    errors,
  };
}

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
 * Parse session row from Google Sheet
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

  const speakersValue = getValue('Speaker Names');
  const speakers = speakersValue
    ?.split(',')
    .map(s => s.trim())
    .filter(s => s !== '') || [];

  return {
    title: row[columnMap['Title']].trim(),
    description: getValue('Description'),
    startTime: row[columnMap['Start Time']].trim(),
    endTime: row[columnMap['End Time']].trim(),
    roomName: getValue('Room Name'),
    type: getValue('Type'),
    track: getValue('Track'),
    speakers,
  };
}

/**
 * Find column indices by header names
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

  // Find required columns
  for (const colName of columnNames.required) {
    const idx = headers.findIndex(h => h.toLowerCase().replace(/\s+/g, '') === colName.toLowerCase().replace(/\s+/g, ''));
    if (idx === -1) {
      errors.push(`Required column not found: "${colName}"`);
    } else {
      indices[colName] = idx;
    }
  }

  // Find optional columns
  for (const colName of columnNames.optional) {
    const idx = headers.findIndex(h => h.toLowerCase().replace(/\s+/g, '') === colName.toLowerCase().replace(/\s+/g, ''));
    if (idx !== -1) {
      indices[colName] = idx;
    }
  }

  return {
    valid: errors.length === 0,
    indices,
    errors,
  };
}

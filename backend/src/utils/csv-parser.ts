import Papa from 'papaparse';

export interface CSVParseOptions {
  header: boolean;
  skipEmptyLines: boolean;
  dynamicTyping: boolean;
}

export interface ExhibitorCSVRow {
  name: string;
  description?: string;
  logo?: string;
  boothNumber?: string;
  category?: string;
  website?: string;
  mapX?: string | number;
  mapY?: string | number;
}

export interface SessionCSVRow {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  roomName?: string;
  type?: string;
  track?: string;
  speakerNames?: string;
}

export function parseCSV(csvContent: string): any[] {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing error: ${result.errors[0].message}`);
  }

  return result.data as any[];
}

export function validateExhibitorRow(row: any, rowIndex: number): { valid: boolean; error?: string } {
  if (!row.name || typeof row.name !== 'string' || row.name.trim().length === 0) {
    return { valid: false, error: `Row ${rowIndex}: name is required` };
  }

  if (row.mapX && isNaN(Number(row.mapX))) {
    return { valid: false, error: `Row ${rowIndex}: mapX must be a number` };
  }

  if (row.mapY && isNaN(Number(row.mapY))) {
    return { valid: false, error: `Row ${rowIndex}: mapY must be a number` };
  }

  return { valid: true };
}

export function validateSessionRow(row: any, rowIndex: number): { valid: boolean; error?: string } {
  if (!row.title || typeof row.title !== 'string' || row.title.trim().length === 0) {
    return { valid: false, error: `Row ${rowIndex}: title is required` };
  }

  if (!row.startTime || isNaN(new Date(row.startTime).getTime())) {
    return { valid: false, error: `Row ${rowIndex}: startTime must be a valid ISO 8601 date` };
  }

  if (!row.endTime || isNaN(new Date(row.endTime).getTime())) {
    return { valid: false, error: `Row ${rowIndex}: endTime must be a valid ISO 8601 date` };
  }

  return { valid: true };
}

export function parseExhibitorRow(row: any): any {
  const result: any = {
    name: row.name?.trim() || '',
    description: row.description?.trim() || undefined,
    logo: row.logo?.trim() || undefined,
    boothNumber: row.boothNumber?.trim() || undefined,
    category: row.category?.trim() || undefined,
    website: row.website?.trim() || undefined,
  };

  // Parse mapX and mapY as numbers only if they have valid values
  if (row.mapX && !isNaN(Number(row.mapX))) {
    result.mapX = parseInt(String(row.mapX), 10);
  }
  if (row.mapY && !isNaN(Number(row.mapY))) {
    result.mapY = parseInt(String(row.mapY), 10);
  }

  return result;
}

export function parseSessionRow(row: any): any {
  return {
    title: row.title?.trim() || '',
    description: row.description?.trim() || undefined,
    startTime: row.startTime?.trim() || '',
    endTime: row.endTime?.trim() || '',
    roomName: row.roomName?.trim() || undefined,
    type: row.type?.trim() || undefined,
    track: row.track?.trim() || undefined,
    speakerNames: row.speakerNames?.trim() || undefined,
  };
}

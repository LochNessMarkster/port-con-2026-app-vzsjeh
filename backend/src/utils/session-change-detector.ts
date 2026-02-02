import type { App } from '../index.js';
import * as schema from '../db/schema.js';

export interface SessionUpdateData {
  title?: string;
  description?: string | null;
  startTime?: Date;
  endTime?: Date;
  roomId?: string | null;
  type?: string | null;
  track?: string | null;
}

export interface SessionChange {
  changeType: 'time_change' | 'room_change' | 'cancellation';
  description: string;
  oldValue?: string;
  newValue?: string;
}

export async function detectSessionChanges(
  app: App,
  sessionId: string,
  oldData: any,
  newData: SessionUpdateData
): Promise<SessionChange[]> {
  const changes: SessionChange[] = [];

  // Check for time changes
  if (newData.startTime && oldData.startTime) {
    const oldTime = new Date(oldData.startTime);
    const newTime = newData.startTime;

    if (oldTime.getTime() !== newTime.getTime()) {
      const oldStr = formatTime(oldTime);
      const newStr = formatTime(newTime);
      changes.push({
        changeType: 'time_change',
        description: `Session time changed from ${oldStr} to ${newStr}`,
        oldValue: oldStr,
        newValue: newStr,
      });
    }
  }

  if (newData.endTime && oldData.endTime) {
    const oldTime = new Date(oldData.endTime);
    const newTime = newData.endTime;

    if (oldTime.getTime() !== newTime.getTime()) {
      const oldStr = formatTime(oldTime);
      const newStr = formatTime(newTime);
      changes.push({
        changeType: 'time_change',
        description: `End time changed from ${oldStr} to ${newStr}`,
        oldValue: oldStr,
        newValue: newStr,
      });
    }
  }

  // Check for room changes
  if (newData.roomId !== undefined && oldData.roomId !== newData.roomId) {
    let oldRoomName = 'No room assigned';
    let newRoomName = 'No room assigned';

    if (oldData.roomId) {
      const oldRoom = await app.db.query.rooms.findFirst({
        where: (rooms, { eq }) => eq(rooms.id, oldData.roomId),
      });
      if (oldRoom) oldRoomName = oldRoom.name;
    }

    if (newData.roomId) {
      const newRoom = await app.db.query.rooms.findFirst({
        where: (rooms, { eq }) => eq(rooms.id, newData.roomId),
      });
      if (newRoom) newRoomName = newRoom.name;
    }

    changes.push({
      changeType: 'room_change',
      description: `Room changed from ${oldRoomName} to ${newRoomName}`,
      oldValue: oldRoomName,
      newValue: newRoomName,
    });
  }

  return changes;
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours || 12;

  return `${displayHours}:${minutes} ${period}`;
}

export async function recordSessionChange(
  app: App,
  sessionId: string,
  changeType: 'time_change' | 'room_change' | 'cancellation',
  oldValue: string | null,
  newValue: string | null
): Promise<void> {
  await app.db
    .insert(schema.sessionChanges)
    .values({
      sessionId,
      changeType,
      oldValue,
      newValue,
    });
}

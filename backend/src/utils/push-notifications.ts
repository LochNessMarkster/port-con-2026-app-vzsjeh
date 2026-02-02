import * as Expo from 'expo-server-sdk';

const expo = new Expo.Expo();

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(
  token: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!Expo.Expo.isExpoPushToken(token)) {
    console.error(`Invalid Expo push token: ${token}`);
    return false;
  }

  try {
    await expo.sendPushNotificationsAsync([
      {
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      },
    ]);
    return true;
  } catch (error) {
    console.error(`Failed to send push notification: ${error}`);
    return false;
  }
}

export async function sendPushNotificationsToMultiple(
  tokens: string[],
  payload: PushNotificationPayload
): Promise<number> {
  let successCount = 0;

  const validTokens = tokens.filter((token) => Expo.Expo.isExpoPushToken(token));

  if (validTokens.length === 0) {
    return 0;
  }

  const messages = validTokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
  }));

  try {
    const tickets = await expo.sendPushNotificationsAsync(messages);
    successCount = tickets.filter((ticket) => ticket.status === 'ok').length;
  } catch (error) {
    console.error(`Failed to send push notifications: ${error}`);
  }

  return successCount;
}

export function formatSessionTime(startTime: Date, endTime: Date): string {
  const startHour = startTime.getHours();
  const startMin = String(startTime.getMinutes()).padStart(2, '0');
  const endHour = endTime.getHours();
  const endMin = String(endTime.getMinutes()).padStart(2, '0');

  const startPeriod = startHour >= 12 ? 'PM' : 'AM';
  const endPeriod = endHour >= 12 ? 'PM' : 'AM';

  const displayStartHour = startHour > 12 ? startHour - 12 : startHour || 12;
  const displayEndHour = endHour > 12 ? endHour - 12 : endHour || 12;

  return `${displayStartHour}:${startMin} ${startPeriod} - ${displayEndHour}:${endMin} ${endPeriod}`;
}

export function formatDailyAgenda(sessions: Array<{ title: string; startTime: Date; endTime: Date }>): string {
  if (sessions.length === 0) {
    return 'No sessions scheduled for today';
  }

  return sessions
    .map((session) => {
      const timeStr = formatSessionTime(session.startTime, session.endTime);
      return `${timeStr} - ${session.title}`;
    })
    .join('\n');
}

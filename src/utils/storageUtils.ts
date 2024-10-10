import { PolymarketEvent, NotificationSetting } from '../types';

export async function saveEvent(event: PolymarketEvent): Promise<void> {
  await chrome.storage.local.set({ currentEvent: event });
}

export async function getEvent(): Promise<PolymarketEvent | null> {
  const result = await chrome.storage.local.get('currentEvent');
  return result.currentEvent || null;
}

export async function saveNotificationSetting(setting: NotificationSetting): Promise<boolean> {
  const existingSettings = await getNotificationSettings(setting.eventId);
  
  // Check if a notification with the same minutesBefore already exists
  const duplicateNotification = existingSettings.find(
    existingSetting => existingSetting.minutesBefore === setting.minutesBefore
  );

  if (duplicateNotification) {
    return false; // Notification already exists for this time
  }

  await chrome.storage.local.set({ [`notification_${setting.eventId}_${setting.minutesBefore}`]: setting });
  return true; // Notification was successfully saved
}

export async function getNotificationSetting(eventId: string): Promise<NotificationSetting | null> {
  const result = await chrome.storage.local.get(`notification_${eventId}`);
  return result[`notification_${eventId}`] || null;
}

export async function getNotificationSettings(eventId: string): Promise<NotificationSetting[]> {
  const result = await chrome.storage.local.get(null);
  return Object.entries(result)
    .filter(([key, _]) => key.startsWith(`notification_${eventId}`))
    .map(([_, value]) => value as NotificationSetting);
}

export async function deleteNotificationSetting(setting: NotificationSetting): Promise<void> {
  await chrome.storage.local.remove(`notification_${setting.eventId}_${setting.minutesBefore}`);
}
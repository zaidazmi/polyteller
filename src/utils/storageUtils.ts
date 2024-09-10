import { PolymarketEvent, NotificationSetting } from '../types';

export async function saveEvent(event: PolymarketEvent): Promise<void> {
  await chrome.storage.local.set({ currentEvent: event });
}

export async function getEvent(): Promise<PolymarketEvent | null> {
  const result = await chrome.storage.local.get('currentEvent');
  return result.currentEvent || null;
}

export async function saveNotificationSetting(setting: NotificationSetting): Promise<void> {
  await chrome.storage.local.set({ [`notification_${setting.eventId}`]: setting });
}

export async function getNotificationSetting(eventId: string): Promise<NotificationSetting | null> {
  const result = await chrome.storage.local.get(`notification_${eventId}`);
  return result[`notification_${eventId}`] || null;
}
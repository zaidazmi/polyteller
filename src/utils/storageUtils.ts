import { PolymarketEvent, NotificationSetting } from '../types';
import { log } from './logUtils';
import { getFromStorage, setInStorage, removeFromStorage } from './chromeUtils';
import { STORAGE_KEYS } from './constants';

export async function saveEvent(event: PolymarketEvent): Promise<void> {
  await setInStorage(STORAGE_KEYS.CURRENT_EVENT, event);
}

export async function getEvent(): Promise<PolymarketEvent | null> {
  return await getFromStorage<PolymarketEvent>(STORAGE_KEYS.CURRENT_EVENT);
}

export async function saveNotificationSetting(setting: NotificationSetting): Promise<boolean> {
  const existingSettings = await getNotificationSettings(setting.eventId);
  
  const duplicateNotification = existingSettings.find(
    existingSetting => existingSetting.minutesBefore === setting.minutesBefore
  );

  if (duplicateNotification) {
    return false;
  }

  await setInStorage(`${STORAGE_KEYS.NOTIFICATION_PREFIX}${setting.eventId}_${setting.minutesBefore}`, setting);
  return true;
}

export async function getNotificationSetting(eventId: string): Promise<NotificationSetting | null> {
  return await getFromStorage<NotificationSetting>(`${STORAGE_KEYS.NOTIFICATION_PREFIX}${eventId}`);
}

export async function getNotificationSettings(eventId: string): Promise<NotificationSetting[]> {
  const result = await getFromStorage<{ [key: string]: any }>('null');
  const now = Date.now();
  return Object.entries(result || {})
    .filter(([key, value]) => {
      if (key.startsWith(`${STORAGE_KEYS.NOTIFICATION_PREFIX}${eventId}`)) {
        const notification = value as NotificationSetting;
        const notificationTime = notification.scheduledTime || 0;
        return notificationTime > now && !notification.triggered;
      }
      return false;
    })
    .map(([_, value]) => value as NotificationSetting);
}

export async function deleteNotificationSetting(notification: NotificationSetting): Promise<boolean> {
  try {
    await removeFromStorage(`${STORAGE_KEYS.NOTIFICATION_PREFIX}${notification.eventId}_${notification.minutesBefore}`);
    return true;
  } catch (error) {
    log('StorageUtils', 'Error deleting notification setting:', error);
    return false;
  }
}

/**
 * Represents a Polymarket event.
 */
export interface PolymarketEvent {
  id: string;
  title: string;
  endTime: number;
  endDate: string;
  timezone: string;
}

/**
 * Represents the settings for a notification.
 */
export interface NotificationSetting {
  eventId: string;
  minutesBefore: number;
  scheduledTime?: number;
  triggered?: boolean;
}

/**
 * Represents a scheduled notification, extending NotificationSetting.
 */
export interface Notification extends NotificationSetting {
  id: string;
  scheduledTime: number;
  triggered: boolean;
}

/**
 * Represents the information about an event.
 */
export interface EventInfo {
  id: string;
  title: string;
  endTime: number;
  timezone: string;
  // ... any other properties
}
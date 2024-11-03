/**
 * Represents a Polymarket event.
 */
export interface PolymarketEvent {
  id: string;
  title: string;
  endTime: number;      // Unix timestamp
  endDate: string;      // Original date string
  timezone: string;     // Timezone identifier
  url: string;
}

/**
 * Represents the settings for a notification.
 */
export interface NotificationSetting {
  eventId: string;
  minutesBefore: number;
  scheduledTime?: number;
  triggered?: boolean;
  eventTitle: string;
  eventUrl: string;
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

/**
 * Represents the button states for a notification.
 */
export type NotificationButtonState = 'default' | 'success' | 'error' | 'disabled';

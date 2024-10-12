export interface PolymarketEvent {
  id: string;
  title: string;
  endTime: number;
  endDate: string;
  timezone: string;
}

export interface NotificationSetting {
  eventId: string;
  minutesBefore: number;
  scheduledTime?: number;
  triggered?: boolean;
}

export interface Notification extends NotificationSetting {
  id: string;
  scheduledTime: number;
  triggered: boolean;
}

export interface EventInfo {
  id: string;
  title: string;
  endTime: number;
  timezone: string;  // Add this line
  // ... any other properties
}

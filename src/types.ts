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
  }
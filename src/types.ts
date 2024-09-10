export interface PolymarketEvent {
    id: string;
    title: string;
    endTime: number;
    endDate?: string; // Add this if you're still using endDate in some places
  }
  
  export interface NotificationSetting {
    eventId: string;
    minutesBefore: number;
  }
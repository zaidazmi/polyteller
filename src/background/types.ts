export interface Notification {
    id: string;
    eventId: string;
    scheduledTime: number;
    triggered: boolean;
  }
  
  export interface EventInfo {
    id: string;
    title: string;
    endTime: number;
  }
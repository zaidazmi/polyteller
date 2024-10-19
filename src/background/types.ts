/**
 * Type definitions for the background processes.
 */

export interface Notification {
  id: string;
  eventId: string;
  scheduledTime: number;
  triggered: boolean;
  eventTitle: string;
  eventUrl: string;
}

export interface EventInfo {
  id: string;
  title: string;
  endTime: number;
}

// Add this new interface for trade confirmation messages
export interface TradeConfirmationMessage {
  type: 'UPDATE_TRADE_CONFIRMATION';
  data: {
    enabled: boolean;
  };
}

// Update the existing MessageType type or create a new one if it doesn't exist
export type MessageType = 
  | { type: 'EVENT_INFO', data: EventInfo }
  | { type: 'GET_EVENT_INFO', tabId: number }
  | { type: 'SCHEDULE_NOTIFICATION', data: Omit<Notification, 'id' | 'triggered'> }
  | TradeConfirmationMessage;

// Define the types inline since they're used only in messages
export interface NotificationSetting {
  eventId: string;
  eventTitle: string;
  eventEndTime: number;
  minutesBefore: number;
  isEnabled: boolean;
  createdAt: number;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  description: string;
  endTime: number;
  url: string;
  volume?: string;
  liquidity?: string;
  isResolved?: boolean;
  outcome?: string;
  imageUrl?: string;
}

export enum MessageType {
  GET_EVENT_INFO = 'GET_EVENT_INFO',
  SCHEDULE_NOTIFICATION = 'SCHEDULE_NOTIFICATION',
  GET_STORED_NOTIFICATIONS = 'GET_STORED_NOTIFICATIONS',
  REMOVE_NOTIFICATION_ALARM = 'REMOVE_NOTIFICATION_ALARM',
  NOTIFICATIONS_UPDATED = 'NOTIFICATIONS_UPDATED',
  EVENT_INITIALIZED = 'EVENT_INITIALIZED',
  EVENT_CLEANUP = 'EVENT_CLEANUP',
  EVENT_INFO = 'EVENT_INFO',
  EVENT_CLEARED = 'EVENT_CLEARED',
  UPDATE_PRIVACY_MODE = 'UPDATE_PRIVACY_MODE',
  BROADCAST_PRIVACY_MODE = 'BROADCAST_PRIVACY_MODE',
  UPDATE_TRADE_CONFIRMATION = 'UPDATE_TRADE_CONFIRMATION',
  CLEAR_CURRENT_EVENT = 'CLEAR_CURRENT_EVENT'
}

export interface MessageData {
  [MessageType.GET_EVENT_INFO]: {
    tabId: number;
  };
  [MessageType.SCHEDULE_NOTIFICATION]: NotificationSetting;
  [MessageType.GET_STORED_NOTIFICATIONS]: void;
  [MessageType.REMOVE_NOTIFICATION_ALARM]: {
    eventId: string;
    minutesBefore: number;
  };
  [MessageType.NOTIFICATIONS_UPDATED]: NotificationSetting[];
  [MessageType.EVENT_INITIALIZED]: PolymarketEvent;
  [MessageType.EVENT_CLEANUP]: {
    tabId: number;
  };
  [MessageType.EVENT_INFO]: {
    event: PolymarketEvent;
    tabId: number;
  };
  [MessageType.EVENT_CLEARED]: {
    tabId: number;
  };
  [MessageType.UPDATE_PRIVACY_MODE]: {
    enabled: boolean;
  };
  [MessageType.BROADCAST_PRIVACY_MODE]: {
    enabled: boolean;
  };
  [MessageType.UPDATE_TRADE_CONFIRMATION]: {
    enabled: boolean;
  };
}

export interface MessageResponse {
  [MessageType.GET_EVENT_INFO]: {
    success: boolean;
    data?: PolymarketEvent | null;
    error?: string;
  };
  [MessageType.SCHEDULE_NOTIFICATION]: {
    success: boolean;
    error?: string;
    isDuplicate?: boolean;
  };
  [MessageType.GET_STORED_NOTIFICATIONS]: {
    success: boolean;
    data?: {
      notifications: NotificationSetting[];
    };
    error?: string;
  };
  [MessageType.REMOVE_NOTIFICATION_ALARM]: {
    success: boolean;
    error?: string;
  };
  [MessageType.NOTIFICATIONS_UPDATED]: {
    success: boolean;
    error?: string;
  };
  [MessageType.EVENT_INITIALIZED]: {
    success: boolean;
    error?: string;
  };
  [MessageType.EVENT_CLEANUP]: {
    success: boolean;
    error?: string;
  };
  [MessageType.EVENT_INFO]: {
    success: boolean;
    error?: string;
  };
  [MessageType.EVENT_CLEARED]: {
    success: boolean;
    error?: string;
  };
  [MessageType.UPDATE_PRIVACY_MODE]: {
    success: boolean;
    error?: string;
  };
  [MessageType.BROADCAST_PRIVACY_MODE]: {
    success: boolean;
    error?: string;
  };
  [MessageType.UPDATE_TRADE_CONFIRMATION]: {
    success: boolean;
    error?: string;
  };
}

export interface Message<T extends MessageType = MessageType> {
  type: T;
  data: T extends keyof MessageData ? MessageData[T] : never;
  requestId: string;
  timestamp: number;
} 
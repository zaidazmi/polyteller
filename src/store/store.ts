import { createStore } from 'zustand/vanilla';
import { persist, PersistOptions, StorageValue, StateStorage, PersistStorage } from 'zustand/middleware';
import { PolymarketEvent, NotificationSetting } from '../types';

/**
 * Defines the shape of the application state.
 */
interface AppState {
  events: PolymarketEvent[];
  notifications: NotificationSetting[];
  currentEvent: PolymarketEvent | null;
  addEvent: (event: PolymarketEvent) => void;
  removeEvent: (eventId: string) => void;
  addNotification: (notification: NotificationSetting) => void;
  removeNotification: (eventId: string, minutesBefore: number) => void;
  setNotifications: (notifications: NotificationSetting[]) => void;
}

/**
 * Custom storage object for persisting state in Chrome's local storage.
 */
const storage: PersistStorage<AppState> = {
  getItem: (name: string): Promise<StorageValue<AppState> | null> => {
    return new Promise((resolve) => {
      chrome.storage.local.get([name], (result) => {
        resolve(result[name] || null);
      });
    });
  },
  setItem: (name: string, value: StorageValue<AppState>): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [name]: value }, () => resolve());
    });
  },
  removeItem: (name: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.remove(name, () => resolve());
    });
  },
};

/**
 * Configuration options for state persistence.
 */
const persistOptions: PersistOptions<AppState> = {
  name: 'polyteller-storage',
  storage,
};

/**
 * Creates and exports the Zustand store with persistence.
 */
export const store = createStore<AppState>()(
  persist(
    (set, get) => ({
      events: [],
      notifications: [],
      currentEvent: null,
      addEvent: (event: PolymarketEvent) =>
        set((state) => {
          console.log('Adding/updating event:', event);
          const existingEventIndex = state.events.findIndex(e => e.id === event.id);
          if (existingEventIndex !== -1) {
            // Update existing event
            const updatedEvents = [...state.events];
            updatedEvents[existingEventIndex] = event;
            return { events: updatedEvents, currentEvent: event };
          } else {
            // Add new event
            return { events: [...state.events, event], currentEvent: event };
          }
        }),
      addNotification: (notification: NotificationSetting) =>
        set((state) => {
          console.log('Adding notification:', notification);
          const existingNotificationIndex = state.notifications.findIndex(
            n => n.eventId === notification.eventId && n.minutesBefore === notification.minutesBefore
          );
          if (existingNotificationIndex !== -1) {
            // Update existing notification
            const updatedNotifications = [...state.notifications];
            updatedNotifications[existingNotificationIndex] = notification;
            return { notifications: updatedNotifications };
          } else {
            // Add new notification
            return { notifications: [...state.notifications, notification] };
          }
        }),
      setNotifications: (notifications: NotificationSetting[]) =>
        set((state) => {
          console.log('Setting notifications:', notifications);
          return { notifications };
        }),
      removeEvent: (eventId: string) =>
        set((state) => ({
          ...state,
          events: state.events.filter((e) => e.id !== eventId),
        })),
      removeNotification: (eventId: string, minutesBefore: number) =>
        set((state) => {
          console.log('Removing notification:', { eventId, minutesBefore });
          const updatedNotifications = state.notifications.filter(
            (n) => !(n.eventId === eventId && Math.abs(n.minutesBefore - minutesBefore) < 0.1)
          );
          console.log('Updated notifications:', updatedNotifications);
          return { notifications: updatedNotifications };
        }),
    }),
    persistOptions
  )
);

// Export the typed useStore hook for use in components
export const useStore = store;

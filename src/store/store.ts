import { createStore } from 'zustand/vanilla';
import { persist, PersistOptions, StorageValue } from 'zustand/middleware';
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
const storage: PersistOptions<AppState>['storage'] = {
  getItem: async (name: string): Promise<StorageValue<AppState> | null> => {
    return new Promise((resolve) => {
      chrome.storage.local.get([name], (result) => {
        resolve(result[name] || null);
      });
    });
  },
  setItem: async (name: string, value: StorageValue<AppState>): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [name]: value }, resolve);
    });
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.remove(name, resolve);
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
    (set) => ({
      events: [],
      notifications: [],
      currentEvent: null,
      addEvent: (event: PolymarketEvent) =>
        set((state) => ({ events: [...state.events, event], currentEvent: event })),
      removeEvent: (eventId: string) =>
        set((state) => ({
          ...state,
          events: state.events.filter((e) => e.id !== eventId),
        })),
      addNotification: (notification: NotificationSetting) =>
        set((state) => ({
          ...state,
          notifications: [...state.notifications, notification],
        })),
      removeNotification: (eventId: string, minutesBefore: number) =>
        set((state) => ({
          ...state,
          notifications: state.notifications.filter(
            (n) =>
              !(n.eventId === eventId && n.minutesBefore === minutesBefore)
          ),
        })),
      setNotifications: (notifications: NotificationSetting[]) =>
        set((state) => ({
          ...state,
          notifications: notifications,
        })),
    }),
    persistOptions
  )
);

// Export the typed useStore hook for use in components
export const useStore = store;

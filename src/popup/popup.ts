/**
 * Main popup script for Polyteller.
 * This file serves as the entry point for the popup, initializing the UI and managing the overall flow.
 * It imports necessary components and utilities, and sets up event listeners for the popup functionality.
 */

import { PolymarketEvent, NotificationSetting } from '../types';
import '../styles/popup.css';
import { log } from '../utils/logUtils';
import { updateUI, displayError, toggleCustomTimeInputs } from './components/uiUpdates';
import { setNotification, displayNotifications, removeTriggeredNotificationFromList } from './components/notifications';
import { cleanupCountdown } from './components/countdown';
import { useStore } from '../store/store';
import { handleError, PolytellerError } from '../utils/errorUtils';
import { validateCustomTime } from './components/customTimeValidation';

/**
 * Initializes the popup UI and sets up event listeners.
 */
export async function initPopup() {
  try {
    log('Initializing popup');

    // Set up "View All" button listener
    const viewAllButton = document.getElementById('view-all-notifications');
    if (viewAllButton) {
      viewAllButton.addEventListener('click', () => {
        const allNotificationsUrl = chrome.runtime.getURL('allNotifications.html');
        chrome.tabs.create({ url: allNotificationsUrl });
      });
    }

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const currentTabId = tabs[0]?.id;
      log('Current tab ID:', currentTabId);
      if (currentTabId) {
        chrome.runtime.sendMessage({ type: 'GET_EVENT_INFO', tabId: currentTabId }, (response: PolymarketEvent | null) => {
          try {
            log('Popup received response:', response);
            if (chrome.runtime.lastError) {
              throw new PolytellerError('GET_EVENT_INFO_ERROR', 'Failed to retrieve event information. Please try again.');
            } else if (response) {
              useStore.getState().addEvent(response);
              updateUI(response);
              loadNotifications();
            } else {
              throw new PolytellerError('NO_EVENT_FOUND', 'No event found on this page.');
            }
          } catch (error: unknown) {
            if (error instanceof Error || error instanceof PolytellerError) {
              handleError(error);
              displayError(error instanceof PolytellerError ? error.message : 'An unexpected error occurred.');
            }
          }
        });
      } else {
        throw new PolytellerError('TAB_ID_ERROR', 'Unable to determine current tab.');
      }
    });

    const notificationTimeSelect = document.getElementById('notification-time') as HTMLSelectElement;
    const setNotificationButton = document.getElementById('set-notification') as HTMLButtonElement;
    const customTimeInputs = document.querySelectorAll('#custom-time-inputs input');

    if (notificationTimeSelect && setNotificationButton) {
      notificationTimeSelect.addEventListener('change', (event) => {
        const isCustom = (event.target as HTMLSelectElement).value === 'custom';
        toggleCustomTimeInputs(isCustom);
        if (isCustom) {
          validateCustomTime();
        } else {
          setNotificationButton.disabled = false;
        }
      });

      setNotificationButton.addEventListener('click', setNotification);
    } else {
      throw new PolytellerError('ELEMENT_NOT_FOUND', 'Required UI elements not found.');
    }

    customTimeInputs.forEach(input => {
      input.addEventListener('input', validateCustomTime);
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'NOTIFICATION_TRIGGERED') {
        log('Popup received NOTIFICATION_TRIGGERED message:', message.data);
        removeTriggeredNotificationFromList(message.data);
      }
    });

    await initTradeConfirmationToggle();
  } catch (error: unknown) {
    if (error instanceof Error || error instanceof PolytellerError) {
      handleError(error);
      displayError(error instanceof PolytellerError ? error.message : 'An unexpected error occurred while initializing the popup.');
    }
  }
}

export async function loadNotifications(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const currentEvent = useStore.getState().currentEvent;
      
      const timeoutId = setTimeout(() => {
        throw new PolytellerError('LOAD_NOTIFICATIONS_TIMEOUT', 'Timeout while loading notifications');
      }, 5000); // 5-second timeout

      chrome.runtime.sendMessage({ type: 'GET_STORED_NOTIFICATIONS' }, (response) => {
        clearTimeout(timeoutId);

        if (chrome.runtime.lastError) {
          throw new PolytellerError('GET_STORED_NOTIFICATIONS_ERROR', 'Error loading notifications');
        }

        let notifications: NotificationSetting[] = response.notifications || [];

        if (currentEvent) {
          const now = Date.now();
          const currentNotifications = notifications.filter(notification => {
            return notification.eventId === currentEvent.id && 
                   (currentEvent.endTime - notification.minutesBefore * 60 * 1000) > now;
          });
          log('Popup', 'Loaded notifications:', currentNotifications);
          useStore.getState().setNotifications(currentNotifications);
          displayNotifications();
        } else {
          log('Popup', 'No event found when loading notifications');
        }
        resolve();
      });
    } catch (error: unknown) {
      if (error instanceof Error || error instanceof PolytellerError) {
        handleError(error);
        displayError(error instanceof PolytellerError ? error.message : 'An unexpected error occurred while loading notifications.');
      }
      resolve();
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NOTIFICATIONS_UPDATED') {
    log('Popup received NOTIFICATIONS_UPDATED message:', message.data);
    loadNotifications().catch(error => {
      if (error instanceof Error || error instanceof PolytellerError) {
        handleError(error);
        displayError('Failed to load updated notifications.');
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initPopup().catch(error => {
    if (error instanceof Error || error instanceof PolytellerError) {
      handleError(error);
      displayError('Failed to initialize popup.');
    }
  });

  const notificationTimeSelect = document.getElementById('notification-time') as HTMLSelectElement;
  notificationTimeSelect.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    toggleCustomTimeInputs(target.value === 'custom');
  });

  toggleCustomTimeInputs(false);

  window.addEventListener('unload', () => {
    cleanupCountdown();
  });
});

window.addEventListener('error', (event: ErrorEvent) => {
  if (event.error instanceof Error || event.error instanceof PolytellerError) {
    handleError(event.error);
    displayError('An unexpected error occurred. Please try reloading the extension.');
  }
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  if (event.reason instanceof Error || event.reason instanceof PolytellerError) {
    handleError(event.reason);
    displayError('An unexpected error occurred. Please try reloading the extension.');
  }
  event.preventDefault();
});

export function initTradeConfirmationToggle(): Promise<boolean> {
  console.log('initTradeConfirmationToggle function called');
  return new Promise((resolve) => {
    console.log('Inside Promise constructor');
    try {
      const toggle = document.getElementById('trade-confirmation-toggle') as HTMLInputElement;
      console.log('Toggle element:', toggle);
      
      if (!chrome.storage || !chrome.storage.local || !chrome.storage.local.get) {
        console.error('Chrome storage API not available');
        resolve(false);
        return;
      }

      chrome.storage.local.get('enableTradeConfirmation', (result) => {
        console.log('Chrome storage result:', result);
        if (chrome.runtime.lastError) {
          console.error('Error getting from storage:', chrome.runtime.lastError);
          resolve(false);
          return;
        }

        const initialState = result.enableTradeConfirmation !== false;
        console.log('Initial state calculated:', initialState);

        if (toggle) {
          toggle.checked = initialState;
          console.log('Initial state set on toggle:', initialState);
          
          const changeHandler = () => {
            const isEnabled = toggle.checked;
            console.log('Toggle changed, new state:', isEnabled);
            chrome.storage.local.set({ enableTradeConfirmation: isEnabled }, () => {
              console.log(`Trade confirmation ${isEnabled ? 'enabled' : 'disabled'}`);
              chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                const currentTabId = tabs[0]?.id;
                if (currentTabId) {
                  chrome.tabs.sendMessage(currentTabId, { action: 'updateTradeConfirmation', enabled: isEnabled });
                }
              });
            });
          };
          
          toggle.addEventListener('change', changeHandler);
          // Trigger the change handler immediately to ensure it's set up correctly
          changeHandler();
        } else {
          console.error('Toggle element not found');
          resolve(false);
          return;
        }
        
        console.log('Resolving promise with:', initialState);
        resolve(initialState);
      });
    } catch (error) {
      console.error('Error in initTradeConfirmationToggle:', error);
      resolve(false);
    }
  });
}

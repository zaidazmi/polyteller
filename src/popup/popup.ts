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
async function initPopup() {
  try {
    log('Initializing popup');
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
  } catch (error: unknown) {
    if (error instanceof Error || error instanceof PolytellerError) {
      handleError(error);
      displayError(error instanceof PolytellerError ? error.message : 'An unexpected error occurred while initializing the popup.');
    }
  }
}

// Export the loadNotifications function
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

// Add this listener to the initPopup function
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

// Initialize the popup when the DOM is fully loaded
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

  // Initially hide custom inputs
  toggleCustomTimeInputs(false);

  // Clean up the countdown when the popup is closed
  window.addEventListener('unload', () => {
    cleanupCountdown();
  });

  document.getElementById('view-all-notifications')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('allNotifications.html') });
  });
});

// Add this near the end of your file, after other event listeners
window.addEventListener('error', (event: ErrorEvent) => {
  if (event.error instanceof Error || event.error instanceof PolytellerError) {
    handleError(event.error);
    displayError('An unexpected error occurred. Please try reloading the extension.');
  }
  // Prevent the error from propagating
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  if (event.reason instanceof Error || event.reason instanceof PolytellerError) {
    handleError(event.reason);
    displayError('An unexpected error occurred. Please try reloading the extension.');
  }
  // Prevent the error from propagating
  event.preventDefault();
});

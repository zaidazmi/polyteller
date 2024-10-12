/**
 * Main popup script for Polyteller.
 * This file has been split into smaller components for better organization and maintainability.
 * It now serves as the entry point for the popup, initializing the UI and managing the overall flow.
 */

import { PolymarketEvent, NotificationSetting } from '../types';
import '../styles/popup.css';
import { getEvent, getNotificationSettings } from '../utils/storageUtils';
import { log } from '../utils/logUtils';
import { updateUI, displayError, toggleCustomTimeInputs } from './components/uiUpdates';
import { setNotification, displayNotifications, removeTriggeredNotificationFromList, setCurrentEvent, setCurrentNotifications } from './components/notifications';
import { cleanupCountdown } from './components/countdown';

/**
 * Initializes the popup UI and sets up event listeners.
 */
async function initPopup() {
  log('Initializing popup');
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const currentTabId = tabs[0]?.id;
    log('Current tab ID:', currentTabId);
    if (currentTabId) {
      chrome.runtime.sendMessage({ type: 'GET_EVENT_INFO', tabId: currentTabId }, (response: PolymarketEvent | null) => {
        log('Popup received response:', response);
        if (chrome.runtime.lastError) {
          log('Error retrieving event info:', chrome.runtime.lastError);
          displayError('Failed to retrieve event information. Please try again.');
        } else if (response) {
          setCurrentEvent(response);
          updateUI(response);
          loadNotifications();
        } else {
          displayError('No event found on this page.');
        }
      });
    } else {
      displayError('Unable to determine current tab.');
    }
  });

  const notificationTimeSelect = document.getElementById('notification-time') as HTMLSelectElement;
  const setNotificationButton = document.getElementById('set-notification');

  if (notificationTimeSelect && setNotificationButton) {
    notificationTimeSelect.addEventListener('change', (event) => {
      toggleCustomTimeInputs((event.target as HTMLSelectElement).value === 'custom');
    });

    setNotificationButton.addEventListener('click', setNotification);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NOTIFICATION_TRIGGERED') {
      log('Popup received NOTIFICATION_TRIGGERED message:', message.data);
      removeTriggeredNotificationFromList(message.data);
    }
  });
}

/**
 * Loads and displays notifications for the current event.
 */
async function loadNotifications() {
  const event = await getEvent();
  if (event) {
    setCurrentEvent(event);
    const allNotifications = await getNotificationSettings(event.id);
    const now = Date.now();
    const currentNotifications = allNotifications.filter(notification => {
      const notificationTime = event.endTime - notification.minutesBefore * 60 * 1000;
      return notificationTime > now;
    });
    log('Popup', 'Loaded notifications:', currentNotifications);
    setCurrentNotifications(currentNotifications);
    displayNotifications();
  } else {
    log('Popup', 'No event found when loading notifications');
  }
}

// Initialize the popup when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initPopup();
  const notificationTimeSelect = document.getElementById('notification-time') as HTMLSelectElement;
  notificationTimeSelect.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    toggleCustomTimeInputs(target.value === 'custom');
  });

  // Initially hide custom inputs
  toggleCustomTimeInputs(false);
});

// Clean up the countdown when the popup is closed
window.addEventListener('unload', () => {
  cleanupCountdown();
});

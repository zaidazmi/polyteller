import { PolymarketEvent, NotificationSetting } from '../types';
import '../styles/popup.css';
import { saveNotificationSetting, getEvent, getNotificationSettings, deleteNotificationSetting } from '../utils/storageUtils';
import { log } from '../utils/logUtils';
import { getTimezoneAbbreviation } from '../utils/timezoneUtils';

let currentEvent: PolymarketEvent | null = null;
let countdownInterval: NodeJS.Timeout | null = null;
let currentNotifications: NotificationSetting[] = [];

/**
 * Displays the countdown for the event
 * @param eventInfo The event information
 */
function displayCountdown(eventInfo: PolymarketEvent): void {
  const countdownElement = document.getElementById('countdown');
  const localEndTimeElement = document.getElementById('local-end-time');
  const notificationSection = document.getElementById('notify-section');

  if (!countdownElement || !localEndTimeElement || !notificationSection) {
    log('Popup', 'Required DOM elements not found');
    return;
  }

  const endDate = new Date(eventInfo.endTime);
  const now = new Date();

  if (endDate <= now) {
    countdownElement.textContent = 'Event has ended';
    localEndTimeElement.innerHTML = `
      <span class="end-time-label">Ended on</span>
      <span>${formatDate(endDate)}</span>
    `;
    notificationSection.style.display = 'none';
  } else {
    function updateCountdown(): void {
      const now = new Date();
      const timeLeft = endDate.getTime() - now.getTime();

      if (timeLeft <= 0) {
        if (countdownElement) {
          countdownElement.textContent = 'Event has just ended';
        }
        if (countdownInterval !== null) {
          clearInterval(countdownInterval);
        }
        if (notificationSection) {
          notificationSection.style.display = 'none';
        }
      } else {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        if (countdownElement) {
          countdownElement.innerHTML = `
            <div class="countdown-value">
              <span class="countdown-number">${days}</span>
              <span class="countdown-label">days</span>
            </div>
            <div class="countdown-value">
              <span class="countdown-number">${hours}</span>
              <span class="countdown-label">hours</span>
            </div>
            <div class="countdown-value">
              <span class="countdown-number">${minutes}</span>
              <span class="countdown-label">mins</span>
            </div>
            <div class="countdown-value">
              <span class="countdown-number">${seconds}</span>
              <span class="countdown-label">secs</span>
            </div>
          `;
        }
      }
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);

    const localTimezoneAbbr = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const formattedLocalEndDate = endDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: localTimezoneAbbr
    });

    localEndTimeElement.innerHTML = `
      <span class="end-time-label">Ends on</span>
      <span>${formattedLocalEndDate} ${localTimezoneAbbr}</span>
    `;
  }
}

/**
 * Formats a date into a readable string
 * @param date The date to format
 * @returns A formatted date string
 */
function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Updates the UI with event information
 * @param eventInfo The event information
 */
function updateUI(eventInfo: PolymarketEvent) {
  log('Updating UI with event info:', eventInfo);
  const titleElement = document.getElementById('event-title');
  if (titleElement) {
    titleElement.textContent = eventInfo.title;
  }
  if (isValidTimestamp(eventInfo.endTime)) {
    displayCountdown(eventInfo);
  } else {
    log('Invalid endTime:', eventInfo.endTime);
    displayStatus('Invalid event end time');
  }
}

/**
 * Initializes the popup
 */
function initPopup() {
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
          currentEvent = response;
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
  const customTimeFields = document.getElementById('custom-time-fields');
  const setNotificationButton = document.getElementById('set-notification');

  if (notificationTimeSelect && customTimeFields && setNotificationButton) {
    notificationTimeSelect.addEventListener('change', (event) => {
      if ((event.target as HTMLSelectElement).value === 'custom') {
        customTimeFields.style.display = 'flex';
      } else {
        customTimeFields.style.display = 'none';
      }
    });

    setNotificationButton.addEventListener('click', setNotification);
  }

  // Add a listener for the NOTIFICATION_TRIGGERED message
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NOTIFICATION_TRIGGERED') {
      log('Popup received NOTIFICATION_TRIGGERED message:', message.data);
      removeTriggeredNotificationFromList(message.data);
    }
  });
}

/**
 * Sets a notification
 */
function setNotification() {
  const notificationTimeSelect = document.getElementById('notification-time') as HTMLSelectElement;
  let minutesBefore: number;
  if (notificationTimeSelect.value === 'custom') {
    const days = parseInt((document.getElementById('custom-days') as HTMLInputElement).value) || 0;
    const hours = parseInt((document.getElementById('custom-hours') as HTMLInputElement).value) || 0;
    const minutes = parseInt((document.getElementById('custom-minutes') as HTMLInputElement).value) || 0;
    const seconds = parseInt((document.getElementById('custom-seconds') as HTMLInputElement).value) || 0;

    minutesBefore = (days * 24 * 60) + (hours * 60) + minutes + (seconds / 60);
  } else {
    minutesBefore = parseInt(notificationTimeSelect.value);
  }

  if (currentEvent) {
    const now = Date.now();
    const notificationTime = currentEvent.endTime - minutesBefore * 60 * 1000;

    if (notificationTime <= now) {
      displayStatus('Cannot set notification for a time that has already passed.');
      return;
    }

    const notificationSetting: NotificationSetting = {
      eventId: currentEvent.id,
      minutesBefore: minutesBefore
    };

    saveNotificationSetting(notificationSetting).then((saved) => {
      if (saved) {
        chrome.runtime.sendMessage({
          type: 'SCHEDULE_NOTIFICATION',
          data: notificationSetting
        }, (response) => {
          if (response.success) {
            currentNotifications.push(notificationSetting);
            displayStatus('Notification set successfully!');
            displayNotifications();
          } else {
            displayStatus('Failed to set notification. Please try again.');
          }
        });
      } else {
        displayStatus('A notification for this time already exists.');
      }
    });
  } else {
    displayStatus('No event selected. Please select an event first.');
  }
}

/**
 * Displays a status message
 * @param message The message to display
 */
function displayStatus(message: string) {
  const statusElement = document.getElementById('notification-status');
  if (statusElement) {
    statusElement.textContent = message;
    setTimeout(() => {
      statusElement.textContent = '';
    }, 3000);
  }
}

/**
 * Displays an error message
 * @param message The error message to display
 */
function displayError(message: string) {
  const countdownElement = document.getElementById('countdown');
  if (countdownElement) {
    countdownElement.textContent = message;
  }
}

// Call initPopup when the popup is loaded
document.addEventListener('DOMContentLoaded', initPopup);

/**
 * Loads notifications for the current event
 */
async function loadNotifications() {
  const event = await getEvent();
  if (event) {
    currentEvent = event;  // Set currentEvent
    const allNotifications = await getNotificationSettings(event.id);
    const now = Date.now();
    currentNotifications = allNotifications.filter(notification => {
      const notificationTime = event.endTime - notification.minutesBefore * 60 * 1000;
      return notificationTime > now;
    });
    log('Popup', 'Loaded notifications:', currentNotifications);
    displayNotifications();
  } else {
    log('Popup', 'No event found when loading notifications');
  }
}

/**
 * Displays the current notifications
 */
function displayNotifications() {
  const notificationsList = document.getElementById('notifications-list');
  log('Popup', 'Displaying notifications:', currentNotifications);
  if (notificationsList && currentEvent) {
    notificationsList.innerHTML = '';
    currentNotifications.forEach((notification, index) => {
      const li = document.createElement('li');
      const notificationTime = new Date((currentEvent?.endTime ?? Date.now()) - notification.minutesBefore * 60 * 1000);
      
      li.innerHTML = `
        <div class="notification-info">
          <span class="notification-time">${formatFullNotificationTime(notification.minutesBefore)}</span>
          <span class="notification-date">${formatDate(notificationTime)}</span>
        </div>
        <button class="delete-notification" data-index="${index}" aria-label="Delete notification">
          <span class="delete-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </span>
        </button>
      `;
      notificationsList.appendChild(li);
    });

    const deleteButtons = document.querySelectorAll('.delete-notification');
    deleteButtons.forEach(button => {
      button.addEventListener('click', deleteNotification);
    });
  } else {
    log('Popup', 'Unable to display notifications: currentEvent is null or notificationsList not found');
    if (notificationsList) {
      notificationsList.innerHTML = '<li>No event selected or notifications available.</li>';
    }
  }
}

/**
 * Formats the full notification time
 * @param minutesBefore The number of minutes before the event
 * @returns A formatted string representing the time before the event
 */
function formatFullNotificationTime(minutesBefore: number): string {
  const days = Math.floor(minutesBefore / 1440);
  const hours = Math.floor((minutesBefore % 1440) / 60);
  const minutes = Math.floor(minutesBefore % 60);
  const seconds = Math.floor((minutesBefore % 1) * 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') + ' before';
}

/**
 * Deletes a notification
 * @param event The click event
 */
async function deleteNotification(event: Event) {
  const button = event.currentTarget as HTMLButtonElement;
  const index = parseInt(button.getAttribute('data-index') || '-1');
  log('Popup', `Attempting to delete notification at index: ${index}`);
  
  if (index !== -1 && currentEvent) {
    const deletedNotification = currentNotifications[index];
    log('Popup', `Notification to delete:`, deletedNotification);
    
    // Send a message to the background script to remove the alarm
    chrome.runtime.sendMessage({
      type: 'REMOVE_NOTIFICATION_ALARM',
      data: deletedNotification
    }, async (response) => {
      log('Popup', `Received response from background:`, response);
      if (response.success || response.alreadyTriggered) {
        // Remove the notification from currentNotifications
        currentNotifications.splice(index, 1);
        await deleteNotificationSetting(deletedNotification);
        displayNotifications();
        displayStatus('Notification deleted successfully!');
      } else {
        displayStatus('Error deleting notification. Please try again.');
      }
    });
  } else {
    log('Popup', 'Invalid index for deletion or no current event');
  }
}

async function reloadNotifications() {
  if (currentEvent) {
    currentNotifications = await getNotificationSettings(currentEvent.id);
    log('Popup', 'Reloaded notifications:', currentNotifications);
    displayNotifications();
  }
}

function isValidTimestamp(timestamp: number): boolean {
  return !isNaN(timestamp) && isFinite(timestamp) && timestamp > 0;
}

function removeTriggeredNotificationFromList(triggeredNotification: { eventId: string, minutesBefore: number }) {
  if (currentEvent && currentEvent.id === triggeredNotification.eventId) {
    currentNotifications = currentNotifications.filter(
      notification => notification.minutesBefore !== triggeredNotification.minutesBefore
    );
    displayNotifications();
  }
}
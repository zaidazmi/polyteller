import { PolymarketEvent, NotificationSetting } from '../types';
import '../styles/popup.css';
import { saveNotificationSetting, getEvent, getNotificationSettings, deleteNotificationSetting } from '../utils/storageUtils';

const DEBUG = true;

function log(...args: any[]) {
  console.log('[Polyteller Popup]', ...args);
}

let currentEvent: PolymarketEvent | null = null;
let countdownInterval: NodeJS.Timeout | null = null;

let currentNotifications: NotificationSetting[] = [];

function displayCountdown(eventInfo: PolymarketEvent): void {
  const countdownElement = document.getElementById('countdown');
  const localEndTimeElement = document.getElementById('local-end-time');
  const notificationSection = document.getElementById('notify-section');

  if (!countdownElement || !localEndTimeElement || !notificationSection) {
    console.error('Required DOM elements not found');
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

    localEndTimeElement.innerHTML = `
      <span class="end-time-label">Ends on</span>
      <span>${formatDate(endDate)}</span>
    `;
  }
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  
  const formattedDate = date.toLocaleString('en-US', options);
  const timeZoneAbbr = getTimeZoneAbbreviation(date);
  
  return `${formattedDate} ${timeZoneAbbr}`;
}

function updateUI(eventInfo: PolymarketEvent) {
  log('Updating UI with event info:', eventInfo);
  const titleElement = document.getElementById('event-title');
  if (titleElement) {
    titleElement.textContent = eventInfo.title;
  }
  displayCountdown(eventInfo);
}

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
        } else if (response?.endTime) {
          log('Current event:', response);
          updateUI(response);
        } else {
          log('No valid event information received');
          displayError('No event information available for this page.');
        }
      });
    } else {
      log('No current tab ID found');
      displayError('Unable to determine the current tab.');
    }
  });

  const notificationTimeSelect = document.getElementById('notification-time') as HTMLSelectElement;
  const customTimeFields = document.getElementById('custom-time-fields');
  const setNotificationButton = document.getElementById('set-notification');

  if (notificationTimeSelect && customTimeFields && setNotificationButton) {
    notificationTimeSelect.addEventListener('change', (event) => {
      if ((event.target as HTMLSelectElement).value === 'custom') {
        customTimeFields.style.display = 'block';
      } else {
        customTimeFields.style.display = 'none';
      }
    });

    setNotificationButton.addEventListener('click', setNotification);
  }

  loadNotifications();
}

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

  // Get the current event from storage
  getEvent().then((currentEvent) => {
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

      // Save the notification setting
      saveNotificationSetting(notificationSetting).then((saved) => {
        if (saved) {
          // Schedule the notification
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
  });
}

function displayStatus(message: string) {
  const statusElement = document.getElementById('notification-status');
  if (statusElement) {
    statusElement.textContent = message;
    setTimeout(() => {
      statusElement.textContent = '';
    }, 3000);
  }
}

function displayError(message: string) {
  const countdownElement = document.getElementById('countdown');
  if (countdownElement) {
    countdownElement.textContent = message;
  }
}

// Call initPopup when the popup is loaded
document.addEventListener('DOMContentLoaded', initPopup);

function getTimeZoneAbbreviation(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    timeZoneName: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value || '';
}

async function loadNotifications() {
  const event = await getEvent();
  if (event) {
    currentNotifications = await getNotificationSettings(event.id);
    console.log('Loaded notifications:', currentNotifications); // Add this line for debugging
    displayNotifications();
  }
}

function displayNotifications() {
  const notificationsList = document.getElementById('notifications-list');
  if (notificationsList) {
    notificationsList.innerHTML = '';
    currentNotifications.forEach((notification, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${formatNotificationTime(notification.minutesBefore)}
        <button class="delete-notification" data-index="${index}">Delete</button>
      `;
      notificationsList.appendChild(li);
    });

    const deleteButtons = document.querySelectorAll('.delete-notification');
    deleteButtons.forEach(button => {
      button.addEventListener('click', deleteNotification);
    });
  }
}

function formatNotificationTime(minutesBefore: number): string {
  if (minutesBefore < 60) {
    return `${minutesBefore} minutes before`;
  } else if (minutesBefore < 1440) {
    const hours = Math.floor(minutesBefore / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} before`;
  } else {
    const days = Math.floor(minutesBefore / 1440);
    return `${days} day${days > 1 ? 's' : ''} before`;
  }
}

async function deleteNotification(event: Event) {
  const button = event.target as HTMLButtonElement;
  const index = parseInt(button.getAttribute('data-index') || '-1');
  if (index !== -1) {
    const deletedNotification = currentNotifications[index];
    currentNotifications.splice(index, 1);
    await deleteNotificationSetting(deletedNotification);
    displayNotifications();
    displayStatus('Notification deleted successfully!');
  }
}

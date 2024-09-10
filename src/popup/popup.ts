import { PolymarketEvent, NotificationSetting } from '../types';
import { getEvent, saveNotificationSetting, getNotificationSetting } from '../utils/storageUtils';
import '../styles/popup.css';

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) console.log('[Polyteller Popup]', ...args);
}

let currentEvent: PolymarketEvent | null = null;
let countdownInterval: NodeJS.Timeout | null = null;

function updateCountdown() {
  log('Updating countdown');
  if (currentEvent) {
    const countdownElement = document.getElementById('countdown');
    const localEndTimeElement = document.getElementById('local-end-time');
    if (countdownElement && localEndTimeElement) {
      const now = Date.now();
      const timeRemaining = currentEvent.endTime - now;
      log('Time remaining:', timeRemaining);

      if (timeRemaining <= 0) {
        countdownElement.innerHTML = '<div class="ended">Event has ended</div>';
      } else {
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `
          <div class="time-unit">
            <span class="time-value">${days.toString().padStart(2, '0')}</span>
            <span class="time-label">Days</span>
          </div>
          <div class="time-unit">
            <span class="time-value">${hours.toString().padStart(2, '0')}</span>
            <span class="time-label">Hours</span>
          </div>
          <div class="time-unit">
            <span class="time-value">${minutes.toString().padStart(2, '0')}</span>
            <span class="time-label">Mins</span>
          </div>
          <div class="time-unit">
            <span class="time-value">${seconds.toString().padStart(2, '0')}</span>
            <span class="time-label">Secs</span>
          </div>
        `;
        countdownElement.setAttribute('data-countdown', timeRemaining.toString());
      }

      const endDate = new Date(currentEvent.endTime);
      const localEndDate = endDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const localEndTime = endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      const timeZoneAbbr = getTimezoneAbbreviation(endDate);
      localEndTimeElement.textContent = `Ends on ${localEndDate} at ${localEndTime} ${timeZoneAbbr}`;
    }
  } else {
    log('No current event available for countdown');
  }
}

function getTimezoneAbbreviation(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, timeZoneName: 'short' };
  const timeZoneString = date.toLocaleString('en-US', options);
  const timeZoneAbbr = timeZoneString.split(' ').pop();
  return timeZoneAbbr || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function displayEventInfo(event: PolymarketEvent) {
  const titleElement = document.getElementById('event-title');
  if (titleElement) {
    titleElement.textContent = event.title;
  }
}

function updateNotificationStatus(event: PolymarketEvent) {
  // Implementation remains the same
}

function setNotification(event: PolymarketEvent, minutesBefore: number) {
  const notificationSetting: NotificationSetting = {
    eventId: event.id,
    minutesBefore: minutesBefore
  };

  saveNotificationSetting(notificationSetting)
    .then(() => {
      const statusElement = document.getElementById('notification-status');
      if (statusElement) {
        statusElement.textContent = `Notification set for ${minutesBefore} minutes before the event.`;
        statusElement.classList.add('show');
        setTimeout(() => statusElement.classList.remove('show'), 3000);
      }
    })
    .catch((error) => {
      console.error('Error setting notification:', error);
      const statusElement = document.getElementById('notification-status');
      if (statusElement) {
        statusElement.textContent = 'Error setting notification. Please try again.';
        statusElement.classList.add('show', 'error');
      }
    });
}

function updatePopup(eventInfo: any) {
  const countdownElement = document.getElementById('countdown');
  const titleElement = document.getElementById('event-title');
  if (!countdownElement || !titleElement) return;

  if (eventInfo) {
    titleElement.textContent = eventInfo.title;
    const endDate = new Date(eventInfo.endDate);
    const now = new Date();
    const timeLeft = endDate.getTime() - now.getTime();

    if (timeLeft <= 0) {
      countdownElement.textContent = 'Event has ended';
    } else {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
  } else {
    titleElement.textContent = 'No event found';
    countdownElement.textContent = 'No event information available. Please try reloading the page.';
    countdownElement.classList.add('error-message');
  }
}

function initPopup() {
  log('Initializing popup');
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const currentTabId = tabs[0].id;
    log('Current tab ID:', currentTabId);
    if (currentTabId) {
      chrome.runtime.sendMessage({ type: 'GET_EVENT_INFO', tabId: currentTabId }, (response: PolymarketEvent | null) => {
        log('Popup received response:', response);
        if (response && response.title && response.endTime) {
          currentEvent = response;
          log('Current event:', currentEvent);
          displayEventInfo(currentEvent);
          updateCountdown();
          countdownInterval = setInterval(updateCountdown, 1000);
        } else {
          log('No valid event information received');
          const eventInfoElement = document.getElementById('event-info');
          if (eventInfoElement) {
            eventInfoElement.innerHTML = '<p class="error-message">No event information available. Please visit a Polymarket event page.</p>';
          }
        }
      });
    } else {
      log('No current tab ID found');
    }
  });

  const setNotificationButton = document.getElementById('set-notification');
  if (setNotificationButton) {
    setNotificationButton.addEventListener('click', () => {
      if (currentEvent) {
        const notificationTimeSelect = document.getElementById('notification-time') as HTMLSelectElement;
        const minutesBefore = parseInt(notificationTimeSelect.value, 10);
        setNotification(currentEvent, minutesBefore);
      } else {
        const statusElement = document.getElementById('notification-status');
        if (statusElement) {
          statusElement.textContent = 'No event available to set notification for.';
          statusElement.classList.add('show', 'error');
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initPopup);

window.addEventListener('unload', () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
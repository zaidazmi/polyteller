import { PolymarketEvent } from '../types';
import '../styles/popup.css';

const DEBUG = true;

function log(...args: any[]) {
  console.log('[Polyteller Popup]', ...args);
}

let currentEvent: PolymarketEvent | null = null;
let countdownInterval: NodeJS.Timeout | null = null;

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
        } else if (response && response.endTime) {
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

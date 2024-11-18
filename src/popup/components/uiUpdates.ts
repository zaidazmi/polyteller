/**
 * UI update functions for the Polyteller popup.
 * This file contains functions responsible for updating various UI elements in the popup.
 */

import { PolymarketEvent } from '../../types';
import { log } from '../../utils/logUtils';
import { displayCountdown } from './countdown';
import { isValidTimestamp } from '../../utils/dateUtils';
import { displayStatus } from '../utils';

/**
 * Updates the UI with event information.
 * @param eventInfo - The event information to display
 */
export function updateUI(eventInfo: PolymarketEvent | null) {
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    const currentUrl = tabs[0]?.url || '';
    
    // Handle sports URLs immediately
    if (currentUrl.includes('/sports/')) {
      displaySportsNotSupported();
      return;
    }
    
    // For non-sports URLs, handle event info
    if (!eventInfo) {
      displayError('No event found on this page.');
      return;
    }

    log('Popup', 'Updating UI with event info:', eventInfo);
    const titleElement = document.getElementById('event-title');
    if (titleElement) {
      titleElement.textContent = eventInfo.title;
    }

    if (typeof eventInfo.endTime === 'number' && isValidTimestamp(eventInfo.endTime)) {
      displayCountdown(eventInfo);
    } else {
      log('Invalid endTime:', eventInfo.endTime);
      displayStatus('Invalid event end time');
    }
  });
}

/**
 * Displays sports not supported message in the popup.
 */
function displaySportsNotSupported() {
  // Hide all sections first
  const sectionsToHide = [
    'countdown',
    'local-end-time',
    'notify-section',
    'set-notifications'
  ];

  sectionsToHide.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
    }
  });

  // Clear notifications list
  const notificationsList = document.getElementById('notifications-list');
  if (notificationsList) {
    notificationsList.innerHTML = '';
  }

  // Clear any existing content
  const eventTitle = document.getElementById('event-title');
  if (eventTitle) {
    // Clear any existing content first
    eventTitle.innerHTML = '';
    
    // Add sports message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-color);
      background-color: var(--countdown-background);
      padding: 12px 16px;
      border-radius: 8px;
      margin: 0;
    `;
    
    messageDiv.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span style="font-weight: 500;">Sports events are not supported yet</span>
    `;
    
    eventTitle.appendChild(messageDiv);
  }

  // Force cleanup of any other messages
  const statusMessage = document.getElementById('notification-status');
  if (statusMessage) {
    statusMessage.textContent = '';
  }
}

/**
 * Displays an error message in the popup.
 * @param message - The error message to display
 */
export function displayError(message: string) {
  const eventTitle = document.getElementById('event-title');
  if (eventTitle) {
    eventTitle.innerHTML = `
      <div style="color: var(--text-color);">${message}</div>
      <div style="color: var(--text-light); font-size: 14px; margin-top: 8px;">
        If you are on a valid Polymarket event page, try refreshing the page
      </div>
    `;
  }

  // Hide countdown and notification sections
  const countdown = document.getElementById('countdown');
  const notifySection = document.getElementById('notify-section');
  if (countdown) countdown.style.display = 'none';
  if (notifySection) notifySection.style.display = 'none';
}

/**
 * Toggles the visibility of custom time input fields.
 * @param show - Whether to show or hide the custom time inputs
 */
export function toggleCustomTimeInputs(show: boolean) {
  const customInputs = document.getElementById('custom-time-inputs');
  if (customInputs) {
    customInputs.style.display = show ? 'flex' : 'none';
  }
}

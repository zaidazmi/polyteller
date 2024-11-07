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
export function updateUI(eventInfo: PolymarketEvent) {
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

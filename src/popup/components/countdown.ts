/**
 * Countdown display function for the Polyteller popup.
 * This file contains the function to display and update the countdown timer for an event.
 */

import { PolymarketEvent } from '../../types';
import { log } from '../../utils/logUtils';
import { formatDate, calculateTimeRemaining, formatCountdown, formatLocalEndDate } from '../../utils/dateUtils';
import { getLocalTimezone } from '../../utils/timezoneUtils';

let countdownInterval: NodeJS.Timeout | null = null;

/**
 * Displays and updates the countdown for an event.
 * @param eventInfo - The event information
 */
export function displayCountdown(eventInfo: PolymarketEvent): void {
  // Retrieve necessary DOM elements
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
    // Event has already ended
    countdownElement.textContent = 'Event has ended';
    localEndTimeElement.innerHTML = `
      <span class="end-time-label">Ended on</span>
      <span>${formatDate(endDate)}</span>
    `;
    notificationSection.style.display = 'none';
  } else {
    // Event is still ongoing
    function updateCountdown(): void {
      const now = new Date();
      const timeLeft = endDate.getTime() - now.getTime();

      if (timeLeft <= 0) {
        // Event just ended
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
        // Update countdown display
        if (countdownElement) {
          countdownElement.innerHTML = formatCountdown(timeLeft);
        }
      }
    }

    // Initial update and set interval for continuous updates
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);

    // Display local end time
    const localTimezoneAbbr = getLocalTimezone();
    const formattedLocalEndDate = formatLocalEndDate(endDate, localTimezoneAbbr);

    localEndTimeElement.innerHTML = `
      <span class="end-time-label">Ends on</span>
      <span>${formattedLocalEndDate} ${localTimezoneAbbr}</span>
    `;
  }
}

/**
 * Cleans up the countdown interval when the popup is closed.
 */
export function cleanupCountdown(): void {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

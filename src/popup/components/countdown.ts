/**
 * Countdown display function for the Polyteller popup.
 * This file contains the function to display and update the countdown timer for an event.
 */

import { PolymarketEvent } from '../../types';
import { CountdownManager } from '../../utils/CountdownManager';
import { formatLocalEndDate } from '../../utils/dateUtils';
import { getLocalTimezone } from '../../utils/timezoneUtils';
import { formatCountdownDisplay } from '../../utils/countdownFormatters';
import { log } from '../../utils/logUtils';

let unsubscribe: (() => void) | null = null;

/**
 * Displays and updates the countdown for an event.
 * @param eventInfo - The event information
 */
export function displayCountdown(eventInfo: PolymarketEvent): void {
  // Cleanup any existing subscription
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  const countdownElement = document.getElementById('countdown');
  const localEndTimeElement = document.getElementById('local-end-time');
  const notificationSection = document.getElementById('notify-section');

  if (!countdownElement || !localEndTimeElement || !notificationSection) {
    log('Countdown', 'Required elements not found');
    return;
  }

  // Reset display properties
  countdownElement.style.display = '';
  localEndTimeElement.style.display = '';
  notificationSection.style.display = '';

  const countdownManager = CountdownManager.getInstance();
  countdownManager.registerEvent(eventInfo);

  unsubscribe = countdownManager.subscribe(eventInfo.id, (timeLeft) => {
    if (!countdownElement) return;

    if (timeLeft.hasEnded) {
      countdownElement.textContent = 'Event has ended';
      const endDate = new Date(eventInfo.endTime);
      localEndTimeElement.innerHTML = `
        <span class="end-time-label">Ended on</span>
        <span>${formatLocalEndDate(endDate, getLocalTimezone())}</span>
      `;
      notificationSection.style.display = 'none';
    } else {
      countdownElement.innerHTML = formatCountdownDisplay(timeLeft);
    }
  });

  // Display local end time
  const endDate = new Date(eventInfo.endTime);
  const localTimezoneAbbr = getLocalTimezone();
  const formattedLocalEndDate = formatLocalEndDate(endDate, localTimezoneAbbr);

  localEndTimeElement.innerHTML = `
    <span class="end-time-label">Ends on</span>
    <span>${formattedLocalEndDate} ${localTimezoneAbbr}</span>
  `;
}

/**
 * Cleans up the countdown interval when the popup is closed.
 */
export function cleanupCountdown(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

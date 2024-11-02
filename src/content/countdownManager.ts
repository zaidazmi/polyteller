/**
 * Countdown manager for Polyteller.
 * This file contains functions for creating, inserting, and updating the countdown element.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';
import { calculateTimeRemaining, formatDate, getTimeRemaining } from '../utils/dateUtils';
import { isDST } from '../utils/timezoneUtils';

/**
 * Creates and inserts a countdown element for the given event.
 * @param eventInfo - The event information
 * @param isExtensionPopup - Whether the countdown is being created for the extension popup
 */
export function createAndInsertCountdown(eventInfo: PolymarketEvent, isExtensionPopup: boolean) {
  log('Content', 'Creating and inserting countdown for event:', eventInfo);
  
  // Create or retrieve the countdown element
  let countdownElement = document.getElementById('polyteller-countdown');
  if (!countdownElement) {
    log('Content', 'Creating new countdown element');
    countdownElement = document.createElement('div');
    countdownElement.id = 'polyteller-countdown';
    document.body.appendChild(countdownElement);
    log('Content', 'Countdown element appended to body');
  }

  // Set styles for the countdown element
  countdownElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 9999;
    transition: all 0.3s ease-in-out;
    opacity: 0.5;
    transform: scale(1);
  `;

  /**
   * Updates the countdown text based on the current time and event end time.
   */
  const updateCountdown = () => {
    const { days, hours, minutes, seconds } = calculateTimeRemaining(eventInfo.endTime);

    if (days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0) {
      // Event has ended
      if (isExtensionPopup) {
        const endDate = new Date(eventInfo.endTime);
        const timezoneSuffix = eventInfo.timezone === 'ET' ? 
          `${isDST(endDate) ? 'EDT' : 'EST'}` : 
          eventInfo.timezone;
        
        countdownElement.innerHTML = `
          <div>Event has ended</div>
          <div style="font-size: 12px; margin-top: 5px;">
            Ended on ${formatDate(endDate)} ${timezoneSuffix}
          </div>
        `;
      } else {
        countdownElement.textContent = 'Event has ended';
      }
    } else {
      // Event is still ongoing
      countdownElement.textContent = getTimeRemaining(eventInfo.endTime);
      
      // Add timezone info
      if (eventInfo.timezone === 'ET') {
        const now = new Date();
        const isDuringDSTChange = Math.abs(eventInfo.endTime - now.getTime()) < 24 * 60 * 60 * 1000 && // Within 24 hours
                                 now.getMonth() === 10 && // November
                                 now.getDate() === 3; // First Sunday
        
        if (isDuringDSTChange) {
          countdownElement.innerHTML += `
            <div style="font-size: 10px; margin-top: 5px; color: #ff9800;">
              Note: DST change occurs during countdown
            </div>
          `;
        }
      }
    }

    log('Content', 'Updated countdown text:', countdownElement.textContent);
  };

  // Initial update and set interval for continuous updates
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Add hover effects for non-popup countdown
  if (!isExtensionPopup) {
    countdownElement.addEventListener('mouseenter', () => {
      countdownElement.style.opacity = '1';
      countdownElement.style.transform = 'scale(1.1)';
    });

    countdownElement.addEventListener('mouseleave', () => {
      countdownElement.style.opacity = '0.5';
      countdownElement.style.transform = 'scale(1)';
    });
  }
}

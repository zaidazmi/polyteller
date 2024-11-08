/**
 * Countdown manager for Polyteller.
 * This file contains functions for creating, inserting, and updating the countdown element.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';
import { calculateTimeRemaining, formatDate, getTimeRemaining } from '../utils/dateUtils';
import { isDST } from '../utils/timezoneUtils';

let countdownInterval: number | null = null;
let countdownElement: HTMLElement | null = null;

/**
 * Creates and inserts a countdown element for the given event.
 * @param eventInfo - The event information
 * @param isExtensionPopup - Whether the countdown is being created for the extension popup
 */
export function createAndInsertCountdown(eventInfo: PolymarketEvent, isExtensionPopup: boolean) {
  log('Content', 'Creating and inserting countdown for event:', eventInfo);
  
  // Clear any existing interval
  clearCountdownInterval();

  // Create or retrieve the countdown element
  countdownElement = document.getElementById('polyteller-countdown');
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
    if (!countdownElement) return;

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
  countdownInterval = window.setInterval(updateCountdown, 1000);

  // Add hover effects for non-popup countdown
  if (!isExtensionPopup) {
    countdownElement.addEventListener('mouseenter', () => {
      if (countdownElement) {
        countdownElement.style.opacity = '1';
        countdownElement.style.transform = 'scale(1.1)';
      }
    });

    countdownElement.addEventListener('mouseleave', () => {
      if (countdownElement) {
        countdownElement.style.opacity = '0.5';
        countdownElement.style.transform = 'scale(1)';
      }
    });
  }
}

/**
 * Clears the countdown interval and element.
 */
function clearCountdownInterval() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

/**
 * Clears the countdown and shows refresh hint.
 */
export function clearCountdown() {
  clearCountdownInterval();
  
  if (!countdownElement) {
    countdownElement = document.getElementById('polyteller-countdown');
  }

  if (countdownElement) {
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
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    countdownElement.innerHTML = `
      <svg 
        style="width: 14px; height: 14px;" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      >
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
      </svg>
      <div style="color: white; font-size: 14px;">
        Refresh page to update
      </div>
    `;

    // Add click handler for refresh
    countdownElement.addEventListener('click', () => {
      window.location.reload();
    });

    // Keep the hover effects
    countdownElement.addEventListener('mouseenter', () => {
      countdownElement!.style.opacity = '1';
      countdownElement!.style.transform = 'scale(1.1)';
    });

    countdownElement.addEventListener('mouseleave', () => {
      countdownElement!.style.opacity = '0.5';
      countdownElement!.style.transform = 'scale(1)';
    });
  }
}

/**
 * Countdown manager for Polyteller.
 * This file contains functions for creating, inserting, and updating the countdown element.
 */

import { PolymarketEvent } from '../types';
import { CountdownManager } from '../utils/CountdownManager';
import { formatDate } from '../utils/dateUtils';
import { isDST } from '../utils/timezoneUtils';
import { TimeRemaining } from '../utils/CountdownManager';

let countdownElement: HTMLElement | null = null;
let unsubscribe: (() => void) | null = null;

/**
 * Creates and inserts a countdown element for the given event.
 * @param eventInfo - The event information
 * @param isExtensionPopup - Whether the countdown is being created for the extension popup
 */
function createAndInsertCountdown(eventInfo: PolymarketEvent, isExtensionPopup: boolean) {
  // Clear any existing subscription
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  // Create or retrieve the countdown element
  countdownElement = document.getElementById('polyteller-countdown');
  if (!countdownElement) {
    countdownElement = document.createElement('div');
    countdownElement.id = 'polyteller-countdown';
    document.body.appendChild(countdownElement);
  }

  // Set styles
  setCountdownStyles(countdownElement, isExtensionPopup);

  // Register event and subscribe to updates
  const countdownManager = CountdownManager.getInstance();
  countdownManager.registerEvent(eventInfo);
  
  unsubscribe = countdownManager.subscribe(eventInfo.id, (timeLeft) => {
    if (!countdownElement) return;

    if (timeLeft.hasEnded) {
      handleEndedEvent(eventInfo, isExtensionPopup);
    } else {
      updateOngoingEvent(timeLeft, eventInfo);
    }
  });

  // Add hover effects for non-popup countdown
  if (!isExtensionPopup) {
    addHoverEffects(countdownElement);
  }
}

/**
 * Sets the styles for the countdown element.
 * @param element - The countdown element
 * @param isExtensionPopup - Whether the countdown is being created for the extension popup
 */
function setCountdownStyles(element: HTMLElement, isExtensionPopup: boolean) {
  element.style.cssText = `
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
}

/**
 * Handles the event when the event has ended.
 * @param eventInfo - The event information
 * @param isExtensionPopup - Whether the countdown is being created for the extension popup
 */
function handleEndedEvent(eventInfo: PolymarketEvent, isExtensionPopup: boolean) {
  if (!countdownElement) return;

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
}

/**
 * Updates the countdown text based on the current time and event end time.
 * @param timeLeft - The time remaining for the event
 * @param eventInfo - The event information
 */
function updateOngoingEvent(timeLeft: TimeRemaining, eventInfo: PolymarketEvent) {
  if (!countdownElement) return;

  if (eventInfo.isResolved) {
    countdownElement.innerHTML = `
      <div class="resolved-event">
        <span class="resolved-label">Event Resolved</span>
        ${eventInfo.outcome ? `<span class="outcome">Outcome: ${eventInfo.outcome}</span>` : ''}
      </div>
    `;
    return;
  }

  countdownElement.textContent = formatContentCountdown(timeLeft);
  
  // Add timezone info
  if (eventInfo.timezone === 'ET') {
    const now = new Date();
    const isDuringDSTChange = Math.abs(eventInfo.endTime - now.getTime()) < 24 * 60 * 60 * 1000 && 
                             now.getMonth() === 10 && 
                             now.getDate() === 3;
    
    if (isDuringDSTChange) {
      countdownElement.innerHTML += `
        <div style="font-size: 10px; margin-top: 5px; color: #ff9800;">
          Note: DST change occurs during countdown
        </div>
      `;
    }
  }
}

/**
 * Adds hover effects for the countdown element.
 * @param element - The countdown element
 */
function addHoverEffects(element: HTMLElement) {
  element.addEventListener('mouseenter', () => {
    if (element) {
      element.style.opacity = '1';
      element.style.transform = 'scale(1.1)';
    }
  });

  element.addEventListener('mouseleave', () => {
    if (element) {
      element.style.opacity = '0.5';
      element.style.transform = 'scale(1)';
    }
  });
}

function formatContentCountdown(timeLeft: TimeRemaining): string {
  return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
}

/**
 * Clears the countdown element.
 */
function clearCountdown() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  
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

export {
  createAndInsertCountdown,
  clearCountdown
};

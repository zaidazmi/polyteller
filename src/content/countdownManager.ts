/**
 * Countdown manager for Polyteller.
 * This file contains functions for creating, inserting, and updating the countdown element.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';

/**
 * Creates and inserts a countdown element for the given event.
 * @param eventInfo - The event information
 * @param isExtensionPopup - Whether the countdown is being created for the extension popup
 */
export function createAndInsertCountdown(eventInfo: PolymarketEvent, isExtensionPopup: boolean) {
  log('Content', 'Creating and inserting countdown for event:', eventInfo);
  
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
    const now = new Date().getTime();
    const timeLeft = eventInfo.endTime - now;

    if (timeLeft <= 0) {
      if (isExtensionPopup) {
        const endDate = new Date(eventInfo.endTime);
        countdownElement.innerHTML = `
          <div>Event has ended</div>
          <div style="font-size: 12px; margin-top: 5px;">Ended on ${endDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ${eventInfo.timezone}</div>
        `;
      } else {
        countdownElement.textContent = 'Event has ended';
      }
    } else {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
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

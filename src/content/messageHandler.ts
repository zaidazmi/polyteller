/**
 * Message handler for Polyteller content script.
 * This file contains functions for sending messages to the background script.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';

/**
 * Creates a debounced version of a function.
 * @param func - The function to debounce
 * @param waitFor - The number of milliseconds to wait before invoking the function
 * @returns A debounced version of the input function
 */
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

/**
 * Sends event information to the background script.
 * @param eventInfo - The event information to send
 */
function sendEventInfoImpl(eventInfo: PolymarketEvent) {
  log('Content', 'Sending event info to background:', eventInfo);
  chrome.runtime.sendMessage({ type: 'EVENT_INFO', data: eventInfo }, (response) => {
    if (chrome.runtime.lastError) {
      log('Content', 'Error sending event info to background:', chrome.runtime.lastError);
    } else {
      log('Content', 'Event info sent successfully:', response);
    }
  });
}

// Export a debounced version of sendEventInfoImpl
export const sendEventInfo = debounce(sendEventInfoImpl, 1000);

/**
 * Main content script for Polyteller.
 * This file serves as the entry point for the content script, initializing the countdown
 * and setting up necessary observers and event handlers.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';
import { extractEventInfo } from './eventExtractor';
import { createAndInsertCountdown } from './countdownManager';
import { initializeDOMObserver } from './domManipulator';
import { sendEventInfo } from './messageHandler';

let isInitialized = false;

/**
 * Initializes the countdown for the current Polymarket event.
 * This function extracts event information, sends it to the background script,
 * and creates the countdown element if not already initialized.
 */
function initializeCountdown() {
  if (isInitialized) return;
  isInitialized = true;

  log('Content', 'Initializing countdown');
  const eventInfo = extractEventInfo();
  if (eventInfo) {
    log('Content', 'Event info extracted:', eventInfo);
    sendEventInfo(eventInfo);
    createAndInsertCountdown(eventInfo, false);
  } else {
    log('Content', 'Failed to extract event info');
  }
}

// Initial call to initialize countdown
initializeCountdown();

// Set up DOM observer to reinitialize countdown on page changes
initializeDOMObserver(initializeCountdown);

log('Content', 'Polyteller content script loaded');

// Extract event info when the page loads
extractEventInfo();

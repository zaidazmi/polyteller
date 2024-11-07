/**
 * Main content script for Polyteller.
 * This file serves as the entry point for the content script, initializing the countdown
 * and setting up necessary observers and event handlers.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';
import { extractEventInfo } from './eventExtractor';
import { createAndInsertCountdown, clearCountdown } from './countdownManager';
import { initializeDOMObserver, initializeDOMManipulations } from './domManipulator';
import { sendEventInfo } from './messageHandler';
import '../styles/content.css';

let isInitialized = false;
let currentUrl = window.location.href;

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

// Add this at the end of the file
initializeDOMManipulations();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTradeConfirmation') {
    log('Content', `Received trade confirmation update: ${message.enabled}`);
    chrome.storage.local.set({ enableTradeConfirmation: message.enabled }, () => {
      log('Content', `Updated trade confirmation setting: ${message.enabled}`);
      sendResponse({ received: true });
    });
    return true; // Indicates that the response is sent asynchronously
  }
});

// Function to handle URL changes
function handleUrlChange() {
  const newUrl = window.location.href;
  if (currentUrl !== newUrl) {
    log('Content', `Route changed from ${new URL(currentUrl).pathname} to ${new URL(newUrl).pathname}`);
    currentUrl = newUrl;
    
    // Clear the countdown and show refresh message
    clearCountdown();
    isInitialized = false; // Reset initialization flag

    // Notify background script to clear current event
    chrome.runtime.sendMessage({ 
      type: 'CLEAR_CURRENT_EVENT'
    });
  }
}

// Set up URL change detection
const urlObserver = new MutationObserver(() => {
  handleUrlChange();
});

urlObserver.observe(document.body, {
  subtree: true,
  childList: true
});

// Also handle popstate events for browser back/forward
window.addEventListener('popstate', handleUrlChange);

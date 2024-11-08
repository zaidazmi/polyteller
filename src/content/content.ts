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
let lastEventSlug: string | null = null;
let urlObserver: MutationObserver | null = null;

// Add retry mechanism for sending event info
async function sendEventInfoWithRetry(eventInfo: PolymarketEvent, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'EVENT_INFO', data: eventInfo }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Initializes the countdown for the current Polymarket event.
 * This function extracts event information, sends it to the background script,
 * and creates the countdown element if not already initialized.
 */
async function initializeCountdown() {
  if (isInitialized) return;

  log('Content', 'Initializing countdown');
  const eventInfo = extractEventInfo();
  
  if (eventInfo) {
    // Extract current event slug from URL
    const currentSlug = window.location.pathname.split('/').pop()?.split('?')[0];
    
    // Check if event data matches current URL
    if (currentSlug && eventInfo.url.includes(currentSlug)) {
      log('Content', 'Event info extracted:', eventInfo);
      lastEventSlug = currentSlug;
      isInitialized = true;
      try {
        await sendEventInfoWithRetry(eventInfo);
        createAndInsertCountdown(eventInfo, false);
      } catch (error) {
        log('Content', 'Error sending event info:', error);
      }
    } else {
      log('Content', 'Event data mismatch with URL, showing refresh hint');
      clearCountdown();
    }
  } else {
    log('Content', 'Failed to extract event info');
  }
}

// Function to handle URL changes
function handleUrlChange() {
  const newUrl = window.location.href;
  if (currentUrl !== newUrl) {
    log('Content', `Route changed from ${new URL(currentUrl).pathname} to ${new URL(newUrl).pathname}`);
    currentUrl = newUrl;
    
    // Get new event slug
    const newSlug = window.location.pathname.split('/').pop()?.split('?')[0];
    
    // Always clear old countdown and reset initialization
    clearCountdown();
    isInitialized = false;
    
    // If we're moving to a different event, ensure we show refresh hint
    if (newSlug && lastEventSlug && newSlug !== lastEventSlug) {
      log('Content', 'Different event detected, showing refresh hint');
      lastEventSlug = null;
    }

    // Notify background script to clear current event
    chrome.runtime.sendMessage({ 
      type: 'CLEAR_CURRENT_EVENT'
    });
  }
}

// Initial call to initialize countdown
initializeCountdown();

// Set up DOM observer to reinitialize countdown on page changes
initializeDOMObserver(initializeCountdown);

log('Content', 'Polyteller content script loaded');

// Set up URL change detection
function setupUrlObserver() {
  if (urlObserver) {
    urlObserver.disconnect();
  }

  urlObserver = new MutationObserver(() => {
    handleUrlChange();
  });

  urlObserver.observe(document.body, {
    subtree: true,
    childList: true
  });
}

// Add cleanup function
function cleanup() {
  if (urlObserver) {
    urlObserver.disconnect();
    urlObserver = null;
  }
  clearCountdown();
  window.removeEventListener('popstate', handleUrlChange);
}

// Add cleanup on unload
window.addEventListener('unload', cleanup);

// Update initialization
setupUrlObserver();
window.addEventListener('popstate', handleUrlChange);

// Also handle popstate events for browser back/forward
window.addEventListener('popstate', handleUrlChange);

// Add this at the end of the file
initializeDOMManipulations();

// Handle trade confirmation updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTradeConfirmation') {
    log('Content', `Received trade confirmation update: ${message.enabled}`);
    chrome.storage.local.set({ enableTradeConfirmation: message.enabled }, () => {
      log('Content', `Updated trade confirmation setting: ${message.enabled}`);
      sendResponse({ received: true });
    });
    return true;
  }
});

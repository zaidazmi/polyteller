/**
 * Main content script for Polyteller.
 * 
 * Key Features:
 * 1. URL Change Detection: Handles Polymarket's SPA navigation
 * 2. Refresh Hint: Shows when manual refresh is needed
 * 3. Sports Page Detection: Shows unsupported message
 * 4. Auto-sync: Attempts to update data without refresh when possible
 * 
 * Why We Built This:
 * Polymarket is a Single Page Application (SPA) which means when users navigate
 * between events, the URL changes but the page doesn't fully reload. This causes:
 * - Old countdown data to persist
 * - New event data not being automatically loaded
 * - Users seeing stale information
 * - Confusion about why the countdown isn't updating
 * 
 * Our solution:
 * 1. Detect actual pathname changes (ignoring query params)
 * 2. Show a user-friendly refresh hint when needed
 * 3. Attempt auto-sync for minor updates
 * 4. Handle special cases like sports pages
 */



import { log } from '../utils/logUtils';
import { extractEventInfo } from './eventExtractor';
import { createAndInsertCountdown, clearCountdown } from './countdownManager';
import { initializeDOMObserver, initializeDOMManipulations } from './domManipulator';
import { sendEventInfo } from './messageHandler';
import { PolymarketEvent } from '../types';
import '../styles/content.css';

let isInitialized = false;
let currentUrl = window.location.href;
let lastEventSlug: string | null = null;
let countdownElement: HTMLElement | null = null;
let marketDataObserver: MutationObserver | null = null;

/**
 * Initializes the countdown for the current Polymarket event.
 * This function extracts event information, sends it to the background script,
 * and creates the countdown element if not already initialized.
 */
function initializeCountdown() {
  if (isInitialized) return;

  log('Content', 'Initializing countdown');
  
  if (window.location.pathname.startsWith('/sports/')) {
    showSportsNotSupported();
    return;
  }

  const eventInfo = extractEventInfo();
  
  if (eventInfo) {
    const currentSlug = window.location.pathname.split('/').pop()?.split('?')[0];
    
    if (currentSlug && eventInfo.url.includes(currentSlug)) {
      log('Content', 'Event info extracted:', eventInfo);
      lastEventSlug = currentSlug;
      isInitialized = true;
      sendEventInfo(eventInfo);
      createAndInsertCountdown(eventInfo, false);
      tryAutoSync();
    } else {
      log('Content', 'Event data mismatch with URL, showing refresh hint');
      clearCountdown();
    }
  } else {
    log('Content', 'Failed to extract event info');
  }
}

function tryAutoSync() {
  if (marketDataObserver) {
    marketDataObserver.disconnect();
  }

  marketDataObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.target instanceof Element && 
          (mutation.target.matches('[data-market-info]') || 
           mutation.target.closest('[data-market-info]'))) {
        log('Content', 'Market data change detected');
        const newEventInfo = extractEventInfo();
        if (newEventInfo) {
          updateCountdownWithoutReload(newEventInfo);
        }
      }
    }
  });

  marketDataObserver.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-market-info']
  });
}

function updateCountdownWithoutReload(newEventInfo: PolymarketEvent) {
  log('Content', 'Updating countdown without reload:', newEventInfo);
  clearCountdown();
  createAndInsertCountdown(newEventInfo, false);
  sendEventInfo(newEventInfo);
}

/**
 * Handles URL changes in Polymarket's SPA environment.
 * Only triggers on pathname changes, not query params.
 * Examples:
 * - /event/bitcoin-price → /event/another-event (triggers refresh hint)
 * - /event/bitcoin-price → /event/bitcoin-price?tid=123 (no trigger)
 * - /event/bitcoin-price → /sports/nfl (shows sports message)
 */
function handleUrlChange() {
  const newUrl = window.location.href;
  const currentPath = new URL(currentUrl).pathname;
  const newPath = new URL(newUrl).pathname;
  
  // Only trigger on actual path changes, not query params
  if (currentPath !== newPath) {
    log('Content', `Route changed from ${currentPath} to ${newPath}`);
    currentUrl = newUrl;
    
    // Always remove any existing countdown/message elements first
    removeExistingElements();
    
    // Reset initialization
    isInitialized = false;
    
    // Check if it's a sports URL
    if (newPath.startsWith('/sports/')) {
      showSportsNotSupported();
      if (marketDataObserver) {
        marketDataObserver.disconnect();
      }
    } else if (newPath.startsWith('/event/')) {
      // Only show refresh hint if we're navigating between event pages
      const newSlug = newPath.split('/').pop()?.split('?')[0];
      if (newSlug && newSlug !== lastEventSlug) {
        log('Content', 'Different event detected, showing refresh hint');
        lastEventSlug = null;
        showRefreshHint();
      } else {
        tryAutoSync();
      }
    } else {
      // For non-event pages (like /markets/politics), just cleanup
      log('Content', 'Non-event page detected, cleaning up');
      lastEventSlug = null;
      if (marketDataObserver) {
        marketDataObserver.disconnect();
      }
    }

    // Notify background script to clear current event
    chrome.runtime.sendMessage({ 
      type: 'CLEAR_CURRENT_EVENT'
    });
  }
}

// Add new function to properly clean up existing elements
function removeExistingElements() {
  // Remove any existing countdown elements
  const existingElements = document.querySelectorAll('#polyteller-countdown');
  existingElements.forEach(element => element.remove());
  
  // Reset countdownElement reference
  countdownElement = null;
}

function showSportsNotSupported() {
  // Ensure clean slate before showing message
  removeExistingElements();
  
  countdownElement = document.createElement('div');
  countdownElement.id = 'polyteller-countdown';
  document.body.appendChild(countdownElement);

  countdownElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    z-index: 9999;
    transition: all 0.3s ease-in-out;
    opacity: 0.5;
    transform: scale(1);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: default;
  `;

  countdownElement.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <span>Sports events are not supported yet</span>
  `;

  // Add hover effects
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

// Add new function for showing refresh hint
function showRefreshHint() {
  // Ensure clean slate before showing message
  removeExistingElements();
  
  countdownElement = document.createElement('div');
  countdownElement.id = 'polyteller-countdown';
  document.body.appendChild(countdownElement);

  countdownElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    z-index: 9999;
    transition: all 0.3s ease-in-out;
    opacity: 0.5;
    transform: scale(1);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  `;

  countdownElement.innerHTML = `
    <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
    </svg>
    <div style="color: white; font-size: 14px;">
      Refresh page to update
    </div>
  `;

  // Add hover effects
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

  // Add click handler for refresh
  countdownElement.addEventListener('click', () => {
    window.location.reload();
  });
}

// Initial call to initialize countdown
initializeCountdown();

// Set up DOM observer to reinitialize countdown on page changes
initializeDOMObserver(initializeCountdown);

log('Content', 'Polyteller content script loaded');

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

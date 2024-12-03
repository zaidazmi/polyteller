/**
 * UI update functions for the Polyteller popup.
 * This file contains functions responsible for updating various UI elements in the popup.
 */

import { PolymarketEvent } from '../../types';
import { log } from '../../utils/logUtils';
import { displayCountdown } from './countdown';
import { isValidTimestamp } from '../../utils/dateUtils';
import { displayStatus } from '../utils';

/**
 * Updates the UI with event information.
 * @param eventInfo - The event information to display
 */
export function updateUI(eventInfo: PolymarketEvent | null) {
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    const currentUrl = tabs[0]?.url || '';
    
    // Handle sports URLs immediately
    if (currentUrl.includes('/sports/')) {
      displaySportsNotSupported();
      return;
    }
    
    // For non-sports URLs, handle event info
    if (!eventInfo) {
      displayError('No event found on this page.');
      return;
    }

    log('Popup', 'Updating UI with event info:', eventInfo);
    
    // Show all sections that might have been hidden
    const sectionsToShow = [
      'countdown',
      'local-end-time',
      'notify-section',
      'set-notifications'
    ];

    sectionsToShow.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = ''; // Reset to default display
      }
    });

    const titleElement = document.getElementById('event-title');
    if (titleElement) {
      titleElement.textContent = eventInfo.title;
    }

    if (typeof eventInfo.endTime === 'number' && isValidTimestamp(eventInfo.endTime)) {
      // Clear existing countdown first
      const countdownElement = document.getElementById('countdown');
      if (countdownElement) {
        countdownElement.innerHTML = '';
      }
      
      // Initialize new countdown
      displayCountdown(eventInfo);
    } else {
      log('Invalid endTime:', eventInfo.endTime);
      displayStatus('Invalid event end time');
    }
  });
}

/**
 * Displays sports not supported message in the popup.
 */
function displaySportsNotSupported() {
  // Hide all sections first
  const sectionsToHide = [
    'countdown',
    'local-end-time',
    'notify-section',
    'set-notifications'
  ];

  sectionsToHide.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
    }
  });

  // Clear notifications list
  const notificationsList = document.getElementById('notifications-list');
  if (notificationsList) {
    notificationsList.innerHTML = '';
  }

  // Clear any existing content
  const eventTitle = document.getElementById('event-title');
  if (eventTitle) {
    // Clear any existing content first
    eventTitle.innerHTML = '';
    
    // Add sports message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-color);
      background-color: var(--countdown-background);
      padding: 12px 16px;
      border-radius: 8px;
      margin: 0;
    `;
    
    messageDiv.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span style="font-weight: 500;">Currently we dont support Sports section</span>
    `;
    
    eventTitle.appendChild(messageDiv);
  }

  // Force cleanup of any other messages
  const statusMessage = document.getElementById('notification-status');
  if (statusMessage) {
    statusMessage.textContent = '';
  }
}

/**
 * Displays an error message in the popup.
 * @param message - The error message to display
 */
export function displayError(message: string) {
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    const currentUrl = tabs[0]?.url || '';
    const currentTabId = tabs[0]?.id;
    const eventTitle = document.getElementById('event-title');
    
    if (eventTitle) {
      let errorMessage = message;
      let subMessage = '';
      let actionButton = '';
      
      if (!currentUrl.includes('polymarket.com')) {
        errorMessage = 'Visit Polymarket to use this extension';
        subMessage = 'This extension only works on <a href="https://polymarket.com" target="_blank" style="color: #4A4FE4; text-decoration: none; font-weight: 700;">polymarket.com</a>';
      } else if (!currentUrl.includes('/event/')) {
        errorMessage = 'No event found on this page';
        subMessage = 'Navigate to a Polymarket event page to use this extension';
      } else {
        errorMessage = 'No event found on this page';
        subMessage = 'Click the button below to refresh and see the countdown';
        actionButton = `
          <div style="display: flex; justify-content: center; width: 100%;">
            <button 
              id="refresh-button"
              style="
                background: var(--primary-color);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                margin-top: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
              "
              onmouseover="this.style.transform='scale(1.02)'"
              onmouseout="this.style.transform='scale(1)'"
            >
              <svg id="refresh-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
              </svg>
              <span id="refresh-text">Refresh Page</span>
            </button>
          </div>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .loading-dots {
              display: flex;
              gap: 4px;
            }
            .loading-dots span {
              width: 4px;
              height: 4px;
              background: white;
              border-radius: 50%;
              animation: dots 1.5s infinite;
            }
            .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
            .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes dots {
              0%, 100% { opacity: 0; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1); }
            }
          </style>
        `;
      }

      eventTitle.innerHTML = `
        <div style="color: var(--text-color);">${errorMessage}</div>
        <div style="color: var(--text-light); font-size: 14px; margin-top: 8px;">
          ${subMessage}
        </div>
        ${actionButton}
      `;

      // Add click handler after the button is in the DOM
      const refreshButton = document.getElementById('refresh-button');
      if (refreshButton && currentTabId) {
        refreshButton.addEventListener('click', () => {
          const refreshIcon = document.getElementById('refresh-icon');
          const refreshText = document.getElementById('refresh-text');
          
          if (refreshIcon && refreshText) {
            // Disable button
            refreshButton.style.cursor = 'default';
            refreshButton.style.opacity = '1';
            refreshButton.style.transform = 'scale(0.95)';
            
            // Update button content to show loading state
            refreshText.innerHTML = `
              <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            `;
            refreshIcon.style.animation = 'spin 1s linear infinite';

            // Short delay before reload
            setTimeout(() => {
              chrome.tabs.reload(currentTabId);
            }, 300);
          }
        });
      }
    }

    // Hide countdown and notification sections
    const countdown = document.getElementById('countdown');
    const notifySection = document.getElementById('notify-section');
    if (countdown) countdown.style.display = 'none';
    if (notifySection) notifySection.style.display = 'none';
  });
}

/**
 * Toggles the visibility of custom time input fields.
 * @param show - Whether to show or hide the custom time inputs
 */
export function toggleCustomTimeInputs(show: boolean) {
  const customInputs = document.getElementById('custom-time-inputs');
  if (customInputs) {
    customInputs.style.display = show ? 'flex' : 'none';
  }
}

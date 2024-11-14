/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/styles/content.css":
/*!********************************!*\
  !*** ./src/styles/content.css ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/config.ts":
/*!***********************!*\
  !*** ./src/config.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   INTERVALS: () => (/* binding */ INTERVALS),
/* harmony export */   MIN_WIDTH_FOR_CONFIRMATION: () => (/* binding */ MIN_WIDTH_FOR_CONFIRMATION)
/* harmony export */ });
const INTERVALS = {
    CLEANUP_NOTIFICATIONS: 60000,
    CHECK_ALARMS: 60000,
    TRIGGER_ALARMS_MANUALLY: 10000,
    SYNC_NOTIFICATIONS: 60000,
    SYNC_STORE: 5000
};
const MIN_WIDTH_FOR_CONFIRMATION = 1050;


/***/ }),

/***/ "./src/content/content.ts":
/*!********************************!*\
  !*** ./src/content/content.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/logUtils */ "./src/utils/logUtils.ts");
/* harmony import */ var _eventExtractor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./eventExtractor */ "./src/content/eventExtractor.ts");
/* harmony import */ var _countdownManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./countdownManager */ "./src/content/countdownManager.ts");
/* harmony import */ var _domManipulator__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./domManipulator */ "./src/content/domManipulator.ts");
/* harmony import */ var _messageHandler__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./messageHandler */ "./src/content/messageHandler.ts");
/* harmony import */ var _styles_content_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../styles/content.css */ "./src/styles/content.css");
/**
 * Main content script for Polyteller.
 * This file serves as the entry point for the content script, initializing the countdown
 * and setting up necessary observers and event handlers.
 */






let isInitialized = false;
let currentUrl = window.location.href;
let lastEventSlug = null;
/**
 * Initializes the countdown for the current Polymarket event.
 * This function extracts event information, sends it to the background script,
 * and creates the countdown element if not already initialized.
 */
function initializeCountdown() {
    if (isInitialized)
        return;
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Initializing countdown');
    const eventInfo = (0,_eventExtractor__WEBPACK_IMPORTED_MODULE_1__.extractEventInfo)();
    if (eventInfo) {
        // Extract current event slug from URL
        const currentSlug = window.location.pathname.split('/').pop()?.split('?')[0];
        // Check if event data matches current URL
        if (currentSlug && eventInfo.url.includes(currentSlug)) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Event info extracted:', eventInfo);
            lastEventSlug = currentSlug;
            isInitialized = true;
            (0,_messageHandler__WEBPACK_IMPORTED_MODULE_4__.sendEventInfo)(eventInfo);
            (0,_countdownManager__WEBPACK_IMPORTED_MODULE_2__.createAndInsertCountdown)(eventInfo, false);
        }
        else {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Event data mismatch with URL, showing refresh hint');
            (0,_countdownManager__WEBPACK_IMPORTED_MODULE_2__.clearCountdown)();
        }
    }
    else {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Failed to extract event info');
    }
}
// Function to handle URL changes
function handleUrlChange() {
    const newUrl = window.location.href;
    if (currentUrl !== newUrl) {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', `Route changed from ${new URL(currentUrl).pathname} to ${new URL(newUrl).pathname}`);
        currentUrl = newUrl;
        // Get new event slug
        const newSlug = window.location.pathname.split('/').pop()?.split('?')[0];
        // Always clear old countdown and reset initialization
        (0,_countdownManager__WEBPACK_IMPORTED_MODULE_2__.clearCountdown)();
        isInitialized = false;
        // If we're moving to a different event, ensure we show refresh hint
        if (newSlug && lastEventSlug && newSlug !== lastEventSlug) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Different event detected, showing refresh hint');
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
(0,_domManipulator__WEBPACK_IMPORTED_MODULE_3__.initializeDOMObserver)(initializeCountdown);
(0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Polyteller content script loaded');
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
(0,_domManipulator__WEBPACK_IMPORTED_MODULE_3__.initializeDOMManipulations)();
// Handle trade confirmation updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateTradeConfirmation') {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', `Received trade confirmation update: ${message.enabled}`);
        chrome.storage.local.set({ enableTradeConfirmation: message.enabled }, () => {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', `Updated trade confirmation setting: ${message.enabled}`);
            sendResponse({ received: true });
        });
        return true;
    }
});


/***/ }),

/***/ "./src/content/countdownManager.ts":
/*!*****************************************!*\
  !*** ./src/content/countdownManager.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clearCountdown: () => (/* binding */ clearCountdown),
/* harmony export */   createAndInsertCountdown: () => (/* binding */ createAndInsertCountdown)
/* harmony export */ });
/* harmony import */ var _utils_CountdownManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/CountdownManager */ "./src/utils/CountdownManager.ts");
/* harmony import */ var _utils_dateUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/dateUtils */ "./src/utils/dateUtils.ts");
/* harmony import */ var _utils_timezoneUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/timezoneUtils */ "./src/utils/timezoneUtils.ts");
/**
 * Countdown manager for Polyteller.
 * This file contains functions for creating, inserting, and updating the countdown element.
 */



let countdownElement = null;
let unsubscribe = null;
/**
 * Creates and inserts a countdown element for the given event.
 * @param eventInfo - The event information
 * @param isExtensionPopup - Whether the countdown is being created for the extension popup
 */
function createAndInsertCountdown(eventInfo, isExtensionPopup) {
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
    const countdownManager = _utils_CountdownManager__WEBPACK_IMPORTED_MODULE_0__.CountdownManager.getInstance();
    countdownManager.registerEvent(eventInfo);
    unsubscribe = countdownManager.subscribe(eventInfo.id, (timeLeft) => {
        if (!countdownElement)
            return;
        if (timeLeft.hasEnded) {
            handleEndedEvent(eventInfo, isExtensionPopup);
        }
        else {
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
function setCountdownStyles(element, isExtensionPopup) {
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
function handleEndedEvent(eventInfo, isExtensionPopup) {
    if (!countdownElement)
        return;
    if (isExtensionPopup) {
        const endDate = new Date(eventInfo.endTime);
        const timezoneSuffix = eventInfo.timezone === 'ET' ?
            `${(0,_utils_timezoneUtils__WEBPACK_IMPORTED_MODULE_2__.isDST)(endDate) ? 'EDT' : 'EST'}` :
            eventInfo.timezone;
        countdownElement.innerHTML = `
      <div>Event has ended</div>
      <div style="font-size: 12px; margin-top: 5px;">
        Ended on ${(0,_utils_dateUtils__WEBPACK_IMPORTED_MODULE_1__.formatDate)(endDate)} ${timezoneSuffix}
      </div>
    `;
    }
    else {
        countdownElement.textContent = 'Event has ended';
    }
}
/**
 * Updates the countdown text based on the current time and event end time.
 * @param timeLeft - The time remaining for the event
 * @param eventInfo - The event information
 */
function updateOngoingEvent(timeLeft, eventInfo) {
    if (!countdownElement)
        return;
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
function addHoverEffects(element) {
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
function formatContentCountdown(timeLeft) {
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
            countdownElement.style.opacity = '1';
            countdownElement.style.transform = 'scale(1.1)';
        });
        countdownElement.addEventListener('mouseleave', () => {
            countdownElement.style.opacity = '0.5';
            countdownElement.style.transform = 'scale(1)';
        });
    }
}



/***/ }),

/***/ "./src/content/domManipulator.ts":
/*!***************************************!*\
  !*** ./src/content/domManipulator.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeDOMManipulations: () => (/* binding */ initializeDOMManipulations),
/* harmony export */   initializeDOMObserver: () => (/* binding */ initializeDOMObserver),
/* harmony export */   interceptBuyButton: () => (/* binding */ interceptBuyButton)
/* harmony export */ });
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/logUtils */ "./src/utils/logUtils.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");
/* harmony import */ var _tradeConfirmation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./tradeConfirmation */ "./src/content/tradeConfirmation.ts");
/**
 * DOM manipulator for Polyteller.
 * This file contains functions for observing and manipulating the DOM.
 */



let isProcessingClick = false;
let confirmationDialog = null;
let countdownInterval = null;
function createConfirmationDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'polyteller-confirmation-dialog';
    dialog.style.cssText = `
    position: fixed;
    background-color: #FFFFFF;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    color: #333333;
    width: 280px;
    text-align: center;
  `;
    dialog.innerHTML = `
    <div style="position: relative;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">Trade Confirmation</h2>
      <button id="closeDialog" style="position: absolute; top: -10px; right: -10px; background: none; border: none; cursor: pointer; font-size: 20px; color: #999;">×</button>
      <p style="margin-bottom: 20px; font-size: 14px;">Are you sure you want to make this trade?</p>
      <div style="display: flex; justify-content: center; gap: 10px;">
        <button id="confirmYes" style="
          background-color: #4A4FE4;
          border: none;
          color: white;
          padding: 12px;
          text-align: center;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
          width: 100px;
          height: 50px;
          justify-content: center;
        ">
          <span style="font-weight: bold; font-size: 16px;">Yes</span>
          <span style="font-size: 10px; opacity: 0.8;">Enter</span>
        </button>
        <button id="confirmNo" style="
          background-color: #A41C1C;
          border: none;
          color: white;
          padding: 12px;
          text-align: center;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
          width: 100px;
          height: 50px;
          justify-content: center;
        ">
          <span id="noButtonCountdown" style="font-weight: bold; font-size: 16px;">No (3)</span>
          <span style="font-size: 10px; opacity: 0.8;">Esc</span>
        </button>
      </div>
    </div>
  `;
    // Add keyboard event listeners
    const handleKeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const yesButton = dialog.querySelector('#confirmYes');
            if (yesButton)
                yesButton.click();
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            const noButton = dialog.querySelector('#confirmNo');
            if (noButton)
                noButton.click();
        }
    };
    // Add keyboard listener when dialog is shown
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const isVisible = dialog.style.display !== 'none';
                if (isVisible) {
                    document.addEventListener('keydown', handleKeydown);
                }
                else {
                    document.removeEventListener('keydown', handleKeydown);
                }
            }
        });
    });
    observer.observe(dialog, { attributes: true });
    // Update hover effects
    const buttons = dialog.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.id !== 'closeDialog') {
            button.addEventListener('mouseover', () => {
                if (button.id === 'confirmYes') {
                    button.style.backgroundColor = '#3A3FD4'; // Slightly darker purple on hover
                }
                else if (button.id === 'confirmNo') {
                    button.style.backgroundColor = '#8B0000'; // Darker red on hover
                }
            });
            button.addEventListener('mouseout', () => {
                if (button.id === 'confirmYes') {
                    button.style.backgroundColor = '#4A4FE4'; // Original purple
                }
                else if (button.id === 'confirmNo') {
                    button.style.backgroundColor = '#A41C1C'; // Original Mexican red
                }
            });
        }
    });
    document.body.appendChild(dialog);
    // Define countdown and handleNo in this scope
    let countdown = 3;
    const handleNo = () => {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        dialog.style.display = 'none';
    };
    // Update the countdown interval
    countdownInterval = window.setInterval(() => {
        countdown--;
        const countdownSpan = dialog.querySelector('#noButtonCountdown');
        if (countdownSpan) {
            countdownSpan.textContent = `No (${countdown})`;
        }
        if (countdown <= 0) {
            handleNo();
        }
    }, 1000);
    return dialog;
}
function showConfirmationDialog(buttonRect, callback) {
    // Disable confirmation for screens smaller than MIN_WIDTH_FOR_CONFIRMATION
    if (window.innerWidth < _config__WEBPACK_IMPORTED_MODULE_1__.MIN_WIDTH_FOR_CONFIRMATION) {
        callback(true); // Automatically confirm for small screens
        return;
    }
    if (!confirmationDialog) {
        confirmationDialog = createConfirmationDialog();
    }
    // Null check for confirmationDialog
    if (!confirmationDialog)
        return;
    // Reset the countdown and button text every time the dialog is shown
    let countdown = 3;
    const noButton = confirmationDialog.querySelector('#confirmNo');
    const countdownSpan = confirmationDialog.querySelector('#noButtonCountdown');
    if (countdownSpan) {
        countdownSpan.textContent = `No (${countdown})`;
    }
    // Force the dialog to be visible but off-screen to get its dimensions
    confirmationDialog.style.display = 'block';
    confirmationDialog.style.top = '-9999px';
    confirmationDialog.style.left = '-9999px';
    // Get the updated dimensions of the dialog
    const dialogRect = confirmationDialog.getBoundingClientRect();
    // Calculate position
    const topPosition = buttonRect.top + window.scrollY - dialogRect.height - 10; // 10px gap above the button
    const leftPosition = buttonRect.left + window.scrollX + (buttonRect.width / 2) - (dialogRect.width / 2);
    // Ensure the dialog doesn't go off the top of the screen
    const adjustedTopPosition = Math.max(window.scrollY + 10, topPosition);
    // Set the final position
    confirmationDialog.style.top = `${adjustedTopPosition}px`;
    confirmationDialog.style.left = `${leftPosition}px`;
    // Ensure the dialog is visible
    confirmationDialog.style.display = 'block';
    const yesButton = confirmationDialog.querySelector('#confirmYes');
    const closeButton = confirmationDialog.querySelector('#closeDialog');
    const handleResponse = (confirmed) => {
        confirmationDialog.style.display = 'none';
        yesButton.removeEventListener('click', handleYes);
        noButton.removeEventListener('click', handleNo);
        closeButton.removeEventListener('click', handleClose);
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        callback(confirmed);
    };
    const handleYes = () => handleResponse(true);
    const handleNo = () => handleResponse(false);
    const handleClose = () => handleResponse(false);
    yesButton.addEventListener('click', handleYes);
    noButton.addEventListener('click', handleNo);
    closeButton.addEventListener('click', handleClose);
    // Clear any existing interval before starting a new one
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    countdownInterval = window.setInterval(() => {
        countdown--;
        // Add null check for confirmationDialog
        const countdownSpan = confirmationDialog?.querySelector('#noButtonCountdown');
        if (countdownSpan) {
            countdownSpan.textContent = `No (${countdown})`;
        }
        if (countdown <= 0) {
            handleNo();
        }
    }, 1000);
}
function interceptBuyButton() {
    const clickHandler = (event) => {
        if (isProcessingClick)
            return;
        const target = event.target;
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('DOMManipulator', `Element clicked: ${target.tagName} - ${target.textContent}`);
        let currentElement = target;
        while (currentElement) {
            // Check for the specific blue button using its unique classes
            if (currentElement.tagName === 'BUTTON' &&
                currentElement.classList.contains('c-hDtDII') &&
                currentElement.classList.contains('c-hDtDII-fcAbGk-color-blue')) {
                isProcessingClick = true;
                (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('DOMManipulator', 'Main blue Buy button clicked, checking confirmation setting');
                event.preventDefault();
                event.stopPropagation();
                const isTradeConfirmationEnabled = _tradeConfirmation__WEBPACK_IMPORTED_MODULE_2__.tradeConfirmationState.isEnabled;
                (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('DOMManipulator', `Trade confirmation enabled: ${isTradeConfirmationEnabled}`);
                if (!isTradeConfirmationEnabled) {
                    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('DOMManipulator', 'Trade confirmation disabled, proceeding with purchase');
                    currentElement.click();
                    isProcessingClick = false;
                }
                else {
                    const buttonRect = currentElement.getBoundingClientRect();
                    showConfirmationDialog(buttonRect, (confirmed) => {
                        if (confirmed) {
                            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('DOMManipulator', 'Order confirmed, proceeding with purchase');
                            currentElement.click();
                        }
                        else {
                            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('DOMManipulator', 'Order cancelled by user');
                        }
                        isProcessingClick = false;
                    });
                }
                break;
            }
            currentElement = currentElement.parentElement;
        }
    };
    document.body.addEventListener('click', clickHandler, true);
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('DOMManipulator', 'Buy button interception set up');
}
function initializeDOMManipulations() {
    interceptBuyButton();
}
/**
 * Initializes the DOM observer with optimized settings.
 * Only watches necessary DOM changes to reduce overhead.
 */
function initializeDOMObserver(callback) {
    // Create observer with performance logging
    const observer = new MutationObserver((mutations) => {
        // Only process if we have relevant changes
        const hasRelevantChanges = mutations.some(mutation => {
            // Check if mutation target or its parent has relevant class/id
            const target = mutation.target;
            return (target.id === '__next' ||
                target.closest('[data-rbd-draggable-context-id]') !== null ||
                target.closest('.market-card') !== null);
        });
        if (hasRelevantChanges) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('DOMObserver', 'Processing relevant DOM changes');
            callback();
        }
    });
    // Find the most specific parent element to observe
    const targetNode = document.querySelector('#__next') || document.body;
    // Configure observer with optimized options
    const config = {
        childList: true,
        subtree: false, // Don't watch entire tree
        attributes: false, // Don't watch attributes
        characterData: false // Don't watch text changes
    };
    // Start observing with performance logging
    observer.observe(targetNode, config);
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('DOMObserver', 'Initialized with optimized settings', {
        target: targetNode.tagName,
        config
    });
    // Cleanup on page unload
    window.addEventListener('unload', () => {
        observer.disconnect();
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('DOMObserver', 'Observer disconnected on unload');
    });
}


/***/ }),

/***/ "./src/content/eventExtractor.ts":
/*!***************************************!*\
  !*** ./src/content/eventExtractor.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   extractEventInfo: () => (/* binding */ extractEventInfo)
/* harmony export */ });
/* harmony import */ var _extractors_datePatterns__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./extractors/datePatterns */ "./src/content/extractors/datePatterns.ts");
/* harmony import */ var _parsers_contextParser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./parsers/contextParser */ "./src/content/parsers/contextParser.ts");
/* harmony import */ var _parsers_dateParser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parsers/dateParser */ "./src/content/parsers/dateParser.ts");
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/logUtils */ "./src/utils/logUtils.ts");




function extractEventInfo() {
    const currentPath = window.location.pathname;
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_3__.log)('Content', 'Checking path:', currentPath);
    if (!currentPath.startsWith('/event/')) {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_3__.log)('Content', 'Not an event page, skipping countdown');
        return null;
    }
    const scriptElement = document.querySelector('script#__NEXT_DATA__');
    if (!scriptElement) {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_3__.log)('Content', 'No __NEXT_DATA__ script found');
        return null;
    }
    try {
        const jsonData = JSON.parse(scriptElement.textContent || '');
        const eventData = jsonData.props?.pageProps?.dehydratedState?.queries[0]?.state?.data;
        if (eventData?.markets?.length > 0) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_3__.log)('Content', 'Market rules:', eventData.markets[0].description);
        }
        if (eventData && eventData.title) {
            if (!(0,_parsers_contextParser__WEBPACK_IMPORTED_MODULE_1__.verifyEventDataMatchesUrl)(eventData)) {
                (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_3__.log)('Content', 'Event data does not match current URL');
                return null;
            }
            let timezone = 'ET';
            let endDateValue = eventData.endDate;
            let matchFound = false;
            if (eventData.markets?.[0]?.description) {
                const marketDescription = eventData.markets[0].description;
                for (const pattern of _extractors_datePatterns__WEBPACK_IMPORTED_MODULE_0__.DATE_PATTERNS) {
                    const match = marketDescription.match(pattern.pattern);
                    if (match) {
                        const result = pattern.handler(match);
                        if (result) {
                            endDateValue = result.endDateValue;
                            timezone = result.timezone;
                            matchFound = true;
                            break;
                        }
                    }
                }
            }
            if (!matchFound && endDateValue.endsWith('Z')) {
                timezone = 'ET';
                const utcDate = new Date(endDateValue);
                const year = utcDate.getUTCFullYear();
                const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
                const day = utcDate.getUTCDate().toString().padStart(2, '0');
                endDateValue = `${year}-${month}-${day}T23:59:59-05:00`;
            }
            if (!matchFound && !endDateValue) {
                return null;
            }
            const parsedDate = (0,_parsers_dateParser__WEBPACK_IMPORTED_MODULE_2__.parseEventDate)(endDateValue, timezone);
            if (isNaN(parsedDate.getTime())) {
                return null;
            }
            const eventInfo = {
                id: eventData.id || `event_${Date.now()}`,
                title: eventData.title,
                endTime: parsedDate.getTime(),
                endDate: endDateValue,
                timezone: timezone,
                url: window.location.href
            };
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_3__.log)('Content', 'Extracted event info:', JSON.stringify(eventInfo, null, 2));
            return eventInfo;
        }
    }
    catch (error) {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_3__.log)('Content', 'Error processing event data:', error);
    }
    return null;
}


/***/ }),

/***/ "./src/content/extractors/datePatterns.ts":
/*!************************************************!*\
  !*** ./src/content/extractors/datePatterns.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DATE_PATTERNS: () => (/* binding */ DATE_PATTERNS)
/* harmony export */ });
/* harmony import */ var _patternHandlers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./patternHandlers */ "./src/content/extractors/patternHandlers.ts");

/**
 * Array of date patterns ordered by priority (highest first).
 * Each pattern has:
 * - name: Unique identifier
 * - pattern: RegExp to match the date format
 * - priority: Higher number = checked first
 * - format: Example of the date format
 * - handler: Function to process matched groups
 */
const DATE_PATTERNS = [
    /**
     * Matches: "until Dec 1, 3 AM ET"
     * Priority: 195 (Highest)
     * Used in: Hurricane season events
     */
    {
        name: 'HURRICANE_END_FORMAT',
        pattern: /(?:until|by) ([A-Za-z]+) (\d{1,2}), (\d{1,2}) ([AP]M) ([A-Z]{2})/i,
        priority: 195,
        format: "until Month DD, HH AM/PM ET",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleHurricaneEndFormat
    },
    /**
     * Matches: "between 1 Jan '24 00:00 and 31 Dec '24 23:59 in the ET timezone"
     * Priority: 190
     * Used in: Bitcoin price events
     */
    {
        name: 'BITCOIN_END_FORMAT',
        pattern: /between (?:\d{1,2} [A-Za-z]+ '\d{2} \d{2}:\d{2} and )?(\d{1,2}) ([A-Za-z]+) '(\d{2}) (\d{2}):(\d{2}) in the ([A-Z]{2}) timezone/i,
        priority: 190,
        format: "DD MMM 'YY HH:mm in the ET timezone",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleBitcoinEndFormat
    },
    /**
     * Matches: "postponed after January 15 2024, 3:00 PM ET"
     * Priority: 185
     * Used in: Postponed events
     */
    {
        name: 'POSTPONED_AFTER_DATE',
        pattern: /postponed after ([A-Za-z]+ \d{1,2} \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
        priority: 185,
        format: "postponed after Month DD YYYY, HH:MM AM/PM ET",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handlePostponedAfterDate
    },
    /**
     * Matches: "by January 15, of 2024, 3:00 PM ET"
     * Priority: 180
     * Note: 'of' and timezone are optional
     */
    {
        name: 'FINAL_RESOLUTION_DEADLINE',
        pattern: /by ([A-Za-z]+,? \d{1,2}),? (?:of )?(\d{4}), (\d{1,2}):(\d{2}) ([AP]M)(?:\s*([A-Z]{2}))?/i,
        priority: 180,
        format: "by Month DD, [of] YYYY, HH:MM AM/PM [ET]",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleFinalResolutionDeadline
    },
    /**
     * Matches: "between November 8, 2024 12:00 PM ET and November 15, 2024, 12:00 PM ET"
     * Priority: 175
     * Used in: Events with start and end dates
     */
    {
        name: 'BETWEEN_DATES_WITH_COMMA_AND',
        pattern: /between ([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ET and ([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ET/i,
        priority: 175,
        format: "between Date1 Time1 ET and Date2 Time2 ET",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleBetweenDatesWithComma
    },
    /**
     * Matches: "between Jan 1, 2024, 00:00 and Dec 31, 2024, 23:59 in the ET timezone"
     * Priority: 170
     * Used in: Events with timezone suffix
     */
    {
        name: 'BETWEEN_DATES_WITH_TIMEZONE_SUFFIX',
        pattern: /between\s+([A-Za-z]+\s+\d{1,2},\s*\d{4}),\s*(\d{1,2}):(\d{2})\s*and\s+([A-Za-z]+\s+\d{1,2},\s*\d{4}),\s*(\d{1,2}):(\d{2})\s*in\s+the\s+([A-Z]{2})\s+timezone/i,
        priority: 170,
        format: "between Month1 DD1, YYYY1, HH1:MM1 and Month2 DD2, YYYY2, HH2:MM2 in the TZ timezone",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleBetweenDatesWithTimezoneSuffix
    },
    /**
     * Matches: "January 15, 3 PM ET"
     * Priority: 165
     * Used in: Short date formats without year
     */
    {
        name: 'SHORT_DATE_TIME_FORMAT',
        pattern: /([A-Za-z]{3,})\s+(\d{1,2}),\s*(\d{1,2})\s*([AP]M)\s*([A-Z]{2,3})/i,
        priority: 165,
        format: "Month DD, HH AM/PM TZ",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleShortDateTime
    },
    /**
     * Matches: "between Date1, Time1 AMPM TZ and Date2, Time2 AMPM TZ"
     * Priority: 160
     * Used in: Events with different formats
     */
    {
        name: 'BETWEEN_DATES_WITH_DIFFERENT_FORMATS',
        pattern: /between\s+([A-Za-z]+\s+\d{1,2},?\s*\d{4}),?\s*(\d{1,2}:\d{2})\s*([AP]M)\s*([A-Z]{2,3})?(?:\s*\(inclusive\))?\s*and\s+([A-Za-z]+\s+\d{1,2}),?\s*(\d{1,2}:\d{2})\s*([AP]M)\s*([A-Z]{2,3})?/i,
        priority: 160,
        format: "between Date1, Time1 AMPM TZ and Date2, Time2 AMPM TZ",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleBetweenDatesWithDifferentFormats
    },
    /**
     * Matches: "between ... and Month DD, YYYY, HH:mm AM/PM ET"
     * Priority: 150
     * Used in: Events with inclusive end
     */
    {
        name: 'BETWEEN_DATES_WITH_INCLUSIVE_END',
        pattern: /between.*?and\s+([A-Za-z]+ \d{1,2},?\s*\d{4}),?\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*ET(?=\.|\s|$)/i,
        priority: 150,
        format: "between ... and Month DD, YYYY, HH:mm AM/PM ET",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleBetweenDatesWithInclusiveEnd
    },
    /**
     * Matches: "between ... and Month DD, YYYY, HH:mm AM/PM ET"
     * Priority: 145
     * Used in: Events with end
     */
    {
        name: 'BETWEEN_DATES_WITH_END',
        pattern: /between.*?and\s+([A-Za-z]+ \d{1,2},?\s*\d{4}),?\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*ET(?!\s*\(inclusive\))/i,
        priority: 145,
        format: "between ... and Month DD, YYYY, HH:mm AM/PM ET",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleBetweenDatesWithEnd
    },
    /**
     * Matches: "final data deadline format"
     * Priority: 135
     * Used in: Final data deadline
     */
    {
        name: 'FINAL_DATA_DEADLINE',
        pattern: /no final data available by ([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
        priority: 135,
        format: "final data deadline format",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleFinalDataDeadline
    },
    /**
     * Matches: "December 31, 2024, 11:59 PM ET"
     * Priority: 120
     * Used in: Main event end
     */
    {
        name: 'MAIN_EVENT_END_FORMAT',
        pattern: /(?:ends?|closes?|resolves?) (?:on |by )?December 31,? 2024(?:,? | at )?11:59(?::00)? PM ET/i,
        priority: 120,
        format: "December 31, 2024, 11:59 PM ET",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleMainEventEnd
    },
    /**
     * Matches: "HH:mm AM/PM ET on Month DD, YYYY"
     * Priority: 115
     * Used in: Time before date
     */
    {
        name: 'TIME_BEFORE_DATE_FORMAT',
        pattern: /(\d{1,2}):(\d{2}) ([AP]M) ET on ([A-Za-z]+ \d{1,2}, \d{4})/i,
        priority: 115,
        format: "HH:mm AM/PM ET on Month DD, YYYY",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleTimeBeforeDate
    },
    /**
     * Matches: "December 31, 2024, 11:59 PM ET"
     * Priority: 110
     * Used in: Year end
     */
    {
        name: 'YEAR_END_FORMAT',
        pattern: /(?:ends?|closes?|resolves?|by).*?(?:December|Dec)\.?\s*31,?\s*2024,?\s*(?:at\s*)?11:59(?::00)?\s*PM\s*ET/i,
        priority: 110,
        format: "December 31, 2024, 11:59 PM ET",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleYearEnd
    },
    /**
     * Matches: "DD Nov 'YY HH:mm in TZ timezone"
     * Priority: 100
     * Used in: Bitcoin noon
     */
    {
        name: 'BITCOIN_NOON_FORMAT',
        pattern: /(?:BTCUSDT\s+)?(\d{1,2}) ([A-Za-z]+) '(\d{2}) (\d{1,2}):(\d{2}) in the ([A-Z]{2}) timezone(?:\s+\(noon\))?/i,
        priority: 195,
        format: "DD MMM 'YY HH:mm in TZ timezone",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleBitcoinNoon
    },
    /**
     * Matches: "Month DD, YYYY, HH:mm:ss AM/PM TZ"
     * Priority: 95
     * Used in: Exact time with seconds
     */
    {
        name: 'EXACT_TIME_WITH_SECONDS',
        pattern: /by.*?(\w+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
        priority: 95,
        format: "Month DD, YYYY, HH:mm:ss AM/PM TZ",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleExactTimeWithSeconds
    },
    /**
     * Matches: "Month DD, YYYY, HH:mm:ss AM/PM TZ"
     * Priority: 90
     * Used in: Election time
     */
    {
        name: 'ELECTION_TIME_FORMAT',
        pattern: /\b(November|December|January|February|March|April|May|June|July|August|September|October) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}):(\d{2}) ([AP]M) ([A-Z]{2,3})\b/i,
        priority: 90,
        format: "Month DD, YYYY, HH:mm:ss AM/PM TZ",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleElectionTime
    },
    /**
     * Matches: "until Month DD, HH:mm AM/PM TZ"
     * Priority: 88
     * Used in: Until time format
     * Examples:
     * - "until November 30, 11:59 PM ET" (no year)
     * - "until January 15, 2024, 11:59 PM ET" (with year)
     */
    {
        name: 'UNTIL_TIME_FORMAT',
        pattern: /(?<!\([^)]*?)(?:and|until|by) ([A-Za-z]+ \d{1,2}(?:,? \d{4})?),? (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2,3})/i,
        priority: 88,
        format: "until Month DD[, YYYY], HH:mm AM/PM TZ",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleUntilTime
    },
    /**
     * Matches: "resolves/ends on Month DD, YYYY, HH:mm AM/PM TZ"
     * Priority: 80
     * Used in: Resolution date time
     */
    {
        name: 'RESOLUTION_DATE_TIME',
        pattern: /(?:resolves?|ends?) on ([A-Za-z]+ \d{1,2}, \d{4}),? (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
        priority: 80,
        format: "resolves/ends on Month DD, YYYY, HH:mm AM/PM TZ",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleResolutionDateTime
    },
    /**
     * Matches: "Month DD, YYYY, HH:mm AM/PM TZ"
     * Priority: 75
     * Used in: Standalone date time
     */
    {
        name: 'STANDALONE_DATE_TIME',
        pattern: /([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
        priority: 75,
        format: "Month DD, YYYY, HH:mm AM/PM TZ",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleStandaloneDateTime
    },
    /**
     * Matches: "Month DD, YYYY"
     * Priority: 70
     * Used in: Date only
     */
    {
        name: 'DATE_ONLY_FORMAT',
        pattern: /([A-Za-z]+ \d{1,2}, \d{4})/i,
        priority: 70,
        format: "Month DD, YYYY",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleDateOnly
    },
    /**
     * Matches: "inauguration date (Month DD, YYYY)"
     * Priority: 65 (Lowest)
     * Used in: Inauguration events
     */
    {
        name: 'INAUGURATION_DATE',
        pattern: /inauguration date.*?\(([A-Za-z]+ \d{1,2},? \d{4})\)/i,
        priority: 65,
        format: "inauguration date (Month DD, YYYY)",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleInaugurationDate
    },
    {
        name: 'BITCOIN_END_FORMAT',
        pattern: /between (?:\d{1,2} [A-Za-z]+ '\d{2} \d{2}:\d{2} and )?(\d{1,2}) ([A-Za-z]+) '(\d{2}) (\d{2}):(\d{2}) in the ([A-Z]{2}) timezone/i,
        priority: 190,
        format: "DD MMM 'YY HH:mm in the ET timezone",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleBitcoinEndFormat
    },
    {
        name: 'HURRICANE_END_FORMAT',
        pattern: /(?:until|by) ([A-Za-z]+) (\d{1,2}), (\d{1,2}) ([AP]M) ([A-Z]{2})/i,
        priority: 195,
        format: "until Month DD, HH AM/PM ET",
        handler: _patternHandlers__WEBPACK_IMPORTED_MODULE_0__.handleHurricaneEndFormat
    }
].sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)


/***/ }),

/***/ "./src/content/extractors/patternHandlers.ts":
/*!***************************************************!*\
  !*** ./src/content/extractors/patternHandlers.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   handleBetweenDatesWithComma: () => (/* binding */ handleBetweenDatesWithComma),
/* harmony export */   handleBetweenDatesWithDifferentFormats: () => (/* binding */ handleBetweenDatesWithDifferentFormats),
/* harmony export */   handleBetweenDatesWithEnd: () => (/* binding */ handleBetweenDatesWithEnd),
/* harmony export */   handleBetweenDatesWithInclusiveEnd: () => (/* binding */ handleBetweenDatesWithInclusiveEnd),
/* harmony export */   handleBetweenDatesWithTimezoneSuffix: () => (/* binding */ handleBetweenDatesWithTimezoneSuffix),
/* harmony export */   handleBitcoinEndFormat: () => (/* binding */ handleBitcoinEndFormat),
/* harmony export */   handleBitcoinNoon: () => (/* binding */ handleBitcoinNoon),
/* harmony export */   handleDateOnly: () => (/* binding */ handleDateOnly),
/* harmony export */   handleElectionTime: () => (/* binding */ handleElectionTime),
/* harmony export */   handleExactTimeWithSeconds: () => (/* binding */ handleExactTimeWithSeconds),
/* harmony export */   handleFinalDataDeadline: () => (/* binding */ handleFinalDataDeadline),
/* harmony export */   handleFinalResolutionDeadline: () => (/* binding */ handleFinalResolutionDeadline),
/* harmony export */   handleHurricaneEndFormat: () => (/* binding */ handleHurricaneEndFormat),
/* harmony export */   handleInaugurationDate: () => (/* binding */ handleInaugurationDate),
/* harmony export */   handleMainEventEnd: () => (/* binding */ handleMainEventEnd),
/* harmony export */   handlePostponedAfterDate: () => (/* binding */ handlePostponedAfterDate),
/* harmony export */   handleResolutionDateTime: () => (/* binding */ handleResolutionDateTime),
/* harmony export */   handleShortDateTime: () => (/* binding */ handleShortDateTime),
/* harmony export */   handleStandaloneDateTime: () => (/* binding */ handleStandaloneDateTime),
/* harmony export */   handleTimeBeforeDate: () => (/* binding */ handleTimeBeforeDate),
/* harmony export */   handleUntilTime: () => (/* binding */ handleUntilTime),
/* harmony export */   handleYearEnd: () => (/* binding */ handleYearEnd)
/* harmony export */ });
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/logUtils */ "./src/utils/logUtils.ts");

/**
 * Handles dates in format: "postponed after Month DD YYYY, HH:MM AM/PM ET"
 * Example: "postponed after January 15 2024, 3:00 PM ET"
 */
function handlePostponedAfterDate(match) {
    const [, datePart, hour, minute, ampm, tz] = match;
    return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: tz || 'ET'
    };
}
/**
 * Handles dates in format: "by Month DD, [of] YYYY, HH:MM AM/PM [ET]"
 * Example: "by January 15, of 2024, 3:00 PM ET"
 * Note: 'of' and timezone are optional
 */
function handleFinalResolutionDeadline(match) {
    const [, monthDay, year, hour, minute, ampm, tz] = match;
    // Clean up any extra commas in monthDay
    const cleanMonthDay = monthDay.replace(/,/g, '');
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Matched final resolution deadline:', {
        monthDay: cleanMonthDay,
        year,
        hour,
        minute,
        ampm,
        tz
    });
    return {
        endDateValue: `${cleanMonthDay}, ${year}, ${hour}:${minute}:00 ${ampm}`,
        timezone: tz || 'ET'
    };
}
/**
 * Handles dates in format: "between Date1 Time1 ET and Date2 Time2 ET"
 * Example: "between November 8, 2024 12:00 PM ET and November 15, 2024, 12:00 PM ET"
 * Returns the end date (Date2)
 */
function handleBetweenDatesWithComma(match) {
    const [, startDateFull, // "November 8, 2024"
    startHour, startMinute, startAMPM, // "12:00 PM"
    endDateFull, // "November 15, 2024"
    endHour, endMinute, endAMPM // "12:00 PM"
    ] = match;
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Matched between dates with comma:', {
        startDateFull,
        startTime: `${startHour}:${startMinute} ${startAMPM}`,
        endDateFull,
        endTime: `${endHour}:${endMinute} ${endAMPM}`
    });
    return {
        endDateValue: `${endDateFull}, ${endHour}:${endMinute} ${endAMPM}`,
        timezone: 'ET'
    };
}
/**
 * Handles dates with timezone suffix: "between Date1, Time1 and Date2, Time2 in the TZ timezone"
 * Example: "between Jan 1, 2024, 00:00 and Dec 31, 2024, 23:59 in the ET timezone"
 * Converts 24-hour format to 12-hour format
 */
function handleBetweenDatesWithTimezoneSuffix(match) {
    const [, startDateFull, startHour, startMinute, endDateFull, endHour, endMinute, timezone] = match;
    const endHourNum = parseInt(endHour);
    const endAMPM = endHourNum >= 12 ? 'PM' : 'AM';
    const adjustedEndHour = endHourNum > 12 ? endHourNum - 12 : endHourNum;
    return {
        endDateValue: `${endDateFull}, ${adjustedEndHour}:${endMinute}:00 ${endAMPM}`,
        timezone: timezone || 'ET'
    };
}
/**
 * Handles short date format: "Month DD, HH AM/PM TZ"
 * Example: "January 15, 3 PM ET"
 * Assumes next year if year not provided
 */
function handleShortDateTime(match) {
    const [, month, day, hour, ampm, tz] = match;
    const year = new Date().getFullYear() + 1;
    return {
        endDateValue: `${month} ${day}, ${year}, ${hour}:00:00 ${ampm}`,
        timezone: tz || 'ET'
    };
}
/**
 * Handles dates with different formats in start and end
 * Example: "between January 15, 2024 3:00 PM ET and February 1, 3:00 PM ET"
 */
function handleBetweenDatesWithDifferentFormats(match) {
    const [, startDateFull, startTime, startAMPM, startTZ, endDatePart, endTime, endAMPM, endTZ] = match;
    const yearMatch = startDateFull.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
    return {
        endDateValue: `${endDatePart}, ${year}, ${endTime}:00 ${endAMPM}`,
        timezone: endTZ || startTZ || 'ET'
    };
}
/**
 * Handles dates with inclusive end: "between ... and Date, Time ET"
 * Example: "between start and January 15, 2024, 3:00 PM ET"
 */
function handleBetweenDatesWithInclusiveEnd(match) {
    const [, datePart, hour, minute, ampm] = match;
    return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: 'ET'
    };
}
/**
 * Handles dates with end: "between ... and Date, Time ET"
 * Similar to inclusive end but without (inclusive) suffix
 */
function handleBetweenDatesWithEnd(match) {
    const [, datePart, hour, minute, ampm] = match;
    return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: 'ET'
    };
}
/**
 * Handles final data deadline format
 * Example: "no final data available by January 15, 2024, 3:00 PM ET"
 */
function handleFinalDataDeadline(match) {
    const [, datePart, hour, minute, ampm, tz] = match;
    return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: tz || 'ET'
    };
}
/**
 * Handles main event end format
 * Fixed date: December 31, 2024, 11:59 PM ET
 */
function handleMainEventEnd() {
    return {
        endDateValue: "December 31, 2024, 11:59:00 PM",
        timezone: "ET"
    };
}
/**
 * Handles time before date format: "HH:MM AM/PM ET on Date"
 * Example: "3:00 PM ET on January 15, 2024"
 */
function handleTimeBeforeDate(match) {
    const [, hour, minute, ampm, datePart] = match;
    return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: 'ET'
    };
}
/**
 * Handles year end format
 * Fixed date: December 31, 2024, 11:59 PM ET
 */
function handleYearEnd() {
    return {
        endDateValue: "December 31, 2024, 11:59:00 PM",
        timezone: "ET"
    };
}
/**
 * Handles Bitcoin noon format: "DD MMM 'YY HH:mm in TZ timezone"
 * Example: "BTCUSDT 15 Nov '24 12:00 in the ET timezone (noon)"
 */
function handleBitcoinNoon(match) {
    const [, day, month, year, hour, minute, tz] = match;
    // Convert month abbreviation to full name
    const monthMap = {
        'Jan': 'January',
        'Feb': 'February',
        'Mar': 'March',
        'Apr': 'April',
        'May': 'May',
        'Jun': 'June',
        'Jul': 'July',
        'Aug': 'August',
        'Sep': 'September',
        'Oct': 'October',
        'Nov': 'November',
        'Dec': 'December'
    };
    const fullMonth = monthMap[month.substring(0, 3)] || month;
    // Convert to 12-hour format if needed
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum > 12 ? hourNum - 12 : (hourNum === 0 ? 12 : hourNum);
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Matched bitcoin noon format:', {
        day,
        month: fullMonth,
        year,
        hour: hour12,
        minute,
        tz,
        ampm,
        original: match[0]
    });
    // Format exactly as parseCustomDate expects
    return {
        endDateValue: `${fullMonth} ${day}, 20${year}, ${hour12}:${minute}:00 ${ampm}`,
        timezone: tz
    };
}
/**
 * Handles exact time with seconds
 * Example: "by January 15, 2024, 3:00:00 PM ET"
 */
function handleExactTimeWithSeconds(match) {
    const [, datePart, hour, minute, second, ampm, tz] = match;
    return {
        endDateValue: `${datePart}, ${hour}:${minute}:${second} ${ampm}`,
        timezone: tz || 'ET'
    };
}
/**
 * Handles election time format
 * Example: "November 5, 2024, 8:00:00 PM ET"
 */
function handleElectionTime(match) {
    const [, month, day, year, hour, minute, second, ampm, tz] = match;
    return {
        endDateValue: `${month} ${day}, ${year}, ${hour}:${minute}:${second} ${ampm}`,
        timezone: tz
    };
}
/**
 * Handles until time format with optional year
 * Examples:
 * - "until November 30, 11:59 PM ET" (no year)
 * - "until January 15, 2024, 11:59 PM ET" (with year)
 */
function handleUntilTime(match) {
    const [, datePart, hour, minute, ampm, tz] = match;
    // Check if year is in datePart
    const hasYear = datePart.match(/\d{4}/);
    const year = hasYear ? '' : ', 2024'; // Add 2024 if no year present
    return {
        endDateValue: `${datePart}${year}, ${hour}:${minute}:00 ${ampm}`,
        timezone: tz || 'ET'
    };
}
/**
 * Handles resolution date time format
 * Example: "resolves on January 15, 2024, 3:00 PM ET"
 */
function handleResolutionDateTime(match) {
    const [, datePart, hour, minute, ampm, tz] = match;
    return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: tz || 'ET'
    };
}
/**
 * Handles standalone date time format
 * Example: "January 15, 2024, 3:00 PM ET"
 */
function handleStandaloneDateTime(match) {
    const [, datePart, hour, minute, ampm, tz] = match;
    return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: tz || 'ET'
    };
}
/**
 * Handles date only format, defaults to end of day
 * Example: "January 15, 2024"
 */
function handleDateOnly(match) {
    const [, datePart] = match;
    return {
        endDateValue: `${datePart}, 11:59:59 PM`,
        timezone: 'ET'
    };
}
/**
 * Handles inauguration date format
 * Example: "inauguration date (January 20, 2025)"
 */
function handleInaugurationDate(match) {
    const [, datePart] = match;
    return {
        endDateValue: `${datePart}, 11:59:59 PM`,
        timezone: 'ET'
    };
}
/**
 * Handles Bitcoin end format with month abbreviations
 * Example: "between 1 Jan '24 00:00 and 31 Dec '24 23:59 in the ET timezone"
 * Converts month abbreviations to full names and 24-hour to 12-hour format
 */
function handleBitcoinEndFormat(match) {
    const [, day, month, year, // 31, Dec, 24
    hour, minute, // 23, 59
    tz // ET
    ] = match;
    // Convert month abbreviation to full name
    const monthMap = {
        'Jan': 'January',
        'Feb': 'February',
        'Mar': 'March',
        'Apr': 'April',
        'May': 'May',
        'Jun': 'June',
        'Jul': 'July',
        'Aug': 'August',
        'Sep': 'September',
        'Oct': 'October',
        'Nov': 'November',
        'Dec': 'December'
    };
    const fullMonth = monthMap[month] || month;
    // Convert 24-hour format to 12-hour format
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum > 12 ? hourNum - 12 : (hourNum === 0 ? 12 : hourNum);
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Matched bitcoin end format:', {
        day, month: fullMonth, year, hour, minute, tz,
        converted: `${hour12}:${minute} ${ampm}`
    });
    // Format exactly as parseCustomDate expects
    return {
        endDateValue: `${fullMonth} ${day}, 20${year}, ${hour12}:${minute}:00 ${ampm}`,
        timezone: tz
    };
}
/**
 * Handles Hurricane end format
 * Example: "until Dec 1, 3 AM ET"
 * Gets year from context (e.g., "2024 Atlantic hurricane season")
 */
function handleHurricaneEndFormat(match) {
    const [, month, day, hour, ampm, tz] = match;
    // Get description text for context
    const description = document.querySelector('[data-rbd-draggable-context-id]')?.textContent || '';
    // Extract year from context (e.g., "2024 Atlantic hurricane season")
    const yearMatch = description.match(/(\d{4})\s+Atlantic\s+hurricane\s+season/i);
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
    // Convert month abbreviation to full name
    const monthMap = {
        'Jan': 'January',
        'Feb': 'February',
        'Mar': 'March',
        'Apr': 'April',
        'May': 'May',
        'Jun': 'June',
        'Jul': 'July',
        'Aug': 'August',
        'Sep': 'September',
        'Oct': 'October',
        'Nov': 'November',
        'Dec': 'December'
    };
    const fullMonth = monthMap[month] || month;
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Matched hurricane end format:', {
        month: fullMonth,
        day,
        hour,
        ampm,
        tz,
        year,
        description: description.substring(0, 100) + '...',
        formatted: `${fullMonth} ${day}, ${year}, ${hour}:00:00 ${ampm}`
    });
    // Format exactly as parseCustomDate expects
    return {
        endDateValue: `${fullMonth} ${day}, ${year}, ${hour}:00:00 ${ampm}`,
        timezone: tz || 'ET'
    };
}
// ... other handlers with same simple string formatting 


/***/ }),

/***/ "./src/content/messageHandler.ts":
/*!***************************************!*\
  !*** ./src/content/messageHandler.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   sendEventInfo: () => (/* binding */ sendEventInfo)
/* harmony export */ });
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/logUtils */ "./src/utils/logUtils.ts");
/**
 * Message handler for Polyteller content script.
 * This file contains functions for sending messages to the background script.
 */

/**
 * Creates a debounced version of a function.
 * @param func - The function to debounce
 * @param waitFor - The number of milliseconds to wait before invoking the function
 * @returns A debounced version of the input function
 */
function debounce(func, waitFor) {
    let timeout = null;
    return (...args) => {
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
function sendEventInfoImpl(eventInfo) {
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Sending event info to background:', eventInfo);
    chrome.runtime.sendMessage({ type: 'EVENT_INFO', data: eventInfo }, (response) => {
        if (chrome.runtime.lastError) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Error sending event info to background:', chrome.runtime.lastError);
        }
        else {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Event info sent successfully:', response);
        }
    });
}
// Export a debounced version of sendEventInfoImpl
const sendEventInfo = debounce(sendEventInfoImpl, 1000);


/***/ }),

/***/ "./src/content/parsers/contextParser.ts":
/*!**********************************************!*\
  !*** ./src/content/parsers/contextParser.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   extractYearFromContext: () => (/* binding */ extractYearFromContext),
/* harmony export */   verifyEventDataMatchesUrl: () => (/* binding */ verifyEventDataMatchesUrl)
/* harmony export */ });
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/logUtils */ "./src/utils/logUtils.ts");

function extractYearFromContext(description) {
    const yearContextPatterns = [
        /(\d{4})\s+Atlantic\s+hurricane\s+season/i,
        /season\s+(\d{4})/i,
        /during\s+(\d{4})/i,
        /in\s+(\d{4})/i,
        /by\s+.*?(\d{4})/i,
        /\b(202\d)\b/
    ];
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Context', 'Searching for year in:', description.substring(0, 100) + '...');
    for (const pattern of yearContextPatterns) {
        const match = description.match(pattern);
        if (match) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Context', 'Found year in context:', {
                pattern: pattern.toString(),
                year: match[1]
            });
            return match[1];
        }
    }
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Context', 'No year found in context');
    return null;
}
function verifyEventDataMatchesUrl(eventData) {
    const currentSlug = window.location.pathname.split('/').pop()?.split('?')[0];
    const eventSlug = eventData.slug;
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Content', 'Verifying event data match:', {
        currentSlug,
        eventSlug,
        urlPath: window.location.pathname
    });
    return currentSlug === eventSlug;
}


/***/ }),

/***/ "./src/content/parsers/dateParser.ts":
/*!*******************************************!*\
  !*** ./src/content/parsers/dateParser.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   parseEventDate: () => (/* binding */ parseEventDate)
/* harmony export */ });
/* harmony import */ var _utils_dateUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/dateUtils */ "./src/utils/dateUtils.ts");
/* harmony import */ var _utils_timezoneUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/timezoneUtils */ "./src/utils/timezoneUtils.ts");
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/logUtils */ "./src/utils/logUtils.ts");



function parseEventDate(dateString, timezone) {
    try {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_2__.log)('Content', 'Before parseCustomDate:', {
            dateString,
            timezone
        });
        const parsedDate = (0,_utils_dateUtils__WEBPACK_IMPORTED_MODULE_0__.parseCustomDate)(dateString, timezone);
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_2__.log)('Content', 'After parseCustomDate:', {
            originalDate: dateString,
            parsedDate: parsedDate.toISOString(),
            localDate: parsedDate.toString(),
            timezone: timezone,
            isDST: timezone === 'ET' ? (0,_utils_timezoneUtils__WEBPACK_IMPORTED_MODULE_1__.isDST)(parsedDate) : null,
            offset: timezone === 'ET' ? (0,_utils_timezoneUtils__WEBPACK_IMPORTED_MODULE_1__.getETOffset)(parsedDate) : null,
            timestamp: parsedDate.getTime(),
            utcOffset: parsedDate.getTimezoneOffset()
        });
        if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date');
        }
        return parsedDate;
    }
    catch (error) {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_2__.log)('Content', 'Error parsing date:', error);
        throw error;
    }
}


/***/ }),

/***/ "./src/content/tradeConfirmation.ts":
/*!******************************************!*\
  !*** ./src/content/tradeConfirmation.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   applyTradeConfirmationStyles: () => (/* binding */ applyTradeConfirmationStyles),
/* harmony export */   tradeConfirmationState: () => (/* binding */ tradeConfirmationState)
/* harmony export */ });
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/logUtils */ "./src/utils/logUtils.ts");

// State management class
class TradeConfirmationState {
    constructor() {
        this._isEnabled = true;
        this.stateChangeCallbacks = [];
        this.loadInitialState();
        this.setupMessageListener();
    }
    static getInstance() {
        if (!TradeConfirmationState.instance) {
            TradeConfirmationState.instance = new TradeConfirmationState();
        }
        return TradeConfirmationState.instance;
    }
    async loadInitialState() {
        try {
            const result = await chrome.storage.local.get('enableTradeConfirmation');
            this._isEnabled = result.enableTradeConfirmation !== false;
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('TradeConfirmation', `Initial state loaded: ${this._isEnabled}`);
        }
        catch (error) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('TradeConfirmation', 'Error loading initial state:', error);
        }
    }
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'updateTradeConfirmation') {
                this.setEnabled(message.enabled);
                sendResponse({ received: true });
            }
            return true;
        });
    }
    get isEnabled() {
        return this._isEnabled;
    }
    async setEnabled(value) {
        if (this._isEnabled === value)
            return;
        this._isEnabled = value;
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('TradeConfirmation', `State updated: ${value}`);
        try {
            await chrome.storage.local.set({ enableTradeConfirmation: value });
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('TradeConfirmation', `State persisted: ${value}`);
            this.notifyStateChange();
        }
        catch (error) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('TradeConfirmation', 'Error persisting state:', error);
        }
    }
    notifyStateChange() {
        this.stateChangeCallbacks.forEach(callback => callback(this._isEnabled));
    }
    onStateChange(callback) {
        this.stateChangeCallbacks.push(callback);
        return () => {
            this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
        };
    }
}
// Export the state instance
const tradeConfirmationState = TradeConfirmationState.getInstance();
// Export the styling function (unchanged)
function applyTradeConfirmationStyles(dialog) {
    dialog.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    dialog.style.backgroundColor = 'var(--card-background, #FFFFFF)';
    dialog.style.borderRadius = '12px';
    dialog.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
    dialog.style.color = 'var(--text-color, #1A1B25)';
    dialog.style.fontSize = '14px';
    const buttons = dialog.querySelectorAll('button');
    buttons.forEach(button => {
        button.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
        button.style.borderRadius = '6px';
        button.style.padding = '10px 16px';
        button.style.fontSize = '14px';
        button.style.fontWeight = '600';
        button.style.cursor = 'pointer';
        button.style.transition = 'background-color 0.2s ease';
    });
}


/***/ }),

/***/ "./src/utils/CountdownManager.ts":
/*!***************************************!*\
  !*** ./src/utils/CountdownManager.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CountdownManager: () => (/* binding */ CountdownManager)
/* harmony export */ });
class CountdownManager {
    constructor() {
        this.subscribers = new Map();
        this.eventEndTimes = new Map();
        this.rafId = null;
        this.lastDisplayUpdate = 0;
        this.lastBackgroundUpdate = 0;
        this.INTERVALS = {
            DISPLAY: 1000, // Always 1 second for smooth countdown
            NEAR_END: 1000, // Every second when < 1 minute
            SHORT: 5000, // Every 5 seconds when < 1 hour
            MEDIUM: 15000, // Every 15 seconds when < 1 day
            LONG: 30000 // Every 30 seconds when > 1 day
        };
        this.visibilityState = 'visible';
        this.updateLoop = (timestamp) => {
            // Always update display every second for smooth countdown
            if (timestamp - this.lastDisplayUpdate >= this.INTERVALS.DISPLAY) {
                if (this.visibilityState === 'visible') {
                    this.updateDisplays();
                }
                this.lastDisplayUpdate = timestamp;
            }
            // Dynamic background task frequency
            const shortestTime = this.getShortestRemainingTime();
            const backgroundInterval = this.determineBackgroundInterval(shortestTime);
            if (timestamp - this.lastBackgroundUpdate >= backgroundInterval) {
                this.processBackgroundTasks();
                this.lastBackgroundUpdate = timestamp;
            }
            // Continue loop if we have subscribers
            if (this.subscribers.size > 0) {
                this.rafId = requestAnimationFrame(this.updateLoop);
            }
            else {
                this.stopUpdates();
            }
        };
        this.handleVisibilityChange = () => {
            this.visibilityState = document.hidden ? 'hidden' : 'visible';
            if (this.visibilityState === 'visible') {
                this.updateDisplays(); // Immediate update when becoming visible
                this.startUpdates(); // Restart animation frame
            }
        };
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new CountdownManager();
        }
        return this.instance;
    }
    registerEvent(event) {
        this.eventEndTimes.set(event.id, event.endTime);
        this.startUpdates(); // Start animation frame if not running
    }
    startUpdates() {
        if (!this.rafId && this.subscribers.size > 0) {
            this.lastDisplayUpdate = performance.now();
            this.lastBackgroundUpdate = performance.now();
            this.rafId = requestAnimationFrame(this.updateLoop);
        }
    }
    stopUpdates() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
    subscribe(eventId, callback) {
        if (!this.subscribers.has(eventId)) {
            this.subscribers.set(eventId, new Set());
        }
        const subscribers = this.subscribers.get(eventId);
        subscribers.add(callback);
        // Start updates if not running
        this.startUpdates();
        // Immediate first update
        const endTime = this.eventEndTimes.get(eventId);
        if (endTime) {
            const timeLeft = this.calculateTimeLeft(endTime);
            callback(timeLeft);
        }
        return () => this.unsubscribe(eventId, callback);
    }
    unsubscribe(eventId, callback) {
        const subscribers = this.subscribers.get(eventId);
        if (subscribers) {
            subscribers.delete(callback);
            if (subscribers.size === 0) {
                this.cleanup(eventId);
            }
        }
    }
    updateDisplays() {
        this.eventEndTimes.forEach((endTime, eventId) => {
            const timeLeft = this.calculateTimeLeft(endTime);
            this.subscribers.get(eventId)?.forEach(callback => {
                try {
                    callback(timeLeft);
                }
                catch (error) {
                    console.error(`Error in countdown subscriber for event ${eventId}:`, error);
                }
            });
        });
    }
    processBackgroundTasks() {
        let needCleanup = false;
        this.eventEndTimes.forEach((endTime, eventId) => {
            const timeLeft = this.calculateTimeLeft(endTime);
            if (timeLeft.hasEnded) {
                this.cleanup(eventId);
                needCleanup = true;
            }
        });
        if (needCleanup && this.eventEndTimes.size === 0) {
            this.stopUpdates();
        }
    }
    cleanupAll() {
        this.eventEndTimes.clear();
        this.subscribers.clear();
        this.stopUpdates();
    }
    calculateTimeLeft(endTime) {
        const total = Math.max(0, endTime - Date.now());
        const hasEnded = total <= 0;
        return {
            days: Math.floor(total / (1000 * 60 * 60 * 24)),
            hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((total % (1000 * 60)) / 1000),
            hasEnded
        };
    }
    cleanup(eventId) {
        this.eventEndTimes.delete(eventId);
        this.subscribers.delete(eventId);
    }
    determineBackgroundInterval(timeRemaining) {
        if (timeRemaining <= 60000) { // Less than 1 minute
            return this.INTERVALS.NEAR_END;
        }
        else if (timeRemaining <= 3600000) { // Less than 1 hour
            return this.INTERVALS.SHORT;
        }
        else if (timeRemaining <= 86400000) { // Less than 1 day
            return this.INTERVALS.MEDIUM;
        }
        return this.INTERVALS.LONG;
    }
    getShortestRemainingTime() {
        const now = Date.now();
        let shortest = Number.MAX_VALUE;
        this.eventEndTimes.forEach(endTime => {
            const remaining = Math.max(0, endTime - now);
            if (remaining < shortest) {
                shortest = remaining;
            }
        });
        return shortest === Number.MAX_VALUE ? 0 : shortest;
    }
}


/***/ }),

/***/ "./src/utils/dateUtils.ts":
/*!********************************!*\
  !*** ./src/utils/dateUtils.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   calculateTimeRemaining: () => (/* binding */ calculateTimeRemaining),
/* harmony export */   formatCountdown: () => (/* binding */ formatCountdown),
/* harmony export */   formatDate: () => (/* binding */ formatDate),
/* harmony export */   formatFullNotificationTime: () => (/* binding */ formatFullNotificationTime),
/* harmony export */   formatLocalEndDate: () => (/* binding */ formatLocalEndDate),
/* harmony export */   formatRemainingTime: () => (/* binding */ formatRemainingTime),
/* harmony export */   getTimeRemaining: () => (/* binding */ getTimeRemaining),
/* harmony export */   isValidTimestamp: () => (/* binding */ isValidTimestamp),
/* harmony export */   parseCustomDate: () => (/* binding */ parseCustomDate)
/* harmony export */ });
/* harmony import */ var _timezoneUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./timezoneUtils */ "./src/utils/timezoneUtils.ts");
/**
 * Date utility functions for Polyteller.
 * This file contains various functions for formatting and calculating date and time information.
 */

/**
 * Formats the remaining time as a string.
 * @param endTime - The end time in milliseconds since epoch
 * @returns A formatted string representing the remaining time
 */
function getTimeRemaining(endTime) {
    const { days, hours, minutes, seconds } = calculateTimeRemaining(endTime);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
/**
 * Formats a date object into a localized string.
 * @param date - The Date object to format
 * @returns A formatted string representation of the date
 */
function formatDate(date) {
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC' // Add this line to ensure consistent timezone
    });
}
/**
 * Checks if a given timestamp is valid.
 * @param timestamp - The timestamp to validate
 * @returns True if the timestamp is valid, false otherwise
 */
function isValidTimestamp(timestamp) {
    return !isNaN(timestamp) && isFinite(timestamp) && timestamp > 0;
}
/**
 * Formats a duration in minutes into a human-readable string.
 * @param minutesBefore - The duration in minutes
 * @returns A formatted string representing the duration
 */
function formatFullNotificationTime(minutesBefore) {
    const days = Math.floor(minutesBefore / 1440);
    const hours = Math.floor((minutesBefore % 1440) / 60);
    const minutes = Math.floor(minutesBefore % 60);
    const seconds = Math.floor((minutesBefore % 1) * 60);
    const parts = [];
    if (days > 0)
        parts.push(`${days}d`);
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes > 0)
        parts.push(`${minutes}m`);
    if (seconds > 0)
        parts.push(`${seconds}s`);
    return parts.join(' ') + ' before';
}
/**
 * Formats a duration in milliseconds into a human-readable string.
 * @param milliseconds - The duration in milliseconds
 * @returns A formatted string representing the duration
 */
function formatRemainingTime(milliseconds) {
    const { days, hours, minutes, seconds } = calculateTimeRemaining(Date.now() + milliseconds);
    const parts = [];
    if (days > 0)
        parts.push(`${days} Day${days !== 1 ? 's' : ''}`);
    if (hours > 0)
        parts.push(`${hours} Hr${hours !== 1 ? 's' : ''}`);
    if (minutes > 0)
        parts.push(`${minutes} Min`);
    if (seconds > 0)
        parts.push(`${seconds} Sec`);
    // If all parts are zero (shouldn't happen, but just in case)
    if (parts.length === 0)
        return "0 Sec";
    return parts.join(", ");
}
/**
 * Calculates the time remaining until a given end time.
 * @param endTime - The end time in milliseconds since epoch
 * @returns An object containing days, hours, minutes, and seconds remaining
 */
function calculateTimeRemaining(endTime) {
    const total = endTime - Date.now();
    return {
        days: Math.floor(total / (1000 * 60 * 60 * 24)),
        hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((total % (1000 * 60)) / 1000)
    };
}
/**
 * Formats a countdown for display in HTML.
 * @param timeLeft - The time left in milliseconds
 * @returns An HTML string representing the formatted countdown
 */
function formatCountdown(timeLeft) {
    const { days, hours, minutes, seconds } = calculateTimeRemaining(Date.now() + timeLeft);
    return `
    <div class="countdown-value">
      <span class="countdown-number">${days}</span>
      <span class="countdown-label">days</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${hours}</span>
      <span class="countdown-label">hours</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${minutes}</span>
      <span class="countdown-label">mins</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${seconds}</span>
      <span class="countdown-label">secs</span>
    </div>
  `;
}
/**
 * Formats a date for a specific timezone.
 * @param date - The Date object to format
 * @param timeZone - The timezone to use for formatting
 * @returns A formatted string representation of the date in the specified timezone
 */
function formatLocalEndDate(date, timeZone) {
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: timeZone
    });
}
/**
 * Parses a custom date string into a Date object.
 * @param dateString - The date string to parse
 * @param timezone - The timezone to use for parsing
 * @returns A Date object parsed from the date string
 */
function parseCustomDate(dateString, timezone) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    // Handle ISO format with timezone offset first
    if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:00$/)) {
        // If it's ET timezone and has EST offset (-05:00), check for DST
        if (timezone === 'ET' && dateString.endsWith('-05:00')) {
            // Create temporary date to check DST
            const tempDate = new Date(dateString);
            if ((0,_timezoneUtils__WEBPACK_IMPORTED_MODULE_0__.isDST)(tempDate)) {
                // If in DST, create new date with EDT offset
                const [datePart] = dateString.split('-05:00');
                return new Date(`${datePart}-04:00`);
            }
        }
        return new Date(dateString);
    }
    // Try 12-hour format first (e.g., "December 17, 2024, 12:00 PM")
    let parts = dateString.match(/(\w+) (\d{1,2}),? (\d{4}),? (\d{1,2}):(\d{2})(?::(\d{2}))? ([AP]M)/);
    if (parts) {
        const [, month, day, year, hour, minute, second = '00', ampm] = parts;
        let parsedHour = parseInt(hour);
        if (ampm === 'PM' && parsedHour !== 12)
            parsedHour += 12;
        if (ampm === 'AM' && parsedHour === 12)
            parsedHour = 0;
        // Create date in ET
        if (timezone === 'ET') {
            // Always create with EST offset first
            const date = new Date(`${year}-${(months.indexOf(month) + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${parsedHour.toString().padStart(2, '0')}:${minute}:${second}-05:00`);
            // Check if date is during DST
            if ((0,_timezoneUtils__WEBPACK_IMPORTED_MODULE_0__.isDST)(date)) {
                // Create new date with EDT offset
                return new Date(`${year}-${(months.indexOf(month) + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${parsedHour.toString().padStart(2, '0')}:${minute}:${second}-04:00`);
            }
            return date;
        }
        return new Date(Date.UTC(parseInt(year), months.indexOf(month), parseInt(day), parsedHour, parseInt(minute), parseInt(second)));
    }
    // If only date is provided (no time) - default to end of day
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/) || dateString.match(/^[A-Za-z]+ \d{1,2},? \d{4}$/)) {
        let date;
        if (timezone === 'ET') {
            // For ET timezone, create at 23:59:59 ET
            date = new Date(`${dateString}T23:59:59-05:00`);
            if ((0,_timezoneUtils__WEBPACK_IMPORTED_MODULE_0__.isDST)(date)) {
                // If in DST, create with EDT offset
                return new Date(`${dateString}T23:59:59-04:00`);
            }
        }
        else {
            // For UTC/other timezones, create at 23:59:59 UTC
            date = new Date(`${dateString}T23:59:59Z`);
        }
        return date;
    }
    // Handle ISO format with Z (UTC)
    if (dateString.endsWith('Z')) {
        // If timezone is ET, always treat as ET and set to end of day
        if (timezone === 'ET') {
            const utcDate = new Date(dateString);
            const year = utcDate.getUTCFullYear();
            const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const day = utcDate.getUTCDate().toString().padStart(2, '0');
            // Create at 23:59:59 ET with correct offset
            const date = new Date(`${year}-${month}-${day}T23:59:59-05:00`);
            if ((0,_timezoneUtils__WEBPACK_IMPORTED_MODULE_0__.isDST)(date)) {
                // If in DST, create with EDT offset
                return new Date(`${year}-${month}-${day}T23:59:59-04:00`);
            }
            return date;
        }
        return new Date(dateString);
    }
    // Fallback to built-in date parsing
    return new Date(dateString);
}


/***/ }),

/***/ "./src/utils/logUtils.ts":
/*!*******************************!*\
  !*** ./src/utils/logUtils.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   log: () => (/* binding */ log),
/* harmony export */   logError: () => (/* binding */ logError)
/* harmony export */ });
const IS_PRODUCTION = "development" === 'production';
function log(context, ...args) {
    if (!IS_PRODUCTION) {
        console.log(`[Polyteller ${context}]`, ...args);
    }
}
function logError(context, error) {
    if (IS_PRODUCTION) {
        chrome.storage.local.get('errorLogs', (result) => {
            const logs = result.errorLogs || [];
            logs.push({
                timestamp: new Date().toISOString(),
                context,
                error: error.message,
                stack: error.stack
            });
            chrome.storage.local.set({ errorLogs: logs.slice(-100) });
        });
    }
    else {
        console.error(`[Polyteller ${context}] Error:`, error);
    }
}


/***/ }),

/***/ "./src/utils/timezoneUtils.ts":
/*!************************************!*\
  !*** ./src/utils/timezoneUtils.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   convertToLocalTime: () => (/* binding */ convertToLocalTime),
/* harmony export */   formatLocalTime: () => (/* binding */ formatLocalTime),
/* harmony export */   getETOffset: () => (/* binding */ getETOffset),
/* harmony export */   getLocalTimezone: () => (/* binding */ getLocalTimezone),
/* harmony export */   getTimezoneAbbreviation: () => (/* binding */ getTimezoneAbbreviation),
/* harmony export */   isAmbiguousDSTTime: () => (/* binding */ isAmbiguousDSTTime),
/* harmony export */   isDST: () => (/* binding */ isDST)
/* harmony export */ });
const timezoneAbbreviations = {
    '-12:00': 'IDLW', '-11:00': 'SST', '-10:00': 'HST', '-09:30': 'MIT',
    '-09:00': 'AKST', '-08:00': 'PST', '-07:00': 'MST', '-06:00': 'CST',
    '-05:00': 'EST', '-04:00': 'AST', '-03:30': 'NST', '-03:00': 'BRT',
    '-02:00': 'FNT', '-01:00': 'CVT', '+00:00': 'GMT', '+01:00': 'CET',
    '+02:00': 'EET', '+03:00': 'MSK', '+03:30': 'IRST', '+04:00': 'GST',
    '+04:30': 'AFT', '+05:00': 'PKT', '+05:30': 'IST', '+05:45': 'NPT',
    '+06:00': 'BST', '+06:30': 'MMT', '+07:00': 'ICT', '+08:00': 'CST',
    '+08:45': 'ACWST', '+09:00': 'JST', '+09:30': 'ACST', '+10:00': 'AEST',
    '+10:30': 'ACDT', '+11:00': 'AEDT', '+12:00': 'NZST', '+12:45': 'CHAST',
    '+13:00': 'NZDT', '+14:00': 'LINT',
    'ET': 'EST/EDT',
    'CT': 'CST/CDT',
    'MT': 'MST/MDT',
    'PT': 'PST/PDT'
};
function getTimezoneAbbreviation(timezone) {
    return timezoneAbbreviations[timezone] || timezone;
}
function getLocalTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function isDST(date) {
    const year = date.getFullYear();
    const november = new Date(year, 10, 1);
    const firstSunday = new Date(november.setDate(november.getDate() + (7 - november.getDay())));
    firstSunday.setHours(2, 0, 0, 0);
    const march = new Date(year, 2, 1);
    const secondSunday = new Date(march.setDate(march.getDate() + (14 - march.getDay())));
    secondSunday.setHours(2, 0, 0, 0);
    return date >= secondSunday && date < firstSunday;
}
function getETOffset(date) {
    return isDST(date) ? 4 : 5; // EDT is UTC-4, EST is UTC-5
}
function isAmbiguousDSTTime(date) {
    const year = date.getFullYear();
    const november = new Date(year, 10, 1);
    const firstSunday = new Date(november.setDate(november.getDate() + (7 - november.getDay())));
    if (date.getMonth() === 10 && // November
        date.getDate() === firstSunday.getDate() && // First Sunday
        date.getHours() >= 1 && date.getHours() < 2) { // Between 1-2 AM
        return true;
    }
    return false;
}
function convertToLocalTime(utcTime) {
    const date = new Date(utcTime);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Date(date.toLocaleString('en-US', { timeZone: userTimezone }));
}
function formatLocalTime(date) {
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	__webpack_require__("./src/content/content.ts");
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/styles/content.css");
/******/ 	
/******/ })()
;
//# sourceMappingURL=content.js.map
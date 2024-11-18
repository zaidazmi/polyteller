/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/styles/popup.css":
/*!******************************!*\
  !*** ./src/styles/popup.css ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/content/privacyMode.ts":
/*!************************************!*\
  !*** ./src/content/privacyMode.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PRIVACY_MODE_KEY: () => (/* binding */ PRIVACY_MODE_KEY),
/* harmony export */   PrivacyModeState: () => (/* binding */ PrivacyModeState),
/* harmony export */   VALUE_SELECTOR: () => (/* binding */ VALUE_SELECTOR),
/* harmony export */   privacyModeState: () => (/* binding */ privacyModeState),
/* harmony export */   togglePrivacyMode: () => (/* binding */ togglePrivacyMode)
/* harmony export */ });
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/logUtils */ "./src/utils/logUtils.ts");

// Constants
const PRIVACY_MODE_KEY = 'privacyModeEnabled';
const VALUE_SELECTOR = '.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css';
const TOGGLE_ICON_CLASS = 'privacy-mode-toggle-icon';
const MUTATION_DEBOUNCE_TIME = 100;
/**
 * Adds the privacy mode toggle icon to the page.
 */
function addToggleIcon() {
    const findAndAddIcon = () => {
        if (document.querySelector(`.${TOGGLE_ICON_CLASS}`))
            return true;
        const portfolioElement = document.querySelector('a[href="/portfolio"].c-gBrBnR.c-dNAgLP.c-gBrBnR-gDWzxt-variant-primary.c-gBrBnR-gFoOfa-cv');
        if (!(portfolioElement instanceof HTMLElement))
            return false;
        const toggleIcon = document.createElement('div');
        toggleIcon.className = TOGGLE_ICON_CLASS;
        toggleIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
        toggleIcon.style.cssText = `
      position: absolute;
      top: calc(100% + 5px);
      left: 50%;
      transform: translateX(-50%);
      cursor: pointer;
      z-index: 1000;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease-in-out;
    `;
        toggleIcon.addEventListener('mouseenter', () => {
            toggleIcon.style.transform = 'translateX(-50%) scale(1.1)';
            toggleIcon.style.opacity = '1';
        });
        toggleIcon.addEventListener('mouseleave', () => {
            toggleIcon.style.transform = 'translateX(-50%) scale(1)';
            toggleIcon.style.opacity = '0.25';
        });
        toggleIcon.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await privacyModeState.toggle();
            toggleIcon.style.transform = 'translateX(-50%) scale(0.95)';
            setTimeout(() => {
                toggleIcon.style.transform = 'translateX(-50%) scale(1)';
            }, 100);
            chrome.runtime.sendMessage({
                action: 'broadcastPrivacyMode',
                enabled: privacyModeState.isEnabled
            });
        });
        const container = document.createElement('div');
        container.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      height: 0;
      overflow: visible;
      pointer-events: none;
    `;
        container.appendChild(toggleIcon);
        portfolioElement.style.position = 'relative';
        portfolioElement.appendChild(container);
        const updateIconColor = (enabled) => {
            toggleIcon.style.color = enabled ? '#4A4FE4' : '#666666';
            toggleIcon.style.opacity = '0.25';
        };
        updateIconColor(privacyModeState.isEnabled);
        privacyModeState.onStateChange(updateIconColor);
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', 'Toggle icon added');
        return true;
    };
    // Initialize with retries
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!findAndAddIcon()) {
                setTimeout(() => {
                    if (!findAndAddIcon()) {
                        setTimeout(findAndAddIcon, 1000);
                    }
                }, 500);
            }
        });
    }
    else {
        if (!findAndAddIcon()) {
            setTimeout(() => {
                if (!findAndAddIcon()) {
                    setTimeout(findAndAddIcon, 1000);
                }
            }, 500);
        }
    }
}
// Define PrivacyModeState class first
class PrivacyModeState {
    constructor() {
        this._isEnabled = false;
        this.stateChangeCallbacks = [];
        this.valueElements = new Set();
        this.mutationDebounceTimeout = null;
        this.pendingElements = new Set();
        this.initialize();
    }
    async initialize() {
        await this.loadInitialState();
        addToggleIcon();
        document.querySelectorAll(VALUE_SELECTOR).forEach(element => {
            if (element instanceof HTMLElement) {
                element.style.visibility = 'visible';
                this.updateElement(element);
            }
        });
        this.setupMessageListener();
        this.setupMutationObserver();
    }
    static getInstance() {
        if (!PrivacyModeState.instance) {
            PrivacyModeState.instance = new PrivacyModeState();
        }
        return PrivacyModeState.instance;
    }
    get isEnabled() {
        return this._isEnabled;
    }
    async toggle() {
        await this.setEnabled(!this._isEnabled);
    }
    async setEnabled(value) {
        if (this._isEnabled === value)
            return;
        this._isEnabled = value;
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', `State updated: ${value}`);
        try {
            await chrome.storage.local.set({ [PRIVACY_MODE_KEY]: value });
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', `State persisted: ${value}`);
            if (value) {
                document.body.classList.add('privacy-enabled');
            }
            else {
                document.body.classList.remove('privacy-enabled');
            }
            this.updateAllElements();
            this.notifyStateChange();
            chrome.runtime.sendMessage({
                action: 'updatePrivacyMode',
                enabled: value
            });
        }
        catch (error) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', 'Error persisting state:', error);
        }
    }
    async loadInitialState() {
        try {
            const result = await chrome.storage.local.get(PRIVACY_MODE_KEY);
            this._isEnabled = result[PRIVACY_MODE_KEY] || false;
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', `Initial state loaded: ${this._isEnabled}`);
            this.updateAllElements();
        }
        catch (error) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', 'Error loading initial state:', error);
        }
    }
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'updatePrivacyMode') {
                this.setEnabled(message.enabled);
                if (sendResponse) {
                    sendResponse({ received: true });
                }
            }
            return true;
        });
    }
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let needsUpdate = false;
            for (const mutation of mutations) {
                if (this.isMutationRelevant(mutation)) {
                    needsUpdate = true;
                    break;
                }
            }
            if (needsUpdate) {
                if (this.mutationDebounceTimeout) {
                    window.clearTimeout(this.mutationDebounceTimeout);
                }
                this.mutationDebounceTimeout = window.setTimeout(() => {
                    this.findAndUpdateElements();
                }, MUTATION_DEBOUNCE_TIME);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'textContent']
        });
    }
    isMutationRelevant(mutation) {
        if (mutation.type === 'childList') {
            return Array.from(mutation.addedNodes).some(node => node instanceof HTMLElement &&
                (node.matches(VALUE_SELECTOR) || node.querySelector(VALUE_SELECTOR)));
        }
        return false;
    }
    findAndUpdateElements() {
        const elements = document.querySelectorAll(VALUE_SELECTOR);
        elements.forEach(element => {
            if (element instanceof HTMLElement) {
                this.valueElements.add(element);
                this.updateElement(element);
            }
        });
    }
    updateElement(element) {
        if (this._isEnabled) {
            if (!element.dataset.originalValue) {
                element.dataset.originalValue = element.textContent || '';
            }
        }
        else {
            if (element.dataset.originalValue) {
                element.textContent = element.dataset.originalValue;
                delete element.dataset.originalValue;
            }
        }
    }
    updateAllElements() {
        this.valueElements.forEach(element => {
            if (document.body.contains(element)) {
                this.updateElement(element);
            }
            else {
                this.valueElements.delete(element);
            }
        });
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
// Export the singleton instance
const privacyModeState = PrivacyModeState.getInstance();
// Export the toggle function
async function togglePrivacyMode() {
    await privacyModeState.toggle();
}


/***/ }),

/***/ "./src/popup/components/countdown.ts":
/*!*******************************************!*\
  !*** ./src/popup/components/countdown.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   cleanupCountdown: () => (/* binding */ cleanupCountdown),
/* harmony export */   displayCountdown: () => (/* binding */ displayCountdown)
/* harmony export */ });
/* harmony import */ var _utils_CountdownManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/CountdownManager */ "./src/utils/CountdownManager.ts");
/* harmony import */ var _utils_dateUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/dateUtils */ "./src/utils/dateUtils.ts");
/* harmony import */ var _utils_timezoneUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/timezoneUtils */ "./src/utils/timezoneUtils.ts");
/* harmony import */ var _utils_countdownFormatters__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/countdownFormatters */ "./src/utils/countdownFormatters.ts");
/**
 * Countdown display function for the Polyteller popup.
 * This file contains the function to display and update the countdown timer for an event.
 */




let unsubscribe = null;
/**
 * Displays and updates the countdown for an event.
 * @param eventInfo - The event information
 */
function displayCountdown(eventInfo) {
    // Cleanup any existing subscription
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    const countdownElement = document.getElementById('countdown');
    const localEndTimeElement = document.getElementById('local-end-time');
    const notificationSection = document.getElementById('notify-section');
    if (!countdownElement || !localEndTimeElement || !notificationSection) {
        return;
    }
    const countdownManager = _utils_CountdownManager__WEBPACK_IMPORTED_MODULE_0__.CountdownManager.getInstance();
    countdownManager.registerEvent(eventInfo);
    unsubscribe = countdownManager.subscribe(eventInfo.id, (timeLeft) => {
        if (timeLeft.hasEnded) {
            countdownElement.textContent = 'Event has ended';
            const endDate = new Date(eventInfo.endTime);
            localEndTimeElement.innerHTML = `
        <span class="end-time-label">Ended on</span>
        <span>${(0,_utils_dateUtils__WEBPACK_IMPORTED_MODULE_1__.formatLocalEndDate)(endDate, (0,_utils_timezoneUtils__WEBPACK_IMPORTED_MODULE_2__.getLocalTimezone)())}</span>
      `;
            notificationSection.style.display = 'none';
        }
        else {
            countdownElement.innerHTML = (0,_utils_countdownFormatters__WEBPACK_IMPORTED_MODULE_3__.formatCountdownDisplay)(timeLeft);
        }
    });
    // Display local end time
    const endDate = new Date(eventInfo.endTime);
    const localTimezoneAbbr = (0,_utils_timezoneUtils__WEBPACK_IMPORTED_MODULE_2__.getLocalTimezone)();
    const formattedLocalEndDate = (0,_utils_dateUtils__WEBPACK_IMPORTED_MODULE_1__.formatLocalEndDate)(endDate, localTimezoneAbbr);
    localEndTimeElement.innerHTML = `
    <span class="end-time-label">Ends on</span>
    <span>${formattedLocalEndDate} ${localTimezoneAbbr}</span>
  `;
}
/**
 * Cleans up the countdown interval when the popup is closed.
 */
function cleanupCountdown() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
}


/***/ }),

/***/ "./src/popup/components/customTimeValidation.ts":
/*!******************************************************!*\
  !*** ./src/popup/components/customTimeValidation.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   validateCustomTime: () => (/* binding */ validateCustomTime)
/* harmony export */ });
/* harmony import */ var _store_store__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../store/store */ "./src/store/store.ts");

function validateCustomTime() {
    const daysInput = document.getElementById('custom-days');
    const hoursInput = document.getElementById('custom-hours');
    const minutesInput = document.getElementById('custom-minutes');
    const secondsInput = document.getElementById('custom-seconds');
    const setNotificationButton = document.getElementById('set-notification');
    const errorMessage = document.getElementById('custom-time-error');
    const inputs = [daysInput, hoursInput, minutesInput, secondsInput];
    const currentEvent = _store_store__WEBPACK_IMPORTED_MODULE_0__.useStore.getState().currentEvent;
    if (!currentEvent) {
        setNotificationButton.disabled = true;
        errorMessage.textContent = 'No event selected.';
        errorMessage.style.display = 'block';
        return;
    }
    // Get remaining time in days/hours/minutes/seconds
    const remainingTime = currentEvent.endTime - Date.now();
    const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    // Individual field validations
    const days = parseInt(daysInput.value) || 0;
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    // More permissive individual validation rules
    const isValid = {
        days: days >= 0 && days <= remainingDays,
        hours: hours >= 0 && hours <= 24,
        minutes: minutes >= 0 && minutes <= 60,
        seconds: seconds >= 0 && seconds <= 60
    };
    // Total time validation
    const totalMilliseconds = days * 86400000 +
        hours * 3600000 +
        minutes * 60000 +
        seconds * 1000;
    // Handle no time entered case
    if (totalMilliseconds === 0) {
        setNotificationButton.disabled = true;
        errorMessage.style.display = 'none';
        inputs.forEach(input => {
            input.style.borderColor = '';
        });
        return;
    }
    const isTotalTimeValid = totalMilliseconds > 0 && totalMilliseconds < remainingTime;
    // Show appropriate error messages
    let errorText = '';
    if (!isTotalTimeValid && totalMilliseconds >= remainingTime) {
        errorText = 'Notification time cannot exceed the remaining time.';
        // Set all inputs to red when total time exceeds remaining time
        inputs.forEach(input => {
            input.style.borderColor = 'red';
        });
    }
    else {
        // Only set individual border colors based on field validation
        inputs.forEach((input, index) => {
            const fieldName = ['days', 'hours', 'minutes', 'seconds'][index];
            input.style.borderColor = isValid[fieldName] ? '' : 'red';
        });
    }
    // Update UI
    const isAllValid = isTotalTimeValid && Object.values(isValid).every(v => v);
    setNotificationButton.disabled = !isAllValid;
    errorMessage.textContent = errorText;
    errorMessage.style.display = errorText ? 'block' : 'none';
}


/***/ }),

/***/ "./src/popup/components/donateWidget.ts":
/*!**********************************************!*\
  !*** ./src/popup/components/donateWidget.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createDonateWidget: () => (/* binding */ createDonateWidget)
/* harmony export */ });
/* harmony import */ var canvas_confetti__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! canvas-confetti */ "./node_modules/canvas-confetti/dist/confetti.module.mjs");

function createDonateWidget() {
    const widget = document.createElement('div');
    widget.className = 'donate-widget';
    widget.innerHTML = `
    <div class="donate-card">
      <div class="donate-content">
        <div class="donate-text">
          <h3>Support Polyteller</h3>
          <p>Help us keep building awesome features and keep this extension free!</p>
        </div>
        <button class="donate-button">
          <span class="donate-icon">❤️</span>
          <span>Donate</span>
        </button>
      </div>
    </div>
  `;
    // Create full-screen canvas for confetti
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  `;
    document.body.appendChild(canvas);
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
    .donate-widget {
      margin-top: 16px;
      position: relative;
    }

    .donate-card {
      background-color: var(--card-background);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      position: relative;
      overflow: hidden;
      transition: transform 0.3s ease;
    }

    .donate-card:hover {
      transform: translateY(-2px);
    }

    .donate-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1;
      position: relative;
    }

    .donate-text h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: var(--text-color);
    }

    .donate-text p {
      font-size: 14px;
      color: var(--text-light);
      margin: 0;
      max-width: 220px;
    }

    .donate-button {
      background: linear-gradient(45deg, #4A4FE4, #8086FF);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .donate-button:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(74, 79, 228, 0.3);
    }

    .donate-icon {
      font-size: 16px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `;
    document.head.appendChild(style);
    // Add confetti effect on hover
    const button = widget.querySelector('.donate-button');
    let confettiInstance = null;
    button?.addEventListener('mouseenter', () => {
        if (!confettiInstance) {
            confettiInstance = canvas_confetti__WEBPACK_IMPORTED_MODULE_0__["default"].create(canvas, {
                resize: true,
                useWorker: true
            });
        }
        // Fire confetti
        const end = Date.now() + 200;
        // Polymarket purple colors
        const colors = ['#4A4FE4', '#8086FF', '#E4E5FF'];
        (function frame() {
            // Single origin from bottom center with wider spread
            confettiInstance({
                particleCount: 5, // Increased particle count
                angle: 90, // Straight up
                spread: 120, // Wider spread for better coverage
                origin: { x: 0.5, y: 1.0 }, // Bottom center
                colors: colors,
                gravity: 0.8, // Slightly reduced gravity for higher rise
                scalar: 0.9, // Slightly smaller particles
                drift: 0, // No horizontal drift
                ticks: 200, // Longer particle lifetime
                shapes: ['circle', 'square'], // Mixed shapes
                zIndex: 9999
            });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    });
    button?.addEventListener('mouseleave', () => {
        if (confettiInstance) {
            confettiInstance.reset();
        }
    });
    button?.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://polyteller.com/donate' });
    });
    return widget;
}


/***/ }),

/***/ "./src/popup/components/notifications.ts":
/*!***********************************************!*\
  !*** ./src/popup/components/notifications.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   deleteNotification: () => (/* binding */ deleteNotification),
/* harmony export */   displayNotifications: () => (/* binding */ displayNotifications),
/* harmony export */   removeTriggeredNotificationFromList: () => (/* binding */ removeTriggeredNotificationFromList),
/* harmony export */   setNotification: () => (/* binding */ setNotification)
/* harmony export */ });
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/logUtils */ "./src/utils/logUtils.ts");
/* harmony import */ var _utils_dateUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/dateUtils */ "./src/utils/dateUtils.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils */ "./src/popup/utils.ts");
/* harmony import */ var _store_store__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../store/store */ "./src/store/store.ts");
/* harmony import */ var _popup__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../popup */ "./src/popup/popup.ts");
/* harmony import */ var _utils_timezoneUtils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../utils/timezoneUtils */ "./src/utils/timezoneUtils.ts");
/**
 * Notification management functions for the Polyteller popup.
 * This file contains functions for setting, displaying, and managing notifications.
 */






/**
 * Sets a new notification for the current event.
 */
function setNotification() {
    const setNotificationButton = document.getElementById('set-notification');
    const notificationTimeSelect = document.getElementById('notification-time');
    // Disable button during processing
    setNotificationButton.disabled = true;
    let minutesBefore;
    if (notificationTimeSelect.value === 'custom') {
        const days = parseInt(document.getElementById('custom-days').value) || 0;
        const hours = parseInt(document.getElementById('custom-hours').value) || 0;
        const minutes = parseInt(document.getElementById('custom-minutes').value) || 0;
        const seconds = parseInt(document.getElementById('custom-seconds').value) || 0;
        minutesBefore = (days * 24 * 60) + (hours * 60) + minutes + (seconds / 60);
    }
    else {
        minutesBefore = parseInt(notificationTimeSelect.value);
    }
    const currentEvent = _store_store__WEBPACK_IMPORTED_MODULE_3__.useStore.getState().currentEvent;
    if (currentEvent) {
        const now = Date.now();
        const notificationTime = currentEvent.endTime - minutesBefore * 60 * 1000;
        if (notificationTime <= now) {
            setNotificationButton.classList.add('error');
            (0,_utils__WEBPACK_IMPORTED_MODULE_2__.displayStatus)('Cannot set notification for a time that has already passed.');
            setTimeout(() => {
                setNotificationButton.classList.remove('error');
                setNotificationButton.disabled = false;
            }, 500);
            return;
        }
        const notificationSetting = {
            eventId: currentEvent.id,
            minutesBefore: minutesBefore,
            eventTitle: currentEvent.title,
            eventUrl: currentEvent.url
        };
        chrome.runtime.sendMessage({
            type: 'SCHEDULE_NOTIFICATION',
            data: notificationSetting
        }, async (response) => {
            if (response.success) {
                setNotificationButton.classList.add('success');
                await (0,_popup__WEBPACK_IMPORTED_MODULE_4__.loadNotifications)();
                (0,_utils__WEBPACK_IMPORTED_MODULE_2__.displayStatus)('Notification set successfully!');
                displayNotifications();
            }
            else {
                setNotificationButton.classList.add('error');
                if (response.isDuplicate) {
                    (0,_utils__WEBPACK_IMPORTED_MODULE_2__.displayStatus)('A notification for this time already exists.');
                }
                else {
                    (0,_utils__WEBPACK_IMPORTED_MODULE_2__.displayStatus)(`Failed to set notification: ${response.error}`);
                }
            }
            // Reset button state after delay
            setTimeout(() => {
                setNotificationButton.classList.remove('success', 'error');
                setNotificationButton.disabled = false;
            }, 500);
        });
    }
    else {
        setNotificationButton.classList.add('error');
        (0,_utils__WEBPACK_IMPORTED_MODULE_2__.displayStatus)('No event selected. Please select an event first.');
        setTimeout(() => {
            setNotificationButton.classList.remove('error');
            setNotificationButton.disabled = false;
        }, 500);
    }
}
/**
 * Displays the list of current notifications.
 */
function displayNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    const currentEvent = _store_store__WEBPACK_IMPORTED_MODULE_3__.useStore.getState().currentEvent;
    if (!currentEvent) {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Popup', 'No current event found');
        if (notificationsList) {
            notificationsList.innerHTML = '<li>No event selected.</li>';
        }
        return;
    }
    chrome.runtime.sendMessage({ type: 'GET_STORED_NOTIFICATIONS' }, (response) => {
        if (chrome.runtime.lastError) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Popup', 'Error fetching notifications:', chrome.runtime.lastError);
            if (notificationsList) {
                notificationsList.innerHTML = '<li>Error loading notifications. Please try again.</li>';
            }
            return;
        }
        const allNotifications = response.notifications;
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Popup', 'All notifications:', allNotifications);
        // Filter notifications for the current event
        const currentEventNotifications = allNotifications.filter((notification) => notification.eventId === currentEvent.id);
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Popup', 'Displaying notifications for current event:', currentEventNotifications);
        if (notificationsList) {
            notificationsList.innerHTML = '';
            if (currentEventNotifications.length === 0) {
                notificationsList.innerHTML = '<li>No notifications set for this event.</li>';
            }
            else {
                currentEventNotifications.forEach((notification) => {
                    const li = document.createElement('li');
                    li.className = 'notification-item';
                    const notificationTime = currentEvent.endTime - notification.minutesBefore * 60 * 1000;
                    const localNotificationTime = (0,_utils_timezoneUtils__WEBPACK_IMPORTED_MODULE_5__.convertToLocalTime)(notificationTime);
                    li.innerHTML = `
            <div class="notification-info">
              <span class="notification-time">${(0,_utils_dateUtils__WEBPACK_IMPORTED_MODULE_1__.formatFullNotificationTime)(notification.minutesBefore)}</span>
              <span class="notification-date">${(0,_utils_timezoneUtils__WEBPACK_IMPORTED_MODULE_5__.formatLocalTime)(localNotificationTime)}</span>
            </div>
            <button class="delete-notification" 
                    data-event-id="${notification.eventId}" 
                    data-minutes-before="${notification.minutesBefore}" 
                    aria-label="Delete notification">
              <span class="delete-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </span>
            </button>
          `;
                    notificationsList.appendChild(li);
                });
                const deleteButtons = document.querySelectorAll('.delete-notification');
                deleteButtons.forEach(button => {
                    button.addEventListener('click', deleteNotification);
                });
            }
        }
        else {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Popup', 'Unable to display notifications: notificationsList not found');
        }
    });
}
/**
 * Deletes a notification from the list and storage.
 * @param event - The click event on the delete button
 */
async function deleteNotification(event) {
    const button = event.currentTarget;
    const eventId = button.getAttribute('data-event-id');
    const minutesBefore = parseFloat(button.getAttribute('data-minutes-before') || '0');
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Popup', `Attempting to delete notification: eventId=${eventId}, minutesBefore=${minutesBefore}`);
    if (eventId && !isNaN(minutesBefore)) {
        const deletedNotification = { eventId, minutesBefore };
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Popup', `Notification to delete:`, deletedNotification);
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'REMOVE_NOTIFICATION_ALARM',
                data: deletedNotification
            });
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Popup', `Received response from background:`, response);
            if (response.success) {
                _store_store__WEBPACK_IMPORTED_MODULE_3__.useStore.getState().removeNotification(eventId, minutesBefore);
                await displayNotifications();
                (0,_utils__WEBPACK_IMPORTED_MODULE_2__.displayStatus)('Notification deleted successfully!');
            }
            else {
                (0,_utils__WEBPACK_IMPORTED_MODULE_2__.displayStatus)('Error deleting notification. Please try again.');
            }
        }
        catch (error) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Popup', 'Error sending message to background:', error);
            (0,_utils__WEBPACK_IMPORTED_MODULE_2__.displayStatus)('Error communicating with background. Please try again.');
        }
    }
    else {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Popup', 'Invalid notification data for deletion');
        (0,_utils__WEBPACK_IMPORTED_MODULE_2__.displayStatus)('Error: Invalid notification data');
    }
}
/**
 * Removes a triggered notification from the list.
 * @param triggeredNotification - The notification that was triggered
 */
function removeTriggeredNotificationFromList(triggeredNotification) {
    _store_store__WEBPACK_IMPORTED_MODULE_3__.useStore.getState().removeNotification(triggeredNotification.eventId, triggeredNotification.minutesBefore);
    displayNotifications();
}


/***/ }),

/***/ "./src/popup/components/privacyModeToggle.ts":
/*!***************************************************!*\
  !*** ./src/popup/components/privacyModeToggle.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initPrivacyModeToggle: () => (/* binding */ initPrivacyModeToggle)
/* harmony export */ });
/* harmony import */ var _content_privacyMode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../content/privacyMode */ "./src/content/privacyMode.ts");
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/logUtils */ "./src/utils/logUtils.ts");


/**
 * Initializes the privacy mode toggle in the extension popup.
 * This function sets up the initial state of the toggle and adds an event listener
 * to handle state changes.
 *
 * @returns {Promise<void>}
 */
async function initPrivacyModeToggle() {
    const toggle = document.getElementById('privacy-mode-toggle');
    if (!toggle) {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('PrivacyModeToggle', 'Toggle element not found');
        return;
    }
    const privacyMode = _content_privacyMode__WEBPACK_IMPORTED_MODULE_0__.PrivacyModeState.getInstance();
    toggle.checked = privacyMode.isEnabled;
    toggle.addEventListener('change', async () => {
        await privacyMode.toggle();
        // Notify all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'updatePrivacyMode',
                        enabled: privacyMode.isEnabled
                    });
                }
            });
        });
    });
    // Listen for state changes
    privacyMode.onStateChange((enabled) => {
        toggle.checked = enabled;
    });
}


/***/ }),

/***/ "./src/popup/components/uiUpdates.ts":
/*!*******************************************!*\
  !*** ./src/popup/components/uiUpdates.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   displayError: () => (/* binding */ displayError),
/* harmony export */   toggleCustomTimeInputs: () => (/* binding */ toggleCustomTimeInputs),
/* harmony export */   updateUI: () => (/* binding */ updateUI)
/* harmony export */ });
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/logUtils */ "./src/utils/logUtils.ts");
/* harmony import */ var _countdown__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./countdown */ "./src/popup/components/countdown.ts");
/* harmony import */ var _utils_dateUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/dateUtils */ "./src/utils/dateUtils.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils */ "./src/popup/utils.ts");
/**
 * UI update functions for the Polyteller popup.
 * This file contains functions responsible for updating various UI elements in the popup.
 */




/**
 * Updates the UI with event information.
 * @param eventInfo - The event information to display
 */
function updateUI(eventInfo) {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
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
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Popup', 'Updating UI with event info:', eventInfo);
        const titleElement = document.getElementById('event-title');
        if (titleElement) {
            titleElement.textContent = eventInfo.title;
        }
        if (typeof eventInfo.endTime === 'number' && (0,_utils_dateUtils__WEBPACK_IMPORTED_MODULE_2__.isValidTimestamp)(eventInfo.endTime)) {
            (0,_countdown__WEBPACK_IMPORTED_MODULE_1__.displayCountdown)(eventInfo);
        }
        else {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Invalid endTime:', eventInfo.endTime);
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__.displayStatus)('Invalid event end time');
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
      <span style="font-weight: 500;">Sports events are not supported yet</span>
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
function displayError(message) {
    const eventTitle = document.getElementById('event-title');
    if (eventTitle) {
        eventTitle.innerHTML = `
      <div style="color: var(--text-color);">${message}</div>
      <div style="color: var(--text-light); font-size: 14px; margin-top: 8px;">
        If you are on a valid Polymarket event page, try refreshing the page
      </div>
    `;
    }
    // Hide countdown and notification sections
    const countdown = document.getElementById('countdown');
    const notifySection = document.getElementById('notify-section');
    if (countdown)
        countdown.style.display = 'none';
    if (notifySection)
        notifySection.style.display = 'none';
}
/**
 * Toggles the visibility of custom time input fields.
 * @param show - Whether to show or hide the custom time inputs
 */
function toggleCustomTimeInputs(show) {
    const customInputs = document.getElementById('custom-time-inputs');
    if (customInputs) {
        customInputs.style.display = show ? 'flex' : 'none';
    }
}


/***/ }),

/***/ "./src/popup/popup.ts":
/*!****************************!*\
  !*** ./src/popup/popup.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initPopup: () => (/* binding */ initPopup),
/* harmony export */   initTradeConfirmationToggle: () => (/* binding */ initTradeConfirmationToggle),
/* harmony export */   loadNotifications: () => (/* binding */ loadNotifications)
/* harmony export */ });
/* harmony import */ var _styles_popup_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../styles/popup.css */ "./src/styles/popup.css");
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/logUtils */ "./src/utils/logUtils.ts");
/* harmony import */ var _components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./components/uiUpdates */ "./src/popup/components/uiUpdates.ts");
/* harmony import */ var _components_notifications__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/notifications */ "./src/popup/components/notifications.ts");
/* harmony import */ var _components_countdown__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./components/countdown */ "./src/popup/components/countdown.ts");
/* harmony import */ var _store_store__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../store/store */ "./src/store/store.ts");
/* harmony import */ var _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/errorUtils */ "./src/utils/errorUtils.ts");
/* harmony import */ var _components_customTimeValidation__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./components/customTimeValidation */ "./src/popup/components/customTimeValidation.ts");
/* harmony import */ var _components_privacyModeToggle__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./components/privacyModeToggle */ "./src/popup/components/privacyModeToggle.ts");
/* harmony import */ var _components_donateWidget__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./components/donateWidget */ "./src/popup/components/donateWidget.ts");
/**
 * Main popup script for Polyteller.
 * This file serves as the entry point for the popup, initializing the UI and managing the overall flow.
 * It imports necessary components and utilities, and sets up event listeners for the popup functionality.
 */










/**
 * Initializes the popup UI and sets up event listeners.
 */
async function initPopup() {
    try {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Initializing popup');
        // Set up "View All" button listener
        const viewAllButton = document.getElementById('view-all-notifications');
        if (viewAllButton) {
            viewAllButton.addEventListener('click', () => {
                const allNotificationsUrl = chrome.runtime.getURL('allNotifications.html');
                chrome.tabs.create({ url: allNotificationsUrl });
            });
        }
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTabId = tabs[0]?.id;
            const currentUrl = tabs[0]?.url || '';
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Current tab ID:', currentTabId);
            // Check for sports page first
            if (currentUrl.includes('/sports/')) {
                (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.updateUI)(null); // This will trigger sports message display
                return;
            }
            if (currentTabId) {
                chrome.runtime.sendMessage({ type: 'GET_EVENT_INFO', tabId: currentTabId }, (response) => {
                    try {
                        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Popup received response:', response);
                        if (chrome.runtime.lastError) {
                            throw new _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError('GET_EVENT_INFO_ERROR', 'Failed to retrieve event information. Please try again.');
                        }
                        else if (response) {
                            _store_store__WEBPACK_IMPORTED_MODULE_5__.useStore.getState().addEvent(response);
                            (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.updateUI)(response);
                            loadNotifications();
                        }
                        else {
                            throw new _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError('NO_EVENT_FOUND', 'No event found on this page.');
                        }
                    }
                    catch (error) {
                        if (error instanceof Error || error instanceof _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError) {
                            (0,_utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.handleError)(error);
                            (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.displayError)(error instanceof _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError ? error.message : 'An unexpected error occurred.');
                        }
                    }
                });
            }
            else {
                throw new _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError('TAB_ID_ERROR', 'Unable to determine current tab.');
            }
        });
        const notificationTimeSelect = document.getElementById('notification-time');
        const setNotificationButton = document.getElementById('set-notification');
        const customTimeInputs = document.querySelectorAll('#custom-time-inputs input');
        if (notificationTimeSelect && setNotificationButton) {
            notificationTimeSelect.addEventListener('change', (event) => {
                const isCustom = event.target.value === 'custom';
                (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.toggleCustomTimeInputs)(isCustom);
                if (isCustom) {
                    (0,_components_customTimeValidation__WEBPACK_IMPORTED_MODULE_7__.validateCustomTime)();
                }
                else {
                    setNotificationButton.disabled = false;
                }
            });
            setNotificationButton.addEventListener('click', _components_notifications__WEBPACK_IMPORTED_MODULE_3__.setNotification);
        }
        else {
            throw new _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError('ELEMENT_NOT_FOUND', 'Required UI elements not found.');
        }
        customTimeInputs.forEach(input => {
            input.addEventListener('input', _components_customTimeValidation__WEBPACK_IMPORTED_MODULE_7__.validateCustomTime);
        });
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'NOTIFICATION_TRIGGERED') {
                (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Popup received NOTIFICATION_TRIGGERED message:', message.data);
                (0,_components_notifications__WEBPACK_IMPORTED_MODULE_3__.removeTriggeredNotificationFromList)(message.data);
            }
        });
        await initTradeConfirmationToggle();
        await (0,_components_privacyModeToggle__WEBPACK_IMPORTED_MODULE_8__.initPrivacyModeToggle)(); // Initialize privacy mode toggle
    }
    catch (error) {
        if (error instanceof Error || error instanceof _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError) {
            (0,_utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.handleError)(error);
            (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.displayError)(error instanceof _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError ? error.message : 'An unexpected error occurred while initializing the popup.');
        }
    }
}
async function loadNotifications() {
    return new Promise((resolve) => {
        try {
            const currentEvent = _store_store__WEBPACK_IMPORTED_MODULE_5__.useStore.getState().currentEvent;
            const timeoutId = setTimeout(() => {
                throw new _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError('LOAD_NOTIFICATIONS_TIMEOUT', 'Timeout while loading notifications');
            }, 5000); // 5-second timeout
            chrome.runtime.sendMessage({ type: 'GET_STORED_NOTIFICATIONS' }, (response) => {
                clearTimeout(timeoutId);
                if (chrome.runtime.lastError) {
                    throw new _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError('GET_STORED_NOTIFICATIONS_ERROR', 'Error loading notifications');
                }
                let notifications = response.notifications || [];
                if (currentEvent) {
                    const now = Date.now();
                    const currentNotifications = notifications.filter(notification => {
                        return notification.eventId === currentEvent.id &&
                            (currentEvent.endTime - notification.minutesBefore * 60 * 1000) > now;
                    });
                    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Popup', 'Loaded notifications:', currentNotifications);
                    _store_store__WEBPACK_IMPORTED_MODULE_5__.useStore.getState().setNotifications(currentNotifications);
                    (0,_components_notifications__WEBPACK_IMPORTED_MODULE_3__.displayNotifications)();
                }
                else {
                    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Popup', 'No event found when loading notifications');
                }
                resolve();
            });
        }
        catch (error) {
            if (error instanceof Error || error instanceof _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError) {
                (0,_utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.handleError)(error);
                (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.displayError)(error instanceof _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError ? error.message : 'An unexpected error occurred while loading notifications.');
            }
            resolve();
        }
    });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NOTIFICATIONS_UPDATED') {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Popup received NOTIFICATIONS_UPDATED message:', message.data);
        loadNotifications().catch(error => {
            if (error instanceof Error || error instanceof _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError) {
                (0,_utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.handleError)(error);
                (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.displayError)('Failed to load updated notifications.');
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    initPopup().catch(error => {
        if (error instanceof Error || error instanceof _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError) {
            (0,_utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.handleError)(error);
            (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.displayError)('Failed to initialize popup.');
        }
    });
    const notificationTimeSelect = document.getElementById('notification-time');
    notificationTimeSelect.addEventListener('change', (event) => {
        const target = event.target;
        (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.toggleCustomTimeInputs)(target.value === 'custom');
    });
    (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.toggleCustomTimeInputs)(false);
    window.addEventListener('unload', () => {
        (0,_components_countdown__WEBPACK_IMPORTED_MODULE_4__.cleanupCountdown)();
    });
    // Add donate widget
    const container = document.querySelector('.container');
    if (container) {
        container.appendChild((0,_components_donateWidget__WEBPACK_IMPORTED_MODULE_9__.createDonateWidget)());
    }
});
window.addEventListener('error', (event) => {
    if (event.error instanceof Error || event.error instanceof _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError) {
        (0,_utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.handleError)(event.error);
        (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.displayError)('An unexpected error occurred. Please try reloading the extension.');
    }
    event.preventDefault();
});
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof Error || event.reason instanceof _utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.PolytellerError) {
        (0,_utils_errorUtils__WEBPACK_IMPORTED_MODULE_6__.handleError)(event.reason);
        (0,_components_uiUpdates__WEBPACK_IMPORTED_MODULE_2__.displayError)('An unexpected error occurred. Please try reloading the extension.');
    }
    event.preventDefault();
});
function initTradeConfirmationToggle() {
    console.log('initTradeConfirmationToggle function called');
    return new Promise((resolve) => {
        console.log('Inside Promise constructor');
        try {
            const toggle = document.getElementById('trade-confirmation-toggle');
            console.log('Toggle element:', toggle);
            if (!chrome.storage || !chrome.storage.local || !chrome.storage.local.get) {
                console.error('Chrome storage API not available');
                resolve(false);
                return;
            }
            chrome.storage.local.get('enableTradeConfirmation', (result) => {
                console.log('Chrome storage result:', result);
                if (chrome.runtime.lastError) {
                    console.error('Error getting from storage:', chrome.runtime.lastError);
                    resolve(false);
                    return;
                }
                const initialState = result.enableTradeConfirmation !== false;
                console.log('Initial state calculated:', initialState);
                if (toggle) {
                    toggle.checked = initialState;
                    console.log('Initial state set on toggle:', initialState);
                    const changeHandler = () => {
                        const isEnabled = toggle.checked;
                        console.log('Toggle changed, new state:', isEnabled);
                        chrome.storage.local.set({ enableTradeConfirmation: isEnabled }, () => {
                            console.log(`Trade confirmation ${isEnabled ? 'enabled' : 'disabled'}`);
                            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                const currentTabId = tabs[0]?.id;
                                if (currentTabId) {
                                    chrome.tabs.sendMessage(currentTabId, { action: 'updateTradeConfirmation', enabled: isEnabled });
                                }
                            });
                        });
                    };
                    toggle.addEventListener('change', changeHandler);
                    // Trigger the change handler immediately to ensure it's set up correctly
                    changeHandler();
                }
                else {
                    console.error('Toggle element not found');
                    resolve(false);
                    return;
                }
                console.log('Resolving promise with:', initialState);
                resolve(initialState);
            });
        }
        catch (error) {
            console.error('Error in initTradeConfirmationToggle:', error);
            resolve(false);
        }
    });
}


/***/ }),

/***/ "./src/popup/utils.ts":
/*!****************************!*\
  !*** ./src/popup/utils.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   displayStatus: () => (/* binding */ displayStatus)
/* harmony export */ });
function displayStatus(message, isSuccess = true) {
    let toastContainer = document.querySelector('.toast-container');
    // Create container if it doesn't exist
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = `toast-message ${isSuccess ? 'success' : 'error'}`;
    toast.textContent = message;
    // Remove any existing toasts
    toastContainer.innerHTML = '';
    toastContainer.appendChild(toast);
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    // Remove toast after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 300); // Keep fade out animation time
    }, 2000); // Changed from 1000 to 2000 to show for 2 seconds
}


/***/ }),

/***/ "./src/store/store.ts":
/*!****************************!*\
  !*** ./src/store/store.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   store: () => (/* binding */ store),
/* harmony export */   useStore: () => (/* binding */ useStore)
/* harmony export */ });
/* harmony import */ var zustand_vanilla__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! zustand/vanilla */ "./node_modules/zustand/vanilla.js");
/* harmony import */ var zustand_middleware__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! zustand/middleware */ "./node_modules/zustand/middleware.js");


/**
 * Custom storage object for persisting state in Chrome's local storage.
 */
const storage = {
    getItem: (name) => {
        return new Promise((resolve) => {
            chrome.storage.local.get([name], (result) => {
                resolve(result[name] || null);
            });
        });
    },
    setItem: (name, value) => {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [name]: value }, () => resolve());
        });
    },
    removeItem: (name) => {
        return new Promise((resolve) => {
            chrome.storage.local.remove(name, () => resolve());
        });
    },
};
/**
 * Configuration options for state persistence.
 */
const persistOptions = {
    name: 'polyteller-storage',
    storage,
};
/**
 * Creates and exports the Zustand store with persistence.
 */
const store = (0,zustand_vanilla__WEBPACK_IMPORTED_MODULE_0__.createStore)()((0,zustand_middleware__WEBPACK_IMPORTED_MODULE_1__.persist)((set, get) => ({
    events: [],
    notifications: [],
    currentEvent: null,
    addEvent: (event) => set((state) => {
        console.log('Adding/updating event:', event);
        const existingEventIndex = state.events.findIndex(e => e.id === event.id);
        if (existingEventIndex !== -1) {
            // Update existing event
            const updatedEvents = [...state.events];
            updatedEvents[existingEventIndex] = event;
            return { events: updatedEvents, currentEvent: event };
        }
        else {
            // Add new event
            return { events: [...state.events, event], currentEvent: event };
        }
    }),
    addNotification: (notification) => set((state) => {
        console.log('Adding notification:', notification);
        const existingNotificationIndex = state.notifications.findIndex(n => n.eventId === notification.eventId && n.minutesBefore === notification.minutesBefore);
        if (existingNotificationIndex !== -1) {
            // Update existing notification
            const updatedNotifications = [...state.notifications];
            updatedNotifications[existingNotificationIndex] = notification;
            return { notifications: updatedNotifications };
        }
        else {
            // Add new notification
            return { notifications: [...state.notifications, notification] };
        }
    }),
    setNotifications: (notifications) => set((state) => {
        console.log('Setting notifications:', notifications);
        return { notifications };
    }),
    removeEvent: (eventId) => set((state) => ({
        ...state,
        events: state.events.filter((e) => e.id !== eventId),
    })),
    removeNotification: (eventId, minutesBefore) => set((state) => {
        console.log('Removing notification:', { eventId, minutesBefore });
        const updatedNotifications = state.notifications.filter((n) => !(n.eventId === eventId && Math.abs(n.minutesBefore - minutesBefore) < 0.1));
        console.log('Updated notifications:', updatedNotifications);
        return { notifications: updatedNotifications };
    }),
}), persistOptions));
// Export the typed useStore hook for use in components
const useStore = store;


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

/***/ "./src/utils/countdownFormatters.ts":
/*!******************************************!*\
  !*** ./src/utils/countdownFormatters.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   formatAllNotificationsCountdown: () => (/* binding */ formatAllNotificationsCountdown),
/* harmony export */   formatCountdownDisplay: () => (/* binding */ formatCountdownDisplay)
/* harmony export */ });
function formatCountdownDisplay(timeLeft) {
    return `
    <div class="countdown-value">
      <span class="countdown-number">${timeLeft.days}</span>
      <span class="countdown-label">days</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${timeLeft.hours}</span>
      <span class="countdown-label">hours</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${timeLeft.minutes}</span>
      <span class="countdown-label">mins</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${timeLeft.seconds}</span>
      <span class="countdown-label">secs</span>
    </div>
  `;
}
function formatAllNotificationsCountdown(timeLeft) {
    return `
    <div class="countdown-segment">
      <span class="countdown-number">${timeLeft.days.toString().padStart(2, '0')}</span>
      <span class="countdown-label">days</span>
    </div>
    <span class="countdown-separator">:</span>
    <div class="countdown-segment">
      <span class="countdown-number">${timeLeft.hours.toString().padStart(2, '0')}</span>
      <span class="countdown-label">hours</span>
    </div>
    <span class="countdown-separator">:</span>
    <div class="countdown-segment">
      <span class="countdown-number">${timeLeft.minutes.toString().padStart(2, '0')}</span>
      <span class="countdown-label">mins</span>
    </div>
    <span class="countdown-separator">:</span>
    <div class="countdown-segment">
      <span class="countdown-number">${timeLeft.seconds.toString().padStart(2, '0')}</span>
      <span class="countdown-label">secs</span>
    </div>
  `;
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

/***/ "./src/utils/errorUtils.ts":
/*!*********************************!*\
  !*** ./src/utils/errorUtils.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PolytellerError: () => (/* binding */ PolytellerError),
/* harmony export */   handleError: () => (/* binding */ handleError)
/* harmony export */ });
/* harmony import */ var _logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./logUtils */ "./src/utils/logUtils.ts");

class PolytellerError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'PolytellerError';
    }
}
function handleError(error) {
    if (error instanceof PolytellerError) {
        (0,_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Error', `[${error.code}] ${error.message}`);
    }
    else {
        (0,_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Error', error.message);
    }
    // You could add error reporting logic here
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


/***/ }),

/***/ "./node_modules/zustand/middleware.js":
/*!********************************************!*\
  !*** ./node_modules/zustand/middleware.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {



const reduxImpl = (reducer, initial) => (set, _get, api) => {
  api.dispatch = (action) => {
    set((state) => reducer(state, action), false, action);
    return action;
  };
  api.dispatchFromDevtools = true;
  return { dispatch: (...a) => api.dispatch(...a), ...initial };
};
const redux = reduxImpl;

const trackedConnections = /* @__PURE__ */ new Map();
const getTrackedConnectionState = (name) => {
  const api = trackedConnections.get(name);
  if (!api) return {};
  return Object.fromEntries(
    Object.entries(api.stores).map(([key, api2]) => [key, api2.getState()])
  );
};
const extractConnectionInformation = (store, extensionConnector, options) => {
  if (store === void 0) {
    return {
      type: "untracked",
      connection: extensionConnector.connect(options)
    };
  }
  const existingConnection = trackedConnections.get(options.name);
  if (existingConnection) {
    return { type: "tracked", store, ...existingConnection };
  }
  const newConnection = {
    connection: extensionConnector.connect(options),
    stores: {}
  };
  trackedConnections.set(options.name, newConnection);
  return { type: "tracked", store, ...newConnection };
};
const devtoolsImpl = (fn, devtoolsOptions = {}) => (set, get, api) => {
  const { enabled, anonymousActionType, store, ...options } = devtoolsOptions;
  let extensionConnector;
  try {
    extensionConnector = (enabled != null ? enabled : "development" !== "production") && window.__REDUX_DEVTOOLS_EXTENSION__;
  } catch (e) {
  }
  if (!extensionConnector) {
    return fn(set, get, api);
  }
  const { connection, ...connectionInformation } = extractConnectionInformation(store, extensionConnector, options);
  let isRecording = true;
  api.setState = (state, replace, nameOrAction) => {
    const r = set(state, replace);
    if (!isRecording) return r;
    const action = nameOrAction === void 0 ? { type: anonymousActionType || "anonymous" } : typeof nameOrAction === "string" ? { type: nameOrAction } : nameOrAction;
    if (store === void 0) {
      connection == null ? void 0 : connection.send(action, get());
      return r;
    }
    connection == null ? void 0 : connection.send(
      {
        ...action,
        type: `${store}/${action.type}`
      },
      {
        ...getTrackedConnectionState(options.name),
        [store]: api.getState()
      }
    );
    return r;
  };
  const setStateFromDevtools = (...a) => {
    const originalIsRecording = isRecording;
    isRecording = false;
    set(...a);
    isRecording = originalIsRecording;
  };
  const initialState = fn(api.setState, get, api);
  if (connectionInformation.type === "untracked") {
    connection == null ? void 0 : connection.init(initialState);
  } else {
    connectionInformation.stores[connectionInformation.store] = api;
    connection == null ? void 0 : connection.init(
      Object.fromEntries(
        Object.entries(connectionInformation.stores).map(([key, store2]) => [
          key,
          key === connectionInformation.store ? initialState : store2.getState()
        ])
      )
    );
  }
  if (api.dispatchFromDevtools && typeof api.dispatch === "function") {
    let didWarnAboutReservedActionType = false;
    const originalDispatch = api.dispatch;
    api.dispatch = (...a) => {
      if ( true && a[0].type === "__setState" && !didWarnAboutReservedActionType) {
        console.warn(
          '[zustand devtools middleware] "__setState" action type is reserved to set state from the devtools. Avoid using it.'
        );
        didWarnAboutReservedActionType = true;
      }
      originalDispatch(...a);
    };
  }
  connection.subscribe((message) => {
    var _a;
    switch (message.type) {
      case "ACTION":
        if (typeof message.payload !== "string") {
          console.error(
            "[zustand devtools middleware] Unsupported action format"
          );
          return;
        }
        return parseJsonThen(
          message.payload,
          (action) => {
            if (action.type === "__setState") {
              if (store === void 0) {
                setStateFromDevtools(action.state);
                return;
              }
              if (Object.keys(action.state).length !== 1) {
                console.error(
                  `
                    [zustand devtools middleware] Unsupported __setState action format.
                    When using 'store' option in devtools(), the 'state' should have only one key, which is a value of 'store' that was passed in devtools(),
                    and value of this only key should be a state object. Example: { "type": "__setState", "state": { "abc123Store": { "foo": "bar" } } }
                    `
                );
              }
              const stateFromDevtools = action.state[store];
              if (stateFromDevtools === void 0 || stateFromDevtools === null) {
                return;
              }
              if (JSON.stringify(api.getState()) !== JSON.stringify(stateFromDevtools)) {
                setStateFromDevtools(stateFromDevtools);
              }
              return;
            }
            if (!api.dispatchFromDevtools) return;
            if (typeof api.dispatch !== "function") return;
            api.dispatch(action);
          }
        );
      case "DISPATCH":
        switch (message.payload.type) {
          case "RESET":
            setStateFromDevtools(initialState);
            if (store === void 0) {
              return connection == null ? void 0 : connection.init(api.getState());
            }
            return connection == null ? void 0 : connection.init(getTrackedConnectionState(options.name));
          case "COMMIT":
            if (store === void 0) {
              connection == null ? void 0 : connection.init(api.getState());
              return;
            }
            return connection == null ? void 0 : connection.init(getTrackedConnectionState(options.name));
          case "ROLLBACK":
            return parseJsonThen(message.state, (state) => {
              if (store === void 0) {
                setStateFromDevtools(state);
                connection == null ? void 0 : connection.init(api.getState());
                return;
              }
              setStateFromDevtools(state[store]);
              connection == null ? void 0 : connection.init(getTrackedConnectionState(options.name));
            });
          case "JUMP_TO_STATE":
          case "JUMP_TO_ACTION":
            return parseJsonThen(message.state, (state) => {
              if (store === void 0) {
                setStateFromDevtools(state);
                return;
              }
              if (JSON.stringify(api.getState()) !== JSON.stringify(state[store])) {
                setStateFromDevtools(state[store]);
              }
            });
          case "IMPORT_STATE": {
            const { nextLiftedState } = message.payload;
            const lastComputedState = (_a = nextLiftedState.computedStates.slice(-1)[0]) == null ? void 0 : _a.state;
            if (!lastComputedState) return;
            if (store === void 0) {
              setStateFromDevtools(lastComputedState);
            } else {
              setStateFromDevtools(lastComputedState[store]);
            }
            connection == null ? void 0 : connection.send(
              null,
              // FIXME no-any
              nextLiftedState
            );
            return;
          }
          case "PAUSE_RECORDING":
            return isRecording = !isRecording;
        }
        return;
    }
  });
  return initialState;
};
const devtools = devtoolsImpl;
const parseJsonThen = (stringified, f) => {
  let parsed;
  try {
    parsed = JSON.parse(stringified);
  } catch (e) {
    console.error(
      "[zustand devtools middleware] Could not parse the received json",
      e
    );
  }
  if (parsed !== void 0) f(parsed);
};

const subscribeWithSelectorImpl = (fn) => (set, get, api) => {
  const origSubscribe = api.subscribe;
  api.subscribe = (selector, optListener, options) => {
    let listener = selector;
    if (optListener) {
      const equalityFn = (options == null ? void 0 : options.equalityFn) || Object.is;
      let currentSlice = selector(api.getState());
      listener = (state) => {
        const nextSlice = selector(state);
        if (!equalityFn(currentSlice, nextSlice)) {
          const previousSlice = currentSlice;
          optListener(currentSlice = nextSlice, previousSlice);
        }
      };
      if (options == null ? void 0 : options.fireImmediately) {
        optListener(currentSlice, currentSlice);
      }
    }
    return origSubscribe(listener);
  };
  const initialState = fn(set, get, api);
  return initialState;
};
const subscribeWithSelector = subscribeWithSelectorImpl;

const combine = (initialState, create) => (...a) => Object.assign({}, initialState, create(...a));

function createJSONStorage(getStorage, options) {
  let storage;
  try {
    storage = getStorage();
  } catch (e) {
    return;
  }
  const persistStorage = {
    getItem: (name) => {
      var _a;
      const parse = (str2) => {
        if (str2 === null) {
          return null;
        }
        return JSON.parse(str2, options == null ? void 0 : options.reviver);
      };
      const str = (_a = storage.getItem(name)) != null ? _a : null;
      if (str instanceof Promise) {
        return str.then(parse);
      }
      return parse(str);
    },
    setItem: (name, newValue) => storage.setItem(
      name,
      JSON.stringify(newValue, options == null ? void 0 : options.replacer)
    ),
    removeItem: (name) => storage.removeItem(name)
  };
  return persistStorage;
}
const toThenable = (fn) => (input) => {
  try {
    const result = fn(input);
    if (result instanceof Promise) {
      return result;
    }
    return {
      then(onFulfilled) {
        return toThenable(onFulfilled)(result);
      },
      catch(_onRejected) {
        return this;
      }
    };
  } catch (e) {
    return {
      then(_onFulfilled) {
        return this;
      },
      catch(onRejected) {
        return toThenable(onRejected)(e);
      }
    };
  }
};
const persistImpl = (config, baseOptions) => (set, get, api) => {
  let options = {
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => state,
    version: 0,
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...persistedState
    }),
    ...baseOptions
  };
  let hasHydrated = false;
  const hydrationListeners = /* @__PURE__ */ new Set();
  const finishHydrationListeners = /* @__PURE__ */ new Set();
  let storage = options.storage;
  if (!storage) {
    return config(
      (...args) => {
        console.warn(
          `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
        );
        set(...args);
      },
      get,
      api
    );
  }
  const setItem = () => {
    const state = options.partialize({ ...get() });
    return storage.setItem(options.name, {
      state,
      version: options.version
    });
  };
  const savedSetState = api.setState;
  api.setState = (state, replace) => {
    savedSetState(state, replace);
    void setItem();
  };
  const configResult = config(
    (...args) => {
      set(...args);
      void setItem();
    },
    get,
    api
  );
  api.getInitialState = () => configResult;
  let stateFromStorage;
  const hydrate = () => {
    var _a, _b;
    if (!storage) return;
    hasHydrated = false;
    hydrationListeners.forEach((cb) => {
      var _a2;
      return cb((_a2 = get()) != null ? _a2 : configResult);
    });
    const postRehydrationCallback = ((_b = options.onRehydrateStorage) == null ? void 0 : _b.call(options, (_a = get()) != null ? _a : configResult)) || void 0;
    return toThenable(storage.getItem.bind(storage))(options.name).then((deserializedStorageValue) => {
      if (deserializedStorageValue) {
        if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
          if (options.migrate) {
            return [
              true,
              options.migrate(
                deserializedStorageValue.state,
                deserializedStorageValue.version
              )
            ];
          }
          console.error(
            `State loaded from storage couldn't be migrated since no migrate function was provided`
          );
        } else {
          return [false, deserializedStorageValue.state];
        }
      }
      return [false, void 0];
    }).then((migrationResult) => {
      var _a2;
      const [migrated, migratedState] = migrationResult;
      stateFromStorage = options.merge(
        migratedState,
        (_a2 = get()) != null ? _a2 : configResult
      );
      set(stateFromStorage, true);
      if (migrated) {
        return setItem();
      }
    }).then(() => {
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(stateFromStorage, void 0);
      stateFromStorage = get();
      hasHydrated = true;
      finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
    }).catch((e) => {
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e);
    });
  };
  api.persist = {
    setOptions: (newOptions) => {
      options = {
        ...options,
        ...newOptions
      };
      if (newOptions.storage) {
        storage = newOptions.storage;
      }
    },
    clearStorage: () => {
      storage == null ? void 0 : storage.removeItem(options.name);
    },
    getOptions: () => options,
    rehydrate: () => hydrate(),
    hasHydrated: () => hasHydrated,
    onHydrate: (cb) => {
      hydrationListeners.add(cb);
      return () => {
        hydrationListeners.delete(cb);
      };
    },
    onFinishHydration: (cb) => {
      finishHydrationListeners.add(cb);
      return () => {
        finishHydrationListeners.delete(cb);
      };
    }
  };
  if (!options.skipHydration) {
    hydrate();
  }
  return stateFromStorage || configResult;
};
const persist = persistImpl;

exports.combine = combine;
exports.createJSONStorage = createJSONStorage;
exports.devtools = devtools;
exports.persist = persist;
exports.redux = redux;
exports.subscribeWithSelector = subscribeWithSelector;


/***/ }),

/***/ "./node_modules/zustand/vanilla.js":
/*!*****************************************!*\
  !*** ./node_modules/zustand/vanilla.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports) => {



const createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const api = { setState, getState, getInitialState, subscribe };
  const initialState = state = createState(setState, getState, api);
  return api;
};
const createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;

exports.createStore = createStore;


/***/ }),

/***/ "./node_modules/canvas-confetti/dist/confetti.module.mjs":
/*!***************************************************************!*\
  !*** ./node_modules/canvas-confetti/dist/confetti.module.mjs ***!
  \***************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   create: () => (/* binding */ create),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// canvas-confetti v1.9.3 built on 2024-04-30T22:19:17.794Z
var module = {};

// source content
/* globals Map */

(function main(global, module, isWorker, workerSize) {
  var canUseWorker = !!(
    global.Worker &&
    global.Blob &&
    global.Promise &&
    global.OffscreenCanvas &&
    global.OffscreenCanvasRenderingContext2D &&
    global.HTMLCanvasElement &&
    global.HTMLCanvasElement.prototype.transferControlToOffscreen &&
    global.URL &&
    global.URL.createObjectURL);

  var canUsePaths = typeof Path2D === 'function' && typeof DOMMatrix === 'function';
  var canDrawBitmap = (function () {
    // this mostly supports ssr
    if (!global.OffscreenCanvas) {
      return false;
    }

    var canvas = new OffscreenCanvas(1, 1);
    var ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, 1, 1);
    var bitmap = canvas.transferToImageBitmap();

    try {
      ctx.createPattern(bitmap, 'no-repeat');
    } catch (e) {
      return false;
    }

    return true;
  })();

  function noop() {}

  // create a promise if it exists, otherwise, just
  // call the function directly
  function promise(func) {
    var ModulePromise = module.exports.Promise;
    var Prom = ModulePromise !== void 0 ? ModulePromise : global.Promise;

    if (typeof Prom === 'function') {
      return new Prom(func);
    }

    func(noop, noop);

    return null;
  }

  var bitmapMapper = (function (skipTransform, map) {
    // see https://github.com/catdad/canvas-confetti/issues/209
    // creating canvases is actually pretty expensive, so we should create a
    // 1:1 map for bitmap:canvas, so that we can animate the confetti in
    // a performant manner, but also not store them forever so that we don't
    // have a memory leak
    return {
      transform: function(bitmap) {
        if (skipTransform) {
          return bitmap;
        }

        if (map.has(bitmap)) {
          return map.get(bitmap);
        }

        var canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);

        map.set(bitmap, canvas);

        return canvas;
      },
      clear: function () {
        map.clear();
      }
    };
  })(canDrawBitmap, new Map());

  var raf = (function () {
    var TIME = Math.floor(1000 / 60);
    var frame, cancel;
    var frames = {};
    var lastFrameTime = 0;

    if (typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function') {
      frame = function (cb) {
        var id = Math.random();

        frames[id] = requestAnimationFrame(function onFrame(time) {
          if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
            lastFrameTime = time;
            delete frames[id];

            cb();
          } else {
            frames[id] = requestAnimationFrame(onFrame);
          }
        });

        return id;
      };
      cancel = function (id) {
        if (frames[id]) {
          cancelAnimationFrame(frames[id]);
        }
      };
    } else {
      frame = function (cb) {
        return setTimeout(cb, TIME);
      };
      cancel = function (timer) {
        return clearTimeout(timer);
      };
    }

    return { frame: frame, cancel: cancel };
  }());

  var getWorker = (function () {
    var worker;
    var prom;
    var resolves = {};

    function decorate(worker) {
      function execute(options, callback) {
        worker.postMessage({ options: options || {}, callback: callback });
      }
      worker.init = function initWorker(canvas) {
        var offscreen = canvas.transferControlToOffscreen();
        worker.postMessage({ canvas: offscreen }, [offscreen]);
      };

      worker.fire = function fireWorker(options, size, done) {
        if (prom) {
          execute(options, null);
          return prom;
        }

        var id = Math.random().toString(36).slice(2);

        prom = promise(function (resolve) {
          function workerDone(msg) {
            if (msg.data.callback !== id) {
              return;
            }

            delete resolves[id];
            worker.removeEventListener('message', workerDone);

            prom = null;

            bitmapMapper.clear();

            done();
            resolve();
          }

          worker.addEventListener('message', workerDone);
          execute(options, id);

          resolves[id] = workerDone.bind(null, { data: { callback: id }});
        });

        return prom;
      };

      worker.reset = function resetWorker() {
        worker.postMessage({ reset: true });

        for (var id in resolves) {
          resolves[id]();
          delete resolves[id];
        }
      };
    }

    return function () {
      if (worker) {
        return worker;
      }

      if (!isWorker && canUseWorker) {
        var code = [
          'var CONFETTI, SIZE = {}, module = {};',
          '(' + main.toString() + ')(this, module, true, SIZE);',
          'onmessage = function(msg) {',
          '  if (msg.data.options) {',
          '    CONFETTI(msg.data.options).then(function () {',
          '      if (msg.data.callback) {',
          '        postMessage({ callback: msg.data.callback });',
          '      }',
          '    });',
          '  } else if (msg.data.reset) {',
          '    CONFETTI && CONFETTI.reset();',
          '  } else if (msg.data.resize) {',
          '    SIZE.width = msg.data.resize.width;',
          '    SIZE.height = msg.data.resize.height;',
          '  } else if (msg.data.canvas) {',
          '    SIZE.width = msg.data.canvas.width;',
          '    SIZE.height = msg.data.canvas.height;',
          '    CONFETTI = module.exports.create(msg.data.canvas);',
          '  }',
          '}',
        ].join('\n');
        try {
          worker = new Worker(URL.createObjectURL(new Blob([code])));
        } catch (e) {
          // eslint-disable-next-line no-console
          typeof console !== undefined && typeof console.warn === 'function' ? console.warn('🎊 Could not load worker', e) : null;

          return null;
        }

        decorate(worker);
      }

      return worker;
    };
  })();

  var defaults = {
    particleCount: 50,
    angle: 90,
    spread: 45,
    startVelocity: 45,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200,
    x: 0.5,
    y: 0.5,
    shapes: ['square', 'circle'],
    zIndex: 100,
    colors: [
      '#26ccff',
      '#a25afd',
      '#ff5e7e',
      '#88ff5a',
      '#fcff42',
      '#ffa62d',
      '#ff36ff'
    ],
    // probably should be true, but back-compat
    disableForReducedMotion: false,
    scalar: 1
  };

  function convert(val, transform) {
    return transform ? transform(val) : val;
  }

  function isOk(val) {
    return !(val === null || val === undefined);
  }

  function prop(options, name, transform) {
    return convert(
      options && isOk(options[name]) ? options[name] : defaults[name],
      transform
    );
  }

  function onlyPositiveInt(number){
    return number < 0 ? 0 : Math.floor(number);
  }

  function randomInt(min, max) {
    // [min, max)
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function toDecimal(str) {
    return parseInt(str, 16);
  }

  function colorsToRgb(colors) {
    return colors.map(hexToRgb);
  }

  function hexToRgb(str) {
    var val = String(str).replace(/[^0-9a-f]/gi, '');

    if (val.length < 6) {
        val = val[0]+val[0]+val[1]+val[1]+val[2]+val[2];
    }

    return {
      r: toDecimal(val.substring(0,2)),
      g: toDecimal(val.substring(2,4)),
      b: toDecimal(val.substring(4,6))
    };
  }

  function getOrigin(options) {
    var origin = prop(options, 'origin', Object);
    origin.x = prop(origin, 'x', Number);
    origin.y = prop(origin, 'y', Number);

    return origin;
  }

  function setCanvasWindowSize(canvas) {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
  }

  function setCanvasRectSize(canvas) {
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  function getCanvas(zIndex) {
    var canvas = document.createElement('canvas');

    canvas.style.position = 'fixed';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = zIndex;

    return canvas;
  }

  function ellipse(context, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.scale(radiusX, radiusY);
    context.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
    context.restore();
  }

  function randomPhysics(opts) {
    var radAngle = opts.angle * (Math.PI / 180);
    var radSpread = opts.spread * (Math.PI / 180);

    return {
      x: opts.x,
      y: opts.y,
      wobble: Math.random() * 10,
      wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
      velocity: (opts.startVelocity * 0.5) + (Math.random() * opts.startVelocity),
      angle2D: -radAngle + ((0.5 * radSpread) - (Math.random() * radSpread)),
      tiltAngle: (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
      color: opts.color,
      shape: opts.shape,
      tick: 0,
      totalTicks: opts.ticks,
      decay: opts.decay,
      drift: opts.drift,
      random: Math.random() + 2,
      tiltSin: 0,
      tiltCos: 0,
      wobbleX: 0,
      wobbleY: 0,
      gravity: opts.gravity * 3,
      ovalScalar: 0.6,
      scalar: opts.scalar,
      flat: opts.flat
    };
  }

  function updateFetti(context, fetti) {
    fetti.x += Math.cos(fetti.angle2D) * fetti.velocity + fetti.drift;
    fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
    fetti.velocity *= fetti.decay;

    if (fetti.flat) {
      fetti.wobble = 0;
      fetti.wobbleX = fetti.x + (10 * fetti.scalar);
      fetti.wobbleY = fetti.y + (10 * fetti.scalar);

      fetti.tiltSin = 0;
      fetti.tiltCos = 0;
      fetti.random = 1;
    } else {
      fetti.wobble += fetti.wobbleSpeed;
      fetti.wobbleX = fetti.x + ((10 * fetti.scalar) * Math.cos(fetti.wobble));
      fetti.wobbleY = fetti.y + ((10 * fetti.scalar) * Math.sin(fetti.wobble));

      fetti.tiltAngle += 0.1;
      fetti.tiltSin = Math.sin(fetti.tiltAngle);
      fetti.tiltCos = Math.cos(fetti.tiltAngle);
      fetti.random = Math.random() + 2;
    }

    var progress = (fetti.tick++) / fetti.totalTicks;

    var x1 = fetti.x + (fetti.random * fetti.tiltCos);
    var y1 = fetti.y + (fetti.random * fetti.tiltSin);
    var x2 = fetti.wobbleX + (fetti.random * fetti.tiltCos);
    var y2 = fetti.wobbleY + (fetti.random * fetti.tiltSin);

    context.fillStyle = 'rgba(' + fetti.color.r + ', ' + fetti.color.g + ', ' + fetti.color.b + ', ' + (1 - progress) + ')';

    context.beginPath();

    if (canUsePaths && fetti.shape.type === 'path' && typeof fetti.shape.path === 'string' && Array.isArray(fetti.shape.matrix)) {
      context.fill(transformPath2D(
        fetti.shape.path,
        fetti.shape.matrix,
        fetti.x,
        fetti.y,
        Math.abs(x2 - x1) * 0.1,
        Math.abs(y2 - y1) * 0.1,
        Math.PI / 10 * fetti.wobble
      ));
    } else if (fetti.shape.type === 'bitmap') {
      var rotation = Math.PI / 10 * fetti.wobble;
      var scaleX = Math.abs(x2 - x1) * 0.1;
      var scaleY = Math.abs(y2 - y1) * 0.1;
      var width = fetti.shape.bitmap.width * fetti.scalar;
      var height = fetti.shape.bitmap.height * fetti.scalar;

      var matrix = new DOMMatrix([
        Math.cos(rotation) * scaleX,
        Math.sin(rotation) * scaleX,
        -Math.sin(rotation) * scaleY,
        Math.cos(rotation) * scaleY,
        fetti.x,
        fetti.y
      ]);

      // apply the transform matrix from the confetti shape
      matrix.multiplySelf(new DOMMatrix(fetti.shape.matrix));

      var pattern = context.createPattern(bitmapMapper.transform(fetti.shape.bitmap), 'no-repeat');
      pattern.setTransform(matrix);

      context.globalAlpha = (1 - progress);
      context.fillStyle = pattern;
      context.fillRect(
        fetti.x - (width / 2),
        fetti.y - (height / 2),
        width,
        height
      );
      context.globalAlpha = 1;
    } else if (fetti.shape === 'circle') {
      context.ellipse ?
        context.ellipse(fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI) :
        ellipse(context, fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI);
    } else if (fetti.shape === 'star') {
      var rot = Math.PI / 2 * 3;
      var innerRadius = 4 * fetti.scalar;
      var outerRadius = 8 * fetti.scalar;
      var x = fetti.x;
      var y = fetti.y;
      var spikes = 5;
      var step = Math.PI / spikes;

      while (spikes--) {
        x = fetti.x + Math.cos(rot) * outerRadius;
        y = fetti.y + Math.sin(rot) * outerRadius;
        context.lineTo(x, y);
        rot += step;

        x = fetti.x + Math.cos(rot) * innerRadius;
        y = fetti.y + Math.sin(rot) * innerRadius;
        context.lineTo(x, y);
        rot += step;
      }
    } else {
      context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
      context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
      context.lineTo(Math.floor(x2), Math.floor(y2));
      context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
    }

    context.closePath();
    context.fill();

    return fetti.tick < fetti.totalTicks;
  }

  function animate(canvas, fettis, resizer, size, done) {
    var animatingFettis = fettis.slice();
    var context = canvas.getContext('2d');
    var animationFrame;
    var destroy;

    var prom = promise(function (resolve) {
      function onDone() {
        animationFrame = destroy = null;

        context.clearRect(0, 0, size.width, size.height);
        bitmapMapper.clear();

        done();
        resolve();
      }

      function update() {
        if (isWorker && !(size.width === workerSize.width && size.height === workerSize.height)) {
          size.width = canvas.width = workerSize.width;
          size.height = canvas.height = workerSize.height;
        }

        if (!size.width && !size.height) {
          resizer(canvas);
          size.width = canvas.width;
          size.height = canvas.height;
        }

        context.clearRect(0, 0, size.width, size.height);

        animatingFettis = animatingFettis.filter(function (fetti) {
          return updateFetti(context, fetti);
        });

        if (animatingFettis.length) {
          animationFrame = raf.frame(update);
        } else {
          onDone();
        }
      }

      animationFrame = raf.frame(update);
      destroy = onDone;
    });

    return {
      addFettis: function (fettis) {
        animatingFettis = animatingFettis.concat(fettis);

        return prom;
      },
      canvas: canvas,
      promise: prom,
      reset: function () {
        if (animationFrame) {
          raf.cancel(animationFrame);
        }

        if (destroy) {
          destroy();
        }
      }
    };
  }

  function confettiCannon(canvas, globalOpts) {
    var isLibCanvas = !canvas;
    var allowResize = !!prop(globalOpts || {}, 'resize');
    var hasResizeEventRegistered = false;
    var globalDisableForReducedMotion = prop(globalOpts, 'disableForReducedMotion', Boolean);
    var shouldUseWorker = canUseWorker && !!prop(globalOpts || {}, 'useWorker');
    var worker = shouldUseWorker ? getWorker() : null;
    var resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;
    var initialized = (canvas && worker) ? !!canvas.__confetti_initialized : false;
    var preferLessMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion)').matches;
    var animationObj;

    function fireLocal(options, size, done) {
      var particleCount = prop(options, 'particleCount', onlyPositiveInt);
      var angle = prop(options, 'angle', Number);
      var spread = prop(options, 'spread', Number);
      var startVelocity = prop(options, 'startVelocity', Number);
      var decay = prop(options, 'decay', Number);
      var gravity = prop(options, 'gravity', Number);
      var drift = prop(options, 'drift', Number);
      var colors = prop(options, 'colors', colorsToRgb);
      var ticks = prop(options, 'ticks', Number);
      var shapes = prop(options, 'shapes');
      var scalar = prop(options, 'scalar');
      var flat = !!prop(options, 'flat');
      var origin = getOrigin(options);

      var temp = particleCount;
      var fettis = [];

      var startX = canvas.width * origin.x;
      var startY = canvas.height * origin.y;

      while (temp--) {
        fettis.push(
          randomPhysics({
            x: startX,
            y: startY,
            angle: angle,
            spread: spread,
            startVelocity: startVelocity,
            color: colors[temp % colors.length],
            shape: shapes[randomInt(0, shapes.length)],
            ticks: ticks,
            decay: decay,
            gravity: gravity,
            drift: drift,
            scalar: scalar,
            flat: flat
          })
        );
      }

      // if we have a previous canvas already animating,
      // add to it
      if (animationObj) {
        return animationObj.addFettis(fettis);
      }

      animationObj = animate(canvas, fettis, resizer, size , done);

      return animationObj.promise;
    }

    function fire(options) {
      var disableForReducedMotion = globalDisableForReducedMotion || prop(options, 'disableForReducedMotion', Boolean);
      var zIndex = prop(options, 'zIndex', Number);

      if (disableForReducedMotion && preferLessMotion) {
        return promise(function (resolve) {
          resolve();
        });
      }

      if (isLibCanvas && animationObj) {
        // use existing canvas from in-progress animation
        canvas = animationObj.canvas;
      } else if (isLibCanvas && !canvas) {
        // create and initialize a new canvas
        canvas = getCanvas(zIndex);
        document.body.appendChild(canvas);
      }

      if (allowResize && !initialized) {
        // initialize the size of a user-supplied canvas
        resizer(canvas);
      }

      var size = {
        width: canvas.width,
        height: canvas.height
      };

      if (worker && !initialized) {
        worker.init(canvas);
      }

      initialized = true;

      if (worker) {
        canvas.__confetti_initialized = true;
      }

      function onResize() {
        if (worker) {
          // TODO this really shouldn't be immediate, because it is expensive
          var obj = {
            getBoundingClientRect: function () {
              if (!isLibCanvas) {
                return canvas.getBoundingClientRect();
              }
            }
          };

          resizer(obj);

          worker.postMessage({
            resize: {
              width: obj.width,
              height: obj.height
            }
          });
          return;
        }

        // don't actually query the size here, since this
        // can execute frequently and rapidly
        size.width = size.height = null;
      }

      function done() {
        animationObj = null;

        if (allowResize) {
          hasResizeEventRegistered = false;
          global.removeEventListener('resize', onResize);
        }

        if (isLibCanvas && canvas) {
          if (document.body.contains(canvas)) {
            document.body.removeChild(canvas); 
          }
          canvas = null;
          initialized = false;
        }
      }

      if (allowResize && !hasResizeEventRegistered) {
        hasResizeEventRegistered = true;
        global.addEventListener('resize', onResize, false);
      }

      if (worker) {
        return worker.fire(options, size, done);
      }

      return fireLocal(options, size, done);
    }

    fire.reset = function () {
      if (worker) {
        worker.reset();
      }

      if (animationObj) {
        animationObj.reset();
      }
    };

    return fire;
  }

  // Make default export lazy to defer worker creation until called.
  var defaultFire;
  function getDefaultFire() {
    if (!defaultFire) {
      defaultFire = confettiCannon(null, { useWorker: true, resize: true });
    }
    return defaultFire;
  }

  function transformPath2D(pathString, pathMatrix, x, y, scaleX, scaleY, rotation) {
    var path2d = new Path2D(pathString);

    var t1 = new Path2D();
    t1.addPath(path2d, new DOMMatrix(pathMatrix));

    var t2 = new Path2D();
    // see https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix/DOMMatrix
    t2.addPath(t1, new DOMMatrix([
      Math.cos(rotation) * scaleX,
      Math.sin(rotation) * scaleX,
      -Math.sin(rotation) * scaleY,
      Math.cos(rotation) * scaleY,
      x,
      y
    ]));

    return t2;
  }

  function shapeFromPath(pathData) {
    if (!canUsePaths) {
      throw new Error('path confetti are not supported in this browser');
    }

    var path, matrix;

    if (typeof pathData === 'string') {
      path = pathData;
    } else {
      path = pathData.path;
      matrix = pathData.matrix;
    }

    var path2d = new Path2D(path);
    var tempCanvas = document.createElement('canvas');
    var tempCtx = tempCanvas.getContext('2d');

    if (!matrix) {
      // attempt to figure out the width of the path, up to 1000x1000
      var maxSize = 1000;
      var minX = maxSize;
      var minY = maxSize;
      var maxX = 0;
      var maxY = 0;
      var width, height;

      // do some line skipping... this is faster than checking
      // every pixel and will be mostly still correct
      for (var x = 0; x < maxSize; x += 2) {
        for (var y = 0; y < maxSize; y += 2) {
          if (tempCtx.isPointInPath(path2d, x, y, 'nonzero')) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      width = maxX - minX;
      height = maxY - minY;

      var maxDesiredSize = 10;
      var scale = Math.min(maxDesiredSize/width, maxDesiredSize/height);

      matrix = [
        scale, 0, 0, scale,
        -Math.round((width/2) + minX) * scale,
        -Math.round((height/2) + minY) * scale
      ];
    }

    return {
      type: 'path',
      path: path,
      matrix: matrix
    };
  }

  function shapeFromText(textData) {
    var text,
        scalar = 1,
        color = '#000000',
        // see https://nolanlawson.com/2022/04/08/the-struggle-of-using-native-emoji-on-the-web/
        fontFamily = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", "system emoji", sans-serif';

    if (typeof textData === 'string') {
      text = textData;
    } else {
      text = textData.text;
      scalar = 'scalar' in textData ? textData.scalar : scalar;
      fontFamily = 'fontFamily' in textData ? textData.fontFamily : fontFamily;
      color = 'color' in textData ? textData.color : color;
    }

    // all other confetti are 10 pixels,
    // so this pixel size is the de-facto 100% scale confetti
    var fontSize = 10 * scalar;
    var font = '' + fontSize + 'px ' + fontFamily;

    var canvas = new OffscreenCanvas(fontSize, fontSize);
    var ctx = canvas.getContext('2d');

    ctx.font = font;
    var size = ctx.measureText(text);
    var width = Math.ceil(size.actualBoundingBoxRight + size.actualBoundingBoxLeft);
    var height = Math.ceil(size.actualBoundingBoxAscent + size.actualBoundingBoxDescent);

    var padding = 2;
    var x = size.actualBoundingBoxLeft + padding;
    var y = size.actualBoundingBoxAscent + padding;
    width += padding + padding;
    height += padding + padding;

    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext('2d');
    ctx.font = font;
    ctx.fillStyle = color;

    ctx.fillText(text, x, y);

    var scale = 1 / scalar;

    return {
      type: 'bitmap',
      // TODO these probably need to be transfered for workers
      bitmap: canvas.transferToImageBitmap(),
      matrix: [scale, 0, 0, scale, -width * scale / 2, -height * scale / 2]
    };
  }

  module.exports = function() {
    return getDefaultFire().apply(this, arguments);
  };
  module.exports.reset = function() {
    getDefaultFire().reset();
  };
  module.exports.create = confettiCannon;
  module.exports.shapeFromPath = shapeFromPath;
  module.exports.shapeFromText = shapeFromText;
}((function () {
  if (typeof window !== 'undefined') {
    return window;
  }

  if (typeof self !== 'undefined') {
    return self;
  }

  return this || {};
})(), module, false));

// end source content

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (module.exports);
var create = module.exports.create;


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
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/popup/popup.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=popup.js.map
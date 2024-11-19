
/*!
 * Polyteller 
 * Copyright (C) 2024 Zaid Azmi
 * All rights reserved
 * 
 * This source code is licensed under a proprietary license.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * 
 * Author: Zaid Azmi
 * Website: https://polyteller.com
 * Email : hi@polyteller.com
 * Version: 1.0.0
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/background/alarms.ts":
/*!**********************************!*\
  !*** ./src/background/alarms.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   checkAlarms: () => (/* binding */ checkAlarms),
/* harmony export */   checkMissedAlarms: () => (/* binding */ checkMissedAlarms),
/* harmony export */   cleanupNotifications: () => (/* binding */ cleanupNotifications),
/* harmony export */   getCurrentEvent: () => (/* binding */ getCurrentEvent),
/* harmony export */   getStoredNotifications: () => (/* binding */ getStoredNotifications),
/* harmony export */   handleAlarm: () => (/* binding */ handleAlarm),
/* harmony export */   isValidNotificationTime: () => (/* binding */ isValidNotificationTime),
/* harmony export */   removeTriggeredNotification: () => (/* binding */ removeTriggeredNotification),
/* harmony export */   scheduleNotification: () => (/* binding */ scheduleNotification),
/* harmony export */   storedNotifications: () => (/* binding */ storedNotifications),
/* harmony export */   syncStoredNotificationsWithAlarms: () => (/* binding */ syncStoredNotificationsWithAlarms),
/* harmony export */   triggerAlarmsManually: () => (/* binding */ triggerAlarmsManually),
/* harmony export */   updateStoredNotifications: () => (/* binding */ updateStoredNotifications)
/* harmony export */ });
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/logUtils */ "./src/utils/logUtils.ts");
/* harmony import */ var _utils_dateUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/dateUtils */ "./src/utils/dateUtils.ts");
/**
 * Alarm management for Polyteller.
 * This file contains functions for scheduling, handling, and managing alarms for event notifications.
 */


/** Stores the current notifications in memory. */
let storedNotifications = [];
/**
 * Updates the stored notifications array.
 * @param notifications - The new array of notifications to store
 */
async function updateStoredNotifications(notifications) {
    storedNotifications = notifications;
    await chrome.storage.local.set({ storedNotifications: notifications });
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Alarms', 'Updated stored notifications:', notifications);
    sendMessageToPopup({ type: 'NOTIFICATIONS_UPDATED', data: notifications });
}
/**
 * Schedules a notification for an event.
 * @param notificationData - The notification settings
 */
async function scheduleNotification(notificationData) {
    const currentEvent = await getCurrentEvent();
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Current event for scheduling:', currentEvent);
    if (!currentEvent) {
        throw new Error('No current event found for scheduling notification');
    }
    if (!isValidNotificationTime(currentEvent.endTime, notificationData.minutesBefore)) {
        throw new Error('Invalid notification time: The notification time has already passed');
    }
    const existingNotifications = await getStoredNotifications();
    // Update duplicate check to use 10 seconds threshold
    const isDuplicate = existingNotifications.some(notification => {
        if (notification.eventId !== notificationData.eventId)
            return false;
        // Calculate time difference in seconds
        const timeDiff = Math.abs(notification.minutesBefore * 60 - notificationData.minutesBefore * 60);
        if (timeDiff < 10) { // Less than 10 seconds apart
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Alarms', `Notification too close to existing one. Time difference: ${timeDiff} seconds`);
            return true;
        }
        return false;
    });
    if (isDuplicate) {
        throw new Error('New notifications must be at least 10 seconds apart.');
    }
    const notificationTime = currentEvent.endTime - notificationData.minutesBefore * 60 * 1000;
    const alarmName = `notification_${notificationData.eventId}_${notificationData.minutesBefore}_${Date.now()}`;
    const notification = {
        id: alarmName,
        ...notificationData,
        scheduledTime: notificationTime,
        triggered: false
    };
    await chrome.alarms.create(alarmName, { when: notificationTime });
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)(`Notification scheduled for ${new Date(notificationTime)}, alarm name: ${alarmName}`);
    storedNotifications.push(notification);
    await updateStoredNotifications(storedNotifications);
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)(`Total scheduled notifications: ${storedNotifications.length}`);
}
/**
 * Handles a triggered alarm.
 * @param alarm - The triggered alarm
 */
async function handleAlarm(alarm) {
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Alarm triggered:', alarm);
    const notification = storedNotifications.find(n => n.id === alarm.name);
    if (notification) {
        // Create and show the notification with updated text
        await chrome.notifications.create(notification.id, {
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Event Reminder',
            message: `${notification.eventTitle} ends in ${(0,_utils_dateUtils__WEBPACK_IMPORTED_MODULE_1__.formatRemainingTime)(notification.minutesBefore * 60 * 1000)}`,
        });
        // Set the triggered property to true
        notification.triggered = true;
        // Update the stored notifications
        await updateStoredNotifications(storedNotifications);
        // Remove the triggered notification from storage
        await removeTriggeredNotification(notification.id);
    }
}
/**
 * Removes a triggered notification from storage and the stored notifications array.
 * @param alarmName - The name of the alarm to remove
 */
async function removeTriggeredNotification(alarmName) {
    // First, get the current stored notifications
    const currentNotifications = await getStoredNotifications();
    // Remove from storage
    await chrome.storage.local.remove(alarmName);
    // Update storedNotifications with current state before filtering
    storedNotifications = currentNotifications.filter(n => n.id !== alarmName);
    // Remove the alarm
    await chrome.alarms.clear(alarmName);
    await updateStoredNotifications(storedNotifications);
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)(`Triggered notification removed: ${alarmName}`);
}
/**
 * Manually triggers alarms that should have been triggered but weren't.
 */
function triggerAlarmsManually() {
    const now = Date.now();
    storedNotifications.forEach(notification => {
        if (!notification.triggered && notification.scheduledTime <= now) {
            chrome.alarms.get(notification.id, (alarm) => {
                if (alarm) {
                    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)("Manually triggering alarm:", alarm);
                    handleAlarm(alarm);
                }
                else {
                    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)("Alarm not found for manual trigger:", notification.id);
                    removeTriggeredNotification(notification.id);
                }
            });
        }
    });
}
/**
 * Logs all current alarms.
 */
function checkAlarms() {
    chrome.alarms.getAll((alarms) => {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)("Current alarms:", alarms);
    });
}
/**
 * Checks for and handles any alarms that were missed during browser downtime.
 */
async function checkMissedAlarms() {
    const now = Date.now();
    const alarms = await chrome.alarms.getAll();
    for (const alarm of alarms) {
        if (alarm.scheduledTime <= now) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Background', `Missed alarm detected: ${alarm.name}`);
            await handleAlarm(alarm);
            await chrome.alarms.clear(alarm.name);
        }
    }
}
/**
 * Retrieves the current event from storage.
 * @returns The current PolymarketEvent or null if not found
 */
async function getCurrentEvent() {
    // Get the current tab ID
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTabId = tabs[0]?.id;
    if (!currentTabId) {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Alarms', 'No active tab found');
        return null;
    }
    // Use the correct key to get the current event
    const result = await chrome.storage.local.get(`currentEvent_${currentTabId}`);
    return result[`currentEvent_${currentTabId}`] || null;
}
/**
 * Cleans up expired notifications.
 */
async function cleanupNotifications() {
    const now = Date.now();
    const expiredNotifications = storedNotifications.filter(n => n.scheduledTime <= now);
    for (const notification of expiredNotifications) {
        await chrome.alarms.clear(notification.id);
        await chrome.storage.local.remove(notification.id);
    }
    storedNotifications = storedNotifications.filter(n => n.scheduledTime > now);
    await updateStoredNotifications(storedNotifications);
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Background', `Notifications cleanup: ${expiredNotifications.length} removed, ${storedNotifications.length} remaining`);
}
/**
 * Syncs stored notifications with actual alarms.
 */
async function syncStoredNotificationsWithAlarms() {
    const alarms = await chrome.alarms.getAll();
    const alarmIds = new Set(alarms.map(a => a.name));
    storedNotifications = storedNotifications.filter(n => alarmIds.has(n.id));
    await updateStoredNotifications(storedNotifications);
}
/**
 * Sends a message to the popup with improved error handling.
 * @param message - The message to send
 */
function sendMessageToPopup(message) {
    chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
            // Check if the error is due to a closed message port
            if (chrome.runtime.lastError.message === "The message port closed before a response was received.") {
                // This is an expected scenario when the popup is not open
                (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Background', 'Popup is not open to receive message:', message);
            }
            else {
                // Log other unexpected errors
                (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Background', 'Error sending message to popup:', chrome.runtime.lastError.message);
            }
        }
        else {
            // Message sent successfully
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('Background', 'Message sent to popup successfully:', message);
        }
    });
}
async function getStoredNotifications() {
    const result = await chrome.storage.local.get('storedNotifications');
    return result.storedNotifications || [];
}
function isValidNotificationTime(eventEndTime, minutesBefore) {
    const notificationTime = eventEndTime - minutesBefore * 60 * 1000;
    return notificationTime > Date.now();
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
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**************************************!*\
  !*** ./src/background/background.ts ***!
  \**************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _alarms__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./alarms */ "./src/background/alarms.ts");
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/logUtils */ "./src/utils/logUtils.ts");
/* harmony import */ var _store_store__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../store/store */ "./src/store/store.ts");
/**
 * Main background script for Polyteller.
 * This file serves as the entry point for the background processes, initializing listeners and periodic tasks.
 * It imports and uses various modules for handling messages, notifications, and alarms.
 */



(() => {
    "use strict";
    // Extension installation listener
    chrome.runtime.onInstalled.addListener(() => {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Background', "Extension installed");
    });
    // Browser startup listener
    chrome.runtime.onStartup.addListener(() => {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Background', "Browser started");
        (0,_alarms__WEBPACK_IMPORTED_MODULE_0__.checkMissedAlarms)();
    });
    // Setup message listeners
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Background', 'Background received message:', request);
        try {
            switch (request.type) {
                case 'EVENT_INFO':
                    handleEventInfo(request, sender);
                    break;
                case 'GET_EVENT_INFO':
                    handleGetEventInfo(request, sendResponse);
                    return true;
                case 'REMOVE_NOTIFICATION_ALARM':
                    handleRemoveNotificationAlarm(request, sendResponse);
                    return true;
                case 'SCHEDULE_NOTIFICATION':
                    handleScheduleNotification(request, sendResponse);
                    return true;
                case 'GET_STORED_NOTIFICATIONS':
                    handleGetStoredNotifications(sendResponse);
                    return true;
                case 'UPDATE_TRADE_CONFIRMATION':
                    handleUpdateTradeConfirmation(request, sendResponse);
                    return true;
                case 'CLEAR_CURRENT_EVENT':
                    if (sender.tab?.id) {
                        cleanupTabEventData(sender.tab.id);
                        // Notify popup to update its display
                        chrome.runtime.sendMessage({
                            type: 'EVENT_CLEARED',
                            data: { tabId: sender.tab.id }
                        });
                    }
                    break;
                default:
                    throw new Error(`Unknown message type: ${request.type}`);
            }
        }
        catch (error) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Background', 'Error processing message:', error);
            sendResponse({ error: error instanceof Error ? error.message : String(error) });
        }
    });
    // Alarm listener
    chrome.alarms.onAlarm.addListener((alarm) => {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Alarm triggered in background:', alarm);
        (0,_alarms__WEBPACK_IMPORTED_MODULE_0__.handleAlarm)(alarm);
    });
    // Periodic tasks
    setInterval(_alarms__WEBPACK_IMPORTED_MODULE_0__.cleanupNotifications, 60000); // Cleanup notifications every minute
    setInterval(_alarms__WEBPACK_IMPORTED_MODULE_0__.checkAlarms, 60000); // Check alarms every minute
    setInterval(_alarms__WEBPACK_IMPORTED_MODULE_0__.triggerAlarmsManually, 10000); // Manually trigger alarms every 10 seconds
    setInterval(_alarms__WEBPACK_IMPORTED_MODULE_0__.syncStoredNotificationsWithAlarms, 60000); // Sync stored notifications with alarms every minute
    // Add this function
    async function syncStoreWithBackgroundNotifications() {
        const storeNotifications = _store_store__WEBPACK_IMPORTED_MODULE_2__.useStore.getState().notifications;
        const backgroundNotifications = await (0,_alarms__WEBPACK_IMPORTED_MODULE_0__.getStoredNotifications)();
        if (JSON.stringify(storeNotifications) !== JSON.stringify(backgroundNotifications)) {
            _store_store__WEBPACK_IMPORTED_MODULE_2__.useStore.getState().setNotifications(backgroundNotifications);
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Background', 'Synced store notifications with background');
        }
    }
    // Add this to your periodic tasks
    setInterval(syncStoreWithBackgroundNotifications, 5000); // Sync every 5 seconds
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Background', "Background script initialized with new notification handling");
})();
// Add this function at the end of the file
function notifyAllTabs(message) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, message);
            }
        });
    });
}
function handleEventInfo(request, sender) {
    if (sender.tab?.id) {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Background', `Storing event info for tab ${sender.tab.id}:`, request.data);
        chrome.storage.local.set({ [`currentEvent_${sender.tab.id}`]: request.data });
        _store_store__WEBPACK_IMPORTED_MODULE_2__.useStore.getState().addEvent(request.data);
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Background', 'Updated events in store:', _store_store__WEBPACK_IMPORTED_MODULE_2__.useStore.getState().events);
    }
}
function handleGetEventInfo(request, sendResponse) {
    chrome.storage.local.get(`currentEvent_${request.tabId}`, (result) => {
        sendResponse(result[`currentEvent_${request.tabId}`] || null);
    });
}
async function handleRemoveNotificationAlarm(request, sendResponse) {
    try {
        const { eventId, minutesBefore } = request.data;
        const notifications = await (0,_alarms__WEBPACK_IMPORTED_MODULE_0__.getStoredNotifications)();
        const notificationToRemove = notifications.find(n => n.eventId === eventId && Math.abs(n.minutesBefore - minutesBefore) < 0.1);
        if (notificationToRemove) {
            await (0,_alarms__WEBPACK_IMPORTED_MODULE_0__.removeTriggeredNotification)(notificationToRemove.id);
            sendResponse({ success: true });
        }
        else {
            sendResponse({ success: false, error: 'Notification not found' });
        }
    }
    catch (error) {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Background', 'Error removing alarm:', error);
        sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
}
function handleScheduleNotification(request, sendResponse) {
    (0,_alarms__WEBPACK_IMPORTED_MODULE_0__.scheduleNotification)(request.data)
        .then(() => {
        sendResponse({ success: true });
    })
        .catch((error) => {
        console.error("Error scheduling notification:", error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            isDuplicate: error instanceof Error && error.message.includes('already exists')
        });
    });
}
function handleGetStoredNotifications(sendResponse) {
    (0,_alarms__WEBPACK_IMPORTED_MODULE_0__.getStoredNotifications)().then(notifications => {
        sendResponse({ notifications });
    });
}
function handleUpdateTradeConfirmation(request, sendResponse) {
    const { enabled } = request.data;
    chrome.storage.local.set({ enableTradeConfirmation: enabled }, () => {
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Background', `Trade confirmation ${enabled ? 'enabled' : 'disabled'}`);
        sendResponse({ success: true });
        // Notify all tabs about the change
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, { action: 'updateTradeConfirmation', enabled });
                }
            });
        });
    });
}
// Add this to your existing background.ts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'broadcastPrivacyMode') {
        // Broadcast to all Polymarket tabs
        chrome.tabs.query({ url: "https://*.polymarket.com/*" }, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id && sender.tab?.id !== tab.id) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'updatePrivacyMode',
                        enabled: message.enabled
                    }).catch(error => {
                        console.log('Error sending message to tab:', error);
                    });
                }
            });
        });
        sendResponse({ success: true });
    }
    return true;
});
// Add this function
function handleClearCurrentEvent(tabId) {
    if (tabId) {
        chrome.storage.local.remove(`currentEvent_${tabId}`);
        // Notify popup to clear its display
        chrome.runtime.sendMessage({
            type: 'EVENT_CLEARED',
            data: { tabId }
        });
    }
}
// Add these functions to background.ts
// Handle tab-specific event data cleanup
async function cleanupTabEventData(tabId) {
    await chrome.storage.local.remove(`currentEvent_${tabId}`);
    (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_1__.log)('Background', `Cleaned up event data for tab ${tabId}`);
}
// Add tab removal listener
chrome.tabs.onRemoved.addListener((tabId) => {
    cleanupTabEventData(tabId);
});

})();

/******/ })()
;
//# sourceMappingURL=background.js.map
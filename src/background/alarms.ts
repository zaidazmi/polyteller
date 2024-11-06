/**
 * Alarm management for Polyteller.
 * This file contains functions for scheduling, handling, and managing alarms for event notifications.
 */

import { NotificationSetting, Notification, PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';
import { getTimezoneAbbreviation, getLocalTimezone } from '../utils/timezoneUtils';
import { formatRemainingTime, formatDate, formatFullNotificationTime } from '../utils/dateUtils';

/** Stores the current notifications in memory. */
export let storedNotifications: Notification[] = [];

/**
 * Updates the stored notifications array.
 * @param notifications - The new array of notifications to store
 */
export async function updateStoredNotifications(notifications: Notification[]) {
  storedNotifications = notifications;
  await chrome.storage.local.set({ storedNotifications: notifications });
  log('Alarms', 'Updated stored notifications:', notifications);
  sendMessageToPopup({ type: 'NOTIFICATIONS_UPDATED', data: notifications });
}

/**
 * Schedules a notification for an event.
 * @param notificationData - The notification settings
 */
export async function scheduleNotification(notificationData: NotificationSetting): Promise<void> {
  const currentEvent = await getCurrentEvent();
  log('Current event for scheduling:', currentEvent);

  if (!currentEvent) {
    throw new Error('No current event found for scheduling notification');
  }

  if (!isValidNotificationTime(currentEvent.endTime, notificationData.minutesBefore)) {
    throw new Error('Invalid notification time: The notification time has already passed');
  }

  const existingNotifications = await getStoredNotifications();
  const isDuplicate = existingNotifications.some(notification => 
    notification.eventId === notificationData.eventId && 
    Math.abs(notification.minutesBefore - notificationData.minutesBefore) < 0.1
  );

  if (isDuplicate) {
    throw new Error('A notification for this event and time already exists');
  }

  const notificationTime = currentEvent.endTime - notificationData.minutesBefore * 60 * 1000;
  const alarmName = `notification_${notificationData.eventId}_${notificationData.minutesBefore}_${Date.now()}`;

  const notification: Notification = {
    id: alarmName,
    ...notificationData,
    scheduledTime: notificationTime,
    triggered: false // Add this line
  };

  await chrome.alarms.create(alarmName, { when: notificationTime });
  log(`Notification scheduled for ${new Date(notificationTime)}, alarm name: ${alarmName}`);

  storedNotifications.push(notification);
  await updateStoredNotifications(storedNotifications);

  log(`Total scheduled notifications: ${storedNotifications.length}`);
}

/**
 * Handles a triggered alarm.
 * @param alarm - The triggered alarm
 */
export async function handleAlarm(alarm: chrome.alarms.Alarm) {
  log('Alarm triggered:', alarm);
  const notification = storedNotifications.find(n => n.id === alarm.name);

  if (notification) {
    // Create and show the notification with updated text
    await chrome.notifications.create(notification.id, {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Event Reminder',
      message: `${notification.eventTitle} ends in ${formatRemainingTime(notification.minutesBefore * 60 * 1000)}`,
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
export async function removeTriggeredNotification(alarmName: string) {
  // Remove from storage
  await chrome.storage.local.remove(alarmName);

  // Remove from storedNotifications array
  storedNotifications = storedNotifications.filter(n => n.id !== alarmName);

  // Remove the alarm
  await chrome.alarms.clear(alarmName);

  await updateStoredNotifications(storedNotifications);

  log(`Triggered notification removed: ${alarmName}`);
}

/**
 * Manually triggers alarms that should have been triggered but weren't.
 */
export function triggerAlarmsManually() {
  const now = Date.now();
  storedNotifications.forEach(notification => {
    if (!notification.triggered && notification.scheduledTime <= now) {
      chrome.alarms.get(notification.id, (alarm) => {
        if (alarm) {
          log("Manually triggering alarm:", alarm);
          handleAlarm(alarm);
        } else {
          log("Alarm not found for manual trigger:", notification.id);
          removeTriggeredNotification(notification.id);
        }
      });
    }
  });
}

/**
 * Logs all current alarms.
 */
export function checkAlarms() {
  chrome.alarms.getAll((alarms) => {
    log("Current alarms:", alarms);
  });
}

/**
 * Checks for and handles any alarms that were missed during browser downtime.
 */
export async function checkMissedAlarms() {
  const now = Date.now();
  const alarms = await chrome.alarms.getAll();
  
  for (const alarm of alarms) {
    if (alarm.scheduledTime <= now) {
      log('Background', `Missed alarm detected: ${alarm.name}`);
      await handleAlarm(alarm);
      await chrome.alarms.clear(alarm.name);
    }
  }
}

/**
 * Retrieves the current event from storage.
 * @returns The current PolymarketEvent or null if not found
 */
export async function getCurrentEvent(): Promise<PolymarketEvent | null> {
  // Get the current tab ID
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTabId = tabs[0]?.id;

  if (!currentTabId) {
    log('Alarms', 'No active tab found');
    return null;
  }

  // Use the correct key to get the current event
  const result = await chrome.storage.local.get(`currentEvent_${currentTabId}`);
  return result[`currentEvent_${currentTabId}`] || null;
}

/**
 * Cleans up expired notifications.
 */
export async function cleanupNotifications() {
  const now = Date.now();
  const expiredNotifications = storedNotifications.filter(n => n.scheduledTime <= now);
  
  for (const notification of expiredNotifications) {
    await chrome.alarms.clear(notification.id);
    await chrome.storage.local.remove(notification.id);
  }

  storedNotifications = storedNotifications.filter(n => n.scheduledTime > now);
  await updateStoredNotifications(storedNotifications);

  log('Background', `Notifications cleanup: ${expiredNotifications.length} removed, ${storedNotifications.length} remaining`);
}

/**
 * Syncs stored notifications with actual alarms.
 */
export async function syncStoredNotificationsWithAlarms() {
  const alarms = await chrome.alarms.getAll();
  const alarmIds = new Set(alarms.map(a => a.name));
  
  storedNotifications = storedNotifications.filter(n => alarmIds.has(n.id));
  await updateStoredNotifications(storedNotifications);
}

/**
 * Sends a message to the popup with improved error handling.
 * @param message - The message to send
 */
function sendMessageToPopup(message: any) {
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      // Check if the error is due to a closed message port
      if (chrome.runtime.lastError.message === "The message port closed before a response was received.") {
        // This is an expected scenario when the popup is not open
        log('Background', 'Popup is not open to receive message:', message);
      } else {
        // Log other unexpected errors
        log('Background', 'Error sending message to popup:', chrome.runtime.lastError.message);
      }
    } else {
      // Message sent successfully
      log('Background', 'Message sent to popup successfully:', message);
    }
  });
}

export async function getStoredNotifications(): Promise<Notification[]> {
  const result = await chrome.storage.local.get('storedNotifications');
  return result.storedNotifications || [];
}

export function isValidNotificationTime(eventEndTime: number, minutesBefore: number): boolean {
  const notificationTime = eventEndTime - minutesBefore * 60 * 1000;
  return notificationTime > Date.now();
}
  

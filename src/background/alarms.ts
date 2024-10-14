/**
 * Alarm management for Polyteller.
 * This file contains functions for scheduling, handling, and managing alarms for event notifications.
 */

import { NotificationSetting, Notification, PolymarketEvent } from '../types';
import { getCurrentEvent as getStoredCurrentEvent } from './storage';
import { log } from '../utils/logUtils';
import { getTimezoneAbbreviation } from '../utils/timezoneUtils';
import { formatRemainingTime } from '../utils/dateUtils';

export let storedNotifications: Notification[] = [];

/**
 * Updates the stored notifications array.
 * @param notifications - The new array of notifications
 */
export function updateStoredNotifications(notifications: Notification[]) {
  storedNotifications = notifications;
}

/**
 * Schedules a notification for an event.
 * @param notificationData - The notification settings
 */
export async function scheduleNotification(notificationData: NotificationSetting): Promise<void> {
  const currentEvent = await getStoredCurrentEvent();
  log('Current event for scheduling:', currentEvent);

  if (!currentEvent) {
    throw new Error('No current event found for scheduling notification');
  }

  const notificationTime = currentEvent.endTime - notificationData.minutesBefore * 60 * 1000;
  const alarmName = `notification_${notificationData.eventId}_${notificationData.minutesBefore}`;

  await chrome.alarms.create(alarmName, {
    when: notificationTime,
  });

  log(`Alarm created for ${new Date(notificationTime)}, alarm name: ${alarmName}`);

  const storedNotification: Notification = {
    id: alarmName,
    eventId: notificationData.eventId,
    minutesBefore: notificationData.minutesBefore,
    scheduledTime: notificationTime,
    triggered: false
  };

  await chrome.storage.local.set({ [alarmName]: storedNotification });
  storedNotifications.push(storedNotification);

  log(`Notification scheduled for ${new Date(notificationTime)}, alarm name: ${alarmName}`);
  log(`Total scheduled notifications: ${storedNotifications.length}`);
}

/**
 * Handles a triggered alarm.
 * @param alarm - The triggered alarm
 */
export async function handleAlarm(alarm: chrome.alarms.Alarm) {
  log('Alarm triggered:', alarm);
  const [_, eventId, minutesBeforeStr] = alarm.name.split('_');
  const minutesBefore = parseFloat(minutesBeforeStr);

  if (eventId && !isNaN(minutesBefore)) {
    const currentEvent = await getStoredCurrentEvent();
    if (currentEvent && currentEvent.id === eventId) {
      const now = Date.now();
      const timeLeft = currentEvent.endTime - now;
      const formattedTimeLeft = formatRemainingTime(timeLeft);

      const endDate = new Date(currentEvent.endTime);
      const localTimezoneAbbr = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const formattedLocalEndDate = endDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: localTimezoneAbbr
      });

      // Create and show the notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Event Reminder',
        message: `${currentEvent.title} is ending in ${formattedTimeLeft} at ${formattedLocalEndDate} ${localTimezoneAbbr}`
      }, (notificationId) => {
        log('Notification created with ID:', notificationId);
      });

      // Remove the triggered notification
      await removeTriggeredNotification(alarm.name);

      // Send a message to the popup to update its notification list
      chrome.runtime.sendMessage({
        type: 'NOTIFICATION_TRIGGERED',
        data: { eventId, minutesBefore }
      });
    }
  } else {
    log("Non-notification alarm triggered:", alarm.name);
  }
}

/**
 * Removes a triggered notification from storage and the stored notifications array.
 * @param alarmName - The name of the alarm to remove
 */
async function removeTriggeredNotification(alarmName: string) {
  // Remove from storage
  await chrome.storage.local.remove(alarmName);

  // Remove from storedNotifications array
  storedNotifications = storedNotifications.filter(n => n.id !== alarmName);

  // Remove the alarm
  await chrome.alarms.clear(alarmName);

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
 * Storage utilities for the background processes.
 * This file contains functions for interacting with the extension's storage.
 */

/**
 * Retrieves the current event from storage.
 * @returns The current PolymarketEvent or null if not found
 */
export async function getCurrentEvent(): Promise<PolymarketEvent | null> {
  const result = await chrome.storage.local.get("currentEvent");
  return result.currentEvent || null;
}

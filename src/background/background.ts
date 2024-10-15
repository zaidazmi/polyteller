/**
 * Main background script for Polyteller.
 * This file serves as the entry point for the background processes, initializing listeners and periodic tasks.
 * It imports and uses various modules for handling messages, notifications, and alarms.
 */

import { setupMessageListeners } from './messaging';
import { cleanupNotifications } from './notifications';
import { checkAlarms, triggerAlarmsManually, handleAlarm, checkMissedAlarms, scheduleNotification } from './alarms';
import { log } from '../utils/logUtils';
import { NotificationSetting, Notification } from '../types';
import { useStore } from '../store/store';

let storedNotifications: Notification[] = [];

async function loadStoredNotifications() {
  const result = await chrome.storage.local.get('storedNotifications');
  if (result.storedNotifications) {
    storedNotifications = result.storedNotifications;
    log('Background', 'Loaded stored notifications:', storedNotifications);
  }
}

(() => {
  "use strict";

  // Extension installation listener
  chrome.runtime.onInstalled.addListener(() => {
    log('Background', "Extension installed");
  });

  // Browser startup listener
  chrome.runtime.onStartup.addListener(() => {
    log('Background', "Browser started");
    checkMissedAlarms();
  });

  // Setup message listeners
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    log('Background', 'Background received message:', request);

    switch (request.type) {
      case 'EVENT_INFO':
        if (sender.tab?.id) {
          log('Background', `Storing event info for tab ${sender.tab.id}:`, request.data);
          chrome.storage.local.set({ [`currentEvent_${sender.tab.id}`]: request.data });
          // Update the store with the new event
          useStore.getState().addEvent(request.data);
        }
        break;
      case 'GET_EVENT_INFO':
        chrome.storage.local.get(`currentEvent_${request.tabId}`, (result) => {
          sendResponse(result[`currentEvent_${request.tabId}`] || null);
        });
        return true; // Keep the message channel open for the async response
      case 'REMOVE_NOTIFICATION_ALARM':
        const notificationToRemove = request.data as NotificationSetting;
        log('Background', `Attempting to remove alarm for notification:`, notificationToRemove);
        const alarmName = `notification_${notificationToRemove.eventId}_${notificationToRemove.minutesBefore}`;
        chrome.alarms.clear(alarmName, async (wasCleared) => {
          if (wasCleared) {
            log('Background', `Alarm ${alarmName} removed successfully`);
            // Remove the notification from storedNotifications
            const updatedNotifications = storedNotifications.filter(n => n.id !== alarmName);
            // Update the storedNotifications in the alarms module
            updateStoredNotifications(updatedNotifications);
            // Remove from storage
            await chrome.storage.local.remove(alarmName);
            sendResponse({ success: true });
          } else {
            // The alarm doesn't exist, which means it was likely already triggered
            log('Background', `Alarm ${alarmName} not found, likely already triggered`);
            sendResponse({ alreadyTriggered: true });
          }
        });
        return true; // Keeps the message channel open for the async response
      case 'SCHEDULE_NOTIFICATION':
        scheduleNotification(request.data)
          .then(() => {
            storedNotifications.push(request.data);
            updateStoredNotifications(storedNotifications);
            sendResponse({ success: true });
          })
          .catch((error: Error) => {
            console.error("Error scheduling notification:", error);
            sendResponse({ success: false });
          });
        return true; // Keeps the message channel open for the async response
      case 'GET_STORED_NOTIFICATIONS':
        sendResponse({ notifications: storedNotifications });
        return true;
      default:
        log('Background', 'Unknown message type:', request.type);
        sendResponse({ error: 'Unknown message type' });
    }
  });

  // Alarm listener
  chrome.alarms.onAlarm.addListener(handleAlarm);

  // Periodic tasks
  setInterval(cleanupNotifications, 60000); // Cleanup notifications every minute
  setInterval(checkAlarms, 60000); // Check alarms every minute
  setInterval(triggerAlarmsManually, 10000); // Manually trigger alarms every 10 seconds

  log('Background', "Background script initialized with new notification handling");

  loadStoredNotifications();
})();

async function updateStoredNotifications(notifications: Notification[]) {
  storedNotifications = notifications;
  await chrome.storage.local.set({ storedNotifications: notifications });
  log('Background', 'Updated stored notifications:', notifications);
  
  // Notify the popup to update its notifications
  chrome.runtime.sendMessage({ type: 'NOTIFICATIONS_UPDATED', data: notifications });
}

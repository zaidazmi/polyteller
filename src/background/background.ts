import { setupMessageListeners } from './messaging';
import { cleanupNotifications } from './notifications';
import { checkAlarms, triggerAlarmsManually, handleAlarm, checkMissedAlarms, scheduleNotification, storedNotifications, updateStoredNotifications } from './alarms';
import { log } from '../utils/logUtils';
import { NotificationSetting, Notification } from '../types';

(() => {
  "use strict";

  chrome.runtime.onInstalled.addListener(() => {
    log('Background', "Extension installed");
  });

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
          chrome.storage.local.set({ currentEvent: request.data });
        }
        break;
      case 'GET_EVENT_INFO':
        chrome.storage.local.get('currentEvent', (result) => {
          sendResponse(result.currentEvent || null);
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
          .then(() => sendResponse({ success: true }))
          .catch((error: Error) => {
            console.error("Error scheduling notification:", error);
            sendResponse({ success: false });
          });
        return true; // Keeps the message channel open for the async response
      default:
        log('Background', 'Unknown message type:', request.type);
        sendResponse({ error: 'Unknown message type' });
    }
  });

  chrome.alarms.onAlarm.addListener(handleAlarm);

  // Run cleanup periodically
  setInterval(cleanupNotifications, 60000); // Every minute

  // Call this function periodically or after scheduling notifications
  setInterval(checkAlarms, 60000); // Check alarms every minute

  // Call this function periodically to ensure alarms are triggered
  setInterval(triggerAlarmsManually, 10000); // Check every 10 seconds

  log('Background', "Background script initialized with new notification handling");
})();

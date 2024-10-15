/**
 * Main background script for Polyteller.
 * This file serves as the entry point for the background processes, initializing listeners and periodic tasks.
 * It imports and uses various modules for handling messages, notifications, and alarms.
 */

import { setupMessageListeners } from './messaging';
import { cleanupNotifications, checkAlarms, triggerAlarmsManually, handleAlarm, checkMissedAlarms, scheduleNotification, syncStoredNotificationsWithAlarms } from './alarms';
import { log } from '../utils/logUtils';
import { NotificationSetting, Notification } from '../types';
import { useStore } from '../store/store';

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
          log('Background', 'Updated events in store:', useStore.getState().events);
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
        const alarmName = `notification_${notificationToRemove.eventId}_${Math.round(notificationToRemove.minutesBefore)}`;
        chrome.alarms.clear(alarmName, async (wasCleared) => {
          if (wasCleared) {
            log('Background', `Alarm ${alarmName} removed successfully`);
            // Remove the notification from storedNotifications
            const updatedNotifications = useStore.getState().notifications.filter(n => n.eventId !== notificationToRemove.eventId || n.minutesBefore !== notificationToRemove.minutesBefore);
            useStore.getState().setNotifications(updatedNotifications);
            // Remove from storage
            await chrome.storage.local.remove(alarmName);
            notifyAllTabs({ type: 'NOTIFICATIONS_UPDATED' }); // Add this line
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
            useStore.getState().addNotification(request.data);
            log('Background', 'Updated notifications in store:', useStore.getState().notifications);
            sendResponse({ success: true });
          })
          .catch((error: Error) => {
            console.error("Error scheduling notification:", error);
            sendResponse({ success: false });
          });
        return true; // Keeps the message channel open for the async response
      case 'GET_STORED_NOTIFICATIONS':
        const notifications = useStore.getState().notifications;
        log('Background', 'Sending stored notifications:', notifications);
        sendResponse({ notifications: notifications });
        break;
      default:
        log('Background', 'Unknown message type:', request.type);
        sendResponse({ error: 'Unknown message type' });
    }
  });

  // Alarm listener
  chrome.alarms.onAlarm.addListener((alarm) => {
    log('Alarm triggered in background:', alarm);
    handleAlarm(alarm);
  });

  // Periodic tasks
  setInterval(cleanupNotifications, 60000); // Cleanup notifications every minute
  setInterval(checkAlarms, 60000); // Check alarms every minute
  setInterval(triggerAlarmsManually, 10000); // Manually trigger alarms every 10 seconds
  setInterval(syncStoredNotificationsWithAlarms, 60000); // Sync stored notifications with alarms every minute

  log('Background', "Background script initialized with new notification handling");
})();

// Add this function at the end of the file
function notifyAllTabs(message: any) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id!, message);
    });
  });
}

/**
 * Main background script for Polyteller.
 * This file serves as the entry point for the background processes, initializing listeners and periodic tasks.
 * It imports and uses various modules for handling messages, notifications, and alarms.
 */

import { setupMessageListeners } from './messaging';
import { cleanupNotifications, checkAlarms, triggerAlarmsManually, handleAlarm, checkMissedAlarms, scheduleNotification, syncStoredNotificationsWithAlarms, removeTriggeredNotification, getStoredNotifications } from './alarms';
import { log } from '../utils/logUtils';
import { NotificationSetting, Notification, PolymarketEvent } from '../types';
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
  chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    log('Background', 'Background received message:', request);

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
    } catch (error: unknown) {
      log('Background', 'Error processing message:', error);
      sendResponse({ error: error instanceof Error ? error.message : String(error) });
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

  // Add this function
  async function syncStoreWithBackgroundNotifications() {
    const storeNotifications = useStore.getState().notifications;
    const backgroundNotifications = await getStoredNotifications();
    if (JSON.stringify(storeNotifications) !== JSON.stringify(backgroundNotifications)) {
      useStore.getState().setNotifications(backgroundNotifications);
      log('Background', 'Synced store notifications with background');
    }
  }

  // Add this to your periodic tasks
  setInterval(syncStoreWithBackgroundNotifications, 5000); // Sync every 5 seconds

  log('Background', "Background script initialized with new notification handling");
})();

// Add this function at the end of the file
function notifyAllTabs(message: any) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  });
}

function handleEventInfo(request: any, sender: chrome.runtime.MessageSender) {
  if (sender.tab?.id) {
    log('Background', `Storing event info for tab ${sender.tab.id}:`, request.data);
    chrome.storage.local.set({ [`currentEvent_${sender.tab.id}`]: request.data });
    useStore.getState().addEvent(request.data);
    log('Background', 'Updated events in store:', useStore.getState().events);
  }
}

function handleGetEventInfo(request: any, sendResponse: (response?: any) => void) {
  chrome.storage.local.get(`currentEvent_${request.tabId}`, (result) => {
    sendResponse(result[`currentEvent_${request.tabId}`] || null);
  });
}

async function handleRemoveNotificationAlarm(request: any, sendResponse: (response?: any) => void) {
  try {
    const { eventId, minutesBefore } = request.data;
    const notifications = await getStoredNotifications();
    const notificationToRemove = notifications.find(n => 
      n.eventId === eventId && Math.abs(n.minutesBefore - minutesBefore) < 0.1
    );
    if (notificationToRemove) {
      await removeTriggeredNotification(notificationToRemove.id);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Notification not found' });
    }
  } catch (error: unknown) {
    log('Background', 'Error removing alarm:', error);
    sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
}

function handleScheduleNotification(request: any, sendResponse: (response?: any) => void) {
  scheduleNotification(request.data)
    .then(() => {
      sendResponse({ success: true });
    })
    .catch((error: unknown) => {
      console.error("Error scheduling notification:", error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        isDuplicate: error instanceof Error && error.message.includes('already exists')
      });
    });
}

function handleGetStoredNotifications(sendResponse: (response?: any) => void) {
  getStoredNotifications().then(notifications => {
    sendResponse({ notifications });
  });
}

function handleUpdateTradeConfirmation(request: any, sendResponse: (response?: any) => void) {
  const { enabled } = request.data;
  chrome.storage.local.set({ enableTradeConfirmation: enabled }, () => {
    log('Background', `Trade confirmation ${enabled ? 'enabled' : 'disabled'}`);
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
function handleClearCurrentEvent(tabId: number | undefined) {
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
async function cleanupTabEventData(tabId: number) {
  await chrome.storage.local.remove(`currentEvent_${tabId}`);
  log('Background', `Cleaned up event data for tab ${tabId}`);
}

// Add tab removal listener
chrome.tabs.onRemoved.addListener((tabId: number) => {
  cleanupTabEventData(tabId);
});

// Add to message handling
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'EVENT_INFO' && sender.tab?.id) {
    // Check if this is a post-refresh update
    const result = await chrome.storage.local.get('refreshInProgress');
    if (result.refreshInProgress && 
        result.refreshInProgress.tabId === sender.tab.id &&
        Date.now() - result.refreshInProgress.timestamp < 5000) { // Within 5 seconds
      
      // Clear the refresh flag
      await chrome.storage.local.remove('refreshInProgress');
      
      // Broadcast to all extension contexts
      chrome.runtime.sendMessage({
        type: 'EVENT_INITIALIZED',
        data: request.data
      });
    }
    
    // Continue with normal event info handling...
  }
});



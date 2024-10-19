/**
 * Message handling for the background processes.
 * This file contains functions for setting up message listeners and handling various message types.
 */

import { EventInfo } from './types';
import { log } from '../utils/logUtils';
import { scheduleNotification } from './alarms';

let eventInfoMap = new Map<number, EventInfo>();

/**
 * Sets up message listeners for the background script.
 */
export function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    log('Background', "Background received message:", request);

    if (request.type === "EVENT_INFO" && sender.tab?.id) {
      log('Background', "Storing event info for tab", sender.tab.id, ":", request.data);
      eventInfoMap.set(sender.tab.id, request.data);
      chrome.storage.local.set({ currentEvent: request.data });
      log('Background', "Updated eventInfoMap:", Array.from(eventInfoMap.entries()));
    } else if (request.type === "GET_EVENT_INFO") {
      const eventInfo = eventInfoMap.get(request.tabId);
      log('Background', "Retrieving eventInfo for tab", request.tabId, ":", eventInfo);
      sendResponse(eventInfo || null);
    } else if (request.type === "SCHEDULE_NOTIFICATION") {
      scheduleNotification(request.data)
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          console.error("Error scheduling notification:", error);
          sendResponse({ success: false });
        });
      return true;
    } else if (request.type === "UPDATE_TRADE_CONFIRMATION") {
      handleUpdateTradeConfirmation(request.data, sendResponse);
      return true;
    }
    return true;
  });

  chrome.tabs.onRemoved.addListener((tabId: number) => {
    eventInfoMap.delete(tabId);
    log('Background', "Removed event info for tab", tabId);
  });
}

function handleUpdateTradeConfirmation(data: { enabled: boolean }, sendResponse: (response: any) => void) {
  chrome.storage.local.set({ enableTradeConfirmation: data.enabled }, () => {
    log('Background', `Trade confirmation ${data.enabled ? 'enabled' : 'disabled'}`);
    sendResponse({ success: true });
    // Notify all tabs about the change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'updateTradeConfirmation', enabled: data.enabled });
        }
      });
    });
  });
}

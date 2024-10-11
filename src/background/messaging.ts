import { EventInfo } from './types';
import { log } from './utils';
import { scheduleNotification } from './alarms';

let eventInfoMap = new Map<number, EventInfo>();

export function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    log("Background received message:", request);

    if (request.type === "EVENT_INFO" && sender.tab?.id) {
      log("Storing event info for tab", sender.tab.id, ":", request.data);
      eventInfoMap.set(sender.tab.id, request.data);
      chrome.storage.local.set({ currentEvent: request.data });
      log("Updated eventInfoMap:", Array.from(eventInfoMap.entries()));
    } else if (request.type === "GET_EVENT_INFO") {
      const eventInfo = eventInfoMap.get(request.tabId);
      log("Retrieving eventInfo for tab", request.tabId, ":", eventInfo);
      sendResponse(eventInfo || null);
    } else if (request.type === "SCHEDULE_NOTIFICATION") {
      scheduleNotification(request.data)
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          console.error("Error scheduling notification:", error);
          sendResponse({ success: false });
        });
      return true;
    }
    return true;
  });

  chrome.tabs.onRemoved.addListener((tabId: number) => {
    eventInfoMap.delete(tabId);
    log("Removed event info for tab", tabId);
  });
}
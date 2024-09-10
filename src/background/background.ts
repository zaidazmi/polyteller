import { PolymarketEvent } from '../types';

// Add this at the top of the file
const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) console.log('[Polyteller Background]', ...args);
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

interface EventInfoMessage {
  type: 'EVENT_INFO';
  data: PolymarketEvent;
  tabId: number;
}

interface GetEventInfoMessage {
  type: 'GET_EVENT_INFO';
  tabId: number;
}

type Message = EventInfoMessage | GetEventInfoMessage;

let eventInfoMap: Map<number, PolymarketEvent> = new Map();

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  log('Background received message:', message);
  if (message.type === 'EVENT_INFO' && sender.tab?.id) {
    log('Storing event info for tab', sender.tab.id, ':', message.data);
    eventInfoMap.set(sender.tab.id, message.data);
    log('Updated eventInfoMap:', Array.from(eventInfoMap.entries()));
  } else if (message.type === 'GET_EVENT_INFO') {
    const eventInfo = eventInfoMap.get(message.tabId);
    log('Retrieving eventInfo for tab', message.tabId, ':', eventInfo);
    sendResponse(eventInfo || null);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  eventInfoMap.delete(tabId);
  log('Removed event info for tab', tabId);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  log('Alarm triggered:', alarm);
  const eventId = alarm.name;
  // Implement your notification logic here
});

log('Background script initialized');

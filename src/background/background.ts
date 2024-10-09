import { PolymarketEvent, NotificationSetting } from '../types';
import { getEvent, saveEvent } from '../utils/storageUtils';

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

interface ScheduleNotificationMessage {
  type: 'SCHEDULE_NOTIFICATION';
  data: NotificationSetting;
}

type Message = EventInfoMessage | GetEventInfoMessage | ScheduleNotificationMessage;

let eventInfoMap: Map<number, PolymarketEvent> = new Map();

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  log('Background received message:', message);
  if (message.type === 'EVENT_INFO' && sender.tab?.id) {
    log('Storing event info for tab', sender.tab.id, ':', message.data);
    eventInfoMap.set(sender.tab.id, message.data);
    saveEvent(message.data); // Save the event to storage
    log('Updated eventInfoMap:', Array.from(eventInfoMap.entries()));
  } else if (message.type === 'GET_EVENT_INFO') {
    const eventInfo = eventInfoMap.get(message.tabId);
    log('Retrieving eventInfo for tab', message.tabId, ':', eventInfo);
    sendResponse(eventInfo || null);
  } else if (message.type === 'SCHEDULE_NOTIFICATION') {
    scheduleNotification(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('Error scheduling notification:', error);
        sendResponse({ success: false });
      });
    return true; // Indicates that the response is sent asynchronously
  }
  // Important: Return true to indicate that the response will be sent asynchronously
  return true;
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

async function scheduleNotification(notificationSetting: NotificationSetting) {
  const event = await getEvent();
  if (!event) {
    throw new Error('No event found');
  }

  const notificationTime = event.endTime - (notificationSetting.minutesBefore * 60 * 1000);
  const alarmName = `notification_${event.id}`;

  // Clear any existing alarm for this event
  await chrome.alarms.clear(alarmName);

  // Create a new alarm
  chrome.alarms.create(alarmName, { when: notificationTime });

  console.log(`Notification scheduled for ${new Date(notificationTime)}`);
}

// Add an alarm listener to show the notification when the alarm fires
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('notification_')) {
    const eventId = alarm.name.split('_')[1];
    const event = await getEvent();
    
    if (event && event.id === eventId) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Polymarket Event Reminder',
        message: `The event "${event.title}" is ending soon!`,
        priority: 2
      });
    }
  }
});

log('Background script initialized');

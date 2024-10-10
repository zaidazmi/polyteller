(() => {
  "use strict";

  interface Notification {
    id: string;
    eventId: string;
    scheduledTime: number;
    triggered: boolean;
  }

  interface EventInfo {
    id: string;
    title: string;
    endTime: number;
  }

  let storedNotifications: Notification[] = [];

  async function getCurrentEvent(): Promise<EventInfo | null> {
    const result = await chrome.storage.local.get("currentEvent");
    return result.currentEvent || null;
  }

  function log(...args: any[]): void {
    console.log("[Polyteller Background]", ...args);
  }

  chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");
  });

  let eventInfoMap = new Map<number, EventInfo>();

  async function scheduleNotification(data: { minutesBefore: number }): Promise<void> {
    const currentEvent = await getCurrentEvent();
    log("Current event for scheduling:", currentEvent);
    if (!currentEvent) throw new Error("No event found");

    const notificationTime = currentEvent.endTime - data.minutesBefore * 60 * 1000;
    const alarmName = `notification_${currentEvent.id}_${Date.now()}`;

    await chrome.alarms.create(alarmName, { when: notificationTime });

    storedNotifications.push({
      id: alarmName,
      eventId: currentEvent.id,
      scheduledTime: notificationTime,
      triggered: false
    });

    log(`Notification scheduled for ${new Date(notificationTime)}, alarm name: ${alarmName}`);
    log(`Total scheduled notifications: ${storedNotifications.length}`);
  }

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

  async function handleAlarm(alarm: chrome.alarms.Alarm) {
    log("Alarm triggered:", alarm);
    if (alarm.name.startsWith("notification_")) {
      const [_, eventId, timestamp] = alarm.name.split("_");
      log(`Parsed alarm: eventId=${eventId}, timestamp=${timestamp}`);
      const currentEvent = await getCurrentEvent();
      log("Current event:", currentEvent);
      if (currentEvent && currentEvent.id === eventId) {
        log("Creating notification for event:", currentEvent.title);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Polymarket Event Reminder",
          message: `The event "${currentEvent.title}" is ending soon!`,
          priority: 2
        }, (notificationId) => {
          log("Notification created with ID:", notificationId);
        });
      } else {
        log("Event mismatch or not found. Current event ID:", currentEvent?.id);
      }
      // Mark the notification as triggered
      const index = storedNotifications.findIndex(n => n.id === alarm.name);
      if (index !== -1) {
        storedNotifications[index].triggered = true;
        log(`Notification triggered and marked: ${alarm.name}`);
      } else {
        log("Notification not found in storedNotifications:", alarm.name);
      }
    } else {
      log("Non-notification alarm triggered:", alarm.name);
    }
  }

  chrome.alarms.onAlarm.addListener(handleAlarm);

  function cleanupNotifications(): void {
    const now = Date.now();
    const beforeCleanup = storedNotifications.length;
    storedNotifications = storedNotifications.filter(n => !n.triggered && n.scheduledTime > now);
    log(`Notifications cleanup: ${beforeCleanup} -> ${storedNotifications.length}`);
  }

  // Run cleanup periodically
  setInterval(cleanupNotifications, 60000); // Every minute

  function checkAlarms() {
    chrome.alarms.getAll((alarms) => {
      log("Current alarms:", alarms);
    });
  }

  // Call this function periodically or after scheduling notifications
  setInterval(checkAlarms, 60000); // Check alarms every minute

  log("Background script initialized with new notification handling");

  function triggerAlarmsManually() {
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

  // Call this function periodically to ensure alarms are triggered
  setInterval(triggerAlarmsManually, 10000); // Check every 10 seconds
})();
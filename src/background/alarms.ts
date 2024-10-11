import { Notification, EventInfo } from './types';
import { getCurrentEvent } from './storage';
import { log } from './utils';

let storedNotifications: Notification[] = [];

function formatRemainingTime(milliseconds: number): string {
    
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
  const hours = Math.floor(milliseconds / (1000 * 60 * 60)) % 24;
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days} Day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} Hr${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} Min`);
  if (seconds > 0) parts.push(`${seconds} Sec`);

  // If all parts are zero (shouldn't happen, but just in case)
  if (parts.length === 0) return "0 Sec";

  return parts.join(", ");
}

export async function scheduleNotification(data: { minutesBefore: number }): Promise<void> {
  const currentEvent = await getCurrentEvent();
  log("Current event for scheduling:", currentEvent);
  if (!currentEvent) throw new Error("No event found");

  const now = Date.now();
  const notificationTime = currentEvent.endTime - data.minutesBefore * 60 * 1000;
  const alarmName = `notification_${currentEvent.id}_${Date.now()}`;

  if (notificationTime <= now) {
    log("Notification time is in the past, triggering immediately");
    handleAlarm({ name: alarmName, scheduledTime: now });
  } else {
    await chrome.alarms.create(alarmName, { when: notificationTime });
    log(`Alarm created for ${new Date(notificationTime)}, alarm name: ${alarmName}`);
  }

  storedNotifications.push({
    id: alarmName,
    eventId: currentEvent.id,
    scheduledTime: notificationTime,
    triggered: false
  });

  log(`Notification scheduled for ${new Date(notificationTime)}, alarm name: ${alarmName}`);
  log(`Total scheduled notifications: ${storedNotifications.length}`);
}

export async function handleAlarm(alarm: chrome.alarms.Alarm) {
  log("Alarm triggered:", alarm);
  if (alarm.name.startsWith("notification_")) {
    const [_, eventId, timestamp] = alarm.name.split("_");
    log(`Parsed alarm: eventId=${eventId}, timestamp=${timestamp}`);
    const currentEvent = await getCurrentEvent();
    log("Current event:", currentEvent);
    if (currentEvent && currentEvent.id === eventId) {
      const now = Date.now();
      const alarmTime = parseInt(timestamp);
      if (alarmTime > now) {
        log(`Alarm time is in the future, rescheduling for ${new Date(alarmTime)}`);
        chrome.alarms.create(alarm.name, { when: alarmTime });
        return;
      }
      const remainingTime = currentEvent.endTime - now;
      const formattedRemainingTime = formatRemainingTime(remainingTime);
      log("Creating notification for event:", currentEvent.title);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Polymarket Event Reminder",
        message: `"${currentEvent.title}" is ending in\n${formattedRemainingTime}`,
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

export function checkAlarms() {
  chrome.alarms.getAll((alarms) => {
    log("Current alarms:", alarms);
  });
}
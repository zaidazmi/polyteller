import { setupMessageListeners } from './messaging';
import { cleanupNotifications } from './notifications';
import { checkAlarms, triggerAlarmsManually, handleAlarm } from './alarms';
import { log } from '../utils/logUtils';

(() => {
  "use strict";

  chrome.runtime.onInstalled.addListener(() => {
    log('Background', "Extension installed");
  });

  setupMessageListeners();

  chrome.alarms.onAlarm.addListener(handleAlarm);

  // Run cleanup periodically
  setInterval(cleanupNotifications, 60000); // Every minute

  // Call this function periodically or after scheduling notifications
  setInterval(checkAlarms, 60000); // Check alarms every minute

  // Call this function periodically to ensure alarms are triggered
  setInterval(triggerAlarmsManually, 10000); // Check every 10 seconds

  log('Background', "Background script initialized with new notification handling");
})();
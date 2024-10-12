/**
 * Notification management for the background processes.
 * This file contains functions for managing and cleaning up stored notifications.
 */

import { log } from '../utils/logUtils';
import { Notification } from './types';

let storedNotifications: Notification[] = [];

/**
 * Cleans up expired or triggered notifications from the stored notifications array.
 */
export function cleanupNotifications(): void {
  const now = Date.now();
  const beforeCleanup = storedNotifications.length;
  storedNotifications = storedNotifications.filter(n => !n.triggered && n.scheduledTime > now);
  log('Background', `Notifications cleanup: ${beforeCleanup} -> ${storedNotifications.length}`);
}

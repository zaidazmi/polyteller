import { log } from './utils';
import { Notification } from './types';

let storedNotifications: Notification[] = [];

export function cleanupNotifications(): void {
  const now = Date.now();
  const beforeCleanup = storedNotifications.length;
  storedNotifications = storedNotifications.filter(n => !n.triggered && n.scheduledTime > now);
  log(`Notifications cleanup: ${beforeCleanup} -> ${storedNotifications.length}`);
}
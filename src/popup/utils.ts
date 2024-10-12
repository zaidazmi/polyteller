/**
 * Utility functions for the Polyteller popup.
 * This file contains helper functions used across different components of the popup.
 */

/**
 * Formats a Date object into a human-readable string.
 * @param date - The Date object to format
 * @returns A formatted string representation of the date
 */
export function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a duration in minutes into a human-readable string.
 * @param minutesBefore - The number of minutes before an event
 * @returns A formatted string representation of the duration
 */
export function formatFullNotificationTime(minutesBefore: number): string {
  const days = Math.floor(minutesBefore / 1440);
  const hours = Math.floor((minutesBefore % 1440) / 60);
  const minutes = Math.floor(minutesBefore % 60);
  const seconds = Math.floor((minutesBefore % 1) * 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') + ' before';
}

/**
 * Checks if a given timestamp is valid.
 * @param timestamp - The timestamp to validate
 * @returns True if the timestamp is valid, false otherwise
 */
export function isValidTimestamp(timestamp: number): boolean {
  return !isNaN(timestamp) && isFinite(timestamp) && timestamp > 0;
}

/**
 * Displays a status message to the user for a short duration.
 * @param message - The message to display
 */
export function displayStatus(message: string) {
  const statusElement = document.getElementById('notification-status');
  if (statusElement) {
    statusElement.textContent = message;
    setTimeout(() => {
      statusElement.textContent = '';
    }, 3000);
  }
}

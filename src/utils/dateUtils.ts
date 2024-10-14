/**
 * Date utility functions for Polyteller.
 * This file contains various functions for formatting and calculating date and time information.
 */

/**
 * Formats the remaining time as a string.
 * @param endTime - The end time in milliseconds since epoch
 * @returns A formatted string representing the remaining time
 */
export function getTimeRemaining(endTime: number): string {
    const { days, hours, minutes, seconds } = calculateTimeRemaining(endTime);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Formats a date object into a localized string.
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
 * Checks if a given timestamp is valid.
 * @param timestamp - The timestamp to validate
 * @returns True if the timestamp is valid, false otherwise
 */
export function isValidTimestamp(timestamp: number): boolean {
  return !isNaN(timestamp) && isFinite(timestamp) && timestamp > 0;
}

/**
 * Formats a duration in minutes into a human-readable string.
 * @param minutesBefore - The duration in minutes
 * @returns A formatted string representing the duration
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
 * Formats a duration in milliseconds into a human-readable string.
 * @param milliseconds - The duration in milliseconds
 * @returns A formatted string representing the duration
 */
export function formatRemainingTime(milliseconds: number): string {
  const { days, hours, minutes, seconds } = calculateTimeRemaining(Date.now() + milliseconds);

  const parts = [];
  if (days > 0) parts.push(`${days} Day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} Hr${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} Min`);
  if (seconds > 0) parts.push(`${seconds} Sec`);

  // If all parts are zero (shouldn't happen, but just in case)
  if (parts.length === 0) return "0 Sec";

  return parts.join(", ");
}

/**
 * Calculates the time remaining until a given end time.
 * @param endTime - The end time in milliseconds since epoch
 * @returns An object containing days, hours, minutes, and seconds remaining
 */
export function calculateTimeRemaining(endTime: number): { days: number; hours: number; minutes: number; seconds: number } {
  const total = endTime - Date.now();
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000)
  };
}

/**
 * Formats a countdown for display in HTML.
 * @param timeLeft - The time left in milliseconds
 * @returns An HTML string representing the formatted countdown
 */
export function formatCountdown(timeLeft: number): string {
  const { days, hours, minutes, seconds } = calculateTimeRemaining(Date.now() + timeLeft);
  return `
    <div class="countdown-value">
      <span class="countdown-number">${days}</span>
      <span class="countdown-label">days</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${hours}</span>
      <span class="countdown-label">hours</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${minutes}</span>
      <span class="countdown-label">mins</span>
    </div>
    <div class="countdown-value">
      <span class="countdown-number">${seconds}</span>
      <span class="countdown-label">secs</span>
    </div>
  `;
}

/**
 * Formats a date for a specific timezone.
 * @param date - The Date object to format
 * @param timeZone - The timezone to use for formatting
 * @returns A formatted string representation of the date in the specified timezone
 */
export function formatLocalEndDate(date: Date, timeZone: string): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timeZone
  });
}

/**
 * Date utility functions for Polyteller.
 * This file contains various functions for formatting and calculating date and time information.
 */

import { isDST } from './timezoneUtils';

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
    hour12: true,
    timeZone: 'UTC' // Add this line to ensure consistent timezone
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

/**
 * Parses a custom date string into a Date object.
 * @param dateString - The date string to parse
 * @param timezone - The timezone to use for parsing
 * @returns A Date object parsed from the date string
 */
export function parseCustomDate(dateString: string, timezone: string): Date {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
    
  // Handle ISO format with timezone offset first
  if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:00$/)) {
    // If it's ET timezone and has EST offset (-05:00), check for DST
    if (timezone === 'ET' && dateString.endsWith('-05:00')) {
      const tempDate = new Date(dateString);
      if (isDST(tempDate)) {
        const [datePart] = dateString.split('-05:00');
        return new Date(`${datePart}-04:00`);
      }
    }
    // If it's PT timezone and has PST offset (-08:00), check for DST
    if (timezone === 'PT' && dateString.endsWith('-08:00')) {
      const tempDate = new Date(dateString);
      if (isDST(tempDate)) {
        const [datePart] = dateString.split('-08:00');
        return new Date(`${datePart}-07:00`);
      }
    }
    return new Date(dateString);
  }
    
  // Try 12-hour format first (e.g., "December 17, 2024, 12:00 PM")
  let parts = dateString.match(/(\w+) (\d{1,2}),? (\d{4}),? (\d{1,2}):(\d{2})(?::(\d{2}))? ([AP]M)/);
  
  if (parts) {
    const [, month, day, year, hour, minute, second = '00', ampm] = parts;
    let parsedHour = parseInt(hour);
    if (ampm === 'PM' && parsedHour !== 12) parsedHour += 12;
    if (ampm === 'AM' && parsedHour === 12) parsedHour = 0;
    
    // Handle ET timezone
    if (timezone === 'ET') {
      // Always create with EST offset first
      const date = new Date(`${year}-${(months.indexOf(month) + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${parsedHour.toString().padStart(2, '0')}:${minute}:${second}-05:00`);
      
      // Check if date is during DST
      if (isDST(date)) {
        // Create new date with EDT offset
        return new Date(`${year}-${(months.indexOf(month) + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${parsedHour.toString().padStart(2, '0')}:${minute}:${second}-04:00`);
      }
      return date;
    }
    
    // Handle PT timezone
    if (timezone === 'PT') {
      // Always create with PST offset first
      const date = new Date(`${year}-${(months.indexOf(month) + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${parsedHour.toString().padStart(2, '0')}:${minute}:${second}-08:00`);
      
      // Check if date is during DST
      if (isDST(date)) {
        // Create new date with PDT offset
        return new Date(`${year}-${(months.indexOf(month) + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${parsedHour.toString().padStart(2, '0')}:${minute}:${second}-07:00`);
      }
      return date;
    }
    
    return new Date(Date.UTC(
      parseInt(year),
      months.indexOf(month),
      parseInt(day),
      parsedHour,
      parseInt(minute),
      parseInt(second)
    ));
  }
  
  // If only date is provided (no time) - default to end of day
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/) || dateString.match(/^[A-Za-z]+ \d{1,2},? \d{4}$/)) {
    let date;
    if (timezone === 'ET') {
      // For ET timezone, create at 23:59:59 ET
      date = new Date(`${dateString}T23:59:59-05:00`);
      if (isDST(date)) {
        return new Date(`${dateString}T23:59:59-04:00`);
      }
      return date;
    } else if (timezone === 'PT') {
      // For PT timezone, create at 23:59:59 PT
      const [monthStr, dayStr, yearStr] = dateString.split(/[, ]+/);
      const month = months.indexOf(monthStr) + 1;
      const day = parseInt(dayStr);
      const year = parseInt(yearStr);
      
      // Create date string in ISO format
      const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      date = new Date(`${isoDate}T23:59:59-08:00`);
      if (isDST(date)) {
        return new Date(`${isoDate}T23:59:59-07:00`);
      }
      return date;
    } else {
      // For UTC/other timezones, create at 23:59:59 UTC
      date = new Date(`${dateString}T23:59:59Z`);
    }
    return date;
  }
  
  // Handle ISO format with Z (UTC)
  if (dateString.endsWith('Z')) {
    // Handle ET timezone
    if (timezone === 'ET') {
      const utcDate = new Date(dateString);
      const year = utcDate.getUTCFullYear();
      const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = utcDate.getUTCDate().toString().padStart(2, '0');
      
      const date = new Date(`${year}-${month}-${day}T23:59:59-05:00`);
      if (isDST(date)) {
        return new Date(`${year}-${month}-${day}T23:59:59-04:00`);
      }
      return date;
    }
    // Handle PT timezone
    if (timezone === 'PT') {
      const utcDate = new Date(dateString);
      const year = utcDate.getUTCFullYear();
      const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = utcDate.getUTCDate().toString().padStart(2, '0');
      
      const date = new Date(`${year}-${month}-${day}T23:59:59-08:00`);
      if (isDST(date)) {
        return new Date(`${year}-${month}-${day}T23:59:59-07:00`);
      }
      return date;
    }
    return new Date(dateString);
  }
  
  // Fallback to built-in date parsing
  return new Date(dateString);
}

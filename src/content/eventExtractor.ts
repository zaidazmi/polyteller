/**
 * Event extractor for Polyteller.
 * This file contains functions for extracting event information from the Polymarket page.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';
import { isDST } from '../utils/timezoneUtils';

// Define interfaces for our patterns
interface DatePattern {
  name: string;
  pattern: RegExp;
  priority: number;
  format: string;
  handler: (match: RegExpMatchArray) => { endDateValue: string; timezone: string } | null;
}

// Define our organized patterns
const DATE_PATTERNS: DatePattern[] = [
  {
    name: 'MAIN_EVENT_END_FORMAT',
    pattern: /(?:ends?|closes?|resolves?) (?:on |by )?December 31,? 2024(?:,? | at )?11:59(?::00)? PM ET/i,
    priority: 120,
    format: "December 31, 2024, 11:59 PM ET",
    handler: (match: RegExpMatchArray) => {
      return {
        endDateValue: "December 31, 2024, 11:59:00 PM",
        timezone: "ET"
      };
    }
  },
  {
    name: 'TIME_BEFORE_DATE_FORMAT',
    // New pattern to match "11:59 PM ET on November 5, 2024"
    pattern: /(\d{1,2}):(\d{2}) ([AP]M) ET on ([A-Za-z]+ \d{1,2}, \d{4})/i,
    priority: 115, // High priority but below MAIN_EVENT_END_FORMAT
    format: "HH:mm AM/PM ET on Month DD, YYYY",
    handler: (match: RegExpMatchArray) => {
      const [, hour, minute, ampm, datePart] = match;
      return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: 'ET'
      };
    }
  },
  {
    name: 'YEAR_END_FORMAT',
    pattern: /(?:ends?|closes?|resolves?|by).*?(?:December|Dec)\.?\s*31,?\s*2024,?\s*(?:at\s*)?11:59(?::00)?\s*PM\s*ET/i,
    priority: 110,
    format: "December 31, 2024, 11:59 PM ET",
    handler: (match: RegExpMatchArray) => {
      return {
        endDateValue: "December 31, 2024, 11:59:00 PM",
        timezone: "ET"
      };
    }
  },
  {
    name: 'BITCOIN_NOON_FORMAT',
    pattern: /(\d{1,2}) Nov '(\d{2}) (\d{1,2}):(\d{2}) in the ([A-Z]{2}) timezone/i,
    priority: 100,
    format: "DD Nov 'YY HH:mm in TZ timezone",
    handler: (match: RegExpMatchArray) => {
      const [, day, year, hour, minute, tz] = match;
      return {
        endDateValue: `November ${day}, 20${year}, ${hour}:${minute}:00`,
        timezone: tz
      };
    }
  },
  {
    name: 'EXACT_TIME_WITH_SECONDS',
    pattern: /by.*?(\w+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 95,
    format: "Month DD, YYYY, HH:mm:ss AM/PM TZ",
    handler: (match: RegExpMatchArray) => {
      const [, datePart, hour, minute, second, ampm, tz] = match;
      return {
        endDateValue: `${datePart}, ${hour}:${minute}:${second} ${ampm}`,
        timezone: tz || 'ET'
      };
    }
  },
  {
    name: 'ELECTION_TIME_FORMAT',
    pattern: /\b(November|December|January|February|March|April|May|June|July|August|September|October) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}):(\d{2}) ([AP]M) ([A-Z]{2,3})\b/i,
    priority: 90,
    format: "Month DD, YYYY, HH:mm:ss AM/PM TZ",
    handler: (match: RegExpMatchArray) => {
      const [, month, day, year, hour, minute, second, ampm, tz] = match;
      return {
        endDateValue: `${month} ${day}, ${year}, ${hour}:${minute}:${second} ${ampm}`,
        timezone: tz
      };
    }
  },
  {
    name: 'DATE_RANGE_FORMAT',
    // Updated pattern to capture time components
    pattern: /between\s+[^]*?and\s+([A-Za-z]+\s+\d{1,2},\s*\d{4})(?:,?\s*(\d{1,2}):(\d{2})(?:\s*([AP]M))?\s*([A-Z]{2}))?/i,
    priority: 95,
    format: "between Start and End DateTime",
    handler: (match: RegExpMatchArray) => {
      const [, datePart, hour, minute, ampm, tz] = match;
      
      log('Content', 'Date range components:', { 
        datePart,
        hour,
        minute,
        ampm,
        tz
      });
      
      // If time is specified, use it
      if (hour && minute) {
        return {
          endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm || 'PM'}`,
          timezone: tz || 'ET'
        };
      }
      
      // Only default to end of day if no specific time is given
      return {
        endDateValue: `${datePart}, 11:59:59 PM`,
        timezone: 'ET'
      };
    }
  },
  {
    name: 'RESOLUTION_DATE_TIME',
    pattern: /(?:resolves?|ends?) on ([A-Za-z]+ \d{1,2}, \d{4}),? (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 80,
    format: "resolves/ends on Month DD, YYYY, HH:mm AM/PM TZ",
    handler: (match: RegExpMatchArray) => {
      const [, datePart, hour, minute, ampm, tz] = match;
      return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: tz || 'ET'
      };
    }
  },
  {
    name: 'STANDALONE_DATE_TIME',
    pattern: /([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 75,
    format: "Month DD, YYYY, HH:mm AM/PM TZ",
    handler: (match: RegExpMatchArray) => {
      const [, datePart, hour, minute, ampm, tz] = match;
      return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: tz || 'ET'
      };
    }
  },
  {
    name: 'DATE_ONLY_FORMAT',
    pattern: /([A-Za-z]+ \d{1,2}, \d{4})/i,
    priority: 70,
    format: "Month DD, YYYY",
    handler: (match: RegExpMatchArray) => {
      const [, datePart] = match;
      return {
        endDateValue: `${datePart}, 11:59:59 PM`,
        timezone: 'ET'
      };
    }
  },
  {
    name: 'UNTIL_TIME_FORMAT',
    pattern: /(?<!\([^)]*?)(?:and|until|by) ([A-Za-z]+ \d{1,2},? \d{4}),? (\d{1,2}:\d{2}) ?([AP]M) ([A-Z]{2,3})/i,
    priority: 88,
    format: "until Month DD, YYYY, HH:mm AM/PM TZ",
    handler: (match: RegExpMatchArray) => {
      const [, datePart, time, ampm, tz] = match;
      const [hour, minute] = time.split(':');
      return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: tz || 'ET'
      };
    }
  },
  {
    name: 'INAUGURATION_DATE',
    pattern: /inauguration date.*?\(([A-Za-z]+ \d{1,2},? \d{4})\)/i,
    priority: 65,
    format: "inauguration date (Month DD, YYYY)",
    handler: (match: RegExpMatchArray) => {
      const [, datePart] = match;
      return {
        endDateValue: `${datePart}, 11:59:59 PM`,
        timezone: 'ET'
      };
    }
  }
].sort((a, b) => b.priority - a.priority);

/**
 * Extracts event information from the Polymarket page.
 * @returns The extracted event information, or null if extraction fails
 */
export function extractEventInfo(): PolymarketEvent | null {
  // Keep this check from current version for refresh hint functionality
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith('/event/')) {
    log('Content', 'Not an event page, skipping countdown');
    return null;
  }

  const scriptElement = document.querySelector('script#__NEXT_DATA__');
  if (!scriptElement) {
    log('Content', 'No __NEXT_DATA__ script found');
    return null;
  }

  try {
    const jsonData = JSON.parse(scriptElement.textContent || '');
    const eventData = jsonData.props?.pageProps?.dehydratedState?.queries[0]?.state?.data;

    if (eventData && eventData.title && eventData.endDate) {
      log('Content', 'Event data found:', JSON.stringify(eventData, null, 2));

      let timezone = 'ET';
      let endDateValue = eventData.endDate;
      let matchFound = false;

      // Special handling for year-end dates (from old version)
      if (eventData && eventData.endDate && 
          (eventData.endDate.includes('2024-12-31') || eventData.endDate.includes('2024-12-30'))) {
        endDateValue = "December 31, 2024, 11:59:00 PM";
        timezone = "ET";
        matchFound = true;
        log('Content', 'Using year end date:', { endDateValue, timezone });
      }

      // Only proceed with pattern matching if no match found
      if (!matchFound) {
        // Try main event description first
        if (eventData.description) {
          const mainDescription = eventData.description;
          log('Content', 'Main event description:', mainDescription);

          // Try each pattern on main description first
          for (const pattern of DATE_PATTERNS) {
            const match = mainDescription.match(pattern.pattern);
            if (match) {
              log('Content', `Matched pattern in main description: ${pattern.name}`, match);
              
              const result = pattern.handler(match);
              if (result) {
                endDateValue = result.endDateValue;
                timezone = result.timezone;
                matchFound = true;
                log('Content', `Using ${pattern.name} from main description:`, { endDateValue, timezone });
                break;
              }
            }
          }
        }

        // Only try market description if no match found in main description
        if (!matchFound && eventData.markets?.[0]?.description) {
          const marketDescription = eventData.markets[0].description;
          log('Content', 'Market description:', marketDescription);

          // Skip text inside parentheses when looking for matches
          const descriptionWithoutParens = marketDescription.replace(/\([^)]*\)/g, '');
          
          // Try each pattern in priority order
          for (const pattern of DATE_PATTERNS) {
            const match = descriptionWithoutParens.match(pattern.pattern);
            if (match) {
              log('Content', `Matched pattern in market description: ${pattern.name}`, match);
              
              const result = pattern.handler(match);
              if (result) {
                endDateValue = result.endDateValue;
                timezone = result.timezone;
                matchFound = true;
                log('Content', `Using ${pattern.name} from market description:`, { endDateValue, timezone });
                break;
              }
            }
          }
        }
      }

      // Parse the end date
      const parsedDate = parseCustomDate(endDateValue, timezone);
      log('Content', 'Original end date:', endDateValue);
      log('Content', 'Parsed end date (local):', parsedDate);
      log('Content', 'Parsed end date (UTC):', parsedDate.toUTCString());

      if (isNaN(parsedDate.getTime())) {
        log('Content', 'Failed to parse end date:', endDateValue);
        return null;
      }

      const eventInfo: PolymarketEvent = {
        id: eventData.id || `event_${Date.now()}`,
        title: eventData.title,
        endTime: parsedDate.getTime(),
        endDate: endDateValue,
        timezone: timezone,
        url: window.location.href
      };
      
      log('Content', 'Extracted event info:', JSON.stringify(eventInfo, null, 2));
      return eventInfo;
    }
  } catch (error) {
    log('Content', 'Error processing event data:', error);
  }

  return null;
}

// Copy all helper functions from old version
function parseCustomDate(dateString: string, timezone: string): Date {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Try full format first
    let parts = dateString.match(/([A-Za-z]+) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}):(\d{2}) ([AP]M)/);
    
    if (parts) {
        const [, month, day, year, hour, minute, second, ampm] = parts;
        let parsedHour = parseInt(hour);
        if (ampm === 'PM' && parsedHour !== 12) parsedHour += 12;
        if (ampm === 'AM' && parsedHour === 12) parsedHour = 0;
        
        return createDateWithTimezone(
            parseInt(year),
            months.indexOf(month),
            parseInt(day),
            parsedHour,
            parseInt(minute),
            parseInt(second),
            timezone
        );
    }
    
    // Try 12-hour format with seconds first
    parts = dateString.match(/(\w+) (\d{1,2}),? (\d{4}),? (\d{1,2}):(\d{2}):(\d{2}) ([AP]M)/);
    
    if (parts) {
        const [, month, day, year, hour, minute, second, ampm] = parts;
        let parsedHour = parseInt(hour);
        if (ampm === 'PM' && parsedHour !== 12) parsedHour += 12;
        if (ampm === 'AM' && parsedHour === 12) parsedHour = 0;
        
        return createDateWithTimezone(
            parseInt(year),
            months.indexOf(month),
            parseInt(day),
            parsedHour,
            parseInt(minute),
            parseInt(second),
            timezone
        );
    }
    
    // Try 12-hour format first
    parts = dateString.match(/(\w+) (\d{1,2}),? (\d{4}),? (\d{1,2}):(\d{2}) ([AP]M)/);
    
    if (parts) {
        const [, month, day, year, hour, minute, ampm] = parts;
        let parsedHour = parseInt(hour);
        if (ampm === 'PM' && parsedHour !== 12) parsedHour += 12;
        if (ampm === 'AM' && parsedHour === 12) parsedHour = 0;
        
        return createDateWithTimezone(
            parseInt(year),
            months.indexOf(month),
            parseInt(day),
            parsedHour,
            parseInt(minute),
            0,  // Add seconds parameter as 0
            timezone
        );
    }
    
    // Try 24-hour format
    parts = dateString.match(/(\w+) (\d{1,2}),? (\d{4}),? (\d{1,2}):(\d{2})/);
    
    if (parts) {
        const [, month, day, year, hour, minute] = parts;
        return createDateWithTimezone(
            parseInt(year),
            months.indexOf(month),
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            0,  // Add seconds parameter as 0
            timezone
        );
    }
    
    // Try ISO format (e.g., "2024-11-08T12:00:00Z")
    if (dateString.endsWith('Z')) {
        const date = new Date(dateString);
        if (timezone === 'ET') {
            // Convert UTC to ET
            const offset = isDST(date) ? 4 : 5;
            date.setHours(date.getHours() + offset);
        }
        return date;
    }
    
    // Fallback: return new Date from string
    return new Date(dateString);
}

function createDateWithTimezone(
    year: number, 
    month: number, 
    day: number, 
    hour: number, 
    minute: number, 
    second: number = 0,
    timezone: string
): Date {
    // Create date in UTC
    const date = new Date(Date.UTC(year, month, day, hour, minute, second));
    
    if (timezone === 'ET') {
        const offset = isDST(date) ? 4 : 5; // EDT = UTC-4, EST = UTC-5
        date.setHours(date.getHours() + offset);
    }
    
    return date;
}

function formatDateToCustomString(date: Date): string {
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    const isPM = hours >= 12;
    const hour12 = hours % 12 || 12;
    return `${month} ${day}, ${year}, ${hour12}:${minutes.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 
               'July', 'August', 'September', 'October', 'November', 'December'];

// Add a new helper function to extract end time from description
function extractEndTimeFromDescription(description: string): string | null {
    const pattern = /between.*?and\s+([A-Za-z]+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M ET)/i;
    const match = description.match(pattern);
    return match ? match[1] : null;
}

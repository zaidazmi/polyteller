/**
 * Event extractor for Polyteller.
 * This file contains functions for extracting event information from the Polymarket page.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';
import { isDST } from '../utils/timezoneUtils';

// First, define interfaces for our patterns
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
    pattern: /between [A-Za-z]+ \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M [A-Z]{2} and ([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 85,
    format: "between Start and End DateTime",
    handler: (match: RegExpMatchArray) => {
      const [, endDate, hour, minute, ampm, tz] = match;
      return {
        endDateValue: `${endDate}, ${hour}:${minute}:00 ${ampm}`,
        timezone: tz || 'ET'
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
    pattern: /(?:and|until|by) ([A-Za-z]+ \d{1,2},? \d{4}),? (\d{1,2}:\d{2}) ?([AP]M) ([A-Z]{2,3})/i,
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

      // Always try to find date in description first
      if (eventData.markets && eventData.markets[0] && eventData.markets[0].description) {
        const description = eventData.markets[0].description;
        log('Content', 'Market description:', description);

        let matchFound = false;

        // Try each pattern in priority order
        for (const pattern of DATE_PATTERNS) {
          const match = description.match(pattern.pattern);
          if (match) {
            log('Content', `Matched pattern: ${pattern.name}`, match);
            
            const result = pattern.handler(match);
            if (result) {
              endDateValue = result.endDateValue;
              timezone = result.timezone;
              matchFound = true;
              log('Content', `Using ${pattern.name}:`, { endDateValue, timezone });
              break;
            }
          }
        }

        // Only use endDate from __NEXT_DATA__ if no pattern matched
        if (!matchFound && endDateValue.endsWith('Z')) {
          timezone = 'ET';
          const utcDate = new Date(endDateValue);
          const year = utcDate.getUTCFullYear();
          const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
          const day = utcDate.getUTCDate().toString().padStart(2, '0');
          endDateValue = `${year}-${month}-${day}T23:59:59-05:00`;
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
    
    // Fallback: return new Date from string
    return new Date(dateString);
}

function createDateWithTimezone(
    year: number, 
    month: number, 
    day: number, 
    hour: number, 
    minute: number, 
    second: number = 0,  // Add seconds parameter
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

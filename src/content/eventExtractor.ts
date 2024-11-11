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
    name: 'BETWEEN_DATES_WITH_DIFFERENT_FORMATS',
    pattern: /between\s+([A-Za-z]+\s+\d{1,2},?\s*\d{4}),?\s*(\d{1,2}:\d{2})\s*([AP]M)\s*([A-Z]{2,3})?(?:\s*\(inclusive\))?\s*and\s+([A-Za-z]+\s+\d{1,2}),?\s*(\d{1,2}:\d{2})\s*([AP]M)\s*([A-Z]{2,3})?/i,
    priority: 160,
    format: "between Date1, Time1 AMPM TZ and Date2, Time2 AMPM TZ",
    handler: (match: RegExpMatchArray) => {
      const [
        ,
        startDateFull,    // Full first date including year
        startTime, startAMPM, startTZ,
        endDatePart,      // Just month and day for end date
        endTime, endAMPM, endTZ
      ] = match;

      // Extract year from start date
      const yearMatch = startDateFull.match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();

      log('Content', 'Matched date parts:', {
        startDateFull,
        startTime, startAMPM, startTZ,
        endDatePart, endTime, endAMPM, endTZ,
        extractedYear: year
      });

      // Construct end date using year from start date
      return {
        endDateValue: `${endDatePart}, ${year}, ${endTime}:00 ${endAMPM}`,
        timezone: endTZ || startTZ || 'ET'
      };
    }
  },
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
  },
  {
    name: 'FINAL_DATA_DEADLINE',
    pattern: /no final data available by ([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 135, // Higher than EXACT_ET_NOON_FORMAT
    format: "final data deadline format",
    handler: (match: RegExpMatchArray) => {
      const [, datePart, hour, minute, ampm, tz] = match;
      return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: tz
      };
    }
  },

  {
    name: 'BETWEEN_DATES_WITH_INCLUSIVE_END',
    // Updated pattern to specifically match after "and"
    pattern: /between.*?and\s+([A-Za-z]+ \d{1,2},?\s*\d{4}),?\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*ET(?=\.|\s|$)/i,
    priority: 150, // Highest priority
    format: "between ... and Month DD, YYYY, HH:mm AM/PM ET",
    handler: (match: RegExpMatchArray) => {
      const [, datePart, hour, minute, ampm] = match;
      return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: 'ET'
      };
    }
  },
  {
    name: 'BETWEEN_DATES_WITH_END',
    // Backup pattern for cases without "inclusive"
    pattern: /between.*?and\s+([A-Za-z]+ \d{1,2},?\s*\d{4}),?\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*ET(?!\s*\(inclusive\))/i,
    priority: 145,
    format: "between ... and Month DD, YYYY, HH:mm AM/PM ET",
    handler: (match: RegExpMatchArray) => {
      const [, datePart, hour, minute, ampm] = match;
      return {
        endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
        timezone: 'ET'
      };
    }
  },
  {
    name: 'SHORT_DATE_TIME_FORMAT',
    pattern: /([A-Za-z]{3,})\s+(\d{1,2}),\s*(\d{1,2})\s*([AP]M)\s*([A-Z]{2,3})/i,
    priority: 165,
    format: "Month DD, HH AM/PM TZ",
    handler: (match: RegExpMatchArray) => {
      const [, month, day, hour, ampm, tz] = match;
      
      // Get the description text
      const description = document.querySelector('[data-rbd-draggable-context-id]')?.textContent || '';
      
      // Multiple patterns to find year context
      const yearContextPatterns = [
        /(\d{4})\s+Atlantic\s+hurricane\s+season/i,  // "2024 Atlantic hurricane season"
        /season\s+(\d{4})/i,                         // "season 2024"
        /during\s+(\d{4})/i,                         // "during 2024"
        /in\s+(\d{4})/i,                            // "in 2024"
        /by\s+.*?(\d{4})/i,                         // "by ... 2024"
        /\b(202\d)\b/                               // any 202x year as fallback
      ];
      
      // Try each pattern to find year context
      let yearFromContext = null;
      for (const pattern of yearContextPatterns) {
        const contextMatch = description.match(pattern);
        if (contextMatch) {
          yearFromContext = contextMatch[1];
          break;
        }
      }
      
      // If no context year found, use current year + 1
      const currentYear = new Date().getFullYear();
      const year = yearFromContext || (currentYear + 1).toString();
      
      log('Content', 'Matched short date format:', {
        month, day, hour, ampm, tz,
        yearFromContext,
        finalYear: year,
        description: description.substring(0, 100) + '...' // Log first 100 chars
      });
      
      // For hurricane season specifically, ensure we use 2024
      if (description.toLowerCase().includes('hurricane season') && 
          description.toLowerCase().includes('2024')) {
        return {
          endDateValue: `${month} ${day}, 2024, ${hour}:00:00 ${ampm}`,
          timezone: tz || 'ET'
        };
      }
      
      return {
        endDateValue: `${month} ${day}, ${year}, ${hour}:00:00 ${ampm}`,
        timezone: tz || 'ET'
      };
    }
  },
  {
    name: 'BETWEEN_DATES_WITH_TIMEZONE_SUFFIX',
    pattern: /between\s+([A-Za-z]+\s+\d{1,2},\s*\d{4}),\s*(\d{1,2}):(\d{2})\s*and\s+([A-Za-z]+\s+\d{1,2},\s*\d{4}),\s*(\d{1,2}):(\d{2})\s*in\s+the\s+([A-Z]{2})\s+timezone/i,
    priority: 170, // Higher priority than other patterns
    format: "between Month1 DD1, YYYY1, HH1:MM1 and Month2 DD2, YYYY2, HH2:MM2 in the TZ timezone",
    handler: (match: RegExpMatchArray) => {
      const [
        ,
        startDateFull, startHour, startMinute,  // Start date parts
        endDateFull, endHour, endMinute,        // End date parts
        timezone                                // Timezone from "in the ET timezone"
      ] = match;

      log('Content', 'Matched timezone suffix format:', {
        startDateFull, startTime: `${startHour}:${startMinute}`,
        endDateFull, endTime: `${endHour}:${endMinute}`,
        timezone
      });

      // For 24-hour format times, determine AM/PM
      const endHourNum = parseInt(endHour);
      const endAMPM = endHourNum >= 12 ? 'PM' : 'AM';
      const adjustedEndHour = endHourNum > 12 ? endHourNum - 12 : endHourNum;

      return {
        endDateValue: `${endDateFull}, ${adjustedEndHour}:${endMinute}:00 ${endAMPM}`,
        timezone: timezone
      };
    }
  }
].sort((a, b) => b.priority - a.priority);

// Add this function at the top level
function verifyEventDataMatchesUrl(eventData: any): boolean {
  // Get current slug from URL
  const currentSlug = window.location.pathname.split('/').pop()?.split('?')[0];
  
  // Get event slug from data
  const eventSlug = eventData.slug;
  
  // Log for debugging
  log('Content', 'Verifying event data match:', { 
    currentSlug, 
    eventSlug, 
    urlPath: window.location.pathname 
  });

  return currentSlug === eventSlug;
}

/**
 * Extracts event information from the Polymarket page.
 * @returns The extracted event information, or null if extraction fails
 */
export function extractEventInfo(): PolymarketEvent | null {
  const currentPath = window.location.pathname;
  log('Content', 'Checking path:', currentPath);

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
    log('Content', 'Found JSON data:', jsonData);

    const eventData = jsonData.props?.pageProps?.dehydratedState?.queries[0]?.state?.data;
    log('Content', 'Extracted event data:', eventData);

    // Add logging for markets data
    if (eventData?.markets?.length > 0) {
      log('Content', 'Market rules:', eventData.markets[0].description);
    }

    if (eventData && eventData.title) {
      if (!verifyEventDataMatchesUrl(eventData)) {
        log('Content', 'Event data does not match current URL');
        return null;
      }

      log('Content', 'Event data found:', JSON.stringify(eventData, null, 2));

      let timezone = 'ET';
      let endDateValue = eventData.endDate;
      let matchFound = false;

      // Try to get end date from market description first
      if (eventData.markets?.[0]?.description) {
        const marketDescription = eventData.markets[0].description;
        log('Content', 'Market description:', marketDescription);

        // Try each pattern in priority order
        for (const pattern of DATE_PATTERNS) {
          const match = marketDescription.match(pattern.pattern);
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

      if (!matchFound) {
        // Handle Z suffix dates explicitly
        if (endDateValue.endsWith('Z')) {
          timezone = 'ET';
          const utcDate = new Date(endDateValue);
          const year = utcDate.getUTCFullYear();
          const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
          const day = utcDate.getUTCDate().toString().padStart(2, '0');
          // Always set to 23:59:59 ET
          endDateValue = `${year}-${month}-${day}T23:59:59-05:00`;
          log('Content', 'Converted UTC date to ET end of day:', endDateValue);
        }
      }

      if (!matchFound && !endDateValue) {
        log('Content', 'No end date found in market description or event data');
        return null;
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
    } else {
      log('Content', 'Missing required event data fields:', { 
        hasTitle: !!eventData?.title
      });
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

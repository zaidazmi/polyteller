/**
 * Event extractor for Polyteller.
 * This file contains functions for extracting event information from the Polymarket page.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';
import { isDST } from '../utils/timezoneUtils';

// Add these date patterns at the top of the file
const DATE_PATTERNS = [
  // Date range pattern (highest priority)
  /between ([A-Za-z]+ \d{1,2},? \d{4}),? (\d{1,2}:\d{2}) ?([AP]M)? ?([A-Z]{2,3})? and ([A-Za-z]+ \d{1,2},? \d{4}),? (\d{1,2}:\d{2}) ?([AP]M)? ?([A-Z]{2,3})?/i,
  
  // Resolution deadline patterns (highest priority)
  /(?:by|before|until|not? later than).*?(?:the )?(?:inauguration date|inauguration).*?\(([A-Za-z]+ \d{1,2},? \d{4})\)/i,
  
  // Resolution/end date patterns
  /(?:market (?:will )?resolves?|resolves? on|ends? on|by)\s*([A-Za-z]+ \d{1,2},? \d{4})(?:,? (\d{1,2}:\d{2})(?: ?([AP]M)))?\s*([A-Z]{2,3})?/i,
  
  // Market close patterns
  /(?:market close|final (?:market )?close|close price) (?:in|on|by)\s*([A-Za-z]+ \d{1,2},? \d{4})/i,
  
  // Standalone date with time
  /([A-Za-z]+ \d{1,2},? \d{4}),? (\d{1,2}:\d{2})(?: ?([AP]M))? ([A-Z]{2,3})/i,
];

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
      let dateTimeMatch = null;

      // Always try to find date in description first
      if (eventData.markets && eventData.markets[0] && eventData.markets[0].description) {
        const description = eventData.markets[0].description;
        log('Content', 'Market description:', description);

        // Try all patterns to find a date in description
        for (const pattern of DATE_PATTERNS) {
          dateTimeMatch = description.match(pattern);
          if (dateTimeMatch) {
            log('Content', 'Date time matches:', dateTimeMatch);
            
            // For date range pattern
            if (dateTimeMatch.length >= 8) {
              const [, , , , , endDate, endTime, endAmPm, endTz] = dateTimeMatch;
              endDateValue = `${endDate}, ${endTime} ${endAmPm}`;
              timezone = endTz || 'ET';
            } else {
              // Always use the date from description
              const [, datePart] = dateTimeMatch;
              endDateValue = `${datePart}, 11:59 PM`;  // Set to end of day
              timezone = 'ET';
              
              // Create date object to verify it's valid
              const parsedDate = new Date(endDateValue);
              if (!isNaN(parsedDate.getTime())) {
                log('Content', 'Using date from description:', endDateValue);
              } else {
                // Fallback to __NEXT_DATA__ date if parsing fails
                endDateValue = eventData.endDate;
                log('Content', 'Failed to parse description date, using fallback:', endDateValue);
              }
            }
            break;
          }
        }
      }

      // Only use endDate from __NEXT_DATA__ if no date found in description
      if (!dateTimeMatch && endDateValue.endsWith('Z')) {
        timezone = 'ET';
        const utcDate = new Date(endDateValue);
        const year = utcDate.getUTCFullYear();
        const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = utcDate.getUTCDate().toString().padStart(2, '0');
        endDateValue = `${year}-${month}-${day}T23:59:59-05:00`;
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
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Try 12-hour format first
    let parts = dateString.match(/(\w+) (\d{1,2}),? (\d{4}),? (\d{1,2}):(\d{2}) ([AP]M)/);
    
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
            timezone
        );
    }
    
    return new Date(dateString);
}

function createDateWithTimezone(year: number, month: number, day: number, hour: number, minute: number, timezone: string): Date {
    const date = new Date(Date.UTC(year, month, day, hour, minute));
    
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

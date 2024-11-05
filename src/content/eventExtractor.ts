/**
 * Event extractor for Polyteller.
 * This file contains functions for extracting event information from the Polymarket page.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';
import { isDST } from '../utils/timezoneUtils';

// Add these date patterns at the top of the file
const DATE_PATTERNS = [
  // Highest priority: Match "08 Nov '24 12:00 in the ET timezone" format
  /(\d{1,2}) Nov '(\d{2}) (\d{1,2}):(\d{2}) in the ([A-Z]{2}) timezone/i,
  
  // New pattern for "Dec 1, 3 AM ET" format (highest priority)
  /(\b[A-Za-z]{3,} \d{1,2}), (\d{1,2}) ([AP]M) ([A-Z]{2,3})/i,
  
  // Specific pattern for "by [date], [time] [AM/PM] ET" format
  /by.*?(\w+ \d{1,2}, \d{4}),? (\d{1,2}:\d{2}:\d{2}) ([AP]M) ([A-Z]{2,3})/i,
  
  // Exact time pattern for "2:59:59 AM ET" format (highest priority)
  /([A-Za-z]+ \d{1,2},? \d{4}),? (\d{1,2}):(\d{2}):(\d{2}) ([AP]M) ([A-Z]{2,3})/i,
  
  // Specific pattern for "2:59:59 AM ET" format
  /(\d{1,2}):(\d{2}):(\d{2}) ?([AP]M) ([A-Z]{2,3})/i,
  
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

// Add these new patterns at the top, after existing DATE_PATTERNS
const PRIORITY_DATE_PATTERNS = [
  // Highest priority: Explicit end dates with time
  {
    pattern: /(?:and|until|by) ([A-Za-z]+ \d{1,2},? \d{4}),? (\d{1,2}:\d{2}) ?([AP]M) ([A-Z]{2,3})/i,
    priority: 3
  },
  // Medium priority: Resolution dates
  {
    pattern: /(?:resolves?|ends?) .*? ([A-Za-z]+ \d{1,2},? \d{4})/i,
    priority: 2
  },
  // Low priority: Inauguration dates
  {
    pattern: /inauguration date.*?\(([A-Za-z]+ \d{1,2},? \d{4})\)/i,
    priority: 1
  }
];

interface DateMatch {
  date: string;
  time?: string;
  ampm?: string;
  timezone: string;
  priority: number;
}

/**
 * Finds all dates in the description and returns them sorted by priority
 * @param description - The market description text
 * @returns Array of date matches sorted by priority
 */
function findPriorityDates(description: string): DateMatch[] {
  const matches: DateMatch[] = [];

  // Check each priority pattern
  PRIORITY_DATE_PATTERNS.forEach(({ pattern, priority }) => {
    const match = description.match(pattern);
    if (match) {
      if (match.length >= 5) {
        // Pattern with time
        matches.push({
          date: match[1],
          time: match[2],
          ampm: match[3],
          timezone: match[4] || 'ET',
          priority
        });
      } else {
        // Pattern without time
        matches.push({
          date: match[1],
          timezone: 'ET',
          priority
        });
      }
    }
  });

  // Sort by priority (highest first)
  return matches.sort((a, b) => b.priority - a.priority);
}

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

        // Try to match the specific format first
        const specificMatch = description.match(/(\d{1,2}) Nov '(\d{2}) (\d{1,2}):(\d{2}) in the ([A-Z]{2}) timezone/i);
        
        if (specificMatch) {
          const [, day, year, hour, minute, tz] = specificMatch;
          // Format the date string properly
          endDateValue = `November ${day}, 20${year}, ${hour}:${minute}:00`;
          timezone = tz;
          log('Content', 'Using specific time format match:', endDateValue);
        } else {
          // First try priority patterns
          const priorityDates = findPriorityDates(description);
          if (priorityDates.length > 0) {
            const highestPriority = priorityDates[0];
            if (highestPriority.time) {
              endDateValue = `${highestPriority.date}, ${highestPriority.time} ${highestPriority.ampm}`;
              timezone = highestPriority.timezone;
            } else {
              endDateValue = `${highestPriority.date}, 11:59 PM`;
              timezone = 'ET';
            }
            log('Content', 'Using priority date:', endDateValue);
          } else {
            // Fall back to existing DATE_PATTERNS logic
            for (const pattern of DATE_PATTERNS) {
              dateTimeMatch = description.match(pattern);
              if (dateTimeMatch) {
                log('Content', 'Date time matches:', dateTimeMatch);
                
                // Handle "Dec 1, 3 AM ET" format
                if (dateTimeMatch[1] && dateTimeMatch[2] && dateTimeMatch[3]) {
                  const [, datePart, hour, ampm, tz] = dateTimeMatch;
                  const currentYear = new Date().getFullYear();
                  const nextYear = currentYear + 1;
                  
                  endDateValue = `${datePart}, ${nextYear}, ${hour}:00 ${ampm}`;
                  timezone = tz || 'ET';
                  log('Content', 'Using short date format with next year:', endDateValue);
                } else {
                  // For exact time with seconds format (2:59:59 AM ET)
                  if (dateTimeMatch[2] && dateTimeMatch[3] && dateTimeMatch[4]) {
                    const [, datePart, hour, minute, second, ampm, tz] = dateTimeMatch;
                    endDateValue = `${datePart}, ${hour}:${minute}:${second} ${ampm}`;
                    timezone = tz || 'ET';
                    log('Content', 'Using exact time with seconds:', endDateValue);
                  } else {
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
                  }
                  break;
                }
              }
            }
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
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Try to parse the specific format first
    let parts = dateString.match(/November (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}):(\d{2})/);
    
    if (parts) {
        const [, day, year, hour, minute, second] = parts;
        return createDateWithTimezone(
            parseInt(year),
            10, // November
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second),
            timezone
        );
    }
    
    // Try short format with year (Dec 1, 2024, 3 AM ET)
    parts = dateString.match(/(\w+) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}) ([AP]M)/);
    
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
            0,
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

/**
 * Event extractor for Polymarket events.
 * This module handles extracting event information including end dates and timezones
 * from both market descriptions and __NEXT_DATA__ script tags.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';
import { parseCustomDate } from '../utils/dateUtils';

/**
 * Regular expression patterns for matching different date formats in market descriptions.
 * Each pattern is designed to catch specific date/time formats commonly used in Polymarket.
 */
const DATE_PATTERNS = [
  // Pattern 1: Matches full date-time with explicit timezone
  // Example: "by December 17, 2024, 12:00 PM ET" or "ends on January 1, 2024, 3:30 PM ET"
  /(?:between .+ and |ends? on |by )([A-Za-z]+ \d{1,2},? \d{4}),? (\d{1,2}:\d{2})(?: ?([AP]M))? (?:in the )?([A-Z]{2,3})/i,
  
  // Pattern 2: Matches date with timezone but no time
  // Example: "on November 5, 2024 ET"
  /(?:on |by )([A-Za-z]+ \d{1,2},? \d{4}) ([A-Z]{2,3})/i,
  
  // Pattern 3: Matches standalone date-time with timezone
  // Example: "April 19, 2025, 11:59 PM ET"
  /([A-Za-z]+ \d{1,2},? \d{4}),? (\d{1,2}:\d{2})(?: ?([AP]M))? ([A-Z]{2,3})/i,
  
  // Pattern 4: Matches dates in parentheses
  // Example: "(January 20, 2025)"
  /\(([A-Za-z]+ \d{1,2},? \d{4})\)/i
];

/**
 * Extracts event information from a Polymarket page.
 * Looks for end dates in both market descriptions and __NEXT_DATA__ script tags.
 * Handles various date formats and timezone conversions.
 * 
 * @returns {PolymarketEvent | null} The extracted event information or null if extraction fails
 */
export function extractEventInfo(): PolymarketEvent | null {
  // Find the __NEXT_DATA__ script tag which contains event data
  const scriptElement = document.querySelector('script#__NEXT_DATA__');
  if (!scriptElement) {
    log('Content', 'No __NEXT_DATA__ script found');
    return null;
  }

  try {
    // Parse the JSON data from the script tag
    const jsonData = JSON.parse(scriptElement.textContent || '');
    const eventData = jsonData.props?.pageProps?.dehydratedState?.queries[0]?.state?.data;

    if (eventData && eventData.title && eventData.endDate) {
      log('Content', 'Event data found:', JSON.stringify(eventData, null, 2));

      // Default to ET timezone for Polymarket events
      let timezone = 'ET';
      let endDateValue = eventData.endDate;
      let dateTimeMatch = null;

      // Try to find date/time information in the market description
      if (eventData.markets?.[0]?.description) {
        const description = eventData.markets[0].description;
        log('Content', 'Market description:', description);

        // Try each date pattern until we find a match
        for (const pattern of DATE_PATTERNS) {
          dateTimeMatch = description.match(pattern);
          if (dateTimeMatch) {
            log('Content', 'Date time matches:', dateTimeMatch);
            
            // Handle different pattern matches
            if (dateTimeMatch.length === 2 && dateTimeMatch[0].startsWith('(')) {
              // Handle dates in parentheses
              const [, datePart] = dateTimeMatch;
              endDateValue = datePart;
              timezone = 'ET';  // Assume ET for dates in parentheses
            } else if (dateTimeMatch.length === 3) {
              // Handle date with timezone but no time
              const [, datePart, tz] = dateTimeMatch;
              endDateValue = `${datePart}, 12:00 AM`; // Default to midnight
              timezone = tz;
            } else if (dateTimeMatch.length >= 5) {
              // Handle full date-time with timezone
              const [, datePart, timePart, ampm, tz] = dateTimeMatch;
              endDateValue = ampm ? 
                `${datePart}, ${timePart} ${ampm}` : 
                `${datePart}, ${timePart}`;
              timezone = tz;
            }
            break;
          }
        }

        // Special handling for ISO dates when ET is mentioned
        if (!dateTimeMatch && description.includes('ET') && eventData.endDate.endsWith('Z')) {
          timezone = 'ET';
          const utcDate = new Date(eventData.endDate);
          endDateValue = formatDateToCustomString(utcDate);
        }
      }

      // Handle ISO dates from __NEXT_DATA__ when no date found in description
      if (!dateTimeMatch && endDateValue.endsWith('Z')) {
        timezone = 'ET';
        
        // Convert UTC time to ET (UTC-5)
        const utcDate = new Date(endDateValue);
        const year = utcDate.getUTCFullYear();
        const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = utcDate.getUTCDate().toString().padStart(2, '0');
        
        // Default to end of day in ET
        endDateValue = `${year}-${month}-${day}T23:59:59-05:00`;
      }

      // Parse the final end date
      const parsedDate = parseCustomDate(endDateValue, timezone);
      log('Content', 'Original end date:', endDateValue);
      log('Content', 'Parsed end date (local):', parsedDate);
      log('Content', 'Parsed end date (UTC):', parsedDate.toUTCString());

      // Validate the parsed date
      if (isNaN(parsedDate.getTime())) {
        log('Content', 'Failed to parse end date:', endDateValue);
        return null;
      }

      // Create and return the event info object
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

// Helper functions below...

// Month names array for date formatting
const months = ['January', 'February', 'March', 'April', 'May', 'June', 
               'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Formats a date into a custom string format.
 * @param date The date to format
 * @returns Formatted date string in "Month Day, Year, HH:MM AM/PM" format
 */
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

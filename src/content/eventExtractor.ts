/**
 * Event extractor for Polyteller.
 * This file contains functions for extracting event information from the Polymarket page.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';
import { isDST } from '../utils/timezoneUtils';

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

      let timezone = 'UTC';
      let endDateValue = eventData.endDate;

      // Try to find ET time in description
      if (eventData.markets && eventData.markets[0] && eventData.markets[0].description) {
        const description = eventData.markets[0].description;
        log('Content', 'Market description:', description);

        // Updated regex to catch more date formats including those with commas
        const dateTimeMatch = description.match(/(?:between .+ and |ends? on |by )([A-Za-z]+ \d{1,2},? \d{4}),? (\d{1,2}:\d{2})(?: ?([AP]M))? (?:in the )?([A-Z]{2,3})/i);
        log('Content', 'Date time matches:', dateTimeMatch);

        if (dateTimeMatch) {
          const [, datePart, timePart, ampm, tz] = dateTimeMatch;
          if (!ampm) {
            endDateValue = `${datePart}, ${timePart}`;
          } else {
            endDateValue = `${datePart}, ${timePart} ${ampm}`;
          }
          timezone = tz;
        } else if (description.includes('ET') && eventData.endDate.endsWith('Z')) {
          // If we find ET in description but date is in ISO format, use ET
          timezone = 'ET';
          const utcDate = new Date(eventData.endDate);
          const month = utcDate.getUTCMonth();
          const day = utcDate.getUTCDate();
          const year = utcDate.getUTCFullYear();
          const hours = utcDate.getUTCHours();
          const minutes = utcDate.getUTCMinutes();
          
          // Convert to 12-hour format
          const isPM = hours >= 12;
          const hour12 = hours % 12 || 12;
          endDateValue = `${months[month]} ${day}, ${year}, ${hour12}:${minutes.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
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

const months = ['January', 'February', 'March', 'April', 'May', 'June', 
               'July', 'August', 'September', 'October', 'November', 'December'];

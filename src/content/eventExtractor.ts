/**
 * Event extractor for Polyteller.
 * This file contains functions for extracting event information from the Polymarket page.
 */

import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';

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

      if (eventData.markets && eventData.markets[0] && eventData.markets[0].description) {
        const description = eventData.markets[0].description;
        log('Content', 'Market description:', description);

        const dateTimeMatch = description.match(/(\w+ \d{1,2},? \d{4},? \d{1,2}:\d{2} [AP]M) ([A-Z]{2,3})/g);
        log('Content', 'Date time matches:', dateTimeMatch);

        if (dateTimeMatch && dateTimeMatch.length >= 2) {
          endDateValue = dateTimeMatch[1];
          timezone = dateTimeMatch[1].split(' ').pop() || 'ET';
          log('Content', 'End date found:', endDateValue);
          log('Content', 'Timezone found:', timezone);
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
        timezone: timezone
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
  const parts = dateString.match(/(\w+) (\d{1,2}),? (\d{4}),? (\d{1,2}):(\d{2}) ([AP]M)/);
  
  if (parts) {
    const [, month, day, year, hour, minute, ampm] = parts;
    let parsedHour = parseInt(hour);
    if (ampm === 'PM' && parsedHour !== 12) parsedHour += 12;
    if (ampm === 'AM' && parsedHour === 12) parsedHour = 0;
    
    // Create a date in UTC
    const date = new Date(Date.UTC(
      parseInt(year),
      months.indexOf(month),
      parseInt(day),
      parsedHour,
      parseInt(minute)
    ));

    // Adjust for ET timezone
    if (timezone === 'ET') {
      date.setHours(date.getHours() + 4); // ET is UTC-4 (assuming EDT)
    }

    return date;
  }
  
  return new Date(dateString);
}

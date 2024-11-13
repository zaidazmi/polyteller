import { PolymarketEvent } from '../types';
import { DATE_PATTERNS } from './extractors/datePatterns';
import { verifyEventDataMatchesUrl } from './parsers/contextParser';
import { parseEventDate } from './parsers/dateParser';
import { log } from '../utils/logUtils';

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
    const eventData = jsonData.props?.pageProps?.dehydratedState?.queries[0]?.state?.data;
    
    if (eventData?.markets?.length > 0) {
      log('Content', 'Market rules:', eventData.markets[0].description);
    }

    if (eventData && eventData.title) {
      if (!verifyEventDataMatchesUrl(eventData)) {
        log('Content', 'Event data does not match current URL');
        return null;
      }

      let timezone = 'ET';
      let endDateValue = eventData.endDate;
      let matchFound = false;

      if (eventData.markets?.[0]?.description) {
        const marketDescription = eventData.markets[0].description;
        
        for (const pattern of DATE_PATTERNS) {
          const match = marketDescription.match(pattern.pattern);
          if (match) {
            const result = pattern.handler(match);
            if (result) {
              endDateValue = result.endDateValue;
              timezone = result.timezone;
              matchFound = true;
              break;
            }
          }
        }
      }

      if (!matchFound && endDateValue.endsWith('Z')) {
        timezone = 'ET';
        const utcDate = new Date(endDateValue);
        const year = utcDate.getUTCFullYear();
        const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = utcDate.getUTCDate().toString().padStart(2, '0');
        endDateValue = `${year}-${month}-${day}T23:59:59-05:00`;
      }

      if (!matchFound && !endDateValue) {
        return null;
      }

      const parsedDate = parseEventDate(endDateValue, timezone);
      if (isNaN(parsedDate.getTime())) {
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

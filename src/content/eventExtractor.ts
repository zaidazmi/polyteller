import { PolymarketEvent } from '../types';
import { DATE_PATTERNS } from './extractors/datePatterns';
import { verifyEventDataMatchesUrl } from './parsers/contextParser';
import { parseEventDate } from './parsers/dateParser';
import { log } from '../utils/logUtils';

function findEventLikeNode(root: any, slugCandidates: string[], depth = 0): any | null {
  if (!root || depth > 8) return null;
  if (Array.isArray(root)) {
    for (const item of root) {
      const result = findEventLikeNode(item, slugCandidates, depth + 1);
      if (result) return result;
    }
    return null;
  }

  if (typeof root !== 'object') return null;

  const slug = typeof root.slug === 'string' ? root.slug : '';
  const title = typeof root.title === 'string' ? root.title : '';
  const hasEndDate = typeof root.endDate === 'string' || typeof root.endTime === 'string';
  const slugMatches = slugCandidates.includes(slug);
  const looksLikeEvent = !!title && hasEndDate;

  if (slugMatches || (looksLikeEvent && !slug)) {
    return root;
  }

  for (const value of Object.values(root)) {
    const result = findEventLikeNode(value, slugCandidates, depth + 1);
    if (result) return result;
  }

  return null;
}

function looksLikeEventPayload(value: any): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return (
    typeof value.title === 'string' &&
    (
      typeof value.endDate === 'string' ||
      typeof value.endTime === 'string' ||
      Array.isArray(value.markets)
    )
  );
}

function extractTimezoneHint(text?: string): string | null {
  if (!text) return null;

  if (/Israel Standard Time|\bIST\b/i.test(text)) return 'IST';
  if (/\b(EST|EDT|ET)\b/i.test(text)) return 'ET';
  if (/\b(PST|PDT|PT)\b/i.test(text)) return 'PT';
  if (/\bUTC\b/i.test(text)) return 'UTC';
  if (/\bGMT\b/i.test(text)) return 'GMT';

  return null;
}

function getEventDataFromNextData(jsonData: any, slugCandidates: string[]): any | null {
  const queries = jsonData?.props?.pageProps?.dehydratedState?.queries;

  if (Array.isArray(queries)) {
    // Preferred path on current Polymarket pages.
    for (const query of queries) {
      const queryKey = query?.queryKey;
      const data = query?.state?.data;

      if (!looksLikeEventPayload(data)) continue;
      if (Array.isArray(queryKey) && queryKey.includes('/api/event/slug')) {
        return data;
      }
    }

    // Fallback for future payload shape changes.
    for (const query of queries) {
      const data = query?.state?.data;
      if (!looksLikeEventPayload(data)) continue;
      if (verifyEventDataMatchesUrl(data)) return data;
    }
  }

  return findEventLikeNode(jsonData, slugCandidates);
}

function hasReliableApiEndDate(endDateValue: string): boolean {
  const isoTimeMatch = endDateValue.match(/T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
  if (!isoTimeMatch) return false;

  const [, hour, minute, second = '00'] = isoTimeMatch;
  // Midnight timestamps are often date-boundary placeholders, not explicit close times.
  const isMidnightBoundary = hour === '00' && minute === '00' && second === '00';
  return !isMidnightBoundary;
}

function extractRulesTextFromDom(): string {
  const mainCandidates = [
    document.querySelector('main')?.textContent || '',
    document.querySelector('[role="main"]')?.textContent || '',
    document.querySelector('#__next')?.textContent || '',
    document.body?.innerText || ''
  ];

  for (const text of mainCandidates) {
    if (!text) continue;
    if (/this market will resolve/i.test(text) || /between .* and .* [AP]M [A-Z]{2,3}/i.test(text)) {
      return text;
    }
  }

  return mainCandidates.find(Boolean) || '';
}

function extractEventTitleFromDom(): string {
  const h1 = document.querySelector('h1')?.textContent?.trim();
  if (h1) return h1;

  const titleTag = document.title?.trim();
  if (!titleTag) return '';

  return titleTag.split('|')[0].trim();
}

function parseFallbackEndDateFromText(text: string): { endDateValue: string; timezone: string } | null {
  if (!text) return null;

  const endDateLabelMatch = text.match(/End Date[:\s]+([A-Za-z]+ \d{1,2}, \d{4})/i);
  if (endDateLabelMatch) {
    return {
      endDateValue: `${endDateLabelMatch[1]}, 11:59:59 PM`,
      timezone: 'ET'
    };
  }

  const untilDateTimeMatch = text.match(/by\s+([A-Za-z]+ \d{1,2}, \d{4}),?\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*([A-Z]{2,3})/i);
  if (untilDateTimeMatch) {
    const [, datePart, hour, minute, ampm, tz] = untilDateTimeMatch;
    return {
      endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
      timezone: tz || 'ET'
    };
  }

  const scheduledRangeMatch = text.match(/scheduled for ([A-Za-z]+)\s+\d{1,2}\s*-\s*(\d{1,2}),\s*(\d{4})/i);
  if (scheduledRangeMatch) {
    const [, month, endDay, year] = scheduledRangeMatch;
    return {
      endDateValue: `${month} ${endDay}, ${year}, 11:59:59 PM`,
      timezone: 'ET'
    };
  }

  return null;
}

/**
 * Checks if an event has been resolved by looking for outcome widget
 * @returns Object containing resolution status and outcome if resolved
 */
function checkEventResolution(): { isResolved: boolean; outcome?: string } {
  try {
    // Look for outcome widget with specific classes
    const outcomeElement = document.querySelector('.c-dhzjXW.c-jeHDnm.c-dhzjXW-ihLUqJT-css');
    if (!outcomeElement) return { isResolved: false };

    // Find outcome text element
    const outcomeText = outcomeElement.querySelector('.c-dqzIym-ihXJvrq-css');
    if (!outcomeText || !outcomeText.textContent) return { isResolved: false };

    // Extract outcome text
    const match = outcomeText.textContent.match(/Outcome:\s*(.*)/);
    if (!match) return { isResolved: false };

    return {
      isResolved: true,
      outcome: match[1].trim()
    };
  } catch (error) {
    log('Content', 'Error checking resolution status:', error);
    return { isResolved: false };
  }
}

export function extractEventInfo(): PolymarketEvent | null {
  const currentPath = window.location.pathname;
  log('Content', 'Checking path:', currentPath);

  if (!currentPath.startsWith('/event/')) {
    log('Content', 'Not an event page, skipping countdown');
    return null;
  }

  const pathSegments = currentPath
    .split('/')
    .filter(Boolean)
    .map(segment => segment.split('?')[0]);
  const eventPathSegments = pathSegments[0] === 'event' ? pathSegments.slice(1) : pathSegments;
  const currentSlug = eventPathSegments[eventPathSegments.length - 1] || '';
  const slugCandidates = Array.from(new Set(eventPathSegments.filter(Boolean)));

  try {
    const scriptElement = document.querySelector('script#__NEXT_DATA__');
    let eventData: any = null;

    if (scriptElement?.textContent) {
      const jsonData = JSON.parse(scriptElement.textContent);
      eventData = getEventDataFromNextData(jsonData, slugCandidates);
    }

    const fallbackRulesText = extractRulesTextFromDom();
    const fallbackTitle = extractEventTitleFromDom();

    const title = eventData?.title || fallbackTitle;
    if (!title) {
      log('Content', 'Unable to identify event title from page');
      return null;
    }

    if (eventData?.title) {
      if (!verifyEventDataMatchesUrl(eventData)) {
        log('Content', 'Event data does not match current URL');
        return null;
      }
    }

    // Check resolution status first
    const { isResolved, outcome } = checkEventResolution();
    log('Content', 'Resolution status:', { isResolved, outcome });

    let timezone = 'ET';
    let endDateValue = eventData?.endDate || eventData?.endTime || '';
    let matchFound = false;
    const shouldTrustApiEndDate = typeof endDateValue === 'string' && hasReliableApiEndDate(endDateValue);
    const marketDescription =
      eventData?.markets?.[0]?.description ||
      eventData?.description ||
      fallbackRulesText;

    if (marketDescription) {
      log('Content', 'Market rules:', marketDescription.substring(0, 250));
    }

    // Only parse date patterns if not resolved
    if (!isResolved && marketDescription && !shouldTrustApiEndDate) {
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

    if (!matchFound && !endDateValue && marketDescription) {
      const fallback = parseFallbackEndDateFromText(marketDescription);
      if (fallback) {
        endDateValue = fallback.endDateValue;
        timezone = fallback.timezone;
        matchFound = true;
      }
    }

    if (!matchFound && endDateValue.endsWith('Z')) {
      const timezoneHint = extractTimezoneHint(marketDescription);
      if (timezoneHint) {
        timezone = timezoneHint;
      }
    }

    if (!matchFound && !endDateValue) {
      return null;
    }

    const parsedDate = parseEventDate(endDateValue, timezone);
    if (isNaN(parsedDate.getTime())) {
      return null;
    }

    const eventInfo: PolymarketEvent = {
      id: eventData?.id || currentSlug || `event_${Date.now()}`,
      title,
      endTime: isResolved ? Date.now() : parsedDate.getTime(),
      endDate: endDateValue,
      timezone: timezone,
      url: window.location.href,
      isResolved: isResolved,
      outcome: outcome
    };
    
    log('Content', 'Extracted event info:', JSON.stringify(eventInfo, null, 2));
    return eventInfo;
  } catch (error) {
    log('Content', 'Error processing event data:', error);
  }

  return null;
}

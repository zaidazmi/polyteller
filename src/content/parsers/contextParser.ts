import { log } from '../../utils/logUtils';

export function extractYearFromContext(description: string): string | null {
  const yearContextPatterns = [
    /(\d{4})\s+Atlantic\s+hurricane\s+season/i,
    /season\s+(\d{4})/i,
    /during\s+(\d{4})/i,
    /in\s+(\d{4})/i,
    /by\s+.*?(\d{4})/i,
    /\b(202\d)\b/
  ];

  log('Context', 'Searching for year in:', description.substring(0, 100) + '...');

  for (const pattern of yearContextPatterns) {
    const match = description.match(pattern);
    if (match) {
      log('Context', 'Found year in context:', {
        pattern: pattern.toString(),
        year: match[1]
      });
      return match[1];
    }
  }

  log('Context', 'No year found in context');
  return null;
}

export function verifyEventDataMatchesUrl(eventData: any): boolean {
  const pathSegments = window.location.pathname
    .split('/')
    .filter(Boolean)
    .map(segment => segment.split('?')[0]);
  const currentSlug = pathSegments[pathSegments.length - 1];
  const eventSlug = eventData?.slug;
  const eventUrl = eventData?.url || eventData?.canonicalUrl || eventData?.shareUrl;
  
  log('Content', 'Verifying event data match:', { 
    currentSlug, 
    pathSegments,
    eventSlug, 
    eventUrl,
    urlPath: window.location.pathname 
  });

  if (!currentSlug) return false;
  if (eventSlug) return pathSegments.includes(eventSlug);
  if (typeof eventUrl === 'string') return eventUrl.includes(`/${currentSlug}`);

  // If slug/url fields are absent in a newer payload shape, don't block extraction.
  return true;
} 

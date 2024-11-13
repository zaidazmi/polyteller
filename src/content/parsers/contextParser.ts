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
  const currentSlug = window.location.pathname.split('/').pop()?.split('?')[0];
  const eventSlug = eventData.slug;
  
  log('Content', 'Verifying event data match:', { 
    currentSlug, 
    eventSlug, 
    urlPath: window.location.pathname 
  });

  return currentSlug === eventSlug;
} 
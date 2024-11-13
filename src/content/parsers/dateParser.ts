import { parseCustomDate } from '../../utils/dateUtils';
import { isDST, getETOffset } from '../../utils/timezoneUtils';
import { log } from '../../utils/logUtils';

export function parseEventDate(dateString: string, timezone: string): Date {
  try {
    log('Content', 'Before parseCustomDate:', {
      dateString,
      timezone
    });

    const parsedDate = parseCustomDate(dateString, timezone);
    
    log('Content', 'After parseCustomDate:', {
      originalDate: dateString,
      parsedDate: parsedDate.toISOString(),
      localDate: parsedDate.toString(),
      timezone: timezone,
      isDST: timezone === 'ET' ? isDST(parsedDate) : null,
      offset: timezone === 'ET' ? getETOffset(parsedDate) : null,
      timestamp: parsedDate.getTime(),
      utcOffset: parsedDate.getTimezoneOffset()
    });

    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date');
    }

    return parsedDate;
  } catch (error) {
    log('Content', 'Error parsing date:', error);
    throw error;
  }
} 
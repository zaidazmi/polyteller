import { DateResult } from './patternTypes';
import { log } from '../../utils/logUtils';

/**
 * Extracts year from market rules context
 * Looks for any mention of year (YYYY) in the text
 * Returns the found year or current year + 1 as fallback
 */
function extractYearFromContext(): string {
  // Get market rules text
  const rulesText = document.querySelector('[data-rbd-draggable-context-id]')?.textContent || '';
  
  // Look for year patterns (2024, 2025, etc.)
  const yearMatches = rulesText.match(/\b(202\d)\b/g);
  
  if (yearMatches && yearMatches.length > 0) {
    // If multiple years found, use the latest one
    const years = yearMatches.map(y => parseInt(y));
    const latestYear = Math.max(...years);
    log('Content', 'Found year in context:', { years, latestYear, rulesText: rulesText.substring(0, 100) });
    return latestYear.toString();
  }
  
  // Fallback to next year if no year found
  const nextYear = new Date().getFullYear() + 1;
  log('Content', 'No year found in context, using next year:', nextYear);
  return nextYear.toString();
}

/**
 * Handles dates in format: "postponed after Month DD YYYY, HH:MM AM/PM ET"
 * Example: "postponed after January 15 2024, 3:00 PM ET"
 */
export function handlePostponedAfterDate(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm, tz] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

/**
 * Handles dates in format: "by Month DD, [of] YYYY, HH:MM AM/PM [ET]"
 * Example: "by January 15, of 2024, 3:00 PM ET"
 * Note: 'of' and timezone are optional
 */
export function handleFinalResolutionDeadline(match: RegExpMatchArray): DateResult {
  const [, monthDay, year, hour, minute, ampm, tz] = match;
  
  // Clean up any extra commas in monthDay
  const cleanMonthDay = monthDay.replace(/,/g, '');
  
  log('Content', 'Matched final resolution deadline:', {
    monthDay: cleanMonthDay,
    year,
    hour,
    minute,
    ampm,
    tz
  });

  return {
    endDateValue: `${cleanMonthDay}, ${year}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

/**
 * Handles dates in format: "between Date1 Time1 ET and Date2 Time2 ET"
 * Example: "between November 8, 2024 12:00 PM ET and November 15, 2024, 12:00 PM ET"
 * Returns the end date (Date2)
 */
export function handleBetweenDatesWithComma(match: RegExpMatchArray): DateResult {
  const [
    ,
    startDateFull,    // "November 8, 2024"
    startHour, startMinute, startAMPM,  // "12:00 PM"
    endDateFull,      // "November 15, 2024"
    endHour, endMinute, endAMPM  // "12:00 PM"
  ] = match;

  log('Content', 'Matched between dates with comma:', {
    startDateFull, 
    startTime: `${startHour}:${startMinute} ${startAMPM}`,
    endDateFull, 
    endTime: `${endHour}:${endMinute} ${endAMPM}`
  });

  return {
    endDateValue: `${endDateFull}, ${endHour}:${endMinute} ${endAMPM}`,
    timezone: 'ET'
  };
}

/**
 * Handles dates with timezone suffix: "between Date1, Time1 and Date2, Time2 in the TZ timezone"
 * Example: "between Jan 1, 2024, 00:00 and Dec 31, 2024, 23:59 in the ET timezone"
 * Converts 24-hour format to 12-hour format
 */
export function handleBetweenDatesWithTimezoneSuffix(match: RegExpMatchArray): DateResult {
  const [, startDateFull, startHour, startMinute, endDateFull, endHour, endMinute, timezone] = match;
  const endHourNum = parseInt(endHour);
  const endAMPM = endHourNum >= 12 ? 'PM' : 'AM';
  const adjustedEndHour = endHourNum > 12 ? endHourNum - 12 : endHourNum;
  return {
    endDateValue: `${endDateFull}, ${adjustedEndHour}:${endMinute}:00 ${endAMPM}`,
    timezone: timezone || 'ET'
  };
}

/**
 * Handles short date format: "Month DD, HH AM/PM TZ"
 * Example: "January 15, 3 PM ET"
 * Uses context to determine year
 */
export function handleShortDateTime(match: RegExpMatchArray): DateResult {
  const [, month, day, hour, minute, ampm, timezone] = match;
  const year = extractYearFromContext();
  
  const formattedDate = `${month} ${day}, ${year}, ${hour}:${minute}:00 ${ampm}`;
  
  return {
    endDateValue: formattedDate,
    timezone: timezone || 'ET'
  };
}

/**
 * Handles dates with different formats in start and end
 * Example: "between January 15, 2024 3:00 PM ET and February 1, 3:00 PM ET"
 */
export function handleBetweenDatesWithDifferentFormats(match: RegExpMatchArray): DateResult {
  const [, startDateFull, startTime, startAMPM, startTZ, endDatePart, endTime, endAMPM, endTZ] = match;
  const yearMatch = startDateFull.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
  return {
    endDateValue: `${endDatePart}, ${year}, ${endTime}:00 ${endAMPM}`,
    timezone: endTZ || startTZ || 'ET'
  };
}

/**
 * Handles dates with inclusive end: "between ... and Date, Time ET"
 * Example: "between start and January 15, 2024, 3:00 PM ET"
 */
export function handleBetweenDatesWithInclusiveEnd(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: 'ET'
  };
}

/**
 * Handles dates with end: "between ... and Date, Time ET"
 * Similar to inclusive end but without (inclusive) suffix
 */
export function handleBetweenDatesWithEnd(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: 'ET'
  };
}

/**
 * Handles final data deadline format
 * Example: "no final data available by January 15, 2024, 3:00 PM ET"
 */
export function handleFinalDataDeadline(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm, tz] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

/**
 * Handles main event end format
 * Fixed date: December 31, 2024, 11:59 PM ET
 */
export function handleMainEventEnd(): DateResult {
  return {
    endDateValue: "December 31, 2024, 11:59:00 PM",
    timezone: "ET"
  };
}

/**
 * Handles time before date format: "HH:MM AM/PM ET on Date"
 * Example: "3:00 PM ET on January 15, 2024"
 */
export function handleTimeBeforeDate(match: RegExpMatchArray): DateResult {
  const [, hour, minute, ampm, datePart] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: 'ET'
  };
}

/**
 * Handles year end format
 * Fixed date: December 31, 2024, 11:59 PM ET
 */
export function handleYearEnd(): DateResult {
  return {
    endDateValue: "December 31, 2024, 11:59:00 PM",
    timezone: "ET"
  };
}

/**
 * Handles Bitcoin noon format: "DD MMM 'YY HH:mm in TZ timezone"
 * Example: "BTCUSDT 15 Nov '24 12:00 in the ET timezone (noon)"
 */
export function handleBitcoinNoon(match: RegExpMatchArray): DateResult {
  const [, day, month, year, hour, minute, tz] = match;

  // Convert month abbreviation to full name
  const monthMap: { [key: string]: string } = {
    'Jan': 'January',
    'Feb': 'February',
    'Mar': 'March',
    'Apr': 'April',
    'May': 'May',
    'Jun': 'June',
    'Jul': 'July',
    'Aug': 'August',
    'Sep': 'September',
    'Oct': 'October',
    'Nov': 'November',
    'Dec': 'December'
  };

  const fullMonth = monthMap[month.substring(0, 3)] || month;

  // Convert to 12-hour format if needed
  const hourNum = parseInt(hour);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const hour12 = hourNum > 12 ? hourNum - 12 : (hourNum === 0 ? 12 : hourNum);

  log('Content', 'Matched bitcoin noon format:', {
    day,
    month: fullMonth,
    year,
    hour: hour12,
    minute,
    tz,
    ampm,
    original: match[0]
  });

  // Format exactly as parseCustomDate expects
  return {
    endDateValue: `${fullMonth} ${day}, 20${year}, ${hour12}:${minute}:00 ${ampm}`,
    timezone: tz
  };
}

/**
 * Handles exact time with seconds
 * Example: "by January 15, 2024, 3:00:00 PM ET"
 */
export function handleExactTimeWithSeconds(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, second, ampm, tz] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:${second} ${ampm}`,
    timezone: tz || 'ET'
  };
}

/**
 * Handles election time format
 * Example: "November 5, 2024, 8:00:00 PM ET"
 */
export function handleElectionTime(match: RegExpMatchArray): DateResult {
  const [, month, day, year, hour, minute, second, ampm, tz] = match;
  return {
    endDateValue: `${month} ${day}, ${year}, ${hour}:${minute}:${second} ${ampm}`,
    timezone: tz
  };
}

/**
 * Handles until time format with optional year
 * Examples:
 * - "until November 30, 11:59 PM ET" (no year)
 * - "until January 15, 2024, 11:59 PM ET" (with year)
 */
export function handleUntilTime(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm, tz] = match;
  
  // Check if year is in datePart
  const hasYear = datePart.match(/\d{4}/);
  const year = hasYear ? '' : `, ${extractYearFromContext()}`;  // Add extracted year if no year present
  
  return {
    endDateValue: `${datePart}${year}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

/**
 * Handles resolution date time format
 * Example: "resolves on January 15, 2024, 3:00 PM ET"
 */
export function handleResolutionDateTime(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm, tz] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

/**
 * Handles standalone date time format
 * Example: "January 15, 2024, 3:00 PM ET"
 */
export function handleStandaloneDateTime(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm, tz] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

/**
 * Handles date only format, defaults to end of day
 * Example: "January 15, 2024"
 */
export function handleDateOnly(match: RegExpMatchArray): DateResult {
  const [, datePart] = match;
  return {
    endDateValue: `${datePart}, 11:59:59 PM`,
    timezone: 'ET'
  };
}

/**
 * Handles inauguration date format
 * Example: "inauguration date (January 20, 2025)"
 */
export function handleInaugurationDate(match: RegExpMatchArray): DateResult {
  const [, datePart] = match;
  return {
    endDateValue: `${datePart}, 11:59:59 PM`,
    timezone: 'ET'
  };
}

/**
 * Handles Bitcoin end format with month abbreviations
 * Example: "between 1 Jan '24 00:00 and 31 Dec '24 23:59 in the ET timezone"
 * Converts month abbreviations to full names and 24-hour to 12-hour format
 */
export function handleBitcoinEndFormat(match: RegExpMatchArray): DateResult {
  const [
    ,
    day, month, year,  // 31, Dec, 24
    hour, minute,      // 23, 59
    tz                 // ET
  ] = match;

  // Convert month abbreviation to full name
  const monthMap: { [key: string]: string } = {
    'Jan': 'January',
    'Feb': 'February',
    'Mar': 'March',
    'Apr': 'April',
    'May': 'May',
    'Jun': 'June',
    'Jul': 'July',
    'Aug': 'August',
    'Sep': 'September',
    'Oct': 'October',
    'Nov': 'November',
    'Dec': 'December'
  };

  const fullMonth = monthMap[month] || month;

  // Convert 24-hour format to 12-hour format
  const hourNum = parseInt(hour);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const hour12 = hourNum > 12 ? hourNum - 12 : (hourNum === 0 ? 12 : hourNum);

  log('Content', 'Matched bitcoin end format:', {
    day, month: fullMonth, year, hour, minute, tz,
    converted: `${hour12}:${minute} ${ampm}`
  });

  // Format exactly as parseCustomDate expects
  return {
    endDateValue: `${fullMonth} ${day}, 20${year}, ${hour12}:${minute}:00 ${ampm}`,
    timezone: tz
  };
}

/**
 * Handles Hurricane end format
 * Example: "until Dec 1, 3 AM ET"
 * Gets year from context (e.g., "2024 Atlantic hurricane season")
 */
export function handleHurricaneEndFormat(match: RegExpMatchArray): DateResult {
  const [, month, day, hour, ampm, tz] = match;
  
  // Get description text for context
  const description = document.querySelector('[data-rbd-draggable-context-id]')?.textContent || '';
  
  // Extract year from context (e.g., "2024 Atlantic hurricane season")
  const yearMatch = description.match(/(\d{4})\s+Atlantic\s+hurricane\s+season/i);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  
  // Convert month abbreviation to full name
  const monthMap: { [key: string]: string } = {
    'Jan': 'January',
    'Feb': 'February',
    'Mar': 'March',
    'Apr': 'April',
    'May': 'May',
    'Jun': 'June',
    'Jul': 'July',
    'Aug': 'August',
    'Sep': 'September',
    'Oct': 'October',
    'Nov': 'November',
    'Dec': 'December'
  };

  const fullMonth = monthMap[month] || month;

  log('Content', 'Matched hurricane end format:', {
    month: fullMonth, 
    day, 
    hour, 
    ampm, 
    tz,
    year,
    description: description.substring(0, 100) + '...',
    formatted: `${fullMonth} ${day}, ${year}, ${hour}:00:00 ${ampm}`
  });

  // Format exactly as parseCustomDate expects
  return {
    endDateValue: `${fullMonth} ${day}, ${year}, ${hour}:00:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

/**
 * Handles dates in format: "Month DD, YYYY at HH:MM AM/PM ET"
 * Example: "Dec 2, 2024 at 10:00AM ET"
 */
export function handleTimeWithAtFormat(match: RegExpMatchArray): DateResult {
  const [, originalDatePart, hour, minute, ampmChar, tz] = match;
  
  // Normalize whitespace in datePart
  let datePart = originalDatePart.replace(/\s+/g, ' ').trim();
  
  // Convert month abbreviation to full name
  const monthMap: { [key: string]: string } = {
    'Jan': 'January',
    'Feb': 'February',
    'Mar': 'March',
    'Apr': 'April',
    'May': 'May',
    'Jun': 'June',
    'Jul': 'July',
    'Aug': 'August',
    'Sep': 'September',
    'Oct': 'October',
    'Nov': 'November',
    'Dec': 'December'
  };

  // Extract month from datePart and convert if it's abbreviated
  const monthMatch = datePart.match(/^([A-Za-z]+)/);
  if (monthMatch) {
    const monthAbbr = monthMatch[1];
    const fullMonth = monthMap[monthAbbr.substring(0, 3)] || monthAbbr;
    datePart = datePart.replace(monthAbbr, fullMonth);
  }

  // Format AM/PM properly
  const ampm = ampmChar + 'M';
  
  log('Content', 'Matched time with at format:', {
    datePart,
    hour,
    minute,
    ampm,
    tz,
    formatted: `${datePart}, ${hour}:${minute}:00 ${ampm}`
  });

  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

/**
 * Handles market timeframe spans with start and end dates
 * Example: "timeframe spans from December 2, 2024, 12:00 PM ET, to December 31, 2024, 11:59 PM ET"
 */
export function handleMarketTimeframeSpan(match: RegExpMatchArray): DateResult {
  const [
    ,
    startDatePart,    // December 2, 2024
    startHour,        // 12
    startMinute,      // 00
    startAMPM,        // PM
    startTZ,          // ET
    endDatePart,      // December 31, 2024
    endHour,          // 11
    endMinute,        // 59
    endAMPM,          // PM
    endTZ             // ET
  ] = match;

  log('Content', 'Matched market timeframe span:', {
    startDate: `${startDatePart}, ${startHour}:${startMinute} ${startAMPM}`,
    endDate: `${endDatePart}, ${endHour}:${endMinute} ${endAMPM}`,
    startTZ,
    endTZ
  });

  // Return the end date as this is what we use for countdown
  return {
    endDateValue: `${endDatePart}, ${endHour}:${endMinute}:00 ${endAMPM}`,
    timezone: endTZ || 'ET'
  };
}

// ... other handlers with same simple string formatting 
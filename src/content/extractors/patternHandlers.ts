import { DateResult } from './patternTypes';
import { log } from '../../utils/logUtils';

export function handlePostponedAfterDate(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm, tz] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

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

export function handleShortDateTime(match: RegExpMatchArray): DateResult {
  const [, month, day, hour, ampm, tz] = match;
  const year = new Date().getFullYear() + 1;
  return {
    endDateValue: `${month} ${day}, ${year}, ${hour}:00:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

export function handleBetweenDatesWithDifferentFormats(match: RegExpMatchArray): DateResult {
  const [, startDateFull, startTime, startAMPM, startTZ, endDatePart, endTime, endAMPM, endTZ] = match;
  const yearMatch = startDateFull.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
  return {
    endDateValue: `${endDatePart}, ${year}, ${endTime}:00 ${endAMPM}`,
    timezone: endTZ || startTZ || 'ET'
  };
}

export function handleBetweenDatesWithInclusiveEnd(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: 'ET'
  };
}

export function handleBetweenDatesWithEnd(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: 'ET'
  };
}

export function handleFinalDataDeadline(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm, tz] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

export function handleMainEventEnd(): DateResult {
  return {
    endDateValue: "December 31, 2024, 11:59:00 PM",
    timezone: "ET"
  };
}

export function handleTimeBeforeDate(match: RegExpMatchArray): DateResult {
  const [, hour, minute, ampm, datePart] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: 'ET'
  };
}

export function handleYearEnd(): DateResult {
  return {
    endDateValue: "December 31, 2024, 11:59:00 PM",
    timezone: "ET"
  };
}

export function handleBitcoinNoon(match: RegExpMatchArray): DateResult {
  const [, day, year, hour, minute, tz] = match;
  return {
    endDateValue: `November ${day}, 20${year}, ${hour}:${minute}:00`,
    timezone: tz
  };
}

export function handleExactTimeWithSeconds(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, second, ampm, tz] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:${second} ${ampm}`,
    timezone: tz || 'ET'
  };
}

export function handleElectionTime(match: RegExpMatchArray): DateResult {
  const [, month, day, year, hour, minute, second, ampm, tz] = match;
  return {
    endDateValue: `${month} ${day}, ${year}, ${hour}:${minute}:${second} ${ampm}`,
    timezone: tz
  };
}

export function handleUntilTime(match: RegExpMatchArray): DateResult {
  const [, datePart, time, ampm, tz] = match;
  const [hour, minute] = time.split(':');
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

export function handleResolutionDateTime(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm, tz] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

export function handleStandaloneDateTime(match: RegExpMatchArray): DateResult {
  const [, datePart, hour, minute, ampm, tz] = match;
  return {
    endDateValue: `${datePart}, ${hour}:${minute}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

export function handleDateOnly(match: RegExpMatchArray): DateResult {
  const [, datePart] = match;
  return {
    endDateValue: `${datePart}, 11:59:59 PM`,
    timezone: 'ET'
  };
}

export function handleInaugurationDate(match: RegExpMatchArray): DateResult {
  const [, datePart] = match;
  return {
    endDateValue: `${datePart}, 11:59:59 PM`,
    timezone: 'ET'
  };
}

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

export function handleHurricaneEndFormat(match: RegExpMatchArray): DateResult {
  const [, month, day, hour, ampm, tz] = match;
  
  // Get description text for context
  const description = document.querySelector('[data-rbd-draggable-context-id]')?.textContent || '';
  
  // Extract year from context (e.g., "2024 Atlantic hurricane season")
  const yearMatch = description.match(/(\d{4})\s+Atlantic\s+hurricane\s+season/i);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  
  log('Content', 'Matched hurricane end format:', {
    month, day, hour, ampm, tz,
    year,
    description: description.substring(0, 100) + '...',
    formatted: `${month} ${day}, ${year}, ${hour}:00 ${ampm}`
  });

  // Format exactly as parseCustomDate expects
  return {
    endDateValue: `${month} ${day}, ${year}, ${hour}:00 ${ampm}`,
    timezone: tz || 'ET'
  };
}

// ... other handlers with same simple string formatting 
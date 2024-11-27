import { DatePattern, PatternName } from './patternTypes';
import * as handlers from './patternHandlers';

/**
 * Array of date patterns ordered by priority (highest first).
 * Each pattern has:
 * - name: Unique identifier
 * - pattern: RegExp to match the date format
 * - priority: Higher number = checked first
 * - format: Example of the date format
 * - handler: Function to process matched groups
 */
export const DATE_PATTERNS: DatePattern[] = [
  /**
   * Matches: "until Dec 1, 3 AM ET"
   * Priority: 195 (Highest)
   * Used in: Hurricane season events
   */
  {
    name: 'HURRICANE_END_FORMAT' as PatternName,
    pattern: /(?:until|by) ([A-Za-z]+) (\d{1,2}), (\d{1,2}) ([AP]M) ([A-Z]{2})/i,
    priority: 195,
    format: "until Month DD, HH AM/PM ET",
    handler: handlers.handleHurricaneEndFormat
  },

  /**
   * Matches: "between 1 Jan '24 00:00 and 31 Dec '24 23:59 in the ET timezone"
   * Priority: 190
   * Used in: Bitcoin price events
   */
  {
    name: 'BITCOIN_END_FORMAT' as PatternName,
    pattern: /between (?:\d{1,2} [A-Za-z]+ '\d{2} \d{2}:\d{2} and )?(\d{1,2}) ([A-Za-z]+) '(\d{2}) (\d{2}):(\d{2}) in the ([A-Z]{2}) timezone/i,
    priority: 190,
    format: "DD MMM 'YY HH:mm in the ET timezone",
    handler: handlers.handleBitcoinEndFormat
  },

  /**
   * Matches: "postponed after January 15 2024, 3:00 PM ET"
   * Priority: 185
   * Used in: Postponed events
   */
  {
    name: 'POSTPONED_AFTER_DATE' as PatternName,
    pattern: /postponed after ([A-Za-z]+ \d{1,2} \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 185,
    format: "postponed after Month DD YYYY, HH:MM AM/PM ET",
    handler: handlers.handlePostponedAfterDate
  },

  /**
   * Matches: "by January 15, of 2024, 3:00 PM ET"
   * Priority: 180
   * Note: 'of' and timezone are optional
   */
  {
    name: 'FINAL_RESOLUTION_DEADLINE' as PatternName,
    pattern: /by ([A-Za-z]+,? \d{1,2}),? (?:of )?(\d{4}), (\d{1,2}):(\d{2}) ([AP]M)(?:\s*([A-Z]{2}))?/i,
    priority: 180,
    format: "by Month DD, [of] YYYY, HH:MM AM/PM [ET]",
    handler: handlers.handleFinalResolutionDeadline
  },

  /**
   * Matches: "between November 8, 2024 12:00 PM ET and November 15, 2024, 12:00 PM ET"
   * Priority: 175
   * Used in: Events with start and end dates
   */
  {
    name: 'BETWEEN_DATES_WITH_COMMA_AND' as PatternName,
    pattern: /between ([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ET and ([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ET/i,
    priority: 175,
    format: "between Date1 Time1 ET and Date2 Time2 ET",
    handler: handlers.handleBetweenDatesWithComma
  },

  /**
   * Matches: "between Jan 1, 2024, 00:00 and Dec 31, 2024, 23:59 in the ET timezone"
   * Priority: 170
   * Used in: Events with timezone suffix
   */
  {
    name: 'BETWEEN_DATES_WITH_TIMEZONE_SUFFIX' as PatternName,
    pattern: /between\s+([A-Za-z]+\s+\d{1,2},\s*\d{4}),\s*(\d{1,2}):(\d{2})\s*and\s+([A-Za-z]+\s+\d{1,2},\s*\d{4}),\s*(\d{1,2}):(\d{2})\s*in\s+the\s+([A-Z]{2})\s+timezone/i,
    priority: 170,
    format: "between Month1 DD1, YYYY1, HH1:MM1 and Month2 DD2, YYYY2, HH2:MM2 in the TZ timezone",
    handler: handlers.handleBetweenDatesWithTimezoneSuffix
  },

  /**
   * Matches: "January 15, 3 PM ET"
   * Priority: 165
   * Used in: Short date formats without year
   */
  {
    name: 'SHORT_DATE_TIME_FORMAT' as PatternName,
    pattern: /([A-Za-z]{3,})\s+(\d{1,2}),\s*(\d{1,2})\s*([AP]M)\s*([A-Z]{2,3})/i,
    priority: 165,
    format: "Month DD, HH AM/PM TZ",
    handler: handlers.handleShortDateTime
  },

  /**
   * Matches: "between Date1, Time1 AMPM TZ and Date2, Time2 AMPM TZ"
   * Priority: 160
   * Used in: Events with different formats
   */
  {
    name: 'BETWEEN_DATES_WITH_DIFFERENT_FORMATS' as PatternName,
    pattern: /between\s+([A-Za-z]+\s+\d{1,2},?\s*\d{4}),?\s*(\d{1,2}:\d{2})\s*([AP]M)\s*([A-Z]{2,3})?(?:\s*\(inclusive\))?\s*and\s+([A-Za-z]+\s+\d{1,2}),?\s*(\d{1,2}:\d{2})\s*([AP]M)\s*([A-Z]{2,3})?/i,
    priority: 160,
    format: "between Date1, Time1 AMPM TZ and Date2, Time2 AMPM TZ",
    handler: handlers.handleBetweenDatesWithDifferentFormats
  },

  /**
   * Matches: "between ... and Month DD, YYYY, HH:mm AM/PM ET"
   * Priority: 150
   * Used in: Events with inclusive end
   */
  {
    name: 'BETWEEN_DATES_WITH_INCLUSIVE_END' as PatternName,
    pattern: /between.*?and\s+([A-Za-z]+ \d{1,2},?\s*\d{4}),?\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*ET(?=\.|\s|$)/i,
    priority: 150,
    format: "between ... and Month DD, YYYY, HH:mm AM/PM ET",
    handler: handlers.handleBetweenDatesWithInclusiveEnd
  },

  /**
   * Matches: "between ... and Month DD, YYYY, HH:mm AM/PM ET"
   * Priority: 145
   * Used in: Events with end
   */
  {
    name: 'BETWEEN_DATES_WITH_END' as PatternName,
    pattern: /between.*?and\s+([A-Za-z]+ \d{1,2},?\s*\d{4}),?\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*ET(?!\s*\(inclusive\))/i,
    priority: 145,
    format: "between ... and Month DD, YYYY, HH:mm AM/PM ET",
    handler: handlers.handleBetweenDatesWithEnd
  },

  /**
   * Matches: "final data deadline format"
   * Priority: 135
   * Used in: Final data deadline
   */
  {
    name: 'FINAL_DATA_DEADLINE' as PatternName,
    pattern: /no final data available by ([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 135,
    format: "final data deadline format",
    handler: handlers.handleFinalDataDeadline
  },

  /**
   * Matches: "December 31, 2024, 11:59 PM ET"
   * Priority: 120
   * Used in: Main event end
   */
  {
    name: 'MAIN_EVENT_END_FORMAT' as PatternName,
    pattern: /(?:ends?|closes?|resolves?) (?:on |by )?December 31,? 2024(?:,? | at )?11:59(?::00)? PM ET/i,
    priority: 120,
    format: "December 31, 2024, 11:59 PM ET",
    handler: handlers.handleMainEventEnd
  },

  /**
   * Matches: "HH:mm AM/PM ET on Month DD, YYYY"
   * Priority: 115
   * Used in: Time before date
   */
  {
    name: 'TIME_BEFORE_DATE_FORMAT' as PatternName,
    pattern: /(\d{1,2}):(\d{2}) ([AP]M) ET on ([A-Za-z]+ \d{1,2}, \d{4})/i,
    priority: 115,
    format: "HH:mm AM/PM ET on Month DD, YYYY",
    handler: handlers.handleTimeBeforeDate
  },

  /**
   * Matches: "December 31, 2024, 11:59 PM ET"
   * Priority: 110
   * Used in: Year end
   */
  {
    name: 'YEAR_END_FORMAT' as PatternName,
    pattern: /(?:ends?|closes?|resolves?|by).*?(?:December|Dec)\.?\s*31,?\s*2024,?\s*(?:at\s*)?11:59(?::00)?\s*PM\s*ET/i,
    priority: 110,
    format: "December 31, 2024, 11:59 PM ET",
    handler: handlers.handleYearEnd
  },

  /**
   * Matches: "DD Nov 'YY HH:mm in TZ timezone"
   * Priority: 100
   * Used in: Bitcoin noon
   */
  {
    name: 'BITCOIN_NOON_FORMAT' as PatternName,
    pattern: /(?:BTCUSDT\s+)?(\d{1,2}) ([A-Za-z]+) '(\d{2}) (\d{1,2}):(\d{2}) in the ([A-Z]{2}) timezone(?:\s+\(noon\))?/i,
    priority: 195,
    format: "DD MMM 'YY HH:mm in TZ timezone",
    handler: handlers.handleBitcoinNoon
  },

  /**
   * Matches: "Month DD, YYYY, HH:mm:ss AM/PM TZ"
   * Priority: 95
   * Used in: Exact time with seconds
   */
  {
    name: 'EXACT_TIME_WITH_SECONDS' as PatternName,
    pattern: /by.*?(\w+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 95,
    format: "Month DD, YYYY, HH:mm:ss AM/PM TZ",
    handler: handlers.handleExactTimeWithSeconds
  },

  /**
   * Matches: "Month DD, YYYY, HH:mm:ss AM/PM TZ"
   * Priority: 90
   * Used in: Election time
   */
  {
    name: 'ELECTION_TIME_FORMAT' as PatternName,
    pattern: /\b(November|December|January|February|March|April|May|June|July|August|September|October) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}):(\d{2}) ([AP]M) ([A-Z]{2,3})\b/i,
    priority: 90,
    format: "Month DD, YYYY, HH:mm:ss AM/PM TZ",
    handler: handlers.handleElectionTime
  },

  /**
   * Matches: "until Month DD, HH:mm AM/PM TZ"
   * Priority: 88
   * Used in: Until time format
   * Examples:
   * - "until November 30, 11:59 PM ET" (no year)
   * - "until January 15, 2024, 11:59 PM ET" (with year)
   */
  {
    name: 'UNTIL_TIME_FORMAT' as PatternName,
    pattern: /(?<!\([^)]*?)(?:and|until|by) ([A-Za-z]+ \d{1,2}(?:,? \d{4})?),? (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2,3})/i,
    priority: 88,
    format: "until Month DD[, YYYY], HH:mm AM/PM TZ",
    handler: handlers.handleUntilTime
  },

  /**
   * Matches: "resolves/ends on Month DD, YYYY, HH:mm AM/PM TZ"
   * Priority: 80
   * Used in: Resolution date time
   */
  {
    name: 'RESOLUTION_DATE_TIME' as PatternName,
    pattern: /(?:resolves?|ends?) on ([A-Za-z]+ \d{1,2}, \d{4}),? (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 80,
    format: "resolves/ends on Month DD, YYYY, HH:mm AM/PM TZ",
    handler: handlers.handleResolutionDateTime
  },

  /**
   * Matches: "Month DD, YYYY, HH:mm AM/PM TZ"
   * Priority: 75
   * Used in: Standalone date time
   */
  {
    name: 'STANDALONE_DATE_TIME' as PatternName,
    pattern: /([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 75,
    format: "Month DD, YYYY, HH:mm AM/PM TZ",
    handler: handlers.handleStandaloneDateTime
  },

  /**
   * Matches: "Month DD, YYYY"
   * Priority: 70
   * Used in: Date only
   */
  {
    name: 'DATE_ONLY_FORMAT' as PatternName,
    pattern: /([A-Za-z]+ \d{1,2}, \d{4})/i,
    priority: 70,
    format: "Month DD, YYYY",
    handler: handlers.handleDateOnly
  },

  /**
   * Matches: "inauguration date (Month DD, YYYY)"
   * Priority: 65 (Lowest)
   * Used in: Inauguration events
   */
  {
    name: 'INAUGURATION_DATE' as PatternName,
    pattern: /inauguration date.*?\(([A-Za-z]+ \d{1,2},? \d{4})\)/i,
    priority: 65,
    format: "inauguration date (Month DD, YYYY)",
    handler: handlers.handleInaugurationDate
  },

  {
    name: 'BITCOIN_END_FORMAT' as PatternName,
    pattern: /between (?:\d{1,2} [A-Za-z]+ '\d{2} \d{2}:\d{2} and )?(\d{1,2}) ([A-Za-z]+) '(\d{2}) (\d{2}):(\d{2}) in the ([A-Z]{2}) timezone/i,
    priority: 190,
    format: "DD MMM 'YY HH:mm in the ET timezone",
    handler: handlers.handleBitcoinEndFormat
  },

  {
    name: 'HURRICANE_END_FORMAT' as PatternName,
    pattern: /(?:until|by) ([A-Za-z]+) (\d{1,2}), (\d{1,2}) ([AP]M) ([A-Z]{2})/i,
    priority: 195,
    format: "until Month DD, HH AM/PM ET",
    handler: handlers.handleHurricaneEndFormat
  },

  {
    name: 'TIME_WITH_AT_FORMAT' as PatternName,
    pattern: /([A-Za-z]+\s+\d{1,2},\s*\d{4})\s*at\s*(\d{1,2}):(\d{2})\s*([AP])M\s*([A-Z]{2})/i,
    priority: 195,
    format: "Month DD, YYYY at HH:MM AM/PM ET",
    handler: handlers.handleTimeWithAtFormat
  }
].sort((a, b) => b.priority - a.priority);  // Sort by priority (highest first)
import { DatePattern, PatternName } from './patternTypes';
import * as handlers from './patternHandlers';

export const DATE_PATTERNS: DatePattern[] = [
  {
    name: 'POSTPONED_AFTER_DATE' as PatternName,
    pattern: /postponed after ([A-Za-z]+ \d{1,2} \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 185,
    format: "postponed after Month DD YYYY, HH:MM AM/PM ET",
    handler: handlers.handlePostponedAfterDate
  },
  {
    name: 'FINAL_RESOLUTION_DEADLINE' as PatternName,
    pattern: /by ([A-Za-z]+,? \d{1,2}),? (?:of )?(\d{4}), (\d{1,2}):(\d{2}) ([AP]M)(?:\s*([A-Z]{2}))?/i,
    priority: 180,
    format: "by Month DD, [of] YYYY, HH:MM AM/PM [ET]",
    handler: handlers.handleFinalResolutionDeadline
  },
  {
    name: 'BETWEEN_DATES_WITH_COMMA_AND' as PatternName,
    pattern: /between ([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ET and ([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ET/i,
    priority: 175,
    format: "between Date1 Time1 ET and Date2 Time2 ET",
    handler: handlers.handleBetweenDatesWithComma
  },
  {
    name: 'BETWEEN_DATES_WITH_TIMEZONE_SUFFIX' as PatternName,
    pattern: /between\s+([A-Za-z]+\s+\d{1,2},\s*\d{4}),\s*(\d{1,2}):(\d{2})\s*and\s+([A-Za-z]+\s+\d{1,2},\s*\d{4}),\s*(\d{1,2}):(\d{2})\s*in\s+the\s+([A-Z]{2})\s+timezone/i,
    priority: 170,
    format: "between Month1 DD1, YYYY1, HH1:MM1 and Month2 DD2, YYYY2, HH2:MM2 in the TZ timezone",
    handler: handlers.handleBetweenDatesWithTimezoneSuffix
  },
  {
    name: 'SHORT_DATE_TIME_FORMAT' as PatternName,
    pattern: /([A-Za-z]{3,})\s+(\d{1,2}),\s*(\d{1,2})\s*([AP]M)\s*([A-Z]{2,3})/i,
    priority: 165,
    format: "Month DD, HH AM/PM TZ",
    handler: handlers.handleShortDateTime
  },
  {
    name: 'BETWEEN_DATES_WITH_DIFFERENT_FORMATS' as PatternName,
    pattern: /between\s+([A-Za-z]+\s+\d{1,2},?\s*\d{4}),?\s*(\d{1,2}:\d{2})\s*([AP]M)\s*([A-Z]{2,3})?(?:\s*\(inclusive\))?\s*and\s+([A-Za-z]+\s+\d{1,2}),?\s*(\d{1,2}:\d{2})\s*([AP]M)\s*([A-Z]{2,3})?/i,
    priority: 160,
    format: "between Date1, Time1 AMPM TZ and Date2, Time2 AMPM TZ",
    handler: handlers.handleBetweenDatesWithDifferentFormats
  },
  {
    name: 'BETWEEN_DATES_WITH_INCLUSIVE_END' as PatternName,
    pattern: /between.*?and\s+([A-Za-z]+ \d{1,2},?\s*\d{4}),?\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*ET(?=\.|\s|$)/i,
    priority: 150,
    format: "between ... and Month DD, YYYY, HH:mm AM/PM ET",
    handler: handlers.handleBetweenDatesWithInclusiveEnd
  },
  {
    name: 'BETWEEN_DATES_WITH_END' as PatternName,
    pattern: /between.*?and\s+([A-Za-z]+ \d{1,2},?\s*\d{4}),?\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*ET(?!\s*\(inclusive\))/i,
    priority: 145,
    format: "between ... and Month DD, YYYY, HH:mm AM/PM ET",
    handler: handlers.handleBetweenDatesWithEnd
  },
  {
    name: 'FINAL_DATA_DEADLINE' as PatternName,
    pattern: /no final data available by ([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 135,
    format: "final data deadline format",
    handler: handlers.handleFinalDataDeadline
  },
  {
    name: 'MAIN_EVENT_END_FORMAT' as PatternName,
    pattern: /(?:ends?|closes?|resolves?) (?:on |by )?December 31,? 2024(?:,? | at )?11:59(?::00)? PM ET/i,
    priority: 120,
    format: "December 31, 2024, 11:59 PM ET",
    handler: handlers.handleMainEventEnd
  },
  {
    name: 'TIME_BEFORE_DATE_FORMAT' as PatternName,
    pattern: /(\d{1,2}):(\d{2}) ([AP]M) ET on ([A-Za-z]+ \d{1,2}, \d{4})/i,
    priority: 115,
    format: "HH:mm AM/PM ET on Month DD, YYYY",
    handler: handlers.handleTimeBeforeDate
  },
  {
    name: 'YEAR_END_FORMAT' as PatternName,
    pattern: /(?:ends?|closes?|resolves?|by).*?(?:December|Dec)\.?\s*31,?\s*2024,?\s*(?:at\s*)?11:59(?::00)?\s*PM\s*ET/i,
    priority: 110,
    format: "December 31, 2024, 11:59 PM ET",
    handler: handlers.handleYearEnd
  },
  {
    name: 'BITCOIN_NOON_FORMAT' as PatternName,
    pattern: /(\d{1,2}) Nov '(\d{2}) (\d{1,2}):(\d{2}) in the ([A-Z]{2}) timezone/i,
    priority: 100,
    format: "DD Nov 'YY HH:mm in TZ timezone",
    handler: handlers.handleBitcoinNoon
  },
  {
    name: 'EXACT_TIME_WITH_SECONDS' as PatternName,
    pattern: /by.*?(\w+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 95,
    format: "Month DD, YYYY, HH:mm:ss AM/PM TZ",
    handler: handlers.handleExactTimeWithSeconds
  },
  {
    name: 'ELECTION_TIME_FORMAT' as PatternName,
    pattern: /\b(November|December|January|February|March|April|May|June|July|August|September|October) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}):(\d{2}) ([AP]M) ([A-Z]{2,3})\b/i,
    priority: 90,
    format: "Month DD, YYYY, HH:mm:ss AM/PM TZ",
    handler: handlers.handleElectionTime
  },
  {
    name: 'UNTIL_TIME_FORMAT' as PatternName,
    pattern: /(?<!\([^)]*?)(?:and|until|by) ([A-Za-z]+ \d{1,2},? \d{4}),? (\d{1,2}:\d{2}) ?([AP]M) ([A-Z]{2,3})/i,
    priority: 88,
    format: "until Month DD, YYYY, HH:mm AM/PM TZ",
    handler: handlers.handleUntilTime
  },
  {
    name: 'RESOLUTION_DATE_TIME' as PatternName,
    pattern: /(?:resolves?|ends?) on ([A-Za-z]+ \d{1,2}, \d{4}),? (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 80,
    format: "resolves/ends on Month DD, YYYY, HH:mm AM/PM TZ",
    handler: handlers.handleResolutionDateTime
  },
  {
    name: 'STANDALONE_DATE_TIME' as PatternName,
    pattern: /([A-Za-z]+ \d{1,2}, \d{4}), (\d{1,2}):(\d{2}) ([AP]M) ([A-Z]{2})/i,
    priority: 75,
    format: "Month DD, YYYY, HH:mm AM/PM TZ",
    handler: handlers.handleStandaloneDateTime
  },
  {
    name: 'DATE_ONLY_FORMAT' as PatternName,
    pattern: /([A-Za-z]+ \d{1,2}, \d{4})/i,
    priority: 70,
    format: "Month DD, YYYY",
    handler: handlers.handleDateOnly
  },
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
  }
].sort((a, b) => b.priority - a.priority); 
export interface DatePattern {
  name: PatternName;
  pattern: RegExp;
  priority: number;
  format: string;
  handler: PatternHandler;
}

export interface DateResult {
  endDateValue: string;
  timezone: string;
}

export type PatternHandler = (match: RegExpMatchArray) => DateResult | null;

export type PatternName = 
  | 'MARKET_TIMEFRAME_SPAN'
  | 'TIME_WITH_AT_FORMAT'
  | 'POSTPONED_AFTER_DATE'
  | 'FINAL_RESOLUTION_DEADLINE'
  | 'BETWEEN_DATES_WITH_COMMA_AND'
  | 'BETWEEN_DATES_WITH_TIMEZONE_SUFFIX'
  | 'SHORT_DATE_TIME_FORMAT'
  | 'BETWEEN_DATES_WITH_DIFFERENT_FORMATS'
  | 'BETWEEN_DATES_WITH_INCLUSIVE_END'
  | 'BETWEEN_DATES_WITH_END'
  | 'FINAL_DATA_DEADLINE'
  | 'MAIN_EVENT_END_FORMAT'
  | 'TIME_BEFORE_DATE_FORMAT'
  | 'YEAR_END_FORMAT'
  | 'BITCOIN_NOON_FORMAT'
  | 'DATE_RANGE_FORMAT'
  | 'EXACT_TIME_WITH_SECONDS'
  | 'ELECTION_TIME_FORMAT'
  | 'UNTIL_TIME_FORMAT'
  | 'RESOLUTION_DATE_TIME'
  | 'STANDALONE_DATE_TIME'
  | 'DATE_ONLY_FORMAT'
  | 'INAUGURATION_DATE'
  | 'BITCOIN_END_FORMAT'
  | 'HURRICANE_END_FORMAT';
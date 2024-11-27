import { DATE_PATTERNS } from '../datePatterns';
import * as handlers from '../patternHandlers';
import { DatePattern, DateResult } from '../patternTypes';

describe('Date Patterns', () => {
  // Helper function to test a pattern
  const testPattern = (
    pattern: DatePattern,
    text: string,
    expected: DateResult | null
  ) => {
    const match = text.match(pattern.pattern);
    if (!expected) {
      expect(match).toBeNull();
      return;
    }
    expect(match).not.toBeNull();
    const result = pattern.handler(match!);
    expect(result).toEqual(expected);
  };

  describe('TIME_WITH_AT_FORMAT', () => {
    const pattern = DATE_PATTERNS.find(p => p.name === 'TIME_WITH_AT_FORMAT')!;

    test('matches date with space between time and AM/PM', () => {
      testPattern(
        pattern,
        'December 2, 2024 at 10:00 AM ET',
        {
          endDateValue: 'December 2, 2024, 10:00:00 AM',
          timezone: 'ET'
        }
      );
    });

    test('matches date without space between time and AM/PM', () => {
      testPattern(
        pattern,
        'December 2, 2024 at 10:00AM ET',
        {
          endDateValue: 'December 2, 2024, 10:00:00 AM',
          timezone: 'ET'
        }
      );
    });

    test('matches date with PM time', () => {
      testPattern(
        pattern,
        'December 2, 2024 at 3:30PM ET',
        {
          endDateValue: 'December 2, 2024, 3:30:00 PM',
          timezone: 'ET'
        }
      );
    });

    test('handles extra whitespace', () => {
      testPattern(
        pattern,
        'December   2,    2024    at   10:00    AM    ET',
        {
          endDateValue: 'December 2, 2024, 10:00:00 AM',
          timezone: 'ET'
        }
      );
    });
  });

  describe('HURRICANE_END_FORMAT', () => {
    const pattern = DATE_PATTERNS.find(p => p.name === 'HURRICANE_END_FORMAT')!;

    test('matches basic format', () => {
      testPattern(
        pattern,
        'until Dec 1, 3 AM ET',
        {
          endDateValue: 'December 1, 2024, 3:00:00 AM',
          timezone: 'ET'
        }
      );
    });

    test('matches with "by" prefix', () => {
      testPattern(
        pattern,
        'by Dec 1, 3 PM ET',
        {
          endDateValue: 'December 1, 2024, 3:00:00 PM',
          timezone: 'ET'
        }
      );
    });
  });

  describe('POSTPONED_AFTER_DATE', () => {
    const pattern = DATE_PATTERNS.find(p => p.name === 'POSTPONED_AFTER_DATE')!;

    test('matches basic format', () => {
      testPattern(
        pattern,
        'postponed after January 15 2024, 3:00 PM ET',
        {
          endDateValue: 'January 15 2024, 3:00:00 PM',
          timezone: 'ET'
        }
      );
    });
  });

  describe('BETWEEN_DATES_WITH_COMMA_AND', () => {
    const pattern = DATE_PATTERNS.find(p => p.name === 'BETWEEN_DATES_WITH_COMMA_AND')!;

    test('matches basic format', () => {
      testPattern(
        pattern,
        'between November 8, 2024, 12:00 PM ET and November 15, 2024, 12:00 PM ET',
        {
          endDateValue: 'November 15, 2024, 12:00 PM',
          timezone: 'ET'
        }
      );
    });
  });

  describe('SHORT_DATE_TIME_FORMAT', () => {
    const pattern = DATE_PATTERNS.find(p => p.name === 'SHORT_DATE_TIME_FORMAT')!;

    test('matches basic format', () => {
      testPattern(
        pattern,
        'January 15, 3 PM ET',
        {
          endDateValue: `January 15, ${new Date().getFullYear() + 1}, 3:00:00 PM`,
          timezone: 'ET'
        }
      );
    });
  });

  describe('BITCOIN_NOON_FORMAT', () => {
    const pattern = DATE_PATTERNS.find(p => p.name === 'BITCOIN_NOON_FORMAT')!;

    test('matches basic format', () => {
      testPattern(
        pattern,
        'BTCUSDT 15 Nov \'24 12:00 in the ET timezone',
        {
          endDateValue: 'November 15, 2024, 12:00:00 PM',
          timezone: 'ET'
        }
      );
    });

    test('matches without BTCUSDT prefix', () => {
      testPattern(
        pattern,
        '15 Nov \'24 12:00 in the ET timezone',
        {
          endDateValue: 'November 15, 2024, 12:00:00 PM',
          timezone: 'ET'
        }
      );
    });
  });

  describe('EXACT_TIME_WITH_SECONDS', () => {
    const pattern = DATE_PATTERNS.find(p => p.name === 'EXACT_TIME_WITH_SECONDS')!;

    test('matches basic format', () => {
      testPattern(
        pattern,
        'by January 15, 2024, 3:00:00 PM ET',
        {
          endDateValue: 'January 15, 2024, 3:00:00 PM',
          timezone: 'ET'
        }
      );
    });
  });

  describe('ELECTION_TIME_FORMAT', () => {
    const pattern = DATE_PATTERNS.find(p => p.name === 'ELECTION_TIME_FORMAT')!;

    test('matches basic format', () => {
      testPattern(
        pattern,
        'November 5, 2024, 8:00:00 PM ET',
        {
          endDateValue: 'November 5, 2024, 8:00:00 PM',
          timezone: 'ET'
        }
      );
    });
  });

  describe('UNTIL_TIME_FORMAT', () => {
    const pattern = DATE_PATTERNS.find(p => p.name === 'UNTIL_TIME_FORMAT')!;

    test('matches format without year', () => {
      testPattern(
        pattern,
        'until November 30, 11:59 PM ET',
        {
          endDateValue: 'November 30, 2024, 11:59:00 PM',
          timezone: 'ET'
        }
      );
    });

    test('matches format with year', () => {
      testPattern(
        pattern,
        'until January 15, 2024, 11:59 PM ET',
        {
          endDateValue: 'January 15, 2024, 11:59:00 PM',
          timezone: 'ET'
        }
      );
    });
  });
}); 
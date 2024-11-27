import { parseCustomDate } from './dateUtils';

describe('parseCustomDate', () => {
  describe('PT timezone handling', () => {
    test('handles standard time correctly', () => {
      const date = parseCustomDate('December 31, 2024, 11:59 PM', 'PT');
      // December 31, 2024, 11:59 PM PT = January 1, 2025, 07:59 AM UTC
      expect(date.toISOString()).toBe('2025-01-01T07:59:00.000Z');
    });

    test('handles daylight saving time correctly', () => {
      const date = parseCustomDate('July 1, 2024, 11:59 PM', 'PT');
      // July 1, 2024, 11:59 PM PDT = July 2, 2024, 06:59 AM UTC
      expect(date.toISOString()).toBe('2024-07-02T06:59:00.000Z');
    });

    test('handles date without time in PT', () => {
      const date = parseCustomDate('December 31, 2024', 'PT');
      // December 31, 2024, 11:59:59 PM PT = January 1, 2025, 07:59:59 AM UTC
      expect(date.toISOString()).toBe('2025-01-01T07:59:59.000Z');
    });

    test('handles ISO format with PT timezone', () => {
      const date = parseCustomDate('2024-12-31T23:59:00-08:00', 'PT');
      // December 31, 2024, 11:59 PM PST = January 1, 2025, 07:59 AM UTC
      expect(date.toISOString()).toBe('2025-01-01T07:59:00.000Z');
    });
  });

  describe('ET timezone handling', () => {
    test('handles standard time correctly', () => {
      const date = parseCustomDate('December 31, 2024, 11:59 PM', 'ET');
      // December 31, 2024, 11:59 PM ET = January 1, 2025, 04:59 AM UTC
      expect(date.toISOString()).toBe('2025-01-01T04:59:00.000Z');
    });

    test('handles daylight saving time correctly', () => {
      const date = parseCustomDate('July 1, 2024, 11:59 PM', 'ET');
      // July 1, 2024, 11:59 PM EDT = July 2, 2024, 03:59 AM UTC
      expect(date.toISOString()).toBe('2024-07-02T03:59:00.000Z');
    });
  });
}); 
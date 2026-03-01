import * as handlers from '../patternHandlers';

describe('Pattern Handlers', () => {
  beforeEach(() => {
    document.querySelector = jest.fn().mockReturnValue(null);
  });

  describe('handleTimeWithAtFormat', () => {
    test('handles AM time correctly', () => {
      const match = ['December 2, 2024 at 10:00AM ET', 'December 2, 2024', '10', '00', 'A', 'ET'] as RegExpMatchArray;
      const result = handlers.handleTimeWithAtFormat(match);
      expect(result).toEqual({
        endDateValue: 'December 2, 2024, 10:00:00 AM',
        timezone: 'ET'
      });
    });

    test('handles PM time correctly', () => {
      const match = ['December 2, 2024 at 3:30PM ET', 'December 2, 2024', '3', '30', 'P', 'ET'] as RegExpMatchArray;
      const result = handlers.handleTimeWithAtFormat(match);
      expect(result).toEqual({
        endDateValue: 'December 2, 2024, 3:30:00 PM',
        timezone: 'ET'
      });
    });

    test('handles missing timezone', () => {
      const match = ['December 2, 2024 at 10:00AM', 'December 2, 2024', '10', '00', 'A', undefined] as RegExpMatchArray;
      const result = handlers.handleTimeWithAtFormat(match);
      expect(result).toEqual({
        endDateValue: 'December 2, 2024, 10:00:00 AM',
        timezone: 'ET'
      });
    });
  });

  describe('handleHurricaneEndFormat', () => {
    test('handles basic format', () => {
      document.querySelector = jest.fn().mockImplementation(() => ({
        textContent: '2024 Atlantic hurricane season'
      }));
      const match = ['until Dec 1, 3 AM ET', 'Dec', '1', '3', 'AM', 'ET'] as RegExpMatchArray;
      const result = handlers.handleHurricaneEndFormat(match);
      expect(result).toEqual({
        endDateValue: 'December 1, 2024, 3:00:00 AM',
        timezone: 'ET'
      });
    });
  });

  describe('handleBitcoinNoon', () => {
    test('converts 24-hour format to 12-hour format', () => {
      const match = ['15 Nov \'24 14:00 in the ET timezone', '15', 'Nov', '24', '14', '00', 'ET'] as RegExpMatchArray;
      const result = handlers.handleBitcoinNoon(match);
      expect(result).toEqual({
        endDateValue: 'November 15, 2024, 2:00:00 PM',
        timezone: 'ET'
      });
    });

    test('handles noon correctly', () => {
      const match = ['15 Nov \'24 12:00 in the ET timezone', '15', 'Nov', '24', '12', '00', 'ET'] as RegExpMatchArray;
      const result = handlers.handleBitcoinNoon(match);
      expect(result).toEqual({
        endDateValue: 'November 15, 2024, 12:00:00 PM',
        timezone: 'ET'
      });
    });
  });

  describe('handleBetweenDatesWithTimezoneSuffix', () => {
    test('converts 24-hour format to 12-hour format', () => {
      const match = [
        'between Jan 1, 2024, 00:00 and Dec 31, 2024, 23:59 in the ET timezone',
        'Jan 1, 2024',
        '00',
        '00',
        'Dec 31, 2024',
        '23',
        '59',
        'ET'
      ] as RegExpMatchArray;
      const result = handlers.handleBetweenDatesWithTimezoneSuffix(match);
      expect(result).toEqual({
        endDateValue: 'Dec 31, 2024, 11:59:00 PM',
        timezone: 'ET'
      });
    });
  });

  describe('handleShortDateTime', () => {
    test('adds next year to date', () => {
      const match = Object.assign(['January 15, 3:00 PM ET', 'January', '15', '3', '00', 'PM', 'ET'], {
        index: 0,
        input: 'January 15, 3:00 PM ET',
        groups: undefined
      }) as RegExpMatchArray;
      const result = handlers.handleShortDateTime(match);
      const nextYear = new Date().getFullYear() + 1;
      expect(result).toEqual({
        endDateValue: `January 15, ${nextYear}, 3:00:00 PM`,
        timezone: 'ET'
      });
    });
  });
}); 

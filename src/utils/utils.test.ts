import { formatDate, getTimeRemaining, isValidTimestamp, formatFullNotificationTime } from './dateUtils';
import { log } from './logUtils';

jest.mock('./logUtils', () => ({
  log: jest.fn(),
}));

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      // Use a specific timezone for consistent testing
      const date = new Date('2023-05-01T12:00:00Z');
      expect(formatDate(date)).toMatch(/Mon, May 1, 2023, \d{1,2}:\d{2} (AM|PM)/);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return correct time remaining', () => {
      const now = Date.now();
      const endTime = now + 24 * 60 * 60 * 1000; // 1 day from now
      const result = getTimeRemaining(endTime);
      expect(result).toMatch(/^(0d 23h|1d 0h) \d{1,2}m \d{1,2}s$/);
    });
  });

  describe('isValidTimestamp', () => {
    it('should return true for valid timestamps', () => {
      expect(isValidTimestamp(Date.now())).toBe(true);
    });

    it('should return false for invalid timestamps', () => {
      expect(isValidTimestamp(-1)).toBe(false);
      expect(isValidTimestamp(NaN)).toBe(false);
    });
  });

  describe('formatFullNotificationTime', () => {
    it('should format notification time correctly', () => {
      expect(formatFullNotificationTime(90)).toBe('1h 30m before');
      expect(formatFullNotificationTime(1440)).toBe('1d before');
    });
  });

  describe('log', () => {
    it('should call log function with correct arguments', () => {
      log('Test', 'message');
      expect(log).toHaveBeenCalledWith('Test', 'message');
    });
  });
});

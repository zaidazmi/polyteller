import '@testing-library/jest-dom';
import { validateCustomTime } from './customTimeValidation';
import { useStore } from '../../store/store';

// Mock the useStore function
jest.mock('../../store/store', () => ({
  useStore: {
    getState: jest.fn(),
  },
}));

describe('validateCustomTime', () => {
  let mockSetNotificationButton: HTMLButtonElement;
  let mockErrorMessage: HTMLDivElement;
  let mockInputs: HTMLInputElement[];

  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <button id="set-notification"></button>
      <div id="custom-time-error"></div>
      <input id="custom-days" />
      <input id="custom-hours" />
      <input id="custom-minutes" />
      <input id="custom-seconds" />
    `;

    mockSetNotificationButton = document.getElementById('set-notification') as HTMLButtonElement;
    mockErrorMessage = document.getElementById('custom-time-error') as HTMLDivElement;
    mockInputs = [
      document.getElementById('custom-days') as HTMLInputElement,
      document.getElementById('custom-hours') as HTMLInputElement,
      document.getElementById('custom-minutes') as HTMLInputElement,
      document.getElementById('custom-seconds') as HTMLInputElement,
    ];

    // Mock the current event
    (useStore.getState as jest.Mock).mockReturnValue({
      currentEvent: {
        endTime: Date.now() + 24 * 60 * 60 * 1000, // 1 day from now
      },
    });
  });

  it('should disable button and show error when no time is entered', () => {
    validateCustomTime();

    expect(mockSetNotificationButton.disabled).toBe(true);
    expect(mockErrorMessage.style.display).toBe('none');
    mockInputs.forEach(input => {
      expect(input.style.borderColor).toBe('');
    });
  });

  it('should enable button and hide error when valid time is entered', () => {
    mockInputs[1].value = '12'; // 12 hours
    validateCustomTime();

    expect(mockSetNotificationButton.disabled).toBe(false);
    expect(mockErrorMessage.style.display).toBe('none');
    mockInputs.forEach(input => {
      expect(input.style.borderColor).toBe('');
    });
  });

  it('should disable button and show error when time exceeds remaining time', () => {
    mockInputs[0].value = '2'; // 2 days
    validateCustomTime();

    expect(mockSetNotificationButton.disabled).toBe(true);
    expect(mockErrorMessage.textContent).toBe('Notification time cannot exceed the remaining time.');
    expect(mockErrorMessage.style.display).toBe('block');
    mockInputs.forEach(input => {
      expect(input.style.borderColor).toBe('red');
    });
  });

  it('should handle case when no current event is selected', () => {
    (useStore.getState as jest.Mock).mockReturnValue({
      currentEvent: null,
    });

    validateCustomTime();

    expect(mockSetNotificationButton.disabled).toBe(true);
    expect(mockErrorMessage.textContent).toBe('No event selected.');
    expect(mockErrorMessage.style.display).toBe('block');
  });
});

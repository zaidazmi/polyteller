import { fireEvent } from '@testing-library/dom';
import * as privacyUtils from '../utils/privacyUtils';
import { 
  PrivacyModeState, 
  privacyModeState,
  PRIVACY_MODE_KEY, 
  VALUE_SELECTOR 
} from './privacyMode';

// Mock privacyUtils module
jest.mock('../utils/privacyUtils', () => ({
  getPrivacyModeState: jest.fn(),
  setPrivacyModeState: jest.fn(),
  maskValue: jest.fn(),
}));

// Mock the chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
  storage: {
    local: {
      get: jest.fn().mockImplementation((key) => {
        return Promise.resolve({ 
          [PRIVACY_MODE_KEY]: false 
        });
      }),
      set: jest.fn().mockImplementation((obj) => {
        return Promise.resolve();
      }),
    },
  },
  tabs: {
    query: jest.fn().mockImplementation((query, callback) => callback([])),
    sendMessage: jest.fn(),
  },
} as unknown as typeof chrome;

// Mock window.location
const mockLocation = {
  href: 'http://test.com',
  pathname: '/',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock MutationObserver
class MockMutationObserver {
  constructor(private callback: MutationCallback) {}
  observe() {}
  disconnect() {}
}

global.MutationObserver = MockMutationObserver as any;

describe('Privacy Mode', () => {
  let privacyMode: PrivacyModeState;

  beforeEach(() => {
    // Reset singleton instance
    (PrivacyModeState as any).instance = null;
    privacyMode = PrivacyModeState.getInstance();
    
    // Reset DOM
    document.body.innerHTML = `
      <div class="${VALUE_SELECTOR}">$100.00</div>
      <div class="${VALUE_SELECTOR}">$50.00</div>
    `;
  });

  test('initializes with correct default state', () => {
    expect(privacyMode.isEnabled).toBe(false);
  });

  test('toggles state correctly', async () => {
    await privacyMode.toggle();
    expect(privacyMode.isEnabled).toBe(true);
    
    await privacyMode.toggle();
    expect(privacyMode.isEnabled).toBe(false);
  });

  test('notifies subscribers of state changes', async () => {
    const mockCallback = jest.fn();
    privacyMode.onStateChange(mockCallback);
    
    await privacyMode.toggle();
    expect(mockCallback).toHaveBeenCalledWith(true);
  });

  test('handles DOM mutations correctly', async () => {
    // Mock maskValue to return expected value
    (privacyUtils.maskValue as jest.Mock).mockReturnValue('*******');

    // Enable privacy mode first
    await privacyMode.toggle();
    expect(privacyMode.isEnabled).toBe(true);

    // Create and add new element
    const newElement = document.createElement('div');
    newElement.className = VALUE_SELECTOR;
    newElement.textContent = '$200.00';
    document.body.appendChild(newElement);

    // Force privacy mode update and wait for it
    privacyMode['updateElement'](newElement); // Call updateElement directly
    
    // Verify the element was masked
    expect(newElement.textContent).toBe('*******');
    expect(privacyUtils.maskValue).toHaveBeenCalledWith('$200.00');
  });
});

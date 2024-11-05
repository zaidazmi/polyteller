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
  maskValue: jest.fn().mockReturnValue('*******'),
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

  beforeEach(async () => {
    // Reset singleton instance
    (PrivacyModeState as any).instance = null;
    
    // Reset DOM with exact class names
    document.body.innerHTML = `
      <div class="c-PJLV c-jaFKlk c-PJLV-ibdakYG-css">$100.00</div>
      <div class="c-PJLV c-jaFKlk c-PJLV-ibdakYG-css">$50.00</div>
    `;

    // Reset mocks
    jest.clearAllMocks();
    document.body.classList.remove('privacy-enabled');

    // Initialize privacy mode instance
    privacyMode = PrivacyModeState.getInstance();
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test('initializes with correct default state', () => {
    expect(privacyMode.isEnabled).toBe(false);
  });

  test('toggles state correctly', async () => {
    await privacyMode.toggle();
    expect(privacyMode.isEnabled).toBe(true);
    expect(document.body.classList.contains('privacy-enabled')).toBe(true);
    
    await privacyMode.toggle();
    expect(privacyMode.isEnabled).toBe(false);
    expect(document.body.classList.contains('privacy-enabled')).toBe(false);
  });

  test('notifies subscribers of state changes', async () => {
    const mockCallback = jest.fn();
    privacyMode.onStateChange(mockCallback);
    
    await privacyMode.toggle();
    expect(mockCallback).toHaveBeenCalledWith(true);
  });

  test('handles DOM mutations correctly', async () => {
    // Enable privacy mode first
    await privacyMode.toggle();
    expect(privacyMode.isEnabled).toBe(true);
    expect(document.body.classList.contains('privacy-enabled')).toBe(true);

    // Create and add new element with exact class names
    const newElement = document.createElement('div');
    newElement.className = 'c-PJLV c-jaFKlk c-PJLV-ibdakYG-css';
    newElement.textContent = '$200.00';
    
    // Add element to DOM
    document.body.appendChild(newElement);

    // Force privacy mode update and wait for it
    await new Promise(resolve => setTimeout(resolve, 100));
    privacyMode['findAndUpdateElements']();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify element was masked
    expect(newElement.dataset.originalValue).toBe('$200.00');
    expect(document.body.classList.contains('privacy-enabled')).toBe(true);
  });

  test('properly stores original values', async () => {
    // Get first value element with exact class names
    const element = document.querySelector('.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css') as HTMLElement;
    expect(element).not.toBeNull();
    
    const originalValue = '$100.00';
    
    // Enable privacy mode and wait for update
    await privacyMode.toggle();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force update to ensure element is processed
    privacyMode['findAndUpdateElements']();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check original value is stored
    expect(element.dataset.originalValue).toBe(originalValue);
    
    // Disable privacy mode
    await privacyMode.toggle();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check original value is restored
    expect(element.textContent).toBe(originalValue);
    expect(element.dataset.originalValue).toBeUndefined();
  });
});

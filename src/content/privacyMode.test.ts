import { fireEvent } from '@testing-library/dom';
import * as privacyUtils from '../utils/privacyUtils';
import { initPrivacyMode, updatePrivacyMode, togglePrivacyMode } from './privacyMode';

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
      get: jest.fn((key, callback) => callback({ privacyModeEnabled: false })),
      set: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn((query, callback) => callback([])),
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
  beforeEach(() => {
    // Reset the DOM
    document.body.innerHTML = `
      <div class="c-gBrBnR c-dNAgLP c-gBrBnR-gDWzxt-variant-primary c-gBrBnR-gFoOfa-cv">
        <div class="c-PJLV c-jaFKlk c-PJLV-ibdakYG-css">$100.00</div>
      </div>
      <div class="c-gBrBnR c-dNAgLP c-gBrBnR-gDWzxt-variant-primary c-gBrBnR-gFoOfa-cv">
        <div class="c-PJLV c-jaFKlk c-PJLV-ibdakYG-css">$50.00</div>
      </div>
    `;

    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (privacyUtils.getPrivacyModeState as jest.Mock).mockResolvedValue(false);
    (privacyUtils.setPrivacyModeState as jest.Mock).mockResolvedValue(undefined);
    (privacyUtils.maskValue as jest.Mock).mockImplementation((value) => '*'.repeat(value.length));
  });

  afterEach(() => {
    // Clean up any intervals or observers
    jest.clearAllTimers();
    jest.resetAllMocks();
  });

  test('initPrivacyMode initializes correctly', async () => {
    await initPrivacyMode();
    expect(document.querySelector('.privacy-mode-toggle-icon')).toBeTruthy();
    expect(privacyUtils.getPrivacyModeState).toHaveBeenCalled();
  });

  test('updatePrivacyMode masks values when enabled', async () => {
    (privacyUtils.getPrivacyModeState as jest.Mock).mockResolvedValue(true);
    await initPrivacyMode();
    const valueElements = document.querySelectorAll('.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css');
    expect(valueElements[0].textContent).toBe('*******');
    expect(valueElements[1].textContent).toBe('******');
    expect(privacyUtils.maskValue).toHaveBeenCalled();
  });

  test('updatePrivacyMode unmasks values when disabled', async () => {
    await initPrivacyMode();
    const valueElements = document.querySelectorAll('.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css');
    expect(valueElements[0].textContent).toBe('$100.00');
    expect(valueElements[1].textContent).toBe('$50.00');
  });

  test('togglePrivacyMode changes the state', async () => {
    await initPrivacyMode();
    const toggleIcon = document.querySelector('.privacy-mode-toggle-icon') as HTMLElement;
    expect(toggleIcon).toBeTruthy();
    
    // Wait for toggle action to complete
    await new Promise<void>((resolve) => {
      fireEvent.click(toggleIcon);
      setTimeout(resolve, 0);
    });
    
    expect(privacyUtils.setPrivacyModeState).toHaveBeenCalledWith(true);
    expect(chrome.tabs.query).toHaveBeenCalled();
  });

  // Add test for MutationObserver
  test('MutationObserver updates privacy mode on DOM changes', async () => {
    await initPrivacyMode();
    
    // Add new element
    const newElement = document.createElement('div');
    newElement.className = 'c-PJLV c-jaFKlk c-PJLV-ibdakYG-css';
    newElement.textContent = '$200.00';
    document.body.appendChild(newElement);
    
    // Wait for updates
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const valueElements = document.querySelectorAll('.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css');
    expect(valueElements.length).toBe(3);
  });
});

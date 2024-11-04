import { fireEvent } from '@testing-library/dom';
import { initPrivacyModeToggle } from './privacyModeToggle';
import * as privacyUtils from '../../utils/privacyUtils';
import { PrivacyModeState, PRIVACY_MODE_KEY } from '../../content/privacyMode';

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
      get: jest.fn().mockImplementation((keys: string | string[] | { [key: string]: any } | null, callback?: (items: { [key: string]: any }) => void) => {
        const result = { [PRIVACY_MODE_KEY]: true };
        if (callback) {
          callback(result);
          return;
        }
        return Promise.resolve(result);
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

// Mock the privacyUtils
jest.mock('../../utils/privacyUtils');

describe('Privacy Mode Toggle', () => {
  beforeEach(() => {
    // Reset the DOM
    document.body.innerHTML = `
      <input type="checkbox" id="privacy-mode-toggle">
    `;

    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset singleton instance
    (PrivacyModeState as any).instance = null;
  });

  test('initPrivacyModeToggle initializes correctly', async () => {
    // Wait for state to be loaded
    const privacyMode = PrivacyModeState.getInstance();
    await privacyMode['loadInitialState']();

    await initPrivacyModeToggle();
    const toggle = document.getElementById('privacy-mode-toggle') as HTMLInputElement;
    expect(toggle.checked).toBe(true);
  });

  test('changing the toggle updates the privacy mode state', async () => {
    // Wait for state to be loaded
    const privacyMode = PrivacyModeState.getInstance();
    await privacyMode['loadInitialState']();

    await initPrivacyModeToggle();
    const toggle = document.getElementById('privacy-mode-toggle') as HTMLInputElement;
    
    expect(toggle.checked).toBe(true);
    
    // Click to toggle off
    fireEvent.click(toggle);
    
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [PRIVACY_MODE_KEY]: false
    });
    expect(toggle.checked).toBe(false);
  });
});

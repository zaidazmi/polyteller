import { fireEvent } from '@testing-library/dom';
import { initPrivacyModeToggle } from './privacyModeToggle';
import * as privacyUtils from '../../utils/privacyUtils';

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
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
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
  });

  test('initPrivacyModeToggle initializes correctly', async () => {
    (privacyUtils.getPrivacyModeState as jest.Mock).mockResolvedValue(true);
    await initPrivacyModeToggle();
    const toggle = document.getElementById('privacy-mode-toggle') as HTMLInputElement;
    expect(toggle.checked).toBe(true);
  });

  test('changing the toggle updates the privacy mode state', async () => {
    (privacyUtils.getPrivacyModeState as jest.Mock).mockResolvedValue(false);
    await initPrivacyModeToggle();
    const toggle = document.getElementById('privacy-mode-toggle') as HTMLInputElement;
    fireEvent.click(toggle);
    expect(privacyUtils.setPrivacyModeState).toHaveBeenCalledWith(true);
  });
});

import { fireEvent } from '@testing-library/dom';
import * as privacyUtils from '../utils/privacyUtils';
import { initPrivacyMode, updatePrivacyMode, togglePrivacyMode } from './privacyMode';

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
} as unknown as typeof chrome;

// Mock the privacyUtils
jest.mock('../utils/privacyUtils');

// Mock MutationObserver
global.MutationObserver = class {
  observe() {}
  disconnect() {}
} as any;

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
  });

  test('initPrivacyMode initializes correctly', async () => {
    (privacyUtils.getPrivacyModeState as jest.Mock).mockResolvedValue(false);
    await initPrivacyMode();
    expect(document.querySelector('.privacy-mode-toggle-icon')).toBeTruthy();
  });

  test('updatePrivacyMode masks values when enabled', async () => {
    (privacyUtils.getPrivacyModeState as jest.Mock).mockResolvedValue(true);
    (privacyUtils.maskValue as jest.Mock).mockImplementation((value) => '*'.repeat(value.length));
    await initPrivacyMode();
    const valueElements = document.querySelectorAll('.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css');
    expect(valueElements[0].textContent).toBe('*******');
    expect(valueElements[1].textContent).toBe('******');  // Changed from '*****' to '******'
  });

  test('updatePrivacyMode unmasks values when disabled', async () => {
    (privacyUtils.getPrivacyModeState as jest.Mock).mockResolvedValue(false);
    await initPrivacyMode();
    const valueElements = document.querySelectorAll('.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css');
    expect(valueElements[0].textContent).toBe('$100.00');
    expect(valueElements[1].textContent).toBe('$50.00');
  });

  test('togglePrivacyMode changes the state', async () => {
    (privacyUtils.getPrivacyModeState as jest.Mock).mockResolvedValue(false);
    await initPrivacyMode();
    const toggleIcon = document.querySelector('.privacy-mode-toggle-icon') as HTMLElement;
    expect(toggleIcon).toBeTruthy();
    fireEvent.click(toggleIcon);
    expect(privacyUtils.setPrivacyModeState).toHaveBeenCalledWith(true);
  });
});

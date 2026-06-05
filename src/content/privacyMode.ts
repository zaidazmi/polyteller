import { log } from '../utils/logUtils';
import { maskValue } from '../utils/privacyUtils';
import { MessageType } from '../types/messages';

// Constants
export const PRIVACY_MODE_KEY = 'privacyModeEnabled';
export const VALUE_SELECTOR = '.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css';
const TOGGLE_ICON_CLASS = 'privacy-mode-toggle-icon';
const TOGGLE_CONTAINER_CLASS = 'privacy-mode-toggle-container';
const FALLBACK_TOGGLE_CLASS = 'privacy-mode-toggle-fallback';
const MASKED_VALUE_CLASS = 'polyteller-privacy-masked';
const MUTATION_DEBOUNCE_TIME = 100;
const VALUE_SELECTORS = [
  VALUE_SELECTOR,
  '[class*="jaFKlk"]',
  '[class*="ibdakYG"]',
  '[data-testid*="portfolio" i]',
  '[data-testid*="balance" i]',
  '[data-testid*="cash" i]',
  '[data-testid*="account" i]',
  '[aria-label*="portfolio" i]',
  '[aria-label*="balance" i]',
  '[aria-label*="cash" i]'
];
const SENSITIVE_CONTEXT_SELECTOR = [
  'a[href*="/portfolio"]',
  'header',
  'nav',
  '[data-testid*="portfolio" i]',
  '[data-testid*="balance" i]',
  '[data-testid*="cash" i]',
  '[data-testid*="account" i]',
  '[aria-label*="portfolio" i]',
  '[aria-label*="balance" i]',
  '[aria-label*="cash" i]'
].join(',');
const VALUE_TEXT_PATTERN = /(?:[$€£]\s*[\d,.]+|[\d,.]+\s*(?:USDC|USD|USDT)\b)/i;
const SENSITIVE_LABEL_PATTERN = /\b(portfolio|balance|cash|available|account|wallet|buying power)\b/i;

function safeMatches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function safeClosest(element: Element, selector: string): Element | null {
  try {
    return element.closest(selector);
  } catch {
    return null;
  }
}

function queryPrivacyValueCandidates(): HTMLElement[] {
  const elements = new Set<HTMLElement>();

  for (const selector of VALUE_SELECTORS) {
    try {
      document.querySelectorAll(selector).forEach(element => {
        if (element instanceof HTMLElement) {
          elements.add(element);
        }
      });
    } catch {
      // Ignore selectors unsupported by older engines.
    }
  }

  return Array.from(elements).filter(isSensitiveValueElement);
}

function isSensitiveValueElement(element: HTMLElement): boolean {
  if (element.closest(`.${TOGGLE_CONTAINER_CLASS}, .${TOGGLE_ICON_CLASS}, .${FALLBACK_TOGGLE_CLASS}, #polyteller-countdown`)) {
    return false;
  }

  const text = (element.textContent || '').trim();
  if (!text || text.length > 120) return false;

  if (safeMatches(element, VALUE_SELECTOR) || safeMatches(element, '[class*="jaFKlk"], [class*="ibdakYG"]')) {
    return true;
  }

  const context = safeClosest(element, SENSITIVE_CONTEXT_SELECTOR);
  if (!context) return false;

  const contextText = (context.textContent || '').trim();
  return VALUE_TEXT_PATTERN.test(text) || (VALUE_TEXT_PATTERN.test(contextText) && SENSITIVE_LABEL_PATTERN.test(contextText));
}

function createToggleIcon(): HTMLElement {
  const toggleIcon = document.createElement('button');
  toggleIcon.type = 'button';
  toggleIcon.className = TOGGLE_ICON_CLASS;
  toggleIcon.setAttribute('aria-label', 'Toggle Polyteller privacy mode');
  toggleIcon.title = 'Toggle Polyteller privacy mode';
  toggleIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;

  toggleIcon.style.cssText = `
    border: 0;
    background: rgba(255, 255, 255, 0.94);
    color: #666666;
    cursor: pointer;
    z-index: 2147483647;
    width: 34px;
    height: 34px;
    border-radius: 17px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
    transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out, color 0.2s ease-in-out;
    pointer-events: auto;
    opacity: 0.72;
  `;

  toggleIcon.addEventListener('mouseenter', () => {
    toggleIcon.style.transform = 'scale(1.08)';
    toggleIcon.style.opacity = '1';
  });

  toggleIcon.addEventListener('mouseleave', () => {
    toggleIcon.style.transform = 'scale(1)';
    toggleIcon.style.opacity = '0.72';
  });

  toggleIcon.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await privacyModeState.toggle();

    toggleIcon.style.transform = 'scale(0.95)';
    setTimeout(() => {
      toggleIcon.style.transform = 'scale(1)';
    }, 100);

    chrome.runtime.sendMessage({
      type: MessageType.BROADCAST_PRIVACY_MODE,
      data: { enabled: privacyModeState.isEnabled },
      requestId: Date.now().toString(),
      timestamp: Date.now()
    });
  });

  const updateIconColor = (enabled: boolean) => {
    toggleIcon.style.color = enabled ? '#4A4FE4' : '#666666';
  };

  updateIconColor(privacyModeState.isEnabled);
  privacyModeState.onStateChange(updateIconColor);

  return toggleIcon;
}

/**
 * Adds the privacy mode toggle icon to the page.
 */
function addToggleIcon() {
  const findAndAddIcon = () => {
    if (document.querySelector(`.${TOGGLE_ICON_CLASS}`)) return true;

    const portfolioElement = document.querySelector('a[href*="/portfolio"], [data-testid*="portfolio" i], [aria-label*="portfolio" i]');
    const toggleIcon = createToggleIcon();

    const container = document.createElement('div');
    container.className = TOGGLE_CONTAINER_CLASS;
    container.appendChild(toggleIcon);

    if (portfolioElement instanceof HTMLElement) {
      container.style.cssText = `
        position: absolute;
        top: calc(100% + 5px);
        left: 50%;
        transform: translateX(-50%);
        width: 34px;
        height: 34px;
        overflow: visible;
        pointer-events: auto;
        z-index: 2147483647;
      `;

      portfolioElement.style.position = 'relative';
      portfolioElement.appendChild(container);
    } else {
      container.classList.add(FALLBACK_TOGGLE_CLASS);
      container.style.cssText = `
        position: fixed;
        top: 78px;
        right: 16px;
        width: 34px;
        height: 34px;
        pointer-events: auto;
        z-index: 2147483647;
      `;
      document.body.appendChild(container);
    }

    log('PrivacyMode', 'Toggle icon added');
    return true;
  };

  // Initialize with retries
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!findAndAddIcon()) {
        setTimeout(() => {
          if (!findAndAddIcon()) {
            setTimeout(findAndAddIcon, 1000);
          }
        }, 500);
      }
    });
  } else {
    if (!findAndAddIcon()) {
      setTimeout(() => {
        if (!findAndAddIcon()) {
          setTimeout(findAndAddIcon, 1000);
        }
      }, 500);
    }
  }
}

// Define PrivacyModeState class first
export class PrivacyModeState {
  private static instance: PrivacyModeState;
  private _isEnabled: boolean = false;
  private stateChangeCallbacks: ((enabled: boolean) => void)[] = [];
  private valueElements: Set<HTMLElement> = new Set();
  private mutationDebounceTimeout: number | null = null;
  private pendingElements: Set<HTMLElement> = new Set();

  private constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.loadInitialState();
    addToggleIcon();
    this.findAndUpdateElements();
    this.setupMessageListener();
    this.setupMutationObserver();
  }

  static getInstance(): PrivacyModeState {
    if (!PrivacyModeState.instance) {
      PrivacyModeState.instance = new PrivacyModeState();
    }
    return PrivacyModeState.instance;
  }

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  public async toggle(): Promise<void> {
    await this.setEnabled(!this._isEnabled);
  }

  public async setEnabled(value: boolean): Promise<void> {
    if (this._isEnabled === value) return;

    this._isEnabled = value;
    log('PrivacyMode', `State updated: ${value}`);

    try {
      await chrome.storage.local.set({ [PRIVACY_MODE_KEY]: value });
      log('PrivacyMode', `State persisted: ${value}`);
      
      if (value) {
        document.body.classList.add('privacy-enabled');
      } else {
        document.body.classList.remove('privacy-enabled');
      }

      this.updateAllElements();
      this.notifyStateChange();

      chrome.runtime.sendMessage({
        type: MessageType.UPDATE_PRIVACY_MODE,
        data: { enabled: value },
        requestId: Date.now().toString(),
        timestamp: Date.now()
      });

    } catch (error) {
      log('PrivacyMode', 'Error persisting state:', error);
    }
  }

  private async loadInitialState(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(PRIVACY_MODE_KEY);
      this._isEnabled = result[PRIVACY_MODE_KEY] || false;
      log('PrivacyMode', `Initial state loaded: ${this._isEnabled}`);
      this.updateAllElements();
    } catch (error) {
      log('PrivacyMode', 'Error loading initial state:', error);
    }
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === MessageType.UPDATE_PRIVACY_MODE) {
        this.setEnabled(message.data.enabled);
        if (sendResponse) {
          sendResponse({ success: true });
        }
      }
      return true;
    });
  }

  private setupMutationObserver(): void {
    const observer = new MutationObserver((mutations) => {
      let needsUpdate = false;
      
      for (const mutation of mutations) {
        if (this.isMutationRelevant(mutation)) {
          needsUpdate = true;
          break;
        }
      }

      if (needsUpdate) {
        if (this.mutationDebounceTimeout) {
          window.clearTimeout(this.mutationDebounceTimeout);
        }
        
        this.mutationDebounceTimeout = window.setTimeout(() => {
          this.findAndUpdateElements();
        }, MUTATION_DEBOUNCE_TIME);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'textContent']
    });
  }

  private isMutationRelevant(mutation: MutationRecord): boolean {
    if (mutation.type === 'childList') {
      return Array.from(mutation.addedNodes).some(node => node instanceof HTMLElement);
    }
    return mutation.type === 'attributes';
  }

  private findAndUpdateElements(): void {
    queryPrivacyValueCandidates().forEach(element => {
      this.valueElements.add(element);
      this.updateElement(element);
    });
  }

  private updateElement(element: HTMLElement): void {
    if (this._isEnabled) {
      if (!element.dataset.originalValue) {
        element.dataset.originalValue = element.textContent || '';
      }
      const originalValue = element.dataset.originalValue || '';
      element.textContent = maskValue(originalValue || element.textContent || '');
      element.classList.add(MASKED_VALUE_CLASS);
      element.setAttribute('aria-label', 'Hidden by Polyteller privacy mode');
    } else {
      if (element.dataset.originalValue) {
        element.textContent = element.dataset.originalValue;
        delete element.dataset.originalValue;
      }
      element.classList.remove(MASKED_VALUE_CLASS);
      element.removeAttribute('aria-label');
    }
  }

  private updateAllElements(): void {
    this.valueElements.forEach(element => {
      if (document.body.contains(element)) {
        this.updateElement(element);
      } else {
        this.valueElements.delete(element);
      }
    });
  }

  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach(callback => callback(this._isEnabled));
  }

  public onStateChange(callback: (enabled: boolean) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
    };
  }
}

// Export the singleton instance
export const privacyModeState = PrivacyModeState.getInstance();

// Export the toggle function
export async function togglePrivacyMode(): Promise<void> {
  await privacyModeState.toggle();
}

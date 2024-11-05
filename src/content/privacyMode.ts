import { log } from '../utils/logUtils';
import { getPrivacyModeState, setPrivacyModeState, maskValue } from '../utils/privacyUtils';

// Constants
export const PRIVACY_MODE_KEY = 'privacyModeEnabled';
export const VALUE_SELECTOR = '.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css';
const TOGGLE_ICON_CLASS = 'privacy-mode-toggle-icon';
const MUTATION_DEBOUNCE_TIME = 100;

/**
 * Adds the privacy mode toggle icon to the page.
 */
function addToggleIcon() {
  if (document.querySelector(`.${TOGGLE_ICON_CLASS}`)) return; // Avoid adding multiple icons

  const portfolioElement = document.querySelector('.c-gBrBnR.c-dNAgLP.c-gBrBnR-gDWzxt-variant-primary.c-gBrBnR-gFoOfa-cv');
  if (portfolioElement instanceof HTMLElement) {
    const toggleIcon = document.createElement('div');
    toggleIcon.className = TOGGLE_ICON_CLASS;
    toggleIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
    toggleIcon.style.cssText = `
      position: absolute;
      top: calc(100% + 5px);
      left: 50%;
      transform: translateX(-50%);
      cursor: pointer;
      z-index: 1000;
      padding: 5px;
    `;
    toggleIcon.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      await privacyModeState.toggle();

      // Send message to background script to handle tab updates
      chrome.runtime.sendMessage({
        action: 'broadcastPrivacyMode',
        enabled: privacyModeState.isEnabled
      });
    });

    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      height: 0;
      overflow: visible;
      pointer-events: none;
    `;
    container.appendChild(toggleIcon);

    portfolioElement.style.position = 'relative';
    portfolioElement.appendChild(container);
    log('PrivacyMode', 'Toggle icon added');
  } else {
    log('PrivacyMode', 'Target element for toggle icon not found or is not an HTMLElement');
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
    document.querySelectorAll(VALUE_SELECTOR).forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.visibility = 'visible';
        this.updateElement(element);
      }
    });
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
        action: 'updatePrivacyMode',
        enabled: value
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
      if (message.action === 'updatePrivacyMode') {
        this.setEnabled(message.enabled);
        if (sendResponse) {
          sendResponse({ received: true });
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
      return Array.from(mutation.addedNodes).some(node => 
        node instanceof HTMLElement && 
        (node.matches(VALUE_SELECTOR) || node.querySelector(VALUE_SELECTOR))
      );
    }
    return false;
  }

  private findAndUpdateElements(): void {
    const elements = document.querySelectorAll(VALUE_SELECTOR);
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        this.valueElements.add(element);
        this.updateElement(element);
      }
    });
  }

  private updateElement(element: HTMLElement): void {
    if (this._isEnabled) {
      if (!element.dataset.originalValue) {
        element.dataset.originalValue = element.textContent || '';
      }
    } else {
      if (element.dataset.originalValue) {
        element.textContent = element.dataset.originalValue;
        delete element.dataset.originalValue;
      }
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

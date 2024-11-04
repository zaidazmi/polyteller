import { log } from '../utils/logUtils';
import { getPrivacyModeState, setPrivacyModeState, maskValue } from '../utils/privacyUtils';

// Selectors and constants
export const PRIVACY_MODE_KEY = 'privacyModeEnabled';
export const VALUE_SELECTOR = '.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css';
const TOGGLE_ICON_CLASS = 'privacy-mode-toggle-icon';

// Global state
let isPrivacyModeEnabled = false;

/**
 * Initializes the privacy mode feature.
 * This function is called when the content script loads and when the URL changes.
 */
export async function initPrivacyMode() {
  isPrivacyModeEnabled = await getPrivacyModeState();
  log('PrivacyMode', `Initializing privacy mode. Enabled: ${isPrivacyModeEnabled}`);
  addToggleIcon();
  updatePrivacyMode();
  setupMutationObserver();
  retryPrivacyMode();
  startContinuousMonitoring();
}

/**
 * Updates the display of sensitive information based on the privacy mode state.
 * This function is called whenever the privacy mode state changes.
 */
export function updatePrivacyMode() {
  log('PrivacyMode', `Updating privacy mode. Enabled: ${isPrivacyModeEnabled}`);
  const valueElements = document.querySelectorAll(VALUE_SELECTOR);
  log('PrivacyMode', `Found ${valueElements.length} value elements`);
  
  valueElements.forEach((element, index) => {
    if (element instanceof HTMLElement) {
      updateElement(element, index);
    }
  });
  updateToggleIcon();
}

function updateElement(element: HTMLElement, index: number) {
  if (isPrivacyModeEnabled) {
    if (!element.dataset.originalValue) {
      element.dataset.originalValue = element.textContent || '';
    }
    const originalValue = element.dataset.originalValue;
    log('PrivacyMode', `Element ${index}: Original value: "${originalValue}"`);
    element.textContent = maskValue(originalValue);
    log('PrivacyMode', `Element ${index}: Masked value: "${element.textContent}"`);
  } else {
    const originalValue = element.dataset.originalValue || element.textContent || '';
    log('PrivacyMode', `Element ${index}: Original value: "${originalValue}"`);
    element.textContent = originalValue;
    log('PrivacyMode', `Element ${index}: Unmasked value: "${element.textContent}"`);
    delete element.dataset.originalValue;
  }
}

/**
 * Adds the privacy mode toggle icon to the page.
 * This function is called once during initialization.
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
    toggleIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      togglePrivacyMode();
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

/**
 * Updates the appearance of the toggle icon based on the privacy mode state.
 */
function updateToggleIcon() {
  const toggleIcon = document.querySelector(`.${TOGGLE_ICON_CLASS}`);
  if (toggleIcon instanceof HTMLElement) {
    toggleIcon.style.opacity = isPrivacyModeEnabled ? '1' : '0.1';
    toggleIcon.title = isPrivacyModeEnabled ? 'Disable Privacy Mode' : 'Enable Privacy Mode';
  }
}

/**
 * Updates the position of the toggle icon.
 * This function is called on window resize and periodically to ensure correct positioning.
 */
function updateToggleIconPosition() {
  const toggleIcon = document.querySelector(`.${TOGGLE_ICON_CLASS}`);
  const container = toggleIcon?.parentElement;
  const portfolioElement = document.querySelector('.c-gBrBnR.c-dNAgLP.c-gBrBnR-gDWzxt-variant-primary.c-gBrBnR-gFoOfa-cv');

  if (container instanceof HTMLElement && portfolioElement instanceof HTMLElement) {
    const rect = portfolioElement.getBoundingClientRect();
    container.style.top = `${rect.height}px`;
    container.style.left = '0';
    container.style.width = `${rect.width}px`;
  }
}

/**
 * Toggles the privacy mode state and updates the UI accordingly.
 */
export async function togglePrivacyMode() {
  isPrivacyModeEnabled = !isPrivacyModeEnabled;
  await setPrivacyModeState(isPrivacyModeEnabled);
  updatePrivacyMode();

  // Send a message to all tabs to update the privacy mode
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'updatePrivacyMode', enabled: isPrivacyModeEnabled });
      }
    });
  });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updatePrivacyMode') {
    isPrivacyModeEnabled = message.enabled;
    updatePrivacyMode();
    sendResponse({ received: true });
  }
});

// Update toggle icon position on window resize
window.addEventListener('resize', updateToggleIconPosition);

// Periodically update the position to handle dynamic layout changes
setInterval(updateToggleIconPosition, 5000);

// Initialize privacy mode
initPrivacyMode();

// Re-run initialization when the URL changes (for single-page applications)
if (typeof window !== 'undefined' && window.location) {
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    if (window.location) {
      const url = window.location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        initPrivacyMode();
      }
    }
  }).observe(document, {subtree: true, childList: true});
}

// Add this function for retrying privacy mode application
function retryPrivacyMode(maxRetries = 10, delay = 500) {
  let retries = 0;
  
  function attempt() {
    if (retries >= maxRetries) {
      log('PrivacyMode', 'Max retries reached, privacy mode may not be fully applied');
      return;
    }
    
    const valueElements = document.querySelectorAll(VALUE_SELECTOR);
    if (valueElements.length === 0) {
      retries++;
      log('PrivacyMode', `Retry attempt ${retries}: No value elements found, retrying in ${delay}ms`);
      setTimeout(attempt, delay);
    } else {
      log('PrivacyMode', `Value elements found on retry ${retries}, applying privacy mode`);
      updatePrivacyMode();
    }
  }
  
  attempt();
}

/**
 * Starts continuous monitoring for dynamically added elements.
 */
function startContinuousMonitoring() {
  setInterval(() => {
    const valueElements = document.querySelectorAll(VALUE_SELECTOR);
    valueElements.forEach((element, index) => {
      if (element instanceof HTMLElement && !element.dataset.privacyManaged) {
        updateElement(element, index);
        element.dataset.privacyManaged = 'true';
      }
    });
  }, 1000); // Check every second
}

/**
 * Sets up a mutation observer to watch for changes in the Portfolio and Cash values.
 */
function setupMutationObserver() {
  const targetNode = document.body;
  const config = { childList: true, subtree: true, characterData: true, attributes: true };
  
  const callback = function(mutationsList: MutationRecord[], observer: MutationObserver) {
    for(let mutation of mutationsList) {
      if (mutation.type === 'childList' || mutation.type === 'characterData' || (mutation.type === 'attributes' && mutation.attributeName === 'class')) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasRelevantChanges = addedNodes.some(node => 
          node instanceof HTMLElement && (node.matches(VALUE_SELECTOR) || node.querySelector(VALUE_SELECTOR))
        ) || (mutation.target instanceof HTMLElement && mutation.target.matches(VALUE_SELECTOR));
        
        if (hasRelevantChanges) {
          log('PrivacyMode', 'Relevant DOM changes detected, updating privacy mode');
          updatePrivacyMode();
        }
      }
    }
  };
  
  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

export class PrivacyModeState {
  private static instance: PrivacyModeState;
  private _isEnabled: boolean = false;
  private stateChangeCallbacks: ((enabled: boolean) => void)[] = [];
  private valueElements: Set<HTMLElement> = new Set();

  private constructor() {
    this.loadInitialState();
    this.setupMessageListener();
    this.setupMutationObserver();
  }

  static getInstance(): PrivacyModeState {
    if (!PrivacyModeState.instance) {
      PrivacyModeState.instance = new PrivacyModeState();
    }
    return PrivacyModeState.instance;
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

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  async toggle(): Promise<void> {
    await this.setEnabled(!this._isEnabled);
  }

  private async setEnabled(value: boolean): Promise<void> {
    if (this._isEnabled === value) return;

    this._isEnabled = value;
    log('PrivacyMode', `State updated: ${value}`);

    try {
      await chrome.storage.local.set({ [PRIVACY_MODE_KEY]: value });
      log('PrivacyMode', `State persisted: ${value}`);
      this.updateAllElements();
      this.notifyStateChange();
    } catch (error) {
      log('PrivacyMode', 'Error persisting state:', error);
    }
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'updatePrivacyMode') {
        this.setEnabled(message.enabled);
        sendResponse({ received: true });
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
        this.findAndUpdateElements();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
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
      element.textContent = maskValue(element.dataset.originalValue);
    } else {
      element.textContent = element.dataset.originalValue || element.textContent || '';
      delete element.dataset.originalValue;
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

  onStateChange(callback: (enabled: boolean) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
    };
  }
}

export const privacyModeState = PrivacyModeState.getInstance();

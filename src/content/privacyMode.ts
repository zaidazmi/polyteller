import { log } from '../utils/logUtils';
import { getPrivacyModeState, setPrivacyModeState, maskValue } from '../utils/privacyUtils';

// Selectors and constants
const VALUE_SELECTOR = '.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css';
const TOGGLE_ICON_CLASS = 'privacy-mode-toggle-icon';

// Global state
let isPrivacyModeEnabled = false;

/**
 * Initializes the privacy mode feature.
 * This function is called when the content script loads and when the URL changes.
 */
async function initPrivacyMode() {
  isPrivacyModeEnabled = await getPrivacyModeState();
  addToggleIcon();
  updatePrivacyMode();
}

/**
 * Updates the display of sensitive information based on the privacy mode state.
 * This function is called whenever the privacy mode state changes.
 */
function updatePrivacyMode() {
  const valueElements = document.querySelectorAll(VALUE_SELECTOR);
  valueElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      if (isPrivacyModeEnabled) {
        // Store the original value and display masked value
        element.dataset.originalValue = element.textContent || '';
        element.textContent = maskValue(element.dataset.originalValue);
      } else {
        // Restore the original value
        element.textContent = element.dataset.originalValue || element.textContent;
      }
    }
  });
  updateToggleIcon();
}

/**
 * Adds the privacy mode toggle icon to the page.
 * This function is called once during initialization.
 */
function addToggleIcon() {
  if (document.querySelector(`.${TOGGLE_ICON_CLASS}`)) return; // Avoid adding multiple icons

  const portfolioElement = document.querySelector('.c-gBrBnR.c-dNAgLP.c-gBrBnR-gDWzxt-variant-primary.c-gBrBnR-gFoOfa-cv');
  const cashElement = portfolioElement?.nextElementSibling;

  if (portfolioElement instanceof HTMLElement && cashElement instanceof HTMLElement) {
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
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      cursor: pointer;
      z-index: 1000;
      padding: 5px;
    `;
    toggleIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePrivacyMode();
    });

    // Create a wrapper div for positioning
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute;
      top: ${cashElement.offsetTop + cashElement.offsetHeight}px;
      left: ${portfolioElement.offsetLeft}px;
      width: ${cashElement.offsetLeft + cashElement.offsetWidth - portfolioElement.offsetLeft}px;
      height: 0;
      overflow: visible;
    `;
    wrapper.appendChild(toggleIcon);

    // Insert the wrapper after the cash element
    cashElement.parentNode?.insertBefore(wrapper, cashElement.nextSibling);

    updateToggleIconPosition();

    log('PrivacyMode', 'Toggle icon added');
  } else {
    log('PrivacyMode', 'Target elements for toggle icon not found or are not HTMLElements');
  }
}

/**
 * Updates the appearance of the toggle icon based on the privacy mode state.
 */
function updateToggleIcon() {
  const toggleIcon = document.querySelector(`.${TOGGLE_ICON_CLASS}`);
  if (toggleIcon instanceof HTMLElement) {
    toggleIcon.style.opacity = isPrivacyModeEnabled ? '1' : '0.3';
    toggleIcon.title = isPrivacyModeEnabled ? 'Disable Privacy Mode' : 'Enable Privacy Mode';
  }
}

/**
 * Updates the position of the toggle icon.
 * This function is called on window resize and periodically to ensure correct positioning.
 */
function updateToggleIconPosition() {
  const toggleIcon = document.querySelector(`.${TOGGLE_ICON_CLASS}`);
  const wrapper = toggleIcon?.parentElement;
  const portfolioElement = document.querySelector('.c-gBrBnR.c-dNAgLP.c-gBrBnR-gDWzxt-variant-primary.c-gBrBnR-gFoOfa-cv');
  const cashElement = portfolioElement?.nextElementSibling;

  if (wrapper instanceof HTMLElement && portfolioElement instanceof HTMLElement && cashElement instanceof HTMLElement) {
    wrapper.style.top = `${cashElement.offsetTop + cashElement.offsetHeight}px`;
    wrapper.style.left = `${portfolioElement.offsetLeft}px`;
    wrapper.style.width = `${cashElement.offsetLeft + cashElement.offsetWidth - portfolioElement.offsetLeft}px`;
  }
}

/**
 * Toggles the privacy mode state and updates the UI accordingly.
 */
async function togglePrivacyMode() {
  isPrivacyModeEnabled = !isPrivacyModeEnabled;
  await setPrivacyModeState(isPrivacyModeEnabled);
  updatePrivacyMode();
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
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    initPrivacyMode();
  }
}).observe(document, {subtree: true, childList: true});

import { log } from '../utils/logUtils';
import { getPrivacyModeState, setPrivacyModeState, maskValue } from '../utils/privacyUtils';

const VALUE_SELECTOR = '.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css';
const TOGGLE_ICON_CLASS = 'privacy-mode-toggle-icon';

let isPrivacyModeEnabled = false;

async function initPrivacyMode() {
  isPrivacyModeEnabled = await getPrivacyModeState();
  addToggleIcon();
  updatePrivacyMode();
}

function updatePrivacyMode() {
  const valueElements = document.querySelectorAll(VALUE_SELECTOR);
  valueElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      if (isPrivacyModeEnabled) {
        element.dataset.originalValue = element.textContent || '';
        element.textContent = maskValue(element.dataset.originalValue);
      } else {
        element.textContent = element.dataset.originalValue || element.textContent;
      }
    }
  });
  updateToggleIcon();
}

function addToggleIcon() {
  if (document.querySelector(`.${TOGGLE_ICON_CLASS}`)) return; // Avoid adding multiple icons

  const targetElement = document.querySelector('.c-gBrBnR.c-dNAgLP.c-gBrBnR-gDWzxt-variant-primary.c-gBrBnR-gFoOfa-cv');
  if (targetElement instanceof HTMLElement) {
    const toggleIcon = document.createElement('div');
    toggleIcon.className = TOGGLE_ICON_CLASS;
    toggleIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
      </svg>
    `;
    toggleIcon.style.cssText = `
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      cursor: pointer;
      padding: 5px;
      background-color: white;
      border-radius: 50%;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 1000;
    `;
    toggleIcon.addEventListener('click', togglePrivacyMode);
    targetElement.style.position = 'relative';
    targetElement.appendChild(toggleIcon);
    log('PrivacyMode', 'Toggle icon added');
  } else {
    log('PrivacyMode', 'Target element for toggle icon not found or is not an HTMLElement');
  }
}

function updateToggleIcon() {
  const toggleIcon = document.querySelector(`.${TOGGLE_ICON_CLASS}`);
  if (toggleIcon instanceof HTMLElement) {
    toggleIcon.style.opacity = isPrivacyModeEnabled ? '1' : '0.5';
  }
}

async function togglePrivacyMode() {
  isPrivacyModeEnabled = !isPrivacyModeEnabled;
  await setPrivacyModeState(isPrivacyModeEnabled);
  updatePrivacyMode();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updatePrivacyMode') {
    isPrivacyModeEnabled = message.enabled;
    updatePrivacyMode();
    sendResponse({ received: true });
  }
});

// Run the initialization
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


/*!
 * Polyteller 
 * Copyright (C) 2024 Zaid Azmi
 * All rights reserved
 * 
 * This source code is licensed under a proprietary license.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * 
 * Author: Zaid Azmi
 * Website: https://polyteller.com
 * Email : polytellerapp@gmail.com
 * Version: 1.0.0
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/utils/logUtils.ts":
/*!*******************************!*\
  !*** ./src/utils/logUtils.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   log: () => (/* binding */ log),
/* harmony export */   logError: () => (/* binding */ logError)
/* harmony export */ });
const IS_PRODUCTION = "development" === 'production';
function log(context, ...args) {
    if (!IS_PRODUCTION) {
        console.log(`[Polyteller ${context}]`, ...args);
    }
}
function logError(context, error) {
    if (IS_PRODUCTION) {
        chrome.storage.local.get('errorLogs', (result) => {
            const logs = result.errorLogs || [];
            logs.push({
                timestamp: new Date().toISOString(),
                context,
                error: error.message,
                stack: error.stack
            });
            chrome.storage.local.set({ errorLogs: logs.slice(-100) });
        });
    }
    else {
        console.error(`[Polyteller ${context}] Error:`, error);
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!************************************!*\
  !*** ./src/content/privacyMode.ts ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PRIVACY_MODE_KEY: () => (/* binding */ PRIVACY_MODE_KEY),
/* harmony export */   PrivacyModeState: () => (/* binding */ PrivacyModeState),
/* harmony export */   VALUE_SELECTOR: () => (/* binding */ VALUE_SELECTOR),
/* harmony export */   privacyModeState: () => (/* binding */ privacyModeState),
/* harmony export */   togglePrivacyMode: () => (/* binding */ togglePrivacyMode)
/* harmony export */ });
/* harmony import */ var _utils_logUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/logUtils */ "./src/utils/logUtils.ts");

// Constants
const PRIVACY_MODE_KEY = 'privacyModeEnabled';
const VALUE_SELECTOR = '.c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css';
const TOGGLE_ICON_CLASS = 'privacy-mode-toggle-icon';
const MUTATION_DEBOUNCE_TIME = 100;
/**
 * Adds the privacy mode toggle icon to the page.
 */
function addToggleIcon() {
    const findAndAddIcon = () => {
        if (document.querySelector(`.${TOGGLE_ICON_CLASS}`))
            return true;
        const portfolioElement = document.querySelector('a[href="/portfolio"].c-gBrBnR.c-dNAgLP.c-gBrBnR-gDWzxt-variant-primary.c-gBrBnR-gFoOfa-cv');
        if (!(portfolioElement instanceof HTMLElement))
            return false;
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
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease-in-out;
    `;
        toggleIcon.addEventListener('mouseenter', () => {
            toggleIcon.style.transform = 'translateX(-50%) scale(1.1)';
            toggleIcon.style.opacity = '1';
        });
        toggleIcon.addEventListener('mouseleave', () => {
            toggleIcon.style.transform = 'translateX(-50%) scale(1)';
            toggleIcon.style.opacity = '0.25';
        });
        toggleIcon.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await privacyModeState.toggle();
            toggleIcon.style.transform = 'translateX(-50%) scale(0.95)';
            setTimeout(() => {
                toggleIcon.style.transform = 'translateX(-50%) scale(1)';
            }, 100);
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
        const updateIconColor = (enabled) => {
            toggleIcon.style.color = enabled ? '#4A4FE4' : '#666666';
            toggleIcon.style.opacity = '0.25';
        };
        updateIconColor(privacyModeState.isEnabled);
        privacyModeState.onStateChange(updateIconColor);
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', 'Toggle icon added');
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
    }
    else {
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
class PrivacyModeState {
    constructor() {
        this._isEnabled = false;
        this.stateChangeCallbacks = [];
        this.valueElements = new Set();
        this.mutationDebounceTimeout = null;
        this.pendingElements = new Set();
        this.initialize();
    }
    async initialize() {
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
    static getInstance() {
        if (!PrivacyModeState.instance) {
            PrivacyModeState.instance = new PrivacyModeState();
        }
        return PrivacyModeState.instance;
    }
    get isEnabled() {
        return this._isEnabled;
    }
    async toggle() {
        await this.setEnabled(!this._isEnabled);
    }
    async setEnabled(value) {
        if (this._isEnabled === value)
            return;
        this._isEnabled = value;
        (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', `State updated: ${value}`);
        try {
            await chrome.storage.local.set({ [PRIVACY_MODE_KEY]: value });
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', `State persisted: ${value}`);
            if (value) {
                document.body.classList.add('privacy-enabled');
            }
            else {
                document.body.classList.remove('privacy-enabled');
            }
            this.updateAllElements();
            this.notifyStateChange();
            chrome.runtime.sendMessage({
                action: 'updatePrivacyMode',
                enabled: value
            });
        }
        catch (error) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', 'Error persisting state:', error);
        }
    }
    async loadInitialState() {
        try {
            const result = await chrome.storage.local.get(PRIVACY_MODE_KEY);
            this._isEnabled = result[PRIVACY_MODE_KEY] || false;
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', `Initial state loaded: ${this._isEnabled}`);
            this.updateAllElements();
        }
        catch (error) {
            (0,_utils_logUtils__WEBPACK_IMPORTED_MODULE_0__.log)('PrivacyMode', 'Error loading initial state:', error);
        }
    }
    setupMessageListener() {
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
    setupMutationObserver() {
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
    isMutationRelevant(mutation) {
        if (mutation.type === 'childList') {
            return Array.from(mutation.addedNodes).some(node => node instanceof HTMLElement &&
                (node.matches(VALUE_SELECTOR) || node.querySelector(VALUE_SELECTOR)));
        }
        return false;
    }
    findAndUpdateElements() {
        const elements = document.querySelectorAll(VALUE_SELECTOR);
        elements.forEach(element => {
            if (element instanceof HTMLElement) {
                this.valueElements.add(element);
                this.updateElement(element);
            }
        });
    }
    updateElement(element) {
        if (this._isEnabled) {
            if (!element.dataset.originalValue) {
                element.dataset.originalValue = element.textContent || '';
            }
        }
        else {
            if (element.dataset.originalValue) {
                element.textContent = element.dataset.originalValue;
                delete element.dataset.originalValue;
            }
        }
    }
    updateAllElements() {
        this.valueElements.forEach(element => {
            if (document.body.contains(element)) {
                this.updateElement(element);
            }
            else {
                this.valueElements.delete(element);
            }
        });
    }
    notifyStateChange() {
        this.stateChangeCallbacks.forEach(callback => callback(this._isEnabled));
    }
    onStateChange(callback) {
        this.stateChangeCallbacks.push(callback);
        return () => {
            this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
        };
    }
}
// Export the singleton instance
const privacyModeState = PrivacyModeState.getInstance();
// Export the toggle function
async function togglePrivacyMode() {
    await privacyModeState.toggle();
}

})();

/******/ })()
;
//# sourceMappingURL=privacyMode.js.map
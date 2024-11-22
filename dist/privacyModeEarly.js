
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
/*!*****************************************!*\
  !*** ./src/content/privacyModeEarly.ts ***!
  \*****************************************/

/**
 * Early initialization script for privacy mode.
 * This script runs before any other content scripts to prevent value leaks.
 */
(() => {
    // Create and inject style immediately
    const style = document.createElement('style');
    style.id = 'polyteller-privacy-early';
    style.textContent = `
        /* Initially hide all value elements */
        .c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css,
        [class*="jaFKlk"],
        [class*="ibdakYG"] {
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
        }

        /* When privacy mode is OFF - remove our overrides completely */
        body:not(.privacy-enabled) .c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css,
        body:not(.privacy-enabled) [class*="jaFKlk"],
        body:not(.privacy-enabled) [class*="ibdakYG"] {
            opacity: 1;
            /* No color override */
            /* No text-shadow override */
        }

        /* When privacy mode is ON - mask values */
        body.privacy-enabled .c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css,
        body.privacy-enabled [class*="jaFKlk"],
        body.privacy-enabled [class*="ibdakYG"] {
            opacity: 1;
            color: transparent !important;
            text-shadow: 0 0 8px rgba(0,0,0,0.5) !important;
        }
    `;
    // Function to inject style
    const injectStyle = () => {
        if (document.documentElement) {
            document.documentElement.appendChild(style);
        }
    };
    // Inject immediately
    injectStyle();
    // Check initial state and show values
    const checkInitialState = async () => {
        try {
            const result = await chrome.storage.local.get('privacyModeEnabled');
            if (result.privacyModeEnabled) {
                document.body?.classList.add('privacy-enabled');
            }
            else {
                document.body?.classList.remove('privacy-enabled');
            }
            // Add ready class to show values
            document.body?.classList.add('privacy-ready');
        }
        catch (error) {
            console.error('Error checking initial privacy state:', error);
        }
    };
    // Wait for body to be available
    const waitForBody = () => {
        if (document.body) {
            checkInitialState();
        }
        else {
            requestAnimationFrame(waitForBody);
        }
    };
    waitForBody();
    // Listen for privacy mode updates
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'updatePrivacyMode') {
            if (message.enabled) {
                document.body?.classList.add('privacy-enabled');
            }
            else {
                document.body?.classList.remove('privacy-enabled');
            }
        }
    });
})();

/******/ })()
;
//# sourceMappingURL=privacyModeEarly.js.map
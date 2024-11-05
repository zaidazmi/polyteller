/**
 * Early initialization script for privacy mode.
 * This script runs before any other content scripts to prevent value leaks.
 */

(() => {
    // Create and inject style immediately
    const style = document.createElement('style');
    style.id = 'polyteller-privacy-early';
    style.textContent = `
        /* Only apply styles when privacy mode is enabled */
        body.privacy-enabled .c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css,
        body.privacy-enabled [class*="jaFKlk"],
        body.privacy-enabled [class*="ibdakYG"] {
            color: transparent !important;
            text-shadow: 0 0 8px rgba(0,0,0,0.5) !important;
            transition: color 0.2s ease-in-out, text-shadow 0.2s ease-in-out;
        }

        /* No styles for disabled state - let Polymarket's styles take over */
    `;

    // Function to inject style
    const injectStyle = () => {
        if (document.documentElement) {
            document.documentElement.appendChild(style);
        }
    };

    // Inject immediately
    injectStyle();

    // Check initial state
    const checkInitialState = () => {
        try {
            chrome.storage.local.get('privacyModeEnabled', (result) => {
                if (result.privacyModeEnabled) {
                    document.body?.classList.add('privacy-enabled');
                }
            });
        } catch (error) {
            console.error('Error checking initial privacy state:', error);
        }
    };

    // Wait for body to be available
    if (document.body) {
        checkInitialState();
    } else {
        const observer = new MutationObserver(() => {
            if (document.body) {
                checkInitialState();
                observer.disconnect();
            }
        });
        observer.observe(document.documentElement, { childList: true });
    }

    // Listen for privacy mode updates
    try {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.action === 'updatePrivacyMode') {
                if (message.enabled) {
                    document.body?.classList.add('privacy-enabled');
                } else {
                    document.body?.classList.remove('privacy-enabled');
                }
            }
        });
    } catch (error) {
        console.error('Error setting up privacy mode listener:', error);
    }
})(); 
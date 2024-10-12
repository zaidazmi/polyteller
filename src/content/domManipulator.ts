/**
 * DOM manipulator for Polyteller.
 * This file contains functions for observing and manipulating the DOM.
 */

/**
 * Initializes a MutationObserver to watch for DOM changes and trigger a callback.
 * @param callback - The function to call when DOM changes are detected
 */
export function initializeDOMObserver(callback: () => void) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        callback();
        break;
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

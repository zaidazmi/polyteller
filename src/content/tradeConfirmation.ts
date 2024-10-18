import { log } from '../utils/logUtils';
// Remove this line
// import { loadFromStorage } from '../utils/storageUtils';

console.log('%c[Polyteller TradeConfirmation] Script loaded', 'color: red; font-size: 20px;');

let isTradeConfirmationEnabled = true;

// Update the message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTradeConfirmation') {
    log('TradeConfirmation', `Received update: ${message.enabled}`);
    chrome.storage.local.set({ enableTradeConfirmation: message.enabled }, () => {
      log('TradeConfirmation', `Saved state to storage: ${message.enabled}`);
      sendResponse({ received: true });
    });
    return true; // Indicates that the response is sent asynchronously
  }
});

// Initial setup
chrome.storage.local.get('enableTradeConfirmation', (result) => {
  isTradeConfirmationEnabled = result.enableTradeConfirmation !== false;
  log('TradeConfirmation', `Initial trade confirmation state: ${isTradeConfirmationEnabled ? 'enabled' : 'disabled'}`);
});

export { isTradeConfirmationEnabled };

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

// Add this function to apply styles to the trade confirmation popup
function applyTradeConfirmationStyles(dialog: HTMLElement) {
  dialog.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
  dialog.style.backgroundColor = 'var(--card-background, #FFFFFF)';
  dialog.style.borderRadius = '12px';
  dialog.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
  dialog.style.color = 'var(--text-color, #1A1B25)';
  dialog.style.fontSize = '14px';
  
  // Style the buttons
  const buttons = dialog.querySelectorAll('button');
  buttons.forEach(button => {
    button.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    button.style.borderRadius = '6px';
    button.style.padding = '10px 16px';
    button.style.fontSize = '14px';
    button.style.fontWeight = '600';
    button.style.cursor = 'pointer';
    button.style.transition = 'background-color 0.2s ease';
  });
}

// Make sure to call this function when creating the trade confirmation popup
// For example:
// const dialog = createConfirmationDialog();
// applyTradeConfirmationStyles(dialog);

export { isTradeConfirmationEnabled, applyTradeConfirmationStyles };

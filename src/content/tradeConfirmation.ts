import { log } from '../utils/logUtils';
// Remove this line
// import { loadFromStorage } from '../utils/storageUtils';

console.log('%c[Polyteller TradeConfirmation] Script loaded', 'color: red; font-size: 20px;');

let isTradeConfirmationEnabled = true;

function createConfirmationModal() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1001;
  `;
  modal.innerHTML = `
    <h3>Confirm Trade</h3>
    <p>Are you sure you want to proceed with this trade?</p>
    <button id="confirm-trade">Confirm</button>
    <button id="cancel-trade">Cancel</button>
  `;
  return modal;
}

function initTradeConfirmation(button: HTMLButtonElement) {
  console.log('[Polyteller TradeConfirmation] Initializing trade confirmation');
  
  const originalClickHandler = button.onclick;
  button.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    chrome.storage.local.get('enableTradeConfirmation', (result) => {
      const isTradeConfirmationEnabled = result.enableTradeConfirmation !== false;
      console.log(`[Polyteller TradeConfirmation] Trade confirmation enabled: ${isTradeConfirmationEnabled}`);
      
      if (!isTradeConfirmationEnabled) {
        console.log('[Polyteller TradeConfirmation] Trade confirmation disabled, proceeding with original click');
        if (originalClickHandler) {
          originalClickHandler.call(button, e);
        } else {
          button.click();
        }
        return;
      }
      
      console.log('[Polyteller TradeConfirmation] Trade confirmation enabled, showing modal');
      showConfirmationDialog(button.getBoundingClientRect(), (confirmed) => {
        if (confirmed) {
          console.log('[Polyteller TradeConfirmation] Order confirmed, proceeding with purchase');
          if (originalClickHandler) {
            originalClickHandler.call(button, e);
          } else {
            button.click();
          }
        } else {
          console.log('[Polyteller TradeConfirmation] Order cancelled by user');
        }
      });
    });
  };
}

function checkForBuyButton() {
  console.log('[Polyteller TradeConfirmation] Checking for buy button');
  
  const buyButtonSelectors = [
    'button[data-testid="place-order-button"]',
    'button.polymarket-buy-button',
    'button:not([disabled])'
  ];
  
  let buyButton: HTMLButtonElement | null = null;
  
  for (const selector of buyButtonSelectors) {
    const button = document.querySelector(selector) as HTMLButtonElement | null;
    if (button) {
      buyButton = button;
      console.log(`[Polyteller TradeConfirmation] Buy button found with selector: ${selector}`);
      break;
    }
  }
  
  if (buyButton) {
    console.log('[Polyteller TradeConfirmation] Buy button found, initializing');
    initTradeConfirmation(buyButton);
  } else {
    console.log('[Polyteller TradeConfirmation] Buy button not found');
  }
}

function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        checkForBuyButton();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log('[Polyteller TradeConfirmation] MutationObserver set up');
}

// Update the message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTradeConfirmation') {
    console.log(`[Polyteller TradeConfirmation] Received update: ${message.enabled}`);
    chrome.storage.local.set({ enableTradeConfirmation: message.enabled }, () => {
      console.log(`[Polyteller TradeConfirmation] Saved state to storage: ${message.enabled}`);
      sendResponse({ received: true });
    });
    return true; // Indicates that the response is sent asynchronously
  }
});

// Initial setup
chrome.storage.local.get('enableTradeConfirmation', (result) => {
  isTradeConfirmationEnabled = result.enableTradeConfirmation !== false;
  console.log(`[Polyteller TradeConfirmation] Initial trade confirmation state: ${isTradeConfirmationEnabled ? 'enabled' : 'disabled'}`);
  checkForBuyButton();
});

// Always observe DOM changes
observeDOMChanges();

function showConfirmationDialog(buttonRect: DOMRect, callback: (confirmed: boolean) => void) {
  const dialog = createConfirmationModal();
  document.body.appendChild(dialog);

  // Position the dialog
  const dialogRect = dialog.getBoundingClientRect();
  const topPosition = buttonRect.top + window.scrollY - dialogRect.height - 10;
  const leftPosition = buttonRect.left + window.scrollX + (buttonRect.width / 2) - (dialogRect.width / 2);

  dialog.style.top = `${Math.max(0, topPosition)}px`;
  dialog.style.left = `${Math.max(0, leftPosition)}px`;
  dialog.style.display = 'block';

  const handleResponse = (confirmed: boolean) => {
    document.body.removeChild(dialog);
    callback(confirmed);
  };

  dialog.querySelector('#confirm-trade')?.addEventListener('click', () => handleResponse(true));
  dialog.querySelector('#cancel-trade')?.addEventListener('click', () => handleResponse(false));
}

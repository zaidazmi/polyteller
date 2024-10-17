import { log } from '../utils/logUtils';

console.log('%c[Polyteller TradeConfirmation] Script loaded', 'color: red; font-size: 20px;');

function createOverlay(button: HTMLElement) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 0, 0, 0.3); // More visible red background for debugging
    cursor: pointer;
    z-index: 1000;
    pointer-events: auto;
  `;
  button.style.position = 'relative';
  button.appendChild(overlay);
  console.log('[Polyteller TradeConfirmation] Overlay created and appended to button');
  return overlay;
}

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
  
  const buyButton = button;
  
  console.log('[Polyteller TradeConfirmation] Buy button query result in initTradeConfirmation:', buyButton);
  
  if (buyButton) {
    console.log('[Polyteller TradeConfirmation] Buy button found:', buyButton);
    const overlay = createOverlay(buyButton);
    console.log('[Polyteller TradeConfirmation] Overlay created:', overlay);
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      const modal = createConfirmationModal();
      document.body.appendChild(modal);

      document.getElementById('confirm-trade')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        overlay.style.display = 'none';
        buyButton.click();
      });

      document.getElementById('cancel-trade')?.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    });
  } else {
    console.log('[Polyteller TradeConfirmation] Buy button not found in initTradeConfirmation');
  }
}

function checkForBuyButton() {
  console.log('[Polyteller TradeConfirmation] Checking for buy button');
  
  // Remove the invalid :contains() selector
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
  
  console.log('[Polyteller TradeConfirmation] Buy button query result:', buyButton);
  
  if (buyButton) {
    console.log('[Polyteller TradeConfirmation] Buy button found, initializing');
    initTradeConfirmation(buyButton);
  } else {
    console.log('[Polyteller TradeConfirmation] Buy button not found');
    // Log all buttons on the page for debugging
    const allButtons = document.querySelectorAll('button');
    console.log('[Polyteller TradeConfirmation] All buttons on the page:', allButtons);
    
    // Log button text content
    Array.from(allButtons).forEach((button, index) => {
      console.log(`[Polyteller TradeConfirmation] Button ${index} text:`, button.textContent?.trim());
    });
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

chrome.storage.sync.get({ enableTradeConfirmation: true }, ({ enableTradeConfirmation }) => {
  console.log('[Polyteller TradeConfirmation] Trade confirmation enabled:', enableTradeConfirmation);
  if (enableTradeConfirmation) {
    // Add a delay before the initial check
    setTimeout(() => {
      console.log('[Polyteller TradeConfirmation] Initial check after delay');
      checkForBuyButton();
      observeDOMChanges();
    }, 2000); // 2 seconds delay
  }
});

// Listen for changes to the enableTradeConfirmation setting
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enableTradeConfirmation) {
    if (changes.enableTradeConfirmation.newValue) {
      log('TradeConfirmation', 'Trade confirmation enabled');
      checkForBuyButton();
    } else {
      log('TradeConfirmation', 'Trade confirmation disabled');
      // Remove overlay if it exists
      const overlay = document.querySelector('.polymarket-buy-button > div') as HTMLElement;
      if (overlay) {
        overlay.remove();
      }
    }
  }
});

setTimeout(() => {
  checkForBuyButton();
}, 15000); // 15 seconds delay

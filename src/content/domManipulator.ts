/**
 * DOM manipulator for Polyteller.
 * This file contains functions for observing and manipulating the DOM.
 */

import { log } from '../utils/logUtils';
import { MIN_WIDTH_FOR_CONFIRMATION } from '../config';

let isProcessingClick = false;
let confirmationDialog: HTMLDivElement | null = null;

let countdownInterval: number | null = null;

function createConfirmationDialog(): HTMLDivElement {
  const dialog = document.createElement('div');
  dialog.id = 'polyteller-confirmation-dialog';
  dialog.style.cssText = `
    position: fixed;
    background-color: #FFFFFF;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    color: #333333;
    width: 280px;
    text-align: center;
  `;
  dialog.innerHTML = `
    <div style="position: relative;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">Confirm Order</h2>
      <button id="closeDialog" style="position: absolute; top: -10px; right: -10px; background: none; border: none; cursor: pointer; font-size: 20px; color: #999;">×</button>
      <p style="margin-bottom: 20px; font-size: 14px;">Are you sure you want to place this order?</p>
      <div style="display: flex; justify-content: center; gap: 10px;">
        <button id="confirmYes" style="
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
          color: #333;
          padding: 8px 20px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
          font-weight: bold;
        ">Yes</button>
        <button id="confirmNo" style="
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
          color: #333;
          padding: 8px 20px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
          font-weight: bold;
        ">No (3)</button>
      </div>
    </div>
  `;
  
  // Add hover effects
  const buttons = dialog.querySelectorAll('button');
  buttons.forEach(button => {
    if (button.id !== 'closeDialog') {
      button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#e0e0e0';
      });
      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#f5f5f5';
      });
    }
  });

  document.body.appendChild(dialog);
  return dialog;
}

function showConfirmationDialog(buttonRect: DOMRect, callback: (confirmed: boolean) => void) {
  // Disable confirmation for screens smaller than MIN_WIDTH_FOR_CONFIRMATION
  if (window.innerWidth < MIN_WIDTH_FOR_CONFIRMATION) {
    callback(true); // Automatically confirm for small screens
    return;
  }

  if (!confirmationDialog) {
    confirmationDialog = createConfirmationDialog();
  }
  
  // Reset the countdown and button text every time the dialog is shown
  let countdown = 3; 
  const noButton = confirmationDialog.querySelector('#confirmNo') as HTMLButtonElement;
  noButton.textContent = `No (${countdown})`;

  // Force the dialog to be visible but off-screen to get its dimensions
  confirmationDialog.style.display = 'block';
  confirmationDialog.style.top = '-9999px';
  confirmationDialog.style.left = '-9999px';
  
  // Get the updated dimensions of the dialog
  const dialogRect = confirmationDialog.getBoundingClientRect();
  
  // Calculate position
  const topPosition = buttonRect.top + window.scrollY - dialogRect.height - 10; // 10px gap above the button
  const leftPosition = buttonRect.left + window.scrollX + (buttonRect.width / 2) - (dialogRect.width / 2);

  // Ensure the dialog doesn't go off the top of the screen
  const adjustedTopPosition = Math.max(window.scrollY + 10, topPosition);

  // Set the final position
  confirmationDialog.style.top = `${adjustedTopPosition}px`;
  confirmationDialog.style.left = `${leftPosition}px`;

  // Ensure the dialog is visible
  confirmationDialog.style.display = 'block';
  
  const yesButton = confirmationDialog.querySelector('#confirmYes') as HTMLButtonElement;
  const closeButton = confirmationDialog.querySelector('#closeDialog') as HTMLButtonElement;

  const handleResponse = (confirmed: boolean) => {
    confirmationDialog!.style.display = 'none';
    yesButton.removeEventListener('click', handleYes);
    noButton.removeEventListener('click', handleNo);
    closeButton.removeEventListener('click', handleClose);
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    callback(confirmed);
  };
  
  const handleYes = () => handleResponse(true);
  const handleNo = () => handleResponse(false);
  const handleClose = () => handleResponse(false);
  
  yesButton.addEventListener('click', handleYes);
  noButton.addEventListener('click', handleNo);
  closeButton.addEventListener('click', handleClose);

  // Clear any existing interval before starting a new one
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = window.setInterval(() => {
    countdown--;
    noButton.textContent = `No (${countdown})`;
    if (countdown <= 0) {
      handleNo();
    }
  }, 1000);
}

export function interceptBuyButton() {
  const clickHandler = (event: MouseEvent) => {
    if (isProcessingClick) return;
    
    const target = event.target as HTMLElement;
    log('DOMManipulator', `Element clicked: ${target.tagName} - ${target.textContent}`);
    
    let currentElement: HTMLElement | null = target;
    while (currentElement) {
      if (currentElement.tagName === 'BUTTON' && currentElement.textContent?.toLowerCase().includes('buy')) {
        isProcessingClick = true;
        log('DOMManipulator', 'Buy button clicked, checking confirmation setting');
        event.preventDefault();
        event.stopPropagation();

        chrome.storage.local.get('enableTradeConfirmation', (result) => {
          const isTradeConfirmationEnabled = result.enableTradeConfirmation !== false;
          log('DOMManipulator', `Trade confirmation enabled: ${isTradeConfirmationEnabled}`);

          if (!isTradeConfirmationEnabled) {
            log('DOMManipulator', 'Trade confirmation disabled, proceeding with purchase');
            currentElement!.click();
            isProcessingClick = false;
          } else {
            const buttonRect = currentElement!.getBoundingClientRect();
            showConfirmationDialog(buttonRect, (confirmed) => {
              if (confirmed) {
                log('DOMManipulator', 'Order confirmed, proceeding with purchase');
                currentElement!.click();
              } else {
                log('DOMManipulator', 'Order cancelled by user');
              }
              isProcessingClick = false;
            });
          }
        });
        break;
      }
      currentElement = currentElement.parentElement;
    }
  };

  document.body.addEventListener('click', clickHandler, true);
  log('DOMManipulator', 'Buy button interception set up');
}

export function initializeDOMManipulations() {
  interceptBuyButton();
}

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

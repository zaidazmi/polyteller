/**
 * DOM manipulator for Polyteller.
 * This file contains functions for observing and manipulating the DOM.
 */

import { log } from '../utils/logUtils';

let isProcessingClick = false;
let confirmationDialog: HTMLDivElement | null = null;

function createConfirmationDialog(): HTMLDivElement {
  const dialog = document.createElement('div');
  dialog.id = 'polyteller-confirmation-dialog';
  dialog.style.cssText = `
    position: fixed;
    background-color: var(--card-background, #FFFFFF);
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    display: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--text-color, #1A1B25);
    width: 220px;
    text-align: center;
    border: 1px solid #e0e0e0;
  `;
  dialog.innerHTML = `
    <div style="position: relative;">
      <button id="closeDialog" style="position: absolute; top: -10px; right: -10px; background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
      <h2 style="margin-bottom: 10px; font-size: 16px; font-weight: 600;">Confirm Order</h2>
      <p style="margin-bottom: 15px; font-size: 14px;">Are you sure you want to place this order?</p>
      <div style="display: flex; justify-content: center; gap: 10px;">
        <button id="confirmYes" class="polyteller-button polyteller-button-yes">Yes</button>
        <button id="confirmNo" class="polyteller-button polyteller-button-no">No</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
  return dialog;
}

function showConfirmationDialog(buttonRect: DOMRect, callback: (confirmed: boolean) => void) {
  if (!confirmationDialog) {
    confirmationDialog = createConfirmationDialog();
  }
  
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
  
  const yesButton = confirmationDialog.querySelector('#confirmYes');
  const noButton = confirmationDialog.querySelector('#confirmNo');
  const closeButton = confirmationDialog.querySelector('#closeDialog');
  
  const handleResponse = (confirmed: boolean) => {
    confirmationDialog!.style.display = 'none';
    yesButton!.removeEventListener('click', handleYes);
    noButton!.removeEventListener('click', handleNo);
    closeButton!.removeEventListener('click', handleClose);
    callback(confirmed);
  };
  
  const handleYes = () => handleResponse(true);
  const handleNo = () => handleResponse(false);
  const handleClose = () => handleResponse(false);
  
  yesButton!.addEventListener('click', handleYes);
  noButton!.addEventListener('click', handleNo);
  closeButton!.addEventListener('click', handleClose);
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
        log('DOMManipulator', 'Buy button clicked, showing confirmation');
        event.preventDefault();
        event.stopPropagation();

        const buttonRect = currentElement.getBoundingClientRect();
        showConfirmationDialog(buttonRect, (confirmed) => {
          if (confirmed) {
            log('DOMManipulator', 'Order confirmed, proceeding with purchase');
            currentElement!.click();
          } else {
            log('DOMManipulator', 'Order cancelled by user');
          }
          isProcessingClick = false;
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

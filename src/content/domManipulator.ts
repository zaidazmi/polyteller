/**
 * DOM manipulator for Polyteller.
 * This file contains functions for observing and manipulating the DOM.
 */

import { log } from '../utils/logUtils';
import { MIN_WIDTH_FOR_CONFIRMATION } from '../config';
import { tradeConfirmationState } from './tradeConfirmation';

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
      <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">Trade Confirmation!</h2>
      <button id="closeDialog" style="position: absolute; top: -10px; right: -10px; background: none; border: none; cursor: pointer; font-size: 20px; color: #999;">×</button>
      <p style="margin-bottom: 20px; font-size: 14px;">Are you sure you want to make this trade?</p>
      <div style="display: flex; justify-content: center; gap: 10px;">
        <button id="confirmYes" style="
          background-color: #4A4FE4;
          border: none;
          color: white;
          padding: 12px;
          text-align: center;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
          width: 100px;
          height: 50px;
          justify-content: center;
        ">
          <span style="font-weight: bold; font-size: 16px;">Yes</span>
          <span style="font-size: 10px; opacity: 0.8;">Enter</span>
        </button>
        <button id="confirmNo" style="
          background-color: #A41C1C;
          border: none;
          color: white;
          padding: 12px;
          text-align: center;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
          width: 100px;
          height: 50px;
          justify-content: center;
        ">
          <span id="noButtonCountdown" style="font-weight: bold; font-size: 16px;">No (3)</span>
          <span style="font-size: 10px; opacity: 0.8;">Esc</span>
        </button>
      </div>
    </div>
  `;

  // Add keyboard event listeners
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const yesButton = dialog.querySelector('#confirmYes') as HTMLButtonElement;
      if (yesButton) yesButton.click();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      const noButton = dialog.querySelector('#confirmNo') as HTMLButtonElement;
      if (noButton) noButton.click();
    }
  };

  // Add keyboard listener when dialog is shown
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const isVisible = dialog.style.display !== 'none';
        if (isVisible) {
          document.addEventListener('keydown', handleKeydown);
        } else {
          document.removeEventListener('keydown', handleKeydown);
        }
      }
    });
  });

  observer.observe(dialog, { attributes: true });

  // Update hover effects
  const buttons = dialog.querySelectorAll('button');
  buttons.forEach(button => {
    if (button.id !== 'closeDialog') {
      button.addEventListener('mouseover', () => {
        if (button.id === 'confirmYes') {
          button.style.backgroundColor = '#3A3FD4'; // Slightly darker purple on hover
        } else if (button.id === 'confirmNo') {
          button.style.backgroundColor = '#8B0000'; // Darker red on hover
        }
      });
      button.addEventListener('mouseout', () => {
        if (button.id === 'confirmYes') {
          button.style.backgroundColor = '#4A4FE4'; // Original purple
        } else if (button.id === 'confirmNo') {
          button.style.backgroundColor = '#A41C1C'; // Original Mexican red
        }
      });
    }
  });

  document.body.appendChild(dialog);

  // Define countdown and handleNo in this scope
  let countdown = 3;
  const handleNo = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    dialog.style.display = 'none';
  };

  // Update the countdown interval
  countdownInterval = window.setInterval(() => {
    countdown--;
    const countdownSpan = dialog.querySelector('#noButtonCountdown');
    if (countdownSpan) {
      countdownSpan.textContent = `No (${countdown})`;
    }
    if (countdown <= 0) {
      handleNo();
    }
  }, 1000);

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
  
  // Null check for confirmationDialog
  if (!confirmationDialog) return;
  
  // Reset the countdown and button text every time the dialog is shown
  let countdown = 3;
  const noButton = confirmationDialog.querySelector('#confirmNo') as HTMLButtonElement;
  const countdownSpan = confirmationDialog.querySelector('#noButtonCountdown');
  if (countdownSpan) {
    countdownSpan.textContent = `No (${countdown})`;
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
    // Add null check for confirmationDialog
    const countdownSpan = confirmationDialog?.querySelector('#noButtonCountdown');
    if (countdownSpan) {
      countdownSpan.textContent = `No (${countdown})`;
    }
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
      // Check for the specific blue button using its unique classes
      if (currentElement.tagName === 'BUTTON' && 
          currentElement.classList.contains('c-hDtDII') && 
          currentElement.classList.contains('c-hDtDII-fcAbGk-color-blue')) {
        
        isProcessingClick = true;
        log('DOMManipulator', 'Main blue Buy button clicked, checking confirmation setting');
        event.preventDefault();
        event.stopPropagation();

        const isTradeConfirmationEnabled = tradeConfirmationState.isEnabled;
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

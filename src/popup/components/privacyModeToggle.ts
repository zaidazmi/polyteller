import { getPrivacyModeState, setPrivacyModeState } from '../../utils/privacyUtils';
import { log } from '../../utils/logUtils';

/**
 * Initializes the privacy mode toggle in the extension popup.
 * This function sets up the initial state of the toggle and adds an event listener
 * to handle state changes.
 * 
 * @returns {Promise<void>}
 */
export async function initPrivacyModeToggle(): Promise<void> {
  // Get the toggle element from the popup HTML
  const toggle = document.getElementById('privacy-mode-toggle') as HTMLInputElement;
  if (!toggle) {
    log('PrivacyModeToggle', 'Privacy mode toggle element not found');
    return;
  }

  // Set the initial state of the toggle
  const initialState = await getPrivacyModeState();
  toggle.checked = initialState;

  // Add event listener for toggle changes
  toggle.addEventListener('change', async () => {
    const isEnabled = toggle.checked;
    
    // Update the privacy mode state
    await setPrivacyModeState(isEnabled);
    
    // Send a message to the active tab to update the privacy mode
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const currentTabId = tabs[0]?.id;
      if (currentTabId) {
        chrome.tabs.sendMessage(currentTabId, { action: 'updatePrivacyMode', enabled: isEnabled });
      }
    });
  });
}

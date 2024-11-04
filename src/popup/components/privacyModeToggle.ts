import { PrivacyModeState, privacyModeState } from '../../content/privacyMode';
import { log } from '../../utils/logUtils';

/**
 * Initializes the privacy mode toggle in the extension popup.
 * This function sets up the initial state of the toggle and adds an event listener
 * to handle state changes.
 * 
 * @returns {Promise<void>}
 */
export async function initPrivacyModeToggle(): Promise<void> {
  const toggle = document.getElementById('privacy-mode-toggle') as HTMLInputElement;
  if (!toggle) {
    log('PrivacyModeToggle', 'Toggle element not found');
    return;
  }

  const privacyMode = PrivacyModeState.getInstance();
  toggle.checked = privacyMode.isEnabled;

  toggle.addEventListener('change', async () => {
    await privacyMode.toggle();
    
    // Notify all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'updatePrivacyMode', 
            enabled: privacyMode.isEnabled 
          });
        }
      });
    });
  });

  // Listen for state changes
  privacyMode.onStateChange((enabled: boolean) => {
    toggle.checked = enabled;
  });
}

import { PrivacyModeState, privacyModeState } from '../../content/privacyMode';
import { log } from '../../utils/logUtils';
import { MessageType } from '../../types/messages';

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
    chrome.runtime.sendMessage({
      type: MessageType.BROADCAST_PRIVACY_MODE,
      data: { enabled: privacyMode.isEnabled },
      requestId: Date.now().toString(),
      timestamp: Date.now()
    });
  });

  // Listen for state changes
  privacyMode.onStateChange((enabled: boolean) => {
    toggle.checked = enabled;
  });
}

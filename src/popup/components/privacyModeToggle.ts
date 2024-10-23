import { getPrivacyModeState, setPrivacyModeState } from '../../utils/privacyUtils';
import { log } from '../../utils/logUtils';

export async function initPrivacyModeToggle(): Promise<void> {
  const toggle = document.getElementById('privacy-mode-toggle') as HTMLInputElement;
  if (!toggle) {
    log('PrivacyModeToggle', 'Privacy mode toggle element not found');
    return;
  }

  const initialState = await getPrivacyModeState();
  toggle.checked = initialState;

  toggle.addEventListener('change', async () => {
    const isEnabled = toggle.checked;
    await setPrivacyModeState(isEnabled);
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const currentTabId = tabs[0]?.id;
      if (currentTabId) {
        chrome.tabs.sendMessage(currentTabId, { action: 'updatePrivacyMode', enabled: isEnabled });
      }
    });
  });
}

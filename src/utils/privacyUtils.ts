import { log } from './logUtils';

export const PRIVACY_MODE_KEY = 'privacyModeEnabled';

export async function getPrivacyModeState(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(PRIVACY_MODE_KEY);
    return result[PRIVACY_MODE_KEY] || false;
  } catch (error) {
    log('PrivacyUtils', 'Error getting privacy mode state:', error);
    return false;
  }
}

export async function setPrivacyModeState(enabled: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ [PRIVACY_MODE_KEY]: enabled });
    log('PrivacyUtils', `Privacy mode ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    log('PrivacyUtils', 'Error setting privacy mode state:', error);
  }
}

export function maskValue(value: string): string {
  return '*'.repeat(value.length);
}

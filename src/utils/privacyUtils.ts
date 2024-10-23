import { log } from './logUtils';

// Key for storing privacy mode state in chrome.storage.local
export const PRIVACY_MODE_KEY = 'privacyModeEnabled';

/**
 * Retrieves the current state of the privacy mode from chrome.storage.local.
 * 
 * @returns {Promise<boolean>} A promise that resolves to the current privacy mode state.
 */
export async function getPrivacyModeState(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(PRIVACY_MODE_KEY);
    return result[PRIVACY_MODE_KEY] || false;
  } catch (error) {
    log('PrivacyUtils', 'Error getting privacy mode state:', error);
    return false;
  }
}

/**
 * Sets the privacy mode state in chrome.storage.local.
 * 
 * @param {boolean} enabled - The new state of the privacy mode.
 * @returns {Promise<void>}
 */
export async function setPrivacyModeState(enabled: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ [PRIVACY_MODE_KEY]: enabled });
    log('PrivacyUtils', `Privacy mode ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    log('PrivacyUtils', 'Error setting privacy mode state:', error);
  }
}

/**
 * Masks a given value by replacing all characters with asterisks.
 * 
 * @param {string} value - The value to be masked.
 * @returns {string} The masked value.
 */
export function maskValue(value: string): string {
  return '*'.repeat(value.length);
}

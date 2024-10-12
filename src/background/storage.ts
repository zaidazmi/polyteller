/**
 * Storage utilities for the background processes of Polyteller.
 * This file contains functions for interacting with the extension's local storage,
 * primarily for managing the current event information.
 */

import { PolymarketEvent } from '../types';

/**
 * Retrieves the current event from storage.
 * @returns The current PolymarketEvent or null if not found
 */
export async function getCurrentEvent(): Promise<PolymarketEvent | null> {
  const result = await chrome.storage.local.get("currentEvent");
  return result.currentEvent || null;
}

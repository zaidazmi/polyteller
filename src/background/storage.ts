import { PolymarketEvent } from '../types';

export async function getCurrentEvent(): Promise<PolymarketEvent | null> {
  const result = await chrome.storage.local.get("currentEvent");
  return result.currentEvent || null;
}

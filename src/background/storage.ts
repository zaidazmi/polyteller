import { EventInfo } from './types';

export async function getCurrentEvent(): Promise<EventInfo | null> {
  const result = await chrome.storage.local.get("currentEvent");
  return result.currentEvent || null;
}
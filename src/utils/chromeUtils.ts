import { log } from './logUtils';

export async function getFromStorage<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  } catch (error) {
    log('ChromeUtils', 'Error getting from storage:', error);
    return null;
  }
}

export async function setInStorage(key: string, value: any): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    log('ChromeUtils', 'Error setting in storage:', error);
  }
}

export async function removeFromStorage(key: string): Promise<void> {
  try {
    await chrome.storage.local.remove(key);
  } catch (error) {
    log('ChromeUtils', 'Error removing from storage:', error);
  }
}

export function sendMessage(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

export function createAlarm(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void> {
  return new Promise((resolve) => {
    chrome.alarms.create(name, alarmInfo);
    resolve();
  });
}

export function getAlarm(name: string): Promise<chrome.alarms.Alarm | undefined> {
  return new Promise((resolve) => {
    chrome.alarms.get(name, (alarm) => {
      resolve(alarm);
    });
  });
}

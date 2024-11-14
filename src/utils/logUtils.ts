const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export function log(context: string, ...args: any[]): void {
  if (!IS_PRODUCTION) {
    console.log(`[Polyteller ${context}]`, ...args);
  }
}

export function logError(context: string, error: Error): void {
  if (IS_PRODUCTION) {
    chrome.storage.local.get('errorLogs', (result) => {
      const logs = result.errorLogs || [];
      logs.push({
        timestamp: new Date().toISOString(),
        context,
        error: error.message,
        stack: error.stack
      });
      chrome.storage.local.set({ errorLogs: logs.slice(-100) });
    });
  } else {
    console.error(`[Polyteller ${context}] Error:`, error);
  }
}

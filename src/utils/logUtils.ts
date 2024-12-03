const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function getTimestamp(): string {
  const now = new Date();
  return `${now.toLocaleTimeString('en-US', { hour12: false })}:${now.getMilliseconds().toString().padStart(3, '0')}`;
}

export function log(context: string, ...args: any[]): void {
  if (!IS_PRODUCTION) {
    console.log(`[${getTimestamp()}] [Polyteller ${context}]`, ...args);
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
    console.error(`[${getTimestamp()}] [Polyteller ${context}] Error:`, error);
  }
}

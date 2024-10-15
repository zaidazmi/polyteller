function keepAlive(): void {
    chrome.runtime.connect({ name: 'keepAlive' });
  }
  
  keepAlive();
  setInterval(keepAlive, 25000); // Every 25 seconds
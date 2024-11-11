# Performance Test Plan - Multiple Event Tabs

## Test Events Selection
1. **Long-term Event**: Presidential Election (ends Jan 2025)
   - URL: https://polymarket.com/event/popular-vote-margin-of-victory-0pt25-ranges
   - Has complex date pattern
   - Long countdown updates

2. **Short-term Event**: Elon Musk tweets (ends within week)
   - URL: https://polymarket.com/event/elon-musk-of-tweets-nov-1-8
   - Regular countdown updates
   - Multiple notifications possible

3. **Event with Multiple Notifications**: Bitcoin Price
   - Set 5-6 notifications at different intervals
   - Test notification management
   - Monitor storage operations

4. **Event with Custom Notifications**: Any active market
   - Set custom time notifications
   - Test time input validation
   - Monitor UI updates

5. **Event Requiring Refresh**: Any newly opened event
   - Test refresh hint functionality
   - Monitor URL change detection
   - Test state management

## Recording Steps

### 1. Chrome Task Manager Metrics
```bash
1. Open Chrome Task Manager (Shift + Esc)
2. Enable columns:
   - Memory footprint
   - JavaScript memory
   - CPU
   - Network
3. Record every 5 minutes for:
   - Extension Service Worker
   - Each event tab
   - Background page
```

### 2. DevTools Performance Monitor
```javascript
// In each tab's DevTools Console
// Start recording
performance.mark('startTest');

// Add performance marks
performance.mark('countdownUpdate');
performance.mark('notificationCheck');
performance.mark('storageOperation');

// End recording after 30 minutes
performance.mark('endTest');
performance.measure('totalTest', 'startTest', 'endTest');
```

### 3. Memory Snapshots
```bash
1. Take heap snapshot at start
2. Take snapshots every 10 minutes
3. Compare for memory leaks
4. Monitor DOM node count
```

### 4. Extension Storage
```javascript
// Monitor storage operations
chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log('Storage usage:', bytes);
});
```

## Test Scenarios

### A. Initial Load (5 minutes)
1. Open all 5 event tabs simultaneously
2. Record initial resource usage
3. Monitor countdown initialization
4. Check for any UI glitches

### B. Active Usage (15 minutes)
1. Set notifications in each tab:
   - 2 preset times
   - 1 custom time
   - Delete 1 notification
2. Switch between tabs every minute
3. Monitor performance impact

### C. Idle State (10 minutes)
1. Leave tabs open
2. No user interaction
3. Monitor background processes
4. Check memory growth

### D. Resource Usage Tracking
```javascript
// Add to background.ts
let metrics = {
  timestamps: [],
  cpuUsage: [],
  memoryUsage: [],
  storageOperations: 0,
  networkRequests: 0
};

function recordMetrics() {
  metrics.timestamps.push(Date.now());
  // Record CPU
  chrome.system.cpu.getInfo((info) => {
    metrics.cpuUsage.push(info.processors[0].usage);
  });
  // Record memory
  chrome.system.memory.getInfo((info) => {
    metrics.memoryUsage.push(info.availableCapacity);
  });
}

// Record every minute
setInterval(recordMetrics, 60000);
```

## Success Criteria
- CPU < 5% per tab average
- Memory < 50MB per tab
- No memory leaks after 30 minutes
- Smooth countdown updates
- No UI lag during tab switches
- Storage usage < 5MB
- Network requests minimal

## Data Collection Format
```json
{
  "timestamp": "2023-11-09T14:00:00",
  "metrics": {
    "cpu": "2.5%",
    "memory": "45MB",
    "jsHeap": "15MB",
    "nodes": 150,
    "storage": "1.2MB",
    "networkRequests": 5
  }
}
``` 
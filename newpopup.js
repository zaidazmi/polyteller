const DEBUG = true;  // Set to false in production

function log(...args) {
  if (DEBUG) console.log(...args);
}

log("Popup script is running");

let countdownInterval;
let lastFetchedUrl = '';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'URL_CHANGED') {
        updatePopup();
    }
});

function updatePopup() {
    log("updatePopup called");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        log("Active tab:", tabs[0]);
        if (tabs.length === 0) {
            log("No active tab found");
            updateStatus("No active tab found", true);
            return;
        }
        
        const activeTab = tabs[0];
        if (!activeTab.url.includes('polymarket.com')) {
            log("Not a Polymarket page");
            updateStatus("Not a Polymarket page", true);
            return;
        }

        if (activeTab.url === lastFetchedUrl) {
            log("URL hasn't changed, skipping update");
            return;
        }
        
        lastFetchedUrl = activeTab.url;
        
        log("Sending GET_END_DATE message to content script");
        chrome.tabs.sendMessage(activeTab.id, {type: 'GET_END_DATE'}, function(response) {
            log("Received response from content script:", response);
            if (chrome.runtime.lastError) {
                log("Error:", chrome.runtime.lastError);
                updateStatus("Error communicating with the page. Please refresh and try again.", true);
                return;
            }
            if (response && response.dateInfo) {
                log("DateInfo received:", response.dateInfo);
                displayCountdown(response.dateInfo);
            } else {
                log("No event found or invalid response");
                updateStatus("No event found on this page", true);
            }
        });
    });
}

function displayCountdown(dateInfo) {
    log("Displaying countdown for:", dateInfo);
    const countdownElement = document.getElementById('countdown');
    const localEndTimeElement = document.getElementById('local-end-time');
    
    if (!dateInfo || !dateInfo.endDate) {
        log("Error: Invalid dateInfo or endDate is missing");
        displayError("Error: Could not retrieve event end date");
        return;
    }
    
    const endDate = new Date(dateInfo.endDate);
    const serverTime = new Date(dateInfo.serverTime);

    if (isNaN(endDate.getTime()) || isNaN(serverTime.getTime())) {
        log("Error: Invalid date format for endDate or serverTime");
        displayError("Error: Invalid date format received");
        return;
    }

    log('End date (UTC):', endDate.toUTCString());
    log('Initial server time (UTC):', serverTime.toUTCString());

    // Display local end time
    const localEndDate = endDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const localEndTime = endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const timeZoneAbbr = getTimezoneAbbreviation(endDate);
    localEndTimeElement.textContent = `Ends at ${localEndDate}, ${localEndTime}, ${timeZoneAbbr}`;

    function updateCountdown() {
        const now = new Date();
        const elapsedTime = now.getTime() - serverTime.getTime();
        const adjustedServerTime = new Date(serverTime.getTime() + elapsedTime);
        const difference = endDate.getTime() - adjustedServerTime.getTime();

        log('Current time (UTC):', now.toUTCString());
        log('Adjusted server time (UTC):', adjustedServerTime.toUTCString());
        log('Time difference (ms):', difference);

        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            log(`Countdown: ${days}d ${hours}h ${minutes}m ${seconds}s`);

            const countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            const totalMilliseconds = difference;
            countdownElement.innerHTML = `
                <div class="time-unit">
                    <span class="time-value">${days.toString().padStart(2, '0')}</span>
                    <span class="time-label">Days</span>
                </div>
                <div class="time-unit">
                    <span class="time-value">${hours.toString().padStart(2, '0')}</span>
                    <span class="time-label">Hours</span>
                </div>
                <div class="time-unit">
                    <span class="time-value">${minutes.toString().padStart(2, '0')}</span>
                    <span class="time-label">Mins</span>
                </div>
                <div class="time-unit">
                    <span class="time-value">${seconds.toString().padStart(2, '0')}</span>
                    <span class="time-label">Secs</span>
                </div>
            `;
            countdownElement.setAttribute('data-countdown', totalMilliseconds);
        } else {
            countdownElement.innerHTML = '<div class="ended">Event has ended</div>';
        }
    }

    updateCountdown();
    clearInterval(countdownInterval);
    countdownInterval = setInterval(updateCountdown, 1000);
}

function getTimezoneAbbreviation(date) {
    const options = { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, timeZoneName: 'short' };
    const timeZoneString = date.toLocaleString('en-US', options);
    const timeZoneAbbr = timeZoneString.split(' ').pop();

    // Handle special cases
    switch (timeZoneAbbr) {
        case 'GMT+5:30':
            return 'IST';
        case 'EDT':
        case 'EST':
        case 'CDT':
        case 'CST':
        case 'MDT':
        case 'MST':
        case 'PDT':
        case 'PST':
            return timeZoneAbbr;
        default:
            // If it's not a recognized abbreviation, return the full timezone name
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
}

function updateStatus(message, isError = false) {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.color = isError ? '#f44336' : '#4CAF50';
  }
}

function setNotification() {
  console.log('Setting notification');
  const hours = parseInt(document.getElementById('notifyHours').value) || 0;
  const minutes = parseInt(document.getElementById('notifyMinutes').value) || 0;
  const totalMinutes = hours * 60 + minutes;

  const countdownElement = document.getElementById('countdown');
  const currentCountdown = countdownElement.getAttribute('data-countdown');

  if (totalMinutes > 0 && currentCountdown) {
    chrome.runtime.sendMessage({
      action: 'setNotification',
      minutes: totalMinutes,
      currentCountdown: currentCountdown
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error setting notification:', chrome.runtime.lastError);
        updateNotificationStatus('Failed to set notification: ' + chrome.runtime.lastError.message, false);
      } else if (response && response.success) {
        console.log('Notification set successfully');
        updateNotificationStatus();
      } else {
        console.error('Failed to set notification:', response ? response.error : 'Unknown error');
        updateNotificationStatus(`Failed to set notification: ${response ? response.error : 'Unknown error'}`, false);
      }
    });
  } else {
    console.error('Invalid notification time');
    updateNotificationStatus('Please enter a valid time for notification.', false);
  }
}

function updateNotificationStatus(message = '', isSuccess = true) {
  console.log('Updating notification status:', message, isSuccess);
  const statusElement = document.getElementById('notificationStatus');
  const deleteButton = document.getElementById('deleteNotification');
  
  if (message) {
    statusElement.textContent = message;
    statusElement.style.color = isSuccess ? '#4CAF50' : '#f44336';
    deleteButton.style.display = isSuccess ? 'inline-block' : 'none';
  } else {
    chrome.storage.local.get(['notificationSet', 'notificationMinutes', 'notificationTime'], (result) => {
      console.log('Retrieved notification data:', result);
      if (result.notificationSet && result.notificationTime > Date.now()) {
        const hours = Math.floor(result.notificationMinutes / 60);
        const minutes = result.notificationMinutes % 60;
        statusElement.textContent = `Notification set for ${hours}h ${minutes}m before the event ends.`;
        statusElement.style.color = '#4CAF50';
        deleteButton.style.display = 'inline-block';
      } else {
        statusElement.textContent = '';
        deleteButton.style.display = 'none';
      }
    });
  }
}

function deleteNotification() {
  console.log('Deleting notification');
  chrome.runtime.sendMessage({ action: 'deleteNotification' }, (response) => {
    if (response && response.success) {
      console.log('Notification deleted successfully');
      updateNotificationStatus();
    } else {
      console.error('Failed to delete notification');
    }
  });
}

function testNotification() {
  console.log('Testing notification');
  chrome.runtime.sendMessage({ action: 'testNotification' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error testing notification:', chrome.runtime.lastError);
    } else if (response && response.success) {
      console.log('Test notification sent successfully');
    } else {
      console.error('Failed to send test notification');
    }
  });
}

function testDirectNotification() {
  console.log('Testing direct notification');
  chrome.runtime.sendMessage({ action: 'testDirectNotification' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error testing direct notification:', chrome.runtime.lastError);
    } else if (response && response.success) {
      console.log('Direct test notification sent successfully');
    } else {
      console.error('Failed to send direct test notification');
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM content loaded');
  document.getElementById('setNotification').addEventListener('click', setNotification);
  document.getElementById('deleteNotification').addEventListener('click', deleteNotification);
  document.getElementById('testNotification').addEventListener('click', testNotification);
  document.getElementById('testDirectNotification').addEventListener('click', testDirectNotification);
  updateNotificationStatus();
  updatePopup();
});

window.addEventListener('unload', () => {
  clearInterval(countdownInterval);
});
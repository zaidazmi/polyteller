const DEBUG = false;
const log = DEBUG ? console.log : () => {};

log("Content script loaded for PolyTime Event Countdown");

// Assuming date-fns and natural are properly imported or included

function parseDate(dateString) {
  dateString = dateString.replace(/^Bet/, '').trim();
  
  // Try parsing with natural language first
  const naturalDate = natural.date(dateString);
  if (naturalDate) {
    return dateFns.parseISO(naturalDate.toISOString());
  }
  
  // If natural parsing fails, try with date-fns
  const parsedDate = dateFns.parse(dateString, 'MMM d, yyyy HH:mm a', new Date());
  if (dateFns.isValid(parsedDate)) {
    return parsedDate;
  }
  
  // If all else fails, log the error and return null
  log("Invalid date:", dateString);
  return null;
}

function sanitizeDate(dateString) {
  // Remove any potentially harmful characters
  return dateString.replace(/[^\w\s,:-]/g, '');
}

// Use moment-timezone for robust time zone handling
function extractEndDateFromPage() {
  const scriptElement = document.getElementById('__NEXT_DATA__');
  if (scriptElement) {
    try {
      const jsonData = JSON.parse(scriptElement.textContent);
      const endDateString = jsonData.props.pageProps.dehydratedState.queries[0].state.data.markets[0].endDate;
      
      // Parse the date string and adjust for ET to UTC
      const endDateET = new Date(endDateString);
      const endDateUTC = new Date(endDateET.getTime() + (4 * 60 * 60 * 1000)); // Add 4 hours to convert ET to UTC
      
      if (endDateUTC) {
        const serverTime = new Date();
        console.log('Extracted end date (ET):', endDateET.toISOString());
        console.log('Adjusted end date (UTC):', endDateUTC.toISOString());
        console.log('Server time (UTC):', serverTime.toISOString());
        return {
          endDate: endDateUTC.toISOString(),
          serverTime: serverTime.toISOString()
        };
      }
    } catch (error) {
      console.error('Error parsing JSON data:', error);
    }
  }
  console.log('Failed to extract end date');
  return null;
}

let currentUrl = window.location.href;

function checkUrlChange() {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        chrome.runtime.sendMessage({ type: 'URL_CHANGED' });
    }
}

setInterval(checkUrlChange, 1000);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({status: 'ready'});
  } else if (message.type === 'GET_END_DATE') {
    try {
      const dateInfo = extractEndDateFromPage();
      sendResponse({dateInfo: dateInfo, error: null});
    } catch (error) {
      console.error('Error in GET_END_DATE:', error);
      sendResponse({dateInfo: null, error: error.message});
    }
  }
  return true;  // Indicates that the response is sent asynchronously
});

const initialEndDateTime = extractEndDateFromPage();
if (initialEndDateTime) {
  log("Sending initial end date to background script:", initialEndDateTime);
  chrome.runtime.sendMessage({
    type: 'SET_END_DATE',
    endDateTime: initialEndDateTime
  });
  
  // Assuming you've extracted the eventEndTime
  chrome.storage.local.set({ eventEndTime: initialEndDateTime.endDate }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving event end time:', chrome.runtime.lastError);
    }
  });
  
  // Assuming you've extracted the eventTitle and eventEndTime
  chrome.storage.local.set({ 
    eventTitle: initialEndDateTime.eventTitle,
    eventEndTime: initialEndDateTime.endDate 
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving event details:', chrome.runtime.lastError);
    }
  });
  
  // After capturing the event end time
  console.log('Captured event end time:', eventEndTime);
  chrome.runtime.sendMessage({
    action: 'setEventEndTime',
    endTime: eventEndTime.toISOString()
  });
} else {
  log("No initial end date found to send to background script");
}

log("Content script setup complete");
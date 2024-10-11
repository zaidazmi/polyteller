import { PolymarketEvent } from '../types';
import { log } from '../utils/logUtils';

let isInitialized = false;

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

function sendEventInfo(eventInfo: PolymarketEvent) {
  log('Content', 'Sending event info to background:', eventInfo);
  chrome.runtime.sendMessage({ type: 'EVENT_INFO', data: eventInfo }, (response) => {
    if (chrome.runtime.lastError) {
      log('Content', 'Error sending event info to background:', chrome.runtime.lastError);
    } else {
      log('Content', 'Event info sent successfully:', response);
    }
  });
}

const debouncedSendEventInfo = debounce(sendEventInfo, 1000);

function extractEventInfo(): PolymarketEvent | null {
  const scriptElement = document.querySelector('script#__NEXT_DATA__');
  if (!scriptElement) {
    log('Content', 'No __NEXT_DATA__ script found');
    return null;
  }

  try {
    const jsonData = JSON.parse(scriptElement.textContent || '');
    const eventData = jsonData.props?.pageProps?.dehydratedState?.queries[0]?.state?.data;

    if (eventData && eventData.title && eventData.endDate) {
      log('Content', 'Event data found:', JSON.stringify(eventData, null, 2));

      let timezone = 'UTC';
      let endDateValue = eventData.endDate;

      if (eventData.markets && eventData.markets[0] && eventData.markets[0].description) {
        const description = eventData.markets[0].description;
        log('Content', 'Market description:', description);

        const dateTimeMatch = description.match(/(\w+ \d{1,2},? \d{4},? \d{1,2}:\d{2} [AP]M) ([A-Z]{2,3})/g);
        log('Content', 'Date time matches:', dateTimeMatch);

        if (dateTimeMatch && dateTimeMatch.length >= 2) {
          endDateValue = dateTimeMatch[1];
          timezone = dateTimeMatch[1].split(' ').pop() || 'ET';
          log('Content', 'End date found:', endDateValue);
          log('Content', 'Timezone found:', timezone);
        }
      }

      // Parse the end date
      const parsedDate = parseCustomDate(endDateValue, timezone);
      log('Content', 'Original end date:', endDateValue);
      log('Content', 'Parsed end date (local):', parsedDate);
      log('Content', 'Parsed end date (UTC):', parsedDate.toUTCString());

      if (isNaN(parsedDate.getTime())) {
        log('Content', 'Failed to parse end date:', endDateValue);
        return null;
      }

      const eventInfo: PolymarketEvent = {
        id: eventData.id || `event_${Date.now()}`,
        title: eventData.title,
        endTime: parsedDate.getTime(),
        endDate: endDateValue,
        timezone: timezone
      };
      log('Content', 'Extracted event info:', JSON.stringify(eventInfo, null, 2));
      return eventInfo;
    }
  } catch (error) {
    log('Content', 'Error processing event data:', error);
  }

  return null;
}

function parseCustomDate(dateString: string, timezone: string): Date {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const parts = dateString.match(/(\w+) (\d{1,2}),? (\d{4}),? (\d{1,2}):(\d{2}) ([AP]M)/);
  
  if (parts) {
    const [, month, day, year, hour, minute, ampm] = parts;
    let parsedHour = parseInt(hour);
    if (ampm === 'PM' && parsedHour !== 12) parsedHour += 12;
    if (ampm === 'AM' && parsedHour === 12) parsedHour = 0;
    
    // Create a date in UTC
    const date = new Date(Date.UTC(
      parseInt(year),
      months.indexOf(month),
      parseInt(day),
      parsedHour,
      parseInt(minute)
    ));

    // Adjust for ET timezone
    if (timezone === 'ET') {
      date.setHours(date.getHours() + 4); // ET is UTC-4 (assuming EDT)
    }

    return date;
  }
  
  return new Date(dateString);
}

function createAndInsertCountdown(eventInfo: PolymarketEvent, isExtensionPopup: boolean) {
  log('Content', 'Creating and inserting countdown for event:', eventInfo);
  
  let countdownElement = document.getElementById('polyteller-countdown');
  if (!countdownElement) {
    log('Content', 'Creating new countdown element');
    countdownElement = document.createElement('div');
    countdownElement.id = 'polyteller-countdown';
    document.body.appendChild(countdownElement);
    log('Content', 'Countdown element appended to body');
  }

  countdownElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 9999;
    transition: all 0.3s ease-in-out;
    opacity: 0.5;
    transform: scale(1);
  `;

  const updateCountdown = () => {
    const now = new Date().getTime();
    const timeLeft = eventInfo.endTime - now;

    if (timeLeft <= 0) {
      if (isExtensionPopup) {
        const endDate = new Date(eventInfo.endTime);
        countdownElement.innerHTML = `
          <div>Event has ended</div>
          <div style="font-size: 12px; margin-top: 5px;">Ended on ${endDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ${eventInfo.timezone}</div>
        `;
      } else {
        countdownElement.textContent = 'Event has ended';
      }
    } else {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    log('Content', 'Updated countdown text:', countdownElement.textContent);
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);

  if (!isExtensionPopup) {
    countdownElement.addEventListener('mouseenter', () => {
      countdownElement.style.opacity = '1';
      countdownElement.style.transform = 'scale(1.1)';
    });

    countdownElement.addEventListener('mouseleave', () => {
      countdownElement.style.opacity = '0.5';
      countdownElement.style.transform = 'scale(1)';
    });
  }
}

function getTimeZoneAbbreviation(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    timeZoneName: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value || '';
}

function initializeCountdown() {
  if (isInitialized) return;
  isInitialized = true;

  log('Content', 'Initializing countdown');
  const eventInfo = extractEventInfo();
  if (eventInfo) {
    log('Content', 'Event info extracted:', eventInfo);
    debouncedSendEventInfo(eventInfo);
    createAndInsertCountdown(eventInfo, false);
  } else {
    log('Content', 'Failed to extract event info');
  }
}

// Use a MutationObserver to watch for changes in the DOM
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      initializeCountdown();
      break;
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial call to initialize countdown
initializeCountdown();

log('Content', 'Polyteller content script loaded');

// Call this function when the page loads
extractEventInfo();
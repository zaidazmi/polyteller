import { PolymarketEvent } from '../types';

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
  console.log('Sending event info to background:', eventInfo);
  chrome.runtime.sendMessage({ type: 'EVENT_INFO', data: eventInfo }, (response) => {
    if (response && response.status === 'Event info stored successfully') {
      console.log('Event info successfully stored in background');
    } else {
      console.error('Failed to store event info in background');
    }
  });
}

const debouncedSendEventInfo = debounce(sendEventInfo, 1000);

function extractEventInfo(): PolymarketEvent | null {
  const scriptElement = document.querySelector('script#__NEXT_DATA__');
  if (!scriptElement) {
    console.log('No __NEXT_DATA__ script found');
    return null;
  }

  try {
    const jsonData = JSON.parse(scriptElement.textContent || '');
    const eventData = jsonData.props?.pageProps?.dehydratedState?.queries[0]?.state?.data;

    if (eventData && eventData.title && eventData.endDate) {
      console.log('Event data found:', JSON.stringify(eventData, null, 2));

      let timezone = 'UTC';
      let endDateValue = eventData.endDate;

      if (eventData.markets && eventData.markets[0] && eventData.markets[0].description) {
        const description = eventData.markets[0].description;
        console.log('Market description:', description);

        const dateTimeMatch = description.match(/(\w+ \d{1,2},? \d{4},? \d{1,2}:\d{2} [AP]M) ([A-Z]{2,3})/g);
        console.log('Date time matches:', dateTimeMatch);

        if (dateTimeMatch && dateTimeMatch.length >= 2) {
          endDateValue = dateTimeMatch[1];
          timezone = dateTimeMatch[1].split(' ').pop() || 'ET';
          console.log('End date found:', endDateValue);
          console.log('Timezone found:', timezone);
        }
      }

      // Parse the end date
      const parsedDate = parseCustomDate(endDateValue, timezone);
      console.log('Original end date:', endDateValue);
      console.log('Parsed end date (local):', parsedDate);
      console.log('Parsed end date (UTC):', parsedDate.toUTCString());

      if (isNaN(parsedDate.getTime())) {
        console.error('Failed to parse end date:', endDateValue);
        return null;
      }

      const eventInfo = {
        id: eventData.id || `event_${Date.now()}`,
        title: eventData.title,
        endTime: parsedDate.getTime(),
        endDate: endDateValue,
        timezone: timezone
      };
      console.log('Extracted event info:', JSON.stringify(eventInfo, null, 2));
      return eventInfo;
    }
  } catch (error) {
    console.error('Error processing event data:', error);
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
  console.log('Creating and inserting countdown for event:', eventInfo);
  
  let countdownElement = document.getElementById('polyteller-countdown');
  if (!countdownElement) {
    console.log('Creating new countdown element');
    countdownElement = document.createElement('div');
    countdownElement.id = 'polyteller-countdown';
    document.body.appendChild(countdownElement);
    console.log('Countdown element appended to body');
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
      countdownElement.textContent = 'Event has ended';
    } else {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      if (isExtensionPopup) {
        const endDate = new Date(eventInfo.endTime);
        const timeZoneAbbr = getTimeZoneAbbreviation(endDate);
        countdownElement.textContent = `Ends on ${endDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ${timeZoneAbbr}`;
      } else {
        countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      }
    }

    console.log('Updated countdown text:', countdownElement.textContent);
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
  const timeZoneOffset = date.getTimezoneOffset();
  const timeZones = [
    { offset: -240, abbr: 'EDT' },
    { offset: -300, abbr: 'EST' },
    { offset: -420, abbr: 'PDT' },
    { offset: -480, abbr: 'PST' },
    { offset: -330, abbr: 'IST' },
    // Add more time zones as needed
  ];

  const matchedZone = timeZones.find(zone => zone.offset === timeZoneOffset);
  return matchedZone ? matchedZone.abbr : `GMT${date.toTimeString().slice(9, 17)}`;
}

function initializeCountdown() {
  if (isInitialized) return;
  isInitialized = true;

  console.log('Initializing countdown');
  const eventInfo = extractEventInfo();
  if (eventInfo) {
    console.log('Event info extracted:', eventInfo);
    debouncedSendEventInfo(eventInfo);
    createAndInsertCountdown(eventInfo, false);
  } else {
    console.log('Failed to extract event info');
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

console.log('Polyteller content script loaded');
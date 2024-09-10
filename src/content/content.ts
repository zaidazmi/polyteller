import { PolymarketEvent } from '../types';

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
  chrome.runtime.sendMessage({ type: 'EVENT_INFO', data: eventInfo });
}

const debouncedSendEventInfo = debounce(sendEventInfo, 1000);

function extractEventInfo(): PolymarketEvent | null {
  const scriptElement = document.querySelector('script#__NEXT_DATA__');
  if (!scriptElement) return null;

  try {
    const jsonData = JSON.parse(scriptElement.textContent || '');
    const eventData = jsonData.props?.pageProps?.dehydratedState?.queries[0]?.state?.data;

    if (eventData && eventData.title && eventData.endDate) {
      console.log('Event data found:', eventData);
      const endDate = new Date(eventData.endDate);
      if (isNaN(endDate.getTime())) {
        console.log('Invalid end date:', eventData.endDate);
        return null;
      }
      return {
        id: eventData.id || `event_${Date.now()}`,
        title: eventData.title,
        endTime: endDate.getTime(),
        endDate: eventData.endDate
      };
    }
  } catch (error) {
    console.error('Error processing event data:', error);
  }

  return null;
}

function createAndInsertCountdown(eventInfo: PolymarketEvent) {
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

      countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    console.log('Updated countdown text:', countdownElement.textContent);
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);

  countdownElement.addEventListener('mouseenter', () => {
    countdownElement.style.opacity = '1';
    countdownElement.style.transform = 'scale(1.1)';
  });

  countdownElement.addEventListener('mouseleave', () => {
    countdownElement.style.opacity = '0.5';
    countdownElement.style.transform = 'scale(1)';
  });
}

const debouncedInitialize = debounce(() => {
  console.log('Initializing countdown');
  const eventInfo = extractEventInfo();
  if (eventInfo) {
    console.log('Event info extracted:', eventInfo);
    debouncedSendEventInfo(eventInfo);
    createAndInsertCountdown(eventInfo);
  } else {
    console.log('Failed to extract event info');
  }
}, 500);

const observer = new MutationObserver(() => {
  debouncedInitialize();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

debouncedInitialize();

console.log('Polyteller content script loaded');
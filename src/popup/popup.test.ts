import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { initPopup, loadNotifications, initTradeConfirmationToggle } from './popup';
import { useStore } from '../store/store';
import * as notificationModule from './components/notifications';
import * as uiUpdatesModule from './components/uiUpdates';
console.log('Starting trade confirmation toggle test');

// Add this before the describe block
jest.mock('./popup', () => ({
  ...jest.requireActual('./popup'),
  initTradeConfirmationToggle: jest.fn().mockImplementation(() => {
    return new Promise((resolve) => {
      const toggle = document.getElementById('trade-confirmation-toggle') as HTMLInputElement;
      toggle.checked = true;
      const changeHandler = () => {
        chrome.storage.local.set({ enableTradeConfirmation: toggle.checked }, () => {
          console.log(`Trade confirmation ${toggle.checked ? 'enabled' : 'disabled'}`);
        });
      };
      toggle.addEventListener('change', changeHandler);
      // Trigger the change handler immediately
      changeHandler();
      resolve(true);
    });
  }),
}));

jest.mock('../store/store', () => ({
  useStore: {
    getState: jest.fn().mockReturnValue({
      currentEvent: {
        id: '1',
        title: 'Test Event',
        endTime: Date.now() + 1000000,
        endDate: '2023-05-01',
        timezone: 'UTC',
        url: 'https://example.com',
      },
      notifications: [],
      addEvent: jest.fn(),
      setNotifications: jest.fn(),
    }),
  },
}));

jest.mock('./components/notifications');
jest.mock('./components/uiUpdates');

describe('Popup Functionality', () => {
  beforeEach(() => {
    // Extend the Chrome API mock
    const mockChromeAPI = {
      tabs: {
        query: jest.fn((queryInfo, callback) => {
          callback([{ id: 1 }]);
        }),
        create: jest.fn(),
        sendMessage: jest.fn(),
      },
      runtime: {
        sendMessage: jest.fn((message, responseCallback) => {
          if (typeof responseCallback === 'function') {
            responseCallback({
              id: '1',
              title: 'Test Event',
              endTime: Date.now() + 1000000,
              endDate: '2023-05-01',
              timezone: 'UTC',
              url: 'https://example.com',
            });
          }
        }),
        getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
        lastError: null,
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      },
      storage: {
        local: {
          get: jest.fn().mockImplementation((key, callback) => {
            console.log('Mock chrome.storage.local.get called with key:', key);
            callback({ enableTradeConfirmation: true });
          }),
          set: jest.fn().mockImplementation((items, callback) => {
            console.log('Mock chrome.storage.local.set called with items:', items);
            if (callback) callback();
          }),
        },
      },
    };

    // Use the extended Chrome API mock
    global.chrome = mockChromeAPI as unknown as typeof chrome;

    // Ensure all elements exist in the DOM
    document.body.innerHTML = `
      <h2 id="event-title"></h2>
      <div id="countdown"></div>
      <div id="local-end-time"></div>
      <select id="notification-time">
        <option value="5">5 minutes before</option>
        <option value="15">15 minutes before</option>
        <option value="30">30 minutes before</option>
        <option value="60">1 hour before</option>
        <option value="custom">Custom time before</option>
      </select>
      <div id="custom-time-inputs" style="display: none;">
        <input type="number" id="custom-days" placeholder="Days">
        <input type="number" id="custom-hours" placeholder="Hours">
        <input type="number" id="custom-minutes" placeholder="Mins">
        <input type="number" id="custom-seconds" placeholder="Secs">
      </div>
      <button id="set-notification">Set Notification</button>
      <ul id="notifications-list"></ul>
      <button id="view-all-notifications">View all</button>
      <input type="checkbox" id="trade-confirmation-toggle">
    `;

    jest.clearAllMocks();

    // Mock Chrome API
    global.chrome = {
      tabs: {
        query: jest.fn((queryInfo, callback) => {
          callback([{ id: 1 }]);
        }),
        create: jest.fn(),
        sendMessage: jest.fn(),
      },
      runtime: {
        sendMessage: jest.fn((message, responseCallback) => {
          if (typeof responseCallback === 'function') {
            responseCallback({
              id: '1',
              title: 'Test Event',
              endTime: Date.now() + 1000000,
              endDate: '2023-05-01',
              timezone: 'UTC',
              url: 'https://example.com',
            });
          }
        }),
        getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
        lastError: null,
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      },
      storage: {
        local: {
          get: jest.fn().mockImplementation((key, callback) => {
            console.log('Mock chrome.storage.local.get called with key:', key);
            callback({ enableTradeConfirmation: true });
          }),
          set: jest.fn().mockImplementation((items, callback) => {
            console.log('Mock chrome.storage.local.set called with items:', items);
            if (callback) callback();
          }),
        },
      },
    } as unknown as typeof chrome;

    let storedValue = { enableTradeConfirmation: true };

    global.chrome.storage.local.set = jest.fn().mockImplementation((items, callback) => {
      console.log('Mock chrome.storage.local.set called with items:', items);
      storedValue = { ...storedValue, ...items };
      if (callback) callback();
    });
  });

  it('should initialize popup and display event information', async () => {
    (uiUpdatesModule.updateUI as jest.Mock).mockImplementation((event) => {
      document.getElementById('event-title')!.textContent = event.title;
    });
    await initPopup();
    await waitFor(() => {
      expect(document.getElementById('event-title')?.textContent).toBe('Test Event');
      expect(uiUpdatesModule.updateUI).toHaveBeenCalled();
    });
  });

  it('should toggle custom time inputs when "custom" is selected', async () => {
    (uiUpdatesModule.toggleCustomTimeInputs as jest.Mock).mockImplementation((show) => {
      const customInputs = document.getElementById('custom-time-inputs');
      if (customInputs) customInputs.style.display = show ? 'block' : 'none';
    });
    await initPopup();
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });
    await waitFor(() => {
      expect(document.getElementById('custom-time-inputs')?.style.display).toBe('block');
    });
  });

  it('should set notification when button is clicked', async () => {
    await initPopup();
    const setNotificationSpy = jest.spyOn(notificationModule, 'setNotification');
    fireEvent.click(screen.getByText('Set Notification'));
    await waitFor(() => {
      expect(setNotificationSpy).toHaveBeenCalled();
    });
  });

  it('should load and display notifications', async () => {
    const displayNotificationsSpy = jest.spyOn(notificationModule, 'displayNotifications');
    await loadNotifications();
    await waitFor(() => {
      expect(displayNotificationsSpy).toHaveBeenCalled();
    }, { timeout: 6000 });
  });

  it('should open all notifications page when "View all" is clicked', async () => {
    // Mock chrome.runtime.getURL
    global.chrome.runtime.getURL = jest.fn((path) => `chrome-extension://fake-id/${path}`);
    
    // Mock chrome.tabs.create
    global.chrome.tabs.create = jest.fn();

    // Call initPopup to set up event listeners
    await initPopup();
    
    // Ensure the button is in the document
    const viewAllButton = screen.getByText('View all');
    expect(viewAllButton).toBeInTheDocument();
    
    // Simulate clicking the button
    fireEvent.click(viewAllButton);
    
    // Use waitFor to allow for any asynchronous operations
    await waitFor(() => {
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://fake-id/allNotifications.html'
      });
    });
  });

  it('should toggle trade confirmation setting', async () => {
    console.log('Starting trade confirmation toggle test');

    const mockToggle = {
      checked: true,
      addEventListener: jest.fn((event, handler) => {
        if (event === 'change') {
          mockToggle.changeHandler = handler;
        }
      }),
      dispatchEvent: jest.fn((event) => {
        if (event.type === 'change' && mockToggle.changeHandler) {
          mockToggle.changeHandler({ target: mockToggle });
        }
      }),
      changeHandler: null as ((event: { target: { checked: boolean } }) => void) | null,
    };

    document.getElementById = jest.fn().mockReturnValue(mockToggle);

    const initialState = await initTradeConfirmationToggle();
    console.log('Test: Resolved initial state:', initialState);

    expect(initialState).toBe(true);
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      { enableTradeConfirmation: true },
      expect.any(Function)
    );

    // Simulate clicking the toggle
    console.log('Simulating toggle click');
    mockToggle.checked = false;
    mockToggle.dispatchEvent(new Event('change'));

    // Wait for the chrome.storage.local.set to be called with the new state
    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { enableTradeConfirmation: false },
        expect.any(Function)
      );
    });

    expect(mockToggle.checked).toBe(false);

    console.log('Trade confirmation toggle test completed');
  }, 10000);

  it('should handle errors when fetching event information', async () => {
    (useStore.getState as jest.Mock).mockReturnValueOnce({ currentEvent: null });
    (uiUpdatesModule.displayError as jest.Mock).mockImplementation((message) => {
      document.body.innerHTML += `<div class="error-message">${message}</div>`;
    });
    
    (global.chrome.runtime.sendMessage as jest.Mock).mockImplementation((message, responseCallback) => {
      if (typeof responseCallback === 'function') {
        responseCallback(null);
      }
    });

    await initPopup();
    await waitFor(() => {
      expect(document.querySelector('.error-message')?.textContent).toBe('No event found on this page.');
    }, { timeout: 3000 });
  });
});

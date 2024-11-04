import '@testing-library/jest-dom';

const mockChrome = {
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      if (callback) callback({ success: true });
    }),
    onMessage: {
      addListener: jest.fn(),
    },
    getURL: jest.fn((path: string) => `chrome-extension://fake-id/${path}`),
  },
  tabs: {
    query: jest.fn().mockImplementation((query, callback) => callback([{ id: 1 }])),
    create: jest.fn(),
    sendMessage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn().mockImplementation((key) => {
        return Promise.resolve({ [key]: true });
      }),
      set: jest.fn().mockImplementation((obj) => {
        return Promise.resolve();
      }),
    },
  },
};

global.chrome = mockChrome as unknown as typeof chrome;

// Mock window.location for JSDOM
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://test.com',
    pathname: '/',
  },
  writable: true,
});

// Mock MutationObserver
class MockMutationObserver {
  constructor(private callback: MutationCallback) {}
  observe() {}
  disconnect() {}
}

global.MutationObserver = MockMutationObserver as any;

// Mock chrome.runtime.getURL
global.chrome.runtime.getURL = jest.fn((path) => `chrome-extension://fake-id/${path}`);

// Add this line to mock the chrome.tabs.create function
global.chrome.tabs.create = jest.fn();

// Mock the initTradeConfirmationToggle function
jest.mock('./popup/popup', () => ({
  ...jest.requireActual('./popup/popup'),
  initTradeConfirmationToggle: jest.fn(),
}));

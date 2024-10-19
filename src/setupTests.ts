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
    query: jest.fn((queryInfo, callback) => {
      callback([{ id: 1 }]);
    }),
    create: jest.fn(),
    sendMessage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn((key, callback) => {
        callback({ [key]: true });
      }),
      set: jest.fn((obj, callback) => {
        if (callback) callback();
      }),
    },
  },
};

global.chrome = mockChrome as unknown as typeof chrome;

// Mock console.log to reduce noise in test output
global.console.log = jest.fn();

// Mock chrome.runtime.getURL
global.chrome.runtime.getURL = jest.fn((path) => `chrome-extension://fake-id/${path}`);

// Add this line to mock the chrome.tabs.create function
global.chrome.tabs.create = jest.fn();

// Mock the initTradeConfirmationToggle function
jest.mock('./popup/popup', () => ({
  ...jest.requireActual('./popup/popup'),
  initTradeConfirmationToggle: jest.fn(),
}));

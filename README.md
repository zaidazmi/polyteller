# Polyteller

Polyteller is a browser extension for Polymarket, a prediction market platform. It provides real-time countdowns, notifications for market events, and privacy mode to enhance the user experience for Polymarket traders.

## Features

- Real-time countdown for Polymarket events
- Customizable notifications before event end
- Privacy mode to mask sensitive information
- Popup interface for easy access to event information
- Content script for in-page countdown display

## Browser Compatibility

- Google Chrome (version 110+)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/zaidazmi/polyteller.git
   ```
2. Navigate to the project directory:
   ```bash
   cd polyteller
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the extension:
   ```bash
   npm run build
   ```
5. Load the extension in your browser:
   - Chrome: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the `dist` folder.

## Usage

1. Navigate to a Polymarket event page.
2. The countdown will automatically appear on the page.
3. Click on the Polyteller icon in your browser toolbar to open the popup interface.
4. In the popup, you can set custom notifications for the event.
5. Enable privacy mode to mask sensitive information on the page.

## Development

To start the development server with hot reloading:

```bash
npm run dev
```

## Tech Stack

- TypeScript
- React
- Webpack
- Chrome Extension API
- Firefox WebExtensions API

## Project Structure

- `src/`: Source code
  - `background/`: Background scripts
  - `content/`: Content scripts
  - `popup/`: Popup UI scripts and components
  - `utils/`: Utility functions
  - `types.ts`: TypeScript type definitions
- `public/`: Static assets
- `dist/`: Built extension (generated)

## Testing

To run the test suite:

```bash
npm test
```

## Contact

Zaid Azmi - zaidazmi27@gmail.com

Project Link: [https://github.com/zaidazmi/polyteller](https://github.com/zaidazmi/polyteller)
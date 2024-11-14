# Polyteller

A Chrome extension for Polymarket that provides real-time countdowns, customizable notifications, and privacy features for traders.

## Features

- **Real-time Event Countdowns**
  - Accurate countdown timers for market events
  - Handles timezone conversions and DST changes
  - Displays in both popup and on-page formats

- **Smart Notifications**
  - Customizable notification timing
  - Multiple notifications per event
  - Local timezone display
  - Persistent across browser sessions

- **Privacy Mode**
  - Masks portfolio values and balances
  - Quick toggle via popup
  - Early initialization to prevent data leaks
  - Syncs across all Polymarket tabs

- **Trade Confirmation**
  - Optional confirmation dialog for trades
  - Keyboard shortcuts (Enter/Esc)
  - Configurable in settings
  - Prevents accidental trades

## Installation

1. Clone the repository:
```bash
git clone https://github.com/zaidazmi/polyteller.git
```

2. Install dependencies:
```bash
cd polyteller
npm install
```

3. Build the extension:
```bash
# For production (no logs)
npm run build

# For development (with logs)
npm run dev
```

4. Load in Chrome:
- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` folder

## Development

### Available Scripts
```bash
# Development build with logs and watch mode
npm run dev

# Production build (no logs)
npm run build

# Development build without watch
npm run build:dev

# Clean dist folder
npm run clean

# Run tests
npm test
```

### Project Structure
```
src/
├── background/     # Background service worker
├── content/        # Content scripts
│   ├── extractors/  # Date pattern matching
│   └── parsers/     # Event data parsing
├── popup/          # Extension popup UI
│   └── components/  # UI components
├── utils/          # Shared utilities
├── store/          # State management
└── styles/         # CSS styles
```

### Key Technologies
- TypeScript
- Webpack
- Chrome Extension APIs
- Zustand (State Management)
- Jest (Testing)

## Testing

Run the test suite:
```bash
npm test
```

The test suite covers:
- Date pattern matching
- Timezone handling
- State management
- UI components
- Error handling

## Browser Support
- Chrome/Chromium (v110+)
- Other Chromium-based browsers (Edge, Brave, etc.)

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
MIT License - See LICENSE file for details

## Contact
Zaid Azmi - zaidazmi27@gmail.com

Project Link: [https://github.com/zaidazmi/polyteller](https://github.com/zaidazmi/polyteller)
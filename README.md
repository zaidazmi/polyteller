# Polyteller

A Chrome extension for Polymarket that provides real-time countdowns, customizable notifications, and privacy features for traders.

## Features

- **Real-time Event Countdowns**
  - Accurate countdown timers for market events
  - Handles timezone conversions and DST changes
  - Auto-sync for minor updates without refresh
  - Smart refresh hints for major changes
  - Dynamic update intervals based on remaining time
  - Performance optimized animation frames
  - Handles DST edge cases and timezone transitions
  - Fallback mechanisms for missed updates

- **Smart Notifications**
  - Customizable notification timing
  - Multiple notifications per event
  - Chronological sorting (earliest first)
  - Local timezone display
  - Persistent across browser sessions
  - Grouped by events in all notifications view
  - Debounced notification scheduling
  - Background sync with error recovery
  - Smart cleanup for expired notifications
  - Duplicate prevention with 10-second threshold

- **Privacy Mode**
  - Masks portfolio values and balances
  - Quick toggle via popup
  - Early initialization to prevent data leaks
  - Syncs across all Polymarket tabs
  - Zero-delay initialization via early content script
  - Mutation observer for dynamic content
  - Memory-efficient value storage
  - Automatic cleanup on tab close

- **Trade Confirmation**
  - Optional confirmation dialog for trades
  - Keyboard shortcuts (Enter/Esc)
  - Configurable in settings
  - Syncs state across all tabs
  - Prevents accidental trades

- **Sports Section**
  - Clear indication of unsupported features
  - User-friendly messages
  - Clean UI state management

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
# For production (minified, no logs)
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

# Production build (minified, no logs)
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
- Webpack with advanced minification
- Chrome Extension APIs
- Zustand (State Management)
- Jest (Testing)
- Canvas Confetti

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
- Notification sorting
- Trade confirmation sync

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
Proprietary - All rights reserved

## Contact
Zaid Azmi - hi@polyteller.com

Project Link: [https://github.com/zaidazmi/polyteller](https://github.com/zaidazmi/polyteller)

## Performance Optimizations

- Debounced DOM updates
- Efficient mutation observers
- Memory leak prevention
- Dynamic update intervals
- Background task throttling
- Storage optimization

## Security Features

- No external data transmission
- Local-only storage
- Secure value masking
- Cross-tab state sync
- Clean data lifecycle

## Development Setup

- Requires Node.js >= 14
- nvm use 14  # If using nvm
- npm install

## Build Configuration

- Production build with optimizations
- npm run build
- Includes:
  - Code minification
  - CSS optimization
  - Tree shaking
  - Module concatenation
  - Chrome API name preservation

## Testing

- Run all tests
- npm test

- Run specific test suite
- npm test -- --testPathPattern=datePatterns

- Run tests with coverage
- npm test -- --coverage

## Debugging

- Enable development logs
- npm run dev

- View background logs
- chrome://extensions
- Click "background page" under Polyteller

- Monitor performance
- See TEST_PLAN.md for detailed metrics

## Known Issues

- Sports section currently unsupported
- Some timezone edge cases in specific regions
- Minor UI glitches during rapid tab switching

## Roadmap

- Sports section support
- Additional notification options
- Enhanced privacy features
- Mobile browser support
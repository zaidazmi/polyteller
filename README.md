# Polyteller

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/dellhbjknongjplfapahjibjcpoboapb)](https://chromewebstore.google.com/detail/polyteller-essential-tool/dellhbjknongjplfapahjibjcpoboapb)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Polyteller is an open-source Chrome extension for Polymarket traders. It adds
countdowns, local reminders, privacy masking, and trade confirmations directly
to Polymarket pages.

**[Install from Chrome Web Store](https://chromewebstore.google.com/detail/polyteller-essential-tool/dellhbjknongjplfapahjibjcpoboapb)**

## Why I Built This

I trade on Polymarket from outside the US, and I kept running into the same
problems: missing market deadlines because event times were in a different
timezone, accidentally placing trades without a second look, and having my
portfolio visible on screen when I didn't want it to be. None of the existing
tools solved these small but annoying issues, so I built Polyteller to fix them
for myself. It turned out useful enough to open source.

## Features

- Real-time event countdowns on Polymarket event pages.
- Custom local reminders before market events.
- Privacy mode for masking balances and portfolio values.
- Optional trade confirmation prompts to reduce accidental actions.
- Cross-tab sync for extension settings and privacy state.
- Production and development builds for Chrome Extension Manifest V3.

## Privacy

Polyteller is designed as a local-first browser extension.

- No backend service is required.
- No analytics SDK is included.
- No personal data is sold or shared.
- Extension preferences are stored locally through Chrome extension storage.
- Host permissions are scoped to `polymarket.com`.

## Requirements

- Node.js 20 or newer.
- npm.
- Chrome or another Chromium-based browser, version 110 or newer.

## Installation From Source

```bash
git clone https://github.com/zaidazmi/polyteller.git
cd polyteller
npm install
npm run build
```

Then load the extension in Chrome:

1. Open `chrome://extensions/`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the generated `dist/` folder.

## Development

```bash
npm run dev        # development build with watch mode
npm run build      # production build
npm run build:dev  # one-off development build
npm run clean      # remove dist/
npm test           # run Jest tests
```

The current extension version is `1.0.6`. The build scripts keep
`package.json` aligned with `manifest.json`.

## Project Structure

```text
src/
├── background/      # Manifest V3 service worker logic
├── content/         # Polymarket page integration
│   ├── extractors/  # Date and event extraction
│   └── parsers/     # Event data parsing
├── popup/           # Extension popup UI
│   └── components/  # Popup components
├── store/           # Shared state management
├── styles/          # Extension styles
└── utils/           # Shared utilities
```

## Technology

- TypeScript.
- Chrome Extension Manifest V3.
- Webpack.
- Zustand.
- Jest.
- Day.js.

## Testing

```bash
npm test
```

The test suite covers date extraction, timezone handling, state management,
popup behavior, privacy mode behavior, and notification logic.

## Build

```bash
npm run build
```

Production builds are generated into `dist/` and include JavaScript
minification, CSS optimization, and static asset copying for extension loading.
Generated artifacts are intentionally ignored by git.

## Browser Support

- Chrome 110 or newer.
- Chromium-based browsers such as Edge and Brave.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md)
before opening a pull request.

Good areas for contribution include:

- Additional date and event format coverage.
- Popup accessibility improvements.
- Browser compatibility checks.
- Smaller permission surface area.
- Documentation improvements.

## Disclaimer

Polyteller is an independent open-source project and is not affiliated with,
endorsed by, or sponsored by Polymarket. It does not provide financial advice
or execute trades.

## License

MIT License. See [LICENSE](LICENSE).

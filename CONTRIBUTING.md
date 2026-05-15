# Contributing to Polyteller

Thanks for taking a look at Polyteller. This project is a Chrome extension, so
small changes can affect real browser behavior. Please keep pull requests
focused and include manual testing notes when the change touches UI, browser
permissions, storage, alarms, or content scripts.

## Setup

```bash
git clone https://github.com/zaidazmi/polyteller.git
cd polyteller
npm install
npm run build
```

Load `dist/` from `chrome://extensions/` with Developer mode enabled.

## Development Workflow

```bash
npm run dev        # watch build
npm run build      # production build
npm test           # Jest tests
```

Before opening a pull request, run:

```bash
npm test
npm run build
```

## Pull Request Guidelines

- Keep the change scoped to one product or engineering concern.
- Add or update tests for date parsing, notification behavior, storage behavior,
  or UI state changes when practical.
- Include screenshots or a short recording for visible UI changes.
- Include manual test notes for Chrome extension behavior.
- Avoid committing generated files such as `dist/`, `coverage/`, zips, logs, or
  local OS/editor files.

## Good First Contributions

- Add tests for a new Polymarket market-rule date format.
- Improve README or setup documentation.
- Tighten TypeScript types around extension messages.
- Improve extension popup accessibility.
- Reduce dependency or permission surface area.

## Project Principles

- Local-first unless a backend is truly necessary.
- Prefer honest unsupported states over fragile partial support.
- Treat privacy and user trust as product requirements, not afterthoughts.
- Keep UI changes practical and workflow-oriented.

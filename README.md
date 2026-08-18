# StayBook

StayBook is an Angular web application for holiday-rental owners to prepare and share clear guest guidance. It centralizes check-in details, home access, house information, recommendations, and checkout instructions in one guided workflow.

## What you can do

- Sign in as an owner and manage multiple properties.
- Complete a structured guide editor with validation and progress tracking.
- Review guide completeness before sharing.
- Open the guest-facing experience for each property, including Home, details, and navigation cards.

## Prerequisites

- Node.js `24.18.1` (see `.nvmrc`)
- npm `11.x`
- A modern browser (Chromium, Firefox, or WebKit based)

## Quick start

Install dependencies:

```bash
npm ci
```

Start the app:

```bash
npm start
```

Open:

`http://localhost:4200/`

## Quality checks

Run the full project quality gate:

```bash
npm run check
```

This runs formatting, linting, unit tests, build, and end-to-end tests.

Useful focused commands:

- `npm run test` - unit and component tests
- `npm run build` - production build
- `npm run e2e` - Playwright end-to-end suite

## Fixture account

Use this fictional account to explore a preloaded workspace:

- Email: `demo@demo.com`
- Password: `demo123`

It includes three sample properties with different completion states.

If you create a new account from the UI, the dashboard starts empty so you can test the full creation flow from scratch.

## Troubleshooting

### Wrong Node or npm version

If installation or scripts fail unexpectedly, confirm your versions:

```bash
node -v
npm -v
```

Then switch to Node `24.18.1` and reinstall with `npm ci`.

### Port 4200 already in use

Stop the process using that port, or run Angular on another one:

```bash
npm start -- --port 4300
```

### Dependency mismatch after branch changes

Clean install again:

```bash
npm ci
```

### Sign-in or data behaves unexpectedly after many test runs

Clear browser site data for the app origin and sign in again.

## Architecture snapshot

StayBook uses:

- Angular standalone APIs with lazy feature routes
- Strict TypeScript
- Typed Reactive Forms and signals
- Focused services/facades for application flows
- Vitest for unit/component coverage
- Playwright (+ axe) for end-to-end and accessibility checks

## Project structure

- `src/app/core` - app shell, routing, auth, i18n, storage, workspace orchestration
- `src/app/domain` - models and mapping logic
- `src/app/features` - owner and guest feature flows
- `src/app/shared` - reusable UI components and cross-feature utilities
- `e2e` - Playwright scenarios
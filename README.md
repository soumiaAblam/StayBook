# StayBook

StayBook is a local-first Angular web application for holiday-rental owners. It helps an owner organise the practical information guests need before arrival and during a stay, including check-in, home access, Wi-Fi, house rules, local recommendations, transport, extras, support and check-out.

This repository is currently being built as a professional technical-demo application. It is frontend-only and intentionally has no backend, remote database, booking flow, payment processing, email delivery or production deployment.

## Local-only scope

StayBook runs in one browser and stores demo data on that device. It does not publish a guide to the Internet or synchronise information across devices. Guest preview links are only reliable in the browser tab and session where the related property exists.

The local account flow is a product demonstration, not secure authentication or hosting. Browser storage, route guards, password derivation and an opaque property identifier do not create an authorisation boundary. Do not enter real door codes, Wi-Fi passwords, personal contact details or production data.

If a local password is lost, there is no password-recovery flow. Clear the site's browser data to remove the local accounts and start again.

## Prerequisites

- Node.js `24.18.1` (the expected version is also recorded in `.nvmrc`)
- npm `11.x`
- A current Chromium, Firefox or WebKit-based browser

## Get started

Install the exact dependency versions from the lockfile:

```bash
npm ci
```

Start the development server:

```bash
npm start
```

Then open `http://localhost:4200/`.

Run the complete local quality gate:

```bash
npm run check
```

The quality gate checks formatting, linting, unit tests, the production build and end-to-end tests. Individual scripts remain available in `package.json` when a narrower check is useful.

## Planned architecture

The application uses Angular standalone components, strict TypeScript, lazy feature routes, typed Reactive Forms, signals and focused services/facades. SCSS provides design tokens and component styling. Vitest covers unit and component behaviour; Playwright and axe cover critical journeys, responsive behaviour and accessibility.

The source is organised around responsibilities rather than a global folder for every file type:

- `core`: application shell, routing, local account flow, localisation and storage adapters
- `domain`: framework-light models, validation, completion rules and Guest projections
- `features`: language, account access, properties, guide editor, review and Guest guide journeys
- `shared`: reusable UI, icons, validators and utilities

Persisted payloads are namespaced, schema-versioned and validated when read. Guest screens receive an explicit projection of Owner data instead of the complete editing model.

## Browser storage model

- `localStorage`: local accounts and the selected interface language. Passwords must never be stored as plaintext; account verification uses a salted password-derived value.
- `sessionStorage`: the authenticated session, Owner workspace, properties, images and guide content. This data ends with the browser-tab session.

This separation supports the approved local demo behaviour; it must not be interpreted as a security guarantee. A production service would require a backend, server-side identity, access control, protected persistence and a separate security review.

## Language policy

The fixed interface is designed for Spanish, English, French and German (`ES`, `EN`, `FR`, `DE`). Content entered by an Owner is stored once and displayed unchanged; StayBook does not automatically translate it.

All source code, file names, routes, symbols, tests, technical documentation and commit messages are written in English. Translation catalogues necessarily contain the user-facing copy for all four supported languages.

## Demo fixture

Use this public, fictional account to review a complete dashboard without entering setup data:

- Email: `demo@staybook.local`
- Password: `StayBookDemo2026!`

The account seeds exactly three fictional properties into the current browser-tab session. It contains no real access codes, Wi-Fi credentials, addresses or personal contacts. Changes persist only for that tab session and are not overwritten while it remains open. Accounts created through the interface start with an empty property dashboard.

## Production status

StayBook is not approved for production use, public hosting or real accommodation data. The current objective is a robust, accessible and reproducible local demonstration.

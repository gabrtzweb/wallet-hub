# Wallet Hub

Wallet Hub is a personal Open Finance dashboard built with Pluggy data integration. It consolidates bank accounts, credit cards, investments, and transactions into a single interface with dedicated Overview, Flow, Assets, and Connections pages.

**Latest Features:**
- Manual Wallet support (track physical cash)
- Improved loading UI with animation and card style
- Custom sorting logic for connections (Pluggy Automated, Manual Import, Physical Wallet)
- Pixel-perfect UI alignment and micro-interactions

## Overview

- Consolidated financial dashboard with real account data.
- Read-only Open Finance integration through Pluggy.
- Dedicated pages:
	- `/` Home (landing)
	- `/overview` Overview
	- `/flow` Cash Flow (Flow)
	- `/assets` Assets
	- `/connections` Connections
- Localized UI (`PT`/`EN`) with dark and light themes.

## Pluggy Resources

- Meu Pluggy: `https://meu.pluggy.ai/`
- Pluggy Dashboard: `https://dashboard.pluggy.ai/`
- Meu Pluggy GitHub repo: `https://github.com/pluggyai/meu-pluggy`

## Current Status

Completed:

- Real routing with modular pages (`Overview`, `Flow`, `Assets`, `Connections`).
- Data hook extraction and shared config/copy organization.
- Monthly flow normalization aligned with Pluggy behavior.
- Responsive header improvements (mobile hamburger, icon-only controls on mobile).
- Mobile and desktop footer refinements.

## Architecture

- `frontend/`: React + Vite SPA.
- `backend/`: Node.js + Express API proxy for Pluggy.

Data flow:

1. Frontend requests `GET /api/dashboard-data`.
2. Backend queries Pluggy (accounts, investments, transactions).
3. Backend returns consolidated payload.
4. Frontend computes view metrics and renders cards/charts/lists.

## Tech Stack

- Frontend: React 19, Vite, React Router, Recharts, Lucide.
- Backend: Node.js, Express, Pluggy SDK, CORS, dotenv.

## Project Structure

```text
wallet-hub/
	backend/
		server.js
		package.json
	frontend/
		src/
			App.jsx
			components/
			config/
			hooks/
			pages/
			assets/
		package.json
	readme.md
```

## Getting Started

### 1) Setup

Clone or download the project, then install dependencies for all packages:

```bash
npm run install:all
```

### 2) Environment



No backend `.env` file is required. Pluggy credentials are provided by the user at runtime (BYOK) in the UI (`Connections` page).

### 3) Start Development

From the root folder:

```bash
npm run dev
```

This will start both the backend API server (`http://localhost:3000`) and the frontend dev server (`http://localhost:5173`) simultaneously.

### 4) Stop or Restart Development

From the root folder:

```bash
npm run stop
```

Stops both backend and frontend dev servers by freeing ports `3000` and `5173`.

```bash
npm run restart
```

Stops both servers and starts them again in one command.

**Frontend default URL:** `http://localhost:5173`

### 5) BYOK Flow (Bring Your Own Key)

1. Open `/connections`.
2. Click `+ Nova conexão`.
3. Fill in:
	- Pluggy Client ID
	- Pluggy Client Secret
	- Item IDs (comma or line separated)
4. Save credentials.

The frontend stores these credentials in browser `localStorage` and injects them into backend request headers.

## Available Scripts

Root (`package.json`):

- `npm run install:all`: installs backend and frontend dependencies.
- `npm run dev`: starts backend and frontend together.
- `npm run stop`: stops backend/frontend dev servers on ports `3000` and `5173`.
- `npm run restart`: runs `stop` and starts both servers again.

Backend (`backend/package.json`):

- `npm run dev`: starts the API server.
- `npm start`: starts the API server.

Frontend (`frontend/package.json`):

- `npm run dev`: starts Vite dev server.
- `npm run build`: production build.
- `npm run preview`: preview built app.
- `npm run lint`: run ESLint.

## API

Main endpoint:

- `GET /api/dashboard-data`

Required headers for Pluggy requests:

- `x-pluggy-client-id`
- `x-pluggy-client-secret`
- `x-pluggy-item-ids`

Returns consolidated arrays for:

- `bankAccounts`
- `creditCards`
- `investments`
- `transactions`
- `balanceEvolution`
- `failedItems`

## Security Notes

- Do not commit `.env` files.
- Keep Pluggy credentials local.
- Integration is read-only by design in this project.

## Roadmap
- Expand manual connection support for non-Open Finance institutions
- Further UI/UX refinements and accessibility improvements
- Additional data visualizations and analytics cards
- Upcoming payments and bill tracking features
- Automated tests for data normalization and financial totals

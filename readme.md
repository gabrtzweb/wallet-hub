# Wallet Hub

Wallet Hub is a personal Open Finance dashboard built with Pluggy data integration. It consolidates bank accounts, credit cards, investments, and transactions into a single interface with dedicated Overview, Flow, Assets, and Connections pages.

## Overview

- Consolidated financial dashboard with real account data.
- Read-only Open Finance integration through Pluggy.
- Dedicated pages:
	- `/` Overview
	- `/flow` Cash Flow (Flow)
	- `/assets` Assets
	- `/connections` Connections
- Localized UI (`PT`/`EN`) with dark and light themes.

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

Create `backend/.env` with:

```env
PLUGGY_CLIENT_ID=your_client_id
PLUGGY_CLIENT_SECRET=your_client_secret
PLUGGY_DASHBOARD_ITEM_IDS=item_id_1,item_id_2
PORT=3000
```

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

- Manual connection support for non-Open Finance institutions.
- Enhanced UI/UX design refinements and micro-interactions.
- Additional data visualizations and analytics cards.
- Upcoming payments and bill tracking features.
- Add automated tests for data normalization and financial totals.

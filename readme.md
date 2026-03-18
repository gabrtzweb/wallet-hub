# Wallet Hub

Wallet Hub is a personal Open Finance dashboard built with Pluggy data integration. It consolidates bank accounts, credit cards, investments, and transactions into a single interface with dedicated Overview and Flow pages.

## Overview

- Consolidated financial dashboard with real account data.
- Read-only Open Finance integration through Pluggy.
- Dedicated pages:
	- `/` Overview
	- `/flow` Cash Flow (Flow)
- Localized UI (`PT`/`EN`) with dark and light themes.

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

### 1) Backend

```bash
cd backend
npm install
```

Create `backend/.env` with:

```env
PLUGGY_CLIENT_ID=your_client_id
PLUGGY_CLIENT_SECRET=your_client_secret
PLUGGY_DASHBOARD_ITEM_IDS=item_id_1,item_id_2
PORT=3000
```

Run backend:

```bash
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Available Scripts

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

- Improve Flow filters (month/account/search/type) with real behavior.
- Add dedicated pages for Assets and Connections.
- Add tests for data normalization and totals consistency.

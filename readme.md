# Wallet Hub

Wallet Hub is a personal Open Finance dashboard built with Pluggy data integration. It consolidates bank accounts, credit cards, investments, and transactions into a single interface with dedicated Overview, Flow, Assets, and Connections pages.

**Latest Features (v1.1.2):**
- **Data Backup & Restore**: Export all connections, transactions, and API credentials to JSON backup files; import backups to restore data with one click.
- **Enhanced Theme Design**: Card and header backgrounds now use 10% opacity for both light and dark modes; improved border visibility in dark mode with subtle shadows.
- **Refined Loading State**: Loading card now hides other page content while displaying progressive feedback; text color adapts by theme for better readability.
- **Visual Enhancements**: Integrated noise texture overlay on app background (10% opacity) for added depth; improved dark mode edge definition with color-tinted borders and depth shadows.
- **Manual Wallet Support**: Track physical cash and manual account balances with transaction history.
- **Custom Connection Sorting**: Intelligent ordering (Pluggy Automated, Manual Import, Physical Wallet).
- **Pixel-perfect UI**: Full light/dark theme support with localization for PT/EN.
- **Flow Summary Cards**: New top-row summary cards for Income, Expenses, and Future Expenses with category-based progress bars.
- **Financial Health Score**: Dynamic 0-100 score based on spending, debt utilization, and monthly surplus, with localized metric labels/status.
- **Projected Balance Card**: New "Projected Balance" card showing `Bank Total - Credit Bills` with a right-side breakdown (`Em conta` / `Faturas`).
- **Flow Localization Expansion**: Added localized PT/EN copy for new Flow cards, subtitles, empty states, and Financial Health statuses.

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
- Flow page redesign with summary cards and dynamic category bars.
- Financial Health calculation utility (`frontend/src/utils/financialHealthCalculator.js`) integrated into Flow page.
- Projected Balance card with bank vs credit breakdown and conditional positive/negative highlighting.

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
			utils/
				backupExport.js (Export/Import backup utilities)
				manualConnections.js
				pluggyCredentials.js
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
2. Click `+ Nova conexão` or `+ New connection`.
3. Fill in:
	- Pluggy Client ID
	- Pluggy Client Secret
	- Item IDs (comma or line separated)
4. Save credentials.

The frontend stores these credentials in browser `localStorage` and injects them into backend request headers.

### 6) Data Backup & Restore

**Export Backup:**
1. Navigate to `/connections` page.
2. Click the `Export` button in the connections header.
3. A JSON file (`wallet-hub-backup-YYYY-MM-DD.json`) downloads automatically.
4. Store this file safely for future recovery.

**Import Backup:**
1. Navigate to `/connections` page.
2. Click the `Import` button in the connections header.
3. Select a previously exported JSON backup file.
4. Confirm the import — all data (manual connections, transactions, and API credentials) will be restored.
5. The app automatically reloads to display restored data.

**Backed-up Data:**
- Manual wallet connections and balances
- Manual wallet transaction history
- Pluggy API credentials (Client ID, Client Secret, Item IDs)

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
- Encrypted backup storage option
- Automated backup scheduling
- Additional data visualizations and analytics cards
- Upcoming payments and bill tracking features
- Automated tests for data normalization and financial totals
- Further UI/UX refinements and accessibility improvements

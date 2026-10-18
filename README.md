# BhoomiBandhu — React + Express + MySQL

The frontend has been migrated from standalone HTML pages to a React single-page application. Page markup is in JSX components, routing uses React Router, and page-specific behavior is in JavaScript modules. Express remains the API/backend and connects to MySQL.

## Stack
- React 18 + React DOM
- Vite development server and production bundler
- React Router for page navigation
- Express REST API
- MySQL 8 via `mysql2`

## Requirements
- Node.js 18 or later
- MySQL 8.x

## Install and configure

```bash
npm install
```

Copy `.env.example` to `.env`, then set your local MySQL host, port, username, password and database name. Configure optional weather/AI provider keys if you want those integrations.

Import the schema and sample data:

```bash
mysql -u root -p < database/bhoomibandhu_dbase.sql
```

**Warning:** the SQL script drops and recreates the project's tables. Back up any existing data before importing it.

## Development

```bash
npm run dev
```

- React/Vite frontend: `http://localhost:5173`
- Express API: `http://localhost:3000`
- API health: `http://localhost:3000/api/health`

## Production

```bash
npm run build
npm start
```

Then open `http://localhost:3000`. The Express server serves the compiled React app from `client/dist` and the API from `/api`.

## Project structure

- `client/index.html` — Vite's single HTML entry point (not separate page HTML files)
- `client/src/main.jsx` — React bootstrap
- `client/src/App.jsx` — React Router routes
- `client/src/pages/*.jsx` — 13 React page components
- `client/src/legacy/*.js` — existing page behavior migrated to JavaScript modules for compatibility
- `client/src/styles.css` and `client/src/pageStyles/` — frontend styles
- `server.js` — Express backend and API endpoints
- `database/bhoomibandhu_dbase.sql` — MySQL schema and sample records

## Notes
- The old standalone page HTML files are no longer the application entry points; the UI is rendered through React routes.
- A few existing interactions still use DOM-based JavaScript from `client/src/legacy/` to preserve their current behavior. They can be refactored into React state/hooks incrementally.
- Do not commit `.env` or API keys.
- MySQL-backed features require the database service and valid credentials.

## Government schemes API integration

The React Government Schemes page loads records from two endpoints:

- `GET /api/government-schemes` — active scheme records from MySQL.
- `GET /api/external-government-schemes` — optional live data from an external provider, proxied through Express.

To connect a provider, set these values in the root `.env` file:

```env
GOV_SCHEMES_API_URL=https://provider.example/api/schemes
GOV_SCHEMES_API_KEY=your_private_key
GOV_SCHEMES_API_KEY_HEADER=Authorization
GOV_SCHEMES_API_KEY_PREFIX=Bearer
```

Use the actual URL and authentication method from the provider's documentation; the example domain above is only a placeholder. For a plain API key header, set `GOV_SCHEMES_API_KEY_HEADER=x-api-key` and `GOV_SCHEMES_API_KEY_PREFIX=none`. Restart Express after changing `.env`. Never place private API keys in React code or variables prefixed with `VITE_`.

The proxy accepts a JSON array or an object containing a `schemes`, `data`, `results`, `items`, or `records` array. It maps common field names (name/title, description/benefits, eligibility, official URL) into the page's display format. If your provider uses a different response shape, adapt the mapping in `server.js` under `/api/external-government-schemes`. External provider data is optional; local database schemes still display when no provider is configured.

The app does not assume an official Indian government API exists at any guessed URL. Use an API endpoint you have permission to access and verify its data and usage terms.

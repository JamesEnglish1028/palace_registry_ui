# Deploy to Render

This project is configured to run on Render as a single Node web service:
- `proxy-server.js` serves API proxy routes (`/api/libraries`, `/api/geojson`)
- the same server also serves the built React app from `dist/`

## Option 1: Blueprint (recommended)

1. Push this repo to GitHub.
2. In Render, create a new service using **Blueprint**.
3. Select this repository.
4. Render will read `render.yaml` and configure:
   - `buildCommand`: `npm ci && npm run build`
   - `startCommand`: `node proxy-server.js`
   - `healthCheckPath`: `/healthz`

## Option 2: Manual Web Service

1. Create a **Web Service** in Render connected to this repo.
2. Configure:
   - Environment: `Node`
   - Build Command: `npm ci && npm run build`
   - Start Command: `node proxy-server.js`
3. Set environment variable:
   - `NODE_VERSION=20`

## Notes

- The frontend uses relative API paths (`/api/...`), so no extra API base URL is needed on Render.
- `vite.config.ts` supports both:
  - GitHub Pages base path in GitHub Actions
  - root path (`/`) for Render and local builds
- Health check endpoint: `/healthz`

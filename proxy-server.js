import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');

app.use(cors());

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/api/libraries', async (_req, res) => {
  try {
    const response = await fetch('https://registry.palaceproject.io/libraries');
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch registry');
    }
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).send(`Proxy error: ${error.message}`);
  }
});

app.get('/api/geojson', async (req, res) => {
  try {
    const rawUrl = req.query.url;
    if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
      return res.status(400).send('Missing required query parameter: url');
    }

    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return res.status(400).send('Invalid url parameter');
    }

    const allowedHosts = new Set([
      'registry.palaceproject.io',
      'registry.thepalaceproject.org',
      'registry.librarysimplified.org'
    ]);

    if (!allowedHosts.has(parsed.hostname)) {
      return res.status(400).send('Focus URL host is not allowed');
    }

    // Normalize to https for upstream requests even if catalog data provides http URLs.
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    } else if (parsed.protocol !== 'https:') {
      return res.status(400).send('Focus URL protocol must be http or https');
    }

    const response = await fetch(parsed.toString());
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch GeoJSON');
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('GeoJSON proxy error:', error);
    return res.status(500).send(`GeoJSON proxy error: ${error.message}`);
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

if (fs.existsSync(DIST_DIR) && fs.existsSync(INDEX_FILE)) {
  app.use(express.static(DIST_DIR));

  app.get(/.*/, (_req, res) => {
    res.sendFile(INDEX_FILE);
  });
} else {
  app.get('/', (_req, res) => {
    res.status(200).send('Proxy server is running. Build the frontend to serve the app.');
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

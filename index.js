const express = require('express');
const addon = express();
const scraper = require('./src/scraper');

const PORT = process.env.PORT || 7000;

// CORS headers (REQUIRED for Stremio)
const respond = (res, data) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
};

// Addon manifest
const MANIFEST = {
  id: 'org.vietsub.motchill',
  version: '1.0.0',
  name: 'VietSub Motchill',
  description: 'Vietnamese movies and TV shows from motchilltv.chat',
  types: ['movie', 'series'],
  resources: ['catalog', 'meta', 'stream'],
  catalogs: [
    {
      type: 'movie',
      id: 'vietsub-movies',
      name: 'Vietnamese Movies',
      extra: [{ name: 'search', isRequired: false }]
    },
    {
      type: 'series',
      id: 'vietsub-series',
      name: 'Vietnamese Series',
      extra: [{ name: 'search', isRequired: false }]
    }
  ],
  idPrefixes: ['vietsub-', 'tt']
};

// Manifest endpoint
addon.get('/manifest.json', (req, res) => {
  respond(res, MANIFEST);
});

// Catalog endpoint (for content discovery)
addon.get('/catalog/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;
  const { search } = req.query;

  try {
    const metas = await scraper.getCatalog(type);
    respond(res, { metas });
  } catch (error) {
    console.error('Catalog error:', error);
    respond(res, { metas: [] });
  }
});

// Meta endpoint (for item details)
addon.get('/meta/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;

  // Extract slug from vietsub- prefix
  const slug = id.replace('vietsub-', '');

  try {
    const meta = await scraper.getMeta(slug);
    respond(res, { meta });
  } catch (error) {
    console.error('Meta error:', error);
    respond(res, { meta: { id, type, name: 'Error loading metadata' } });
  }
});

// Stream endpoint (for video sources)
addon.get('/stream/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;

  // Extract slug from vietsub- prefix
  const slug = id.replace('vietsub-', '');

  try {
    const streams = await scraper.getVideoSources(slug);
    respond(res, { streams });
  } catch (error) {
    console.error('Stream error:', error);
    respond(res, { streams: [] });
  }
});

// Health check
addon.get('/', (req, res) => {
  res.send('VietSub Stremio Addon is running!');
});

addon.listen(PORT, () => {
  console.log(`VietSub addon running on http://localhost:${PORT}`);
  console.log(`Add to Stremio: http://localhost:${PORT}/manifest.json`);
});

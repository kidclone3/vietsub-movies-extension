# VietSub Stremio Addon

Vietnamese movie and TV show streaming addon for Stremio, powered by motchilltv.chat.

## Status

✅ **Core Features Working:**
- Video source extraction (HLS streams from JWPlayer)
- Metadata extraction (title, description, genres, episode count)
- Stremio addon protocol (manifest, meta, stream endpoints)

⚠️ **Known Limitations:**
- Catalog endpoint not fully implemented (returns empty)
- Content must be accessed via direct IDs (see Usage below)

## Features

- 📽️ Vietnamese movies and TV series from motchilltv.chat
- 🎬 HLS streaming links extracted via Playwright + JWPlayer
- 📺 Series with episode support
- 🏷️ Metadata including genres and episode count

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the addon server:
   ```bash
   npm start
   ```

3. Add to Stremio:
   - Open Stremio
   - Go to Settings > Addons
   - Enter: `http://localhost:7000/manifest.json`

## Usage

### Finding Content on motchilltv.chat

1. Browse to [motchilltv.chat](https://motchilltv.chat)
2. Find a movie or series you want to watch
3. Copy the slug from the URL (e.g., `/con-ra-the-thong-gi-nua` → `con-ra-the-thong-gi-nua`)

### Using in Stremio

1. Search for the content using the ID format: `vietsub-{slug}`
   - Example: `vietsub-con-ra-the-thong-gi-nua`
2. Or search for the title and select from results

### For Series Episodes

The addon automatically loads the first episode. To watch different episodes, use:
- ID: `vietsub-{slug}` (auto-loads episode 1)

## Project Structure

```
├── index.js              # Main Express server with Stremio endpoints
├── src/
│   └── scraper.js        # Playwright scraper for motchilltv.chat
├── package.json          # Dependencies
├── test-scraper.js       # Test the scraper directly
└── .mcp.json             # Playwright MCP configuration
```

## API Endpoints

| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /manifest.json` | Addon manifest | - |
| `GET /meta/:type/:id.json` | Item metadata | `/meta/movie/vietsub-con-ra-the-thong-gi-nua.json` |
| `GET /stream/:type/:id.json` | Video streams | `/stream/movie/vietsub-con-ra-the-thong-gi-nua.json` |

## Testing

```bash
# Test scraper directly
node test-scraper.js

# Test addon endpoints (requires server running)
node test-endpoints.js
```

## How It Works

1. **Navigation**: Opens motchilltv.chat episode page in headless Chrome
2. **Player Extraction**: Waits for JWPlayer to initialize
3. **Source Extraction**: Reads HLS stream URL from JWPlayer configuration
4. **Stremio Format**: Returns streams in Stremio-compatible format

## Technical Details

- Uses Playwright to render JavaScript-heavy pages
- Extracts video sources from JWPlayer instance (not HTML parsing)
- Returns HLS (.m3u8) streams from cdn2.vixos.store
- Supports series with multiple episodes

## TODO

- [ ] Implement proper catalog from homepage
- [ ] Add caching for better performance
- [ ] Add episode selection in Stremio UI
- [ ] Deploy to public server (Vercel, Railway, etc.)
- [ ] Add error handling for rate limiting

## Notes

- Requires Playwright browsers: `npx playwright install chromium`
- Headless browser mode for server deployment
- Sources are extracted from JWPlayer client-side configuration

## License

MIT

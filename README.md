# VietSub Stremio Addon

Vietnamese movie and TV show streaming addon for Stremio, powered by motchilltv.chat.

## Features

- 🎬 **Vietnamese Content**: Movies and TV series from motchilltv.chat
- 🌐 **Title Mapping**: Vietnamese ↔ English title mapping with IMDb ID support
- 📺 **Series Support**: Full episode support for TV series
- 🎯 **Multi-Server**: 6 server options (3 Vietsub + 3 Thuyết Minh dubbed)
- 🖥️ **Web Player**: Beautiful Plyr player with HLS.js for direct streaming
- 🔍 **Search**: Search by English or Vietnamese titles

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Start the server
npm start
```

The addon will be available at:
- **Stremio Manifest**: `http://localhost:7000/manifest.json`
- **Web Player**: `http://localhost:7000/player`

## Installation in Stremio

1. Open Stremio
2. Go to **Settings > Addons**
3. Click **"+"** to add addon
4. Enter: `http://localhost:7000/manifest.json` (or your public URL)
5. Click **Install**

## Usage

### Searching Content

Search by **English title** or **Vietnamese title**:

```
How Dare You
Còn Ra Thể Thống Gì Nữa
```

### Series Episodes

Series automatically support all episodes. In Stremio:
1. Select the series
2. Click on any episode in the season
3. The addon will fetch the correct stream for that episode

### Web Player

For direct streaming without Stremio, use the web player:
```
http://localhost:7000/player?episode=1
```

Features:
- Episode selector dropdown
- Server switching (6 options)
- Custom URL input
- Vietnamese UI
- Keyboard shortcuts (Space, Arrow keys)

## Content Mapping

The addon includes a built-in mapping of popular Vietnamese content to IMDb IDs:

| Vietnamese Title | English Title | IMDb ID |
|-----------------|---------------|---------|
| Còn Ra Thể Thống Gì Nữa | How Dare You | tt35231547 |

### Adding New Content

Edit `src/mapping.js` to add new content:

```javascript
'movie-slug': {
  imdbId: 'tt1234567',
  englishTitle: 'English Title',
  vietnameseTitle: 'Tiếng Việt Title',
  alsoKnownAs: ['Alternative Name 1', 'Alternative Name 2']
}
```

## Server Options

The addon extracts 6 server options from motchilltv.chat:

### Subtitle Servers (Vietsub)
| Server | Quality | Status |
|--------|---------|--------|
| Vietsub 1 | Variable | ⚠️ TikTok CDN issues |
| Vietsub 2 | ~720p (1280x536) | ✅ Working |
| Vietsub 4K | ~720p (1280x536) | ✅ Working (not true 4K) |

### Dubbed Servers (Thuyết Minh)
| Server | Quality | Status |
|--------|---------|--------|
| Thuyết Minh 1 | Variable | ⚠️ TikTok CDN issues |
| Thuyết Minh 2 | ~720p (1280x536) | ✅ Working |
| Thuyết Minh 3 | ~720p (1280x536) | ✅ Working |

> **Note**: Quality labels on motchilltv.chat may not reflect actual stream quality. Use the web player to try different servers.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/manifest.json` | GET | Stremio addon manifest |
| `/catalog/:type/:id.json` | GET | Content catalog (supports search) |
| `/meta/:type/:id.json` | GET | Item metadata by ID |
| `/stream/:type/:id.json` | GET | Video streams by ID |
| `/api/servers/:slug/:episode` | GET | All servers for an episode |
| `/player` | GET | Web player interface |

### Stream ID Format

**Movies**: `vietsub-{slug}` or `tt{imdbId}`

**Series Episodes**: `{imdbId}:{season}:{episode}`
- Example: `tt35231547:1:8` (Season 1, Episode 8)

## Project Structure

```
├── index.js              # Express server with Stremio endpoints
├── player.html           # Plyr + HLS.js web player
├── src/
│   ├── scraper.js        # Playwright scraper for motchilltv.chat
│   └── mapping.js        # Vietnamese-English title mapping
├── package.json          # Dependencies and scripts
├── .mcp.json             # Playwright MCP configuration
└── README.md             # This file
```

## How It Works

1. **Scraping**: Playwright navigates to motchilltv.chat episode pages
2. **Server Discovery**: Extracts all server buttons (Vietsub + Thuyết Minh)
3. **Stream Extraction**: Clicks each server and extracts JWPlayer HLS URLs
4. **Stremio Integration**: Returns streams in `externalUrl` format
5. **Title Mapping**: Maps Vietnamese slugs to IMDb IDs for Stremio recognition

## Web Player Tech Stack

| Component | Library | License |
|-----------|---------|---------|
| Player UI | [Plyr](https://plyr.io/) 3.7.8 | MIT |
| HLS Streaming | [HLS.js](https://github.com/video-dev/hls.js) | Apache-2.0 |
| Styling | Custom CSS | MIT |

## Development

```bash
# Run in development mode
npm start

# Test scraper directly
node -e "require('./src/scraper').getAllServers('con-ra-the-thong-gi-nua', 1).then(console.log)"

# Test endpoint
curl http://localhost:7000/api/servers/con-ra-the-thong-gi-nua/1
```

## Deployment

### Local Network

For use on your local network:
1. Find your local IP: `hostname -I`
2. Use that IP in Stremio: `http://192.168.x.x:7000/manifest.json`

### Public Deployment

Options for public deployment:
- **Railway**: `npx railway deploy`
- **Render**: Connect GitHub repo
- **VPS**: Use PM2: `pm2 start npm --name "vietsub-addon" -- start`

> **Note**: Playwright requires a Linux environment with proper dependencies.

## Troubleshooting

### No streams found
- Try different servers using the web player
- Check if motchilltv.chat is accessible
- Some content may have been removed

### TikTok CDN errors (PNG pixels)
- Use Vietsub 2, Vietsub 4K, or Thuyết Minh servers
- The vixos.store CDN serves tracking pixels, not video

### Series episodes not working
- Verify the IMDb ID in mapping.js
- Check the episode format: `{imdbId}:{season}:{episode}`

### Playwright not found
```bash
npx playwright install chromium
```

## Known Limitations

1. **Quality**: Actual stream quality is ~720p (1280x536), not 4K as labeled
2. **TikTok CDN**: Vietsub 1 and Thuyết Minh 1 use broken TikTok CDN
3. **Source dependency**: Requires motchilltv.chat to be accessible
4. **Catalog**: Limited to manually mapped content in `mapping.js`

## Contributing

Contributions welcome! Areas for improvement:
- Add more content to `mapping.js`
- Implement automatic catalog discovery
- Add caching layer for performance
- Support more Vietnamese streaming sites

## License

MIT License - feel free to use and modify as needed.

## Acknowledgments

- **motchilltv.chat** - Source of Vietnamese content
- **Stremio** - Media center platform
- **Plyr** - Beautiful, accessible player
- **HLS.js** - HLS streaming library
- **Playwright** - Browser automation

---

**Made with ❤️ for Vietnamese content lovers**

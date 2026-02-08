const { chromium } = require('playwright');

/**
 * MotchillTV Scraper
 * Extracts video sources from motchilltv.chat using Playwright
 */

const BASE_URL = 'https://motchilltv.chat';

/**
 * Extract all server options and their stream URLs from a motchilltv episode page
 * @param {string} slug - The slug/path of the content (e.g., 'con-ra-the-thong-gi-nua')
 * @param {number} episode - Episode number
 * @returns {Promise<Object>} Object containing all servers and their streams
 */
async function getAllServers(slug, episode = 1) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const url = episode
      ? `${BASE_URL}/xem-phim-${slug}-tap-${episode}`
      : `${BASE_URL}/xem-phim-${slug}-tap-1`;

    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Find all server buttons (both Vietsub and Thuyết Minh)
    const serverButtons = await page.evaluate(() => {
      const results = [];
      const buttons = Array.from(document.querySelectorAll('button'));
      buttons.forEach(btn => {
        const text = btn.textContent?.trim();
        const classList = Array.from(btn.classList || []);
        // Look for server buttons - include Vietsub, Thuyết Minh, and general server buttons
        const lowerText = text.toLowerCase();
        if (text && text.length > 0 && text.length < 50 &&
            (lowerText.includes('vietsub') ||
             lowerText.includes('thuyết minh') ||
             lowerText.includes('thuyetminh') ||
             lowerText.includes('server'))) {
          results.push({
            text,
            classList,
            isActive: classList.includes('bg-[#A3765D]') || classList.some(c => c.includes('#A3765D'))
          });
        }
      });
      return results;
    });

    // Click each server button and get the stream URL
    const serverStreams = [];

    for (const btn of serverButtons) {
      console.log(`  Testing server: ${btn.text}`);

      // Click the button
      await page.evaluate((btnText) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent?.trim() === btnText);
        if (target) {
          target.click();
        }
      }, btn.text);

      // Wait for player to update
      await page.waitForTimeout(3000);

      // Get the current stream URL
      const streamInfo = await page.evaluate(() => {
        if (window.jwplayer) {
          try {
            const player = window.jwplayer();
            const playlist = player.getPlaylist();
            if (playlist && playlist[0]) {
              return {
                file: playlist[0].file,
                sources: playlist[0].sources?.map(s => ({
                  file: s.file,
                  label: s.label
                }))
              };
            }
          } catch (e) {
            return { error: e.message };
          }
        }
        return null;
      });

      serverStreams.push({
        name: btn.text,
        url: streamInfo?.file,
        isActive: btn.isActive
      });
    }

    return {
      slug,
      episode,
      servers: serverStreams
    };

  } catch (error) {
    console.error(`Error scraping servers from ${slug}:`, error.message);
    return { slug, episode, servers: [], error: error.message };
  } finally {
    await browser.close();
  }
}

/**
 * Get video sources with fallback servers
 * Returns multiple stream options for redundancy
 * @param {string} slug - The slug/path of the content
 * @param {number} episode - Episode number (optional)
 * @returns {Promise<Array>} Array of stream objects for Stremio
 */
async function getVideoSources(slug, episode = null) {
  const result = await getAllServers(slug, episode || 1);

  // Convert to Stremio stream format
  const streams = result.servers.map(server => ({
    name: `VietSub${episode ? ` - Tập ${episode}` : ''} - ${server.name}`,
    externalUrl: server.url
  }));

  // If no servers found, return empty array
  if (streams.length === 0) {
    console.error(`No servers found for ${slug} episode ${episode}`);
    return [];
  }

  console.log(`Found ${streams.length} stream(s) for ${slug} episode ${episode}`);
  return streams;
}

/**
 * Get detailed metadata for a specific movie/show
 * @param {string} slug - The slug/path of the content
 * @returns {Promise<Object>} Meta object for Stremio
 */
async function getMeta(slug) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/${slug}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Extract metadata from the page
    const meta = await page.evaluate(() => {
      const title = document.querySelector('h1, h2, .title')?.textContent?.trim() || 'Unknown';
      const description = document.querySelector('.description, .summary, .content, [class*="intro"]')?.textContent?.trim() || '';
      const poster = document.querySelector('.poster img, .movie-poster img, img[class*="poster"]')?.getAttribute('src') || '';
      const backdrop = document.querySelector('img[class*="backdrop"], img[class*="banner"]')?.getAttribute('src') || poster;

      // Try to extract genres
      const genreElements = document.querySelectorAll('[class*="genre"], a[href*="/the-loai/"]');
      const genres = Array.from(genreElements).map(el => el.textContent?.trim()).filter(Boolean).slice(0, 5);

      // Try to extract year
      const yearElement = document.querySelector('[class*="year"]');
      const year = yearElement?.textContent?.match(/\d{4}/)?.[0] || '';

      // Try to extract episode count for series
      const episodeLinks = document.querySelectorAll('a[href*="tap-"]');
      const isSeries = episodeLinks.length > 0;
      const episodeCount = isSeries ? episodeLinks.length : 1;

      return {
        title,
        description: description.substring(0, 500),
        poster,
        backdrop,
        genres: genres.length > 0 ? genres : ['Vietnamese', 'Asian'],
        year,
        type: isSeries ? 'series' : 'movie',
        episodeCount
      };
    });

    return {
      id: `vietsub-${slug}`,
      type: meta.type,
      name: meta.title,
      poster: meta.poster,
      background: meta.backdrop,
      description: meta.description || `Vietnamese ${meta.type} from motchilltv.chat`,
      genres: meta.genres,
      year: meta.year,
      info: meta.type === 'series' ? [`Episodes: ${meta.episodeCount}`] : undefined
    };

  } catch (error) {
    console.error('Error scraping meta:', error.message);
    return {
      id: `vietsub-${slug}`,
      type: 'movie',
      name: 'Unknown'
    };
  } finally {
    await browser.close();
  }
}

/**
 * Get catalog of movies/shows from motchilltv
 * @param {string} type - 'movie' or 'series'
 * @returns {Promise<Array>} Array of meta objects for Stremio catalog
 */
async function getCatalog(type = 'movie') {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const catalog = [];

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Extract movie/show cards from the page using page.evaluate
    const items = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href^="/"], a[href^="http"]');
      const results = [];

      for (const link of links) {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim();
        const img = link.querySelector('img');
        const poster = img?.getAttribute('src') || img?.getAttribute('data-src');

        // Skip navigation, footer, and non-content links
        if (href &&
            !href.includes('/the-loai/') &&
            !href.includes('/quoc-gia/') &&
            !href.includes('/search') &&
            !href.includes('/tag/') &&
            text &&
            text.length > 2 &&
            text.length < 100 &&
            poster) {
          results.push({
            slug: href.replace(/^\//, ''),
            title: text,
            poster: poster
          });
        }
      }

      // Remove duplicates and limit results
      const unique = [];
      const seen = new Set();
      for (const item of results) {
        if (!seen.has(item.slug)) {
          seen.add(item.slug);
          unique.push(item);
        }
        if (unique.length >= 50) break;
      }

      return unique;
    });

    // Fetch detailed metadata for each item
    for (const item of items.slice(0, 20)) {
      try {
        const meta = await getMeta(item.slug);
        catalog.push(meta);
      } catch (e) {
        catalog.push({
          id: `vietsub-${item.slug.replace(/\//g, '-')}`,
          type: type,
          name: item.title,
          poster: item.poster,
          description: `Vietnamese ${type} from motchilltv.chat`
        });
      }
    }

  } catch (error) {
    console.error('Error scraping catalog:', error.message);
  } finally {
    await browser.close();
  }

  return catalog;
}

module.exports = {
  getVideoSources,
  getAllServers,
  getCatalog,
  getMeta
};

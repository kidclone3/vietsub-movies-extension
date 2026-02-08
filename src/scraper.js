const { chromium } = require('playwright');

/**
 * MotchillTV Scraper
 * Extracts video sources from motchilltv.chat using Playwright
 */

const BASE_URL = 'https://motchilltv.chat';

/**
 * Extract video sources from a motchilltv movie/show page
 * @param {string} slug - The slug/path of the content (e.g., 'con-ra-the-thong-gi-nua')
 * @param {number} episode - Episode number (optional, for series)
 * @returns {Promise<Array>} Array of stream objects for Stremio
 */
async function getVideoSources(slug, episode = null) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const sources = [];

  try {
    // For series, we need to navigate to the episode page
    // The episode URL pattern is: /xem-phim-{slug}-tap-{episode}
    const url = episode
      ? `${BASE_URL}/xem-phim-${slug}-tap-${episode}`
      : `${BASE_URL}/xem-phim-${slug}-tap-1`; // Default to episode 1 if no episode specified

    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for JWPlayer to initialize
    await page.waitForTimeout(5000);

    // Extract video sources from JWPlayer configuration
    const playerData = await page.evaluate(() => {
      if (window.jwplayer) {
        try {
          const player = window.jwplayer();
          const playlist = player.getPlaylist();
          if (playlist && playlist[0]) {
            return {
              file: playlist[0].file,
              sources: playlist[0].sources || [],
              image: playlist[0].image
            };
          }
        } catch (e) {
          return { error: e.message };
        }
      }
      return null;
    });

    if (playerData && playerData.file) {
      console.log(`Found JWPlayer source: ${playerData.file}`);
      sources.push({
        name: `VietSub${episode ? ` - Tập ${episode}` : ''}`,
        externalUrl: playerData.file
      });
    }

    // Also check allSources for multiple quality options
    if (playerData && playerData.sources) {
      playerData.sources.forEach((source, index) => {
        if (source.file && source.file !== playerData.file) {
          console.log(`Found additional source ${index}: ${source.file}`);
          sources.push({
            name: `VietSub ${source.label || `Quality ${index}`}${episode ? ` - Tập ${episode}` : ''}`,
            externalUrl: source.file
          });
        }
      });
    }

  } catch (error) {
    console.error(`Error scraping ${slug}:`, error.message);
  } finally {
    await browser.close();
  }

  return sources;
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
      // Look for all links that might be content items
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
        // If we can't get detailed meta, add basic info
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
        description: description.substring(0, 500), // Limit description length
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
      // For series, add info about episodes
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

module.exports = {
  getVideoSources,
  getCatalog,
  getMeta
};

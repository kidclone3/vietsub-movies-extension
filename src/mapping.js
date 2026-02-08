/**
 * Title mapping for Vietnamese content to IMDb IDs and English titles
 * This allows Stremio to recognize content by its English name
 */

const TITLE_MAPPING = {
  // Format: 'vietnamese-slug': { imdbId, englishTitle, vietnameseTitle }
  'con-ra-the-thong-gi-nua': {
    imdbId: 'tt35231547',
    englishTitle: 'How Dare You',
    vietnameseTitle: 'Còn Ra Thể Thống Gì Nữa',
    alsoKnownAs: ['Cheng He Ti Tong', 'In What Manner', 'This Is Ridiculous', 'What a Disgrace']
  }
};

/**
 * Find content by English title or IMDb ID
 * @param {string} query - English title or IMDb ID to search for
 * @returns {Object|null} - Matching entry with Vietnamese slug
 */
function findByEnglishTitle(query) {
  const normalizedQuery = query.toLowerCase().trim();

  for (const [slug, data] of Object.entries(TITLE_MAPPING)) {
    // Check exact English title match
    if (data.englishTitle.toLowerCase() === normalizedQuery) {
      return { slug, ...data };
    }

    // Check IMDb ID match
    if (data.imdbId === normalizedQuery) {
      return { slug, ...data };
    }

    // Check "also known as" titles
    if (data.alsoKnownAs) {
      for (const aka of data.alsoKnownAs) {
        if (aka.toLowerCase() === normalizedQuery) {
          return { slug, ...data };
        }
      }
    }

    // Check partial match
    if (data.englishTitle.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(data.englishTitle.toLowerCase())) {
      return { slug, ...data };
    }
  }

  return null;
}

/**
 * Get Vietnamese slug from IMDb ID or English title
 * @param {string} id - IMDb ID (e.g., 'tt1234567') or English title
 * @returns {string|null} - Vietnamese slug or null
 */
function getSlugFromId(id) {
  const match = findByEnglishTitle(id);
  return match ? match.slug : null;
}

/**
 * Get metadata with English title mapping
 * @param {string} slug - Vietnamese slug
 * @returns {Object} - Metadata with English titles
 */
function getMetadata(slug) {
  const mapping = TITLE_MAPPING[slug];
  if (!mapping) {
    return null;
  }

  return {
    imdbId: mapping.imdbId,
    englishTitle: mapping.englishTitle,
    vietnameseTitle: mapping.vietnameseTitle,
    alsoKnownAs: mapping.alsoKnownAs || []
  };
}

/**
 * Add or update a mapping entry
 * @param {string} slug - Vietnamese slug
 * @param {Object} data - Mapping data
 */
function addMapping(slug, data) {
  TITLE_MAPPING[slug] = {
    imdbId: data.imdbId || '',
    englishTitle: data.englishTitle || '',
    vietnameseTitle: data.vietnameseTitle || '',
    alsoKnownAs: data.alsoKnownAs || []
  };
}

/**
 * Get all mappings (for catalog generation)
 * @returns {Array} - All mapping entries
 */
function getAllMappings() {
  return Object.entries(TITLE_MAPPING).map(([slug, data]) => ({
    slug,
    ...data
  }));
}

module.exports = {
  TITLE_MAPPING,
  findByEnglishTitle,
  getSlugFromId,
  getMetadata,
  addMapping,
  getAllMappings
};

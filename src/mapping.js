/**
 * Vietnamese-English Title Mapping Module
 * Maps IMDb IDs to Vietnamese content slugs
 */

// Mapping of IMDb IDs to Vietnamese slugs and titles
const MAPPINGS = [
  {
    imdbId: 'tt35231547',
    vietnameseTitle: 'Còn Ra Thể Thống Gì Nữa',
    englishTitle: 'How Dare You!?',
    slug: 'con-ra-the-thong-gi-nua',
    alsoKnownAs: ['How Dare You', 'Còn Ra Thể Thống Gì Nữa']
  }
];

// Additional titles that can be searched
const ADDITIONAL_TITLES = [
  {
    vietnameseTitle: 'Còn Ra Thể Thống Gì Nữa',
    englishTitle: 'How Dare You!?',
    slug: 'con-ra-the-thong-gi-nua'
  }
];

/**
 * Find mapping by IMDb ID
 */
function findByImdbId(imdbId) {
  return MAPPINGS.find(m => m.imdbId === imdbId);
}

/**
 * Find mapping by Vietnamese slug
 */
function findBySlug(slug) {
  return MAPPINGS.find(m => m.slug === slug);
}

/**
 * Find mapping by English title
 */
function findByEnglishTitle(title) {
  // Case-insensitive partial match
  const lowerTitle = title.toLowerCase();
  return MAPPINGS.find(m =>
    m.englishTitle.toLowerCase().includes(lowerTitle) ||
    lowerTitle.includes(m.englishTitle.toLowerCase())
  );
}

/**
 * Find mapping by Vietnamese title
 */
function findByVietnameseTitle(title) {
  const lowerTitle = title.toLowerCase();
  return MAPPINGS.find(m =>
    m.vietnameseTitle.toLowerCase().includes(lowerTitle) ||
    lowerTitle.includes(m.vietnameseTitle.toLowerCase())
  );
}

/**
 * Get slug from IMDb ID
 */
function getSlugFromId(imdbId) {
  const mapping = findByImdbId(imdbId);
  return mapping ? mapping.slug : null;
}

/**
 * Get metadata for a slug
 */
function getMetadata(slug) {
  return findBySlug(slug) || null;
}

/**
 * Get all mappings
 */
function getAllMappings() {
  return MAPPINGS;
}

/**
 * Search for content by title (English or Vietnamese)
 */
function search(query) {
  const lowerQuery = query.toLowerCase();
  return MAPPINGS.filter(m =>
    m.englishTitle.toLowerCase().includes(lowerQuery) ||
    m.vietnameseTitle.toLowerCase().includes(lowerQuery) ||
    m.alsoKnownAs?.some(aka => aka.toLowerCase().includes(lowerQuery))
  );
}

module.exports = {
  findByImdbId,
  findBySlug,
  findByEnglishTitle,
  findByVietnameseTitle,
  getSlugFromId,
  getMetadata,
  getAllMappings,
  search
};

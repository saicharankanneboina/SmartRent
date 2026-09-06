const { calculateDistance } = require('./distanceService');

/**
 * Synonym / alias map for common equipment terms.
 * Keys are aliases users might say; values are canonical terms to match against.
 */
const SYNONYM_MAP = {
  'jcb': 'excavator',
  'digger': 'excavator',
  'earthmover': 'excavator',
  'backhoe': 'excavator',
  'genset': 'generator',
  'dg set': 'generator',
  'power generator': 'generator',
  'rotary tiller': 'rotavator',
  'tiller': 'rotavator',
  'cultivator': 'rotavator',
  'cement mixer': 'concrete mixer',
  'drum mixer': 'concrete mixer',
  'transit mixer': 'concrete mixer',
  'farming machine': 'tractor',
  'farm tractor': 'tractor',
  'power tiller': 'tractor',
  'welder': 'welding machine',
  'arc welder': 'welding machine',
  'speaker': 'sound system',
  'pa system': 'sound system',
  'audio system': 'sound system',
  'dj system': 'sound system',
  'jet washer': 'pressure washer',
  'power washer': 'pressure washer',
  'submersible pump': 'water pump',
  'drainage pump': 'water pump',
  'spotlights': 'event lighting',
  'stage lights': 'event lighting',
  'led lights': 'event lighting'
};

/**
 * Tokenize a string: lowercase, strip punctuation, split by whitespace.
 * @param {string} str
 * @returns {string[]}
 */
const tokenize = (str) => {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
};

/**
 * Expand a list of search terms by resolving synonyms.
 * @param {string[]} terms
 * @returns {string[]} expanded unique terms
 */
const expandWithSynonyms = (terms) => {
  const expanded = new Set(terms.map(t => t.toLowerCase()));
  terms.forEach(term => {
    const lower = term.toLowerCase();
    // Check if this term IS a synonym key
    if (SYNONYM_MAP[lower]) expanded.add(SYNONYM_MAP[lower]);
    // Check if any synonym key appears within the term
    Object.entries(SYNONYM_MAP).forEach(([alias, canonical]) => {
      if (lower.includes(alias)) expanded.add(canonical);
    });
  });
  return Array.from(expanded);
};

/**
 * Check how well a search term matches the equipment (by token overlap).
 * Returns a score multiplier: 1.0 (exact), 0.8 (all tokens match), 0.5 (partial), 0 (no match).
 * @param {string} searchTerm
 * @param {string[]} equipmentTokens - tokens from name + description + category
 * @returns {number}
 */
const termMatchScore = (searchTerm, equipmentTokens) => {
  const termTokens = tokenize(searchTerm);
  if (termTokens.length === 0) return 0;

  // Exact substring match after tokenizing the full equipment text
  const equipmentText = equipmentTokens.join(' ');
  if (equipmentText.includes(searchTerm.toLowerCase())) return 1.0;

  // Count how many term tokens appear in equipment tokens
  const matches = termTokens.filter(t => equipmentTokens.includes(t)).length;
  const ratio = matches / termTokens.length;

  if (ratio === 1) return 0.8;   // All words match but not as a phrase
  if (ratio >= 0.5) return 0.5;  // At least half the words match
  return 0;
};

/**
 * Calculate recommendation score and generate explainable strings.
 *
 * Scoring breakdown:
 *  Primary match      : up to 70 pts
 *  Suggested match    : up to 50 pts
 *  Category match     : +10 pts
 *  Keyword bonus      : +5 pts per keyword hit (max 15)
 *  Availability       : +10 pts
 *  Distance           : up to 20 pts (via Haversine)
 *  Rating             : up to 5 pts
 *  Price (relative)   : up to 15 pts (applied in controller)
 */
const calculateRecommendationScore = (equipment, aiAnalysis, userLat, userLon, userBudget) => {
  const equipmentTokens = tokenize(
    `${equipment.name} ${equipment.description} ${equipment.category}`
  );

  // ─── Build search terms ───────────────────────────────────────────────────
  const primaryTerms = aiAnalysis.primaryEquipmentType
    ? [aiAnalysis.primaryEquipmentType]
    : [];

  const suggestedTerms = Array.isArray(aiAnalysis.suggestedEquipmentTypes)
    ? aiAnalysis.suggestedEquipmentTypes
    : [];

  const keywordTerms = Array.isArray(aiAnalysis.keywords)
    ? aiAnalysis.keywords
    : [];

  // Expand all terms with synonyms
  const expandedPrimary   = expandWithSynonyms(primaryTerms);
  const expandedSuggested = expandWithSynonyms(suggestedTerms);
  const expandedKeywords  = expandWithSynonyms(keywordTerms);

  // ─── Relevance gate: must match primary OR suggested terms ────────────────
  let primaryMatchScore   = 0;
  let suggestedMatchScore = 0;

  for (const term of expandedPrimary) {
    const s = termMatchScore(term, equipmentTokens);
    if (s > primaryMatchScore) primaryMatchScore = s;
  }

  for (const term of expandedSuggested) {
    const s = termMatchScore(term, equipmentTokens);
    if (s > suggestedMatchScore) suggestedMatchScore = s;
  }

  const isRelevant = primaryMatchScore > 0 || suggestedMatchScore > 0;
  if (!isRelevant) return null;

  // ─── Base score ───────────────────────────────────────────────────────────
  let score = 0;
  const explanations = [];

  // Primary match contributes more than suggested match
  if (primaryMatchScore > 0) {
    score += Math.round(70 * primaryMatchScore);
    explanations.push(`✅ Directly matches your ${aiAnalysis.task ? aiAnalysis.task.toLowerCase() : 'requirement'}`);
  } else {
    score += Math.round(50 * suggestedMatchScore);
    explanations.push(`✅ Suitable alternative for your ${aiAnalysis.task ? aiAnalysis.task.toLowerCase() : 'project'}`);
  }

  // ─── Category match bonus ─────────────────────────────────────────────────
  if (
    aiAnalysis.equipmentCategory &&
    equipment.category &&
    equipment.category.toLowerCase() === aiAnalysis.equipmentCategory.toLowerCase()
  ) {
    score += 10;
    explanations.push(`🏷️ Matches ${equipment.category} category`);
  }

  // ─── Keyword bonus (max 15 pts) ───────────────────────────────────────────
  let keywordHits = 0;
  for (const kw of expandedKeywords) {
    if (termMatchScore(kw, equipmentTokens) > 0) {
      keywordHits++;
    }
  }
  if (keywordHits > 0) {
    const kwBonus = Math.min(keywordHits * 5, 15);
    score += kwBonus;
    explanations.push(`🔑 Matches ${keywordHits} task keyword${keywordHits > 1 ? 's' : ''}`);
  }

  // ─── Availability ─────────────────────────────────────────────────────────
  if (equipment.availability) {
    score += 10;
    explanations.push('✅ Currently available');
  }

  // ─── Distance (Haversine) ─────────────────────────────────────────────────
  if (userLat && userLon && equipment.latitude && equipment.longitude) {
    const distanceKm = calculateDistance(userLat, userLon, equipment.latitude, equipment.longitude);
    equipment.distanceKm = distanceKm;

    if (distanceKm <= 5) {
      score += 20;
    } else if (distanceKm <= 15) {
      score += 15;
    } else if (distanceKm <= 50) {
      score += 10;
    } else {
      score += 2;
    }
  }

  // ─── Rating ───────────────────────────────────────────────────────────────
  if (equipment.rating >= 4.5) {
    score += 5;
  } else if (equipment.rating >= 4.0) {
    score += 3;
  } else if (equipment.rating > 0) {
    score += 1;
  }

  // Relative price scoring applied in controller after all items are evaluated

  return { score, explanations };
};

module.exports = { calculateRecommendationScore };

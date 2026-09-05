/**
 * Calculate recommendation score and generate explainable strings
 * Weights:
 * Suitability = 40% (base match of suggested types)
 * Availability = 25% (if available)
 * Distance = 15% (closer is better)
 * Price = 10% (cheaper within budget is better)
 * Rating = 10% (higher rating is better)
 */

const calculateRecommendationScore = (equipment, aiAnalysis, userLat, userLon, userBudget) => {
  let isRelevant = false;
  
  const searchTerms = [];
  if (aiAnalysis.primaryEquipmentType) {
    searchTerms.push(aiAnalysis.primaryEquipmentType.toLowerCase());
  }
  if (aiAnalysis.suggestedEquipmentTypes && Array.isArray(aiAnalysis.suggestedEquipmentTypes)) {
    aiAnalysis.suggestedEquipmentTypes.forEach(t => searchTerms.push(t.toLowerCase()));
  }

  const name = equipment.name.toLowerCase();
  const desc = equipment.description.toLowerCase();

  for (const term of searchTerms) {
    if (name.includes(term) || desc.includes(term)) {
      isRelevant = true;
      break;
    }
  }

  // Hard Relevance Gate
  if (!isRelevant) {
    return null; 
  }

  let score = 50; // Base relevance points
  let explanations = [`✅ Matches your ${aiAnalysis.task ? aiAnalysis.task.toLowerCase() : 'project'} requirement`];

  // Availability (10 points max)
  if (equipment.availability) {
    score += 10;
    explanations.push('✅ Currently available');
  }

  // Distance (20 points max)
  if (userLat && userLon && equipment.latitude && equipment.longitude) {
    const { calculateDistance } = require('./distanceService');
    const distanceKm = calculateDistance(userLat, userLon, equipment.latitude, equipment.longitude);
    equipment.distanceKm = distanceKm;
    
    if (distanceKm <= 5) {
      score += 20;
    } else if (distanceKm <= 15) {
      score += 15;
    } else if (distanceKm <= 50) {
      score += 10;
    } else {
      score += 0;
    }
  }

  // Rating (5 points max)
  if (equipment.rating >= 4.5) {
    score += 5;
  } else if (equipment.rating >= 4.0) {
    score += 3;
  } else if (equipment.rating > 0) {
    score += 1;
  }

  // Price base logic (Relative price scoring will be added in controller)

  return {
    score,
    explanations
  };
};

module.exports = { calculateRecommendationScore };

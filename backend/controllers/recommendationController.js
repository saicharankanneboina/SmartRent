const { analyzeRequirement } = require('../services/geminiService');
const { calculateRecommendationScore } = require('../services/recommendationService');
const Equipment = require('../models/Equipment');
const RecommendationHistory = require('../models/RecommendationHistory');

// @desc    Analyze request and get recommendations
// @route   POST /api/recommendations/analyze
// @access  Public
exports.analyzeAndRecommend = async (req, res) => {
  try {
    const { prompt, latitude, longitude, budget } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Please provide a requirement description' });
    }

    // 1. Analyze with Gemini
    let aiAnalysis;
    try {
      aiAnalysis = await analyzeRequirement(prompt);
    } catch (error) {
      return res.status(502).json({ success: false, error: 'AI analysis failed. Please try again or use manual search.' });
    }

    // 2. Search MongoDB (Find all equipment first to score them. In production, we'd pre-filter)
    // We will do a broad search since Gemini might suggest multiple types
    const allEquipment = await Equipment.find({}).populate('ownerId', 'name');

    // 3. Calculate initial scores and filter
    let validEquipment = [];
    allEquipment.forEach(eq => {
      let equipmentObj = eq.toObject();
      const result = calculateRecommendationScore(equipmentObj, aiAnalysis, latitude, longitude, budget);
      if (result) {
        equipmentObj.score = result.score;
        equipmentObj.explanations = result.explanations;
        equipmentObj.badges = [];
        validEquipment.push(equipmentObj);
      }
    });

    if (validEquipment.length === 0) {
      return res.status(200).json({
        success: true,
        analysis: aiAnalysis,
        recommendations: [],
        message: 'No suitable equipment found for your requirement.'
      });
    }

    // 4. Calculate Relative Metrics (Price, Nearest, Highest Rated)
    let lowestPrice = Infinity;
    let nearestDistance = Infinity;
    let highestRating = -1;

    validEquipment.forEach(eq => {
      if (eq.pricePerDay < lowestPrice) lowestPrice = eq.pricePerDay;
      if (eq.distanceKm !== undefined && eq.distanceKm < nearestDistance) nearestDistance = eq.distanceKm;
      if (eq.rating > highestRating) highestRating = eq.rating;
    });

    // 5. Finalize Score and Assign Badges
    validEquipment.forEach(eq => {
      // Relative Price Score (up to 15 points)
      if (eq.pricePerDay === lowestPrice) {
        eq.score += 15;
      } else {
        const ratio = lowestPrice / eq.pricePerDay;
        eq.score += Math.floor(15 * ratio); 
      }

      // Explanations for dynamic variables
      if (eq.distanceKm !== undefined) {
        if (eq.distanceKm < 1) {
          eq.explanations.push(`📍 ${Math.round(eq.distanceKm * 1000)} m away`);
        } else {
          eq.explanations.push(`📍 ${eq.distanceKm.toFixed(1)} km away`);
        }
      }
      eq.explanations.push(`💰 ₹${new Intl.NumberFormat('en-IN').format(eq.pricePerDay)}/day`);
      if (eq.rating > 0) {
        eq.explanations.push(`⭐ ${eq.rating.toFixed(1)}/5 rating`);
      }

      // Assign Badges
      if (eq.pricePerDay === lowestPrice) eq.badges.push('💰 Best Price');
      if (eq.distanceKm !== undefined && eq.distanceKm === nearestDistance) eq.badges.push('📍 Nearest');
      if (highestRating > 0 && eq.rating === highestRating) eq.badges.push('⭐ Highest Rated');
    });

    // 6. Sort by Score and identify Best Match & Best Value
    validEquipment.sort((a, b) => b.score - a.score);
    if (validEquipment.length > 0) {
      const highestScore = validEquipment[0].score;
      validEquipment.forEach(eq => {
        if (eq.score === highestScore) {
          eq.badges.unshift('⚖️ Best Value');
        }
      });
      // Best Match still goes to the top item
      validEquipment[0].badges.unshift('🏆 Best Match');
    }

    // 7. Save history (if user is logged in, but we can save it anonymously too)
    const history = await RecommendationHistory.create({
      userId: req.user ? req.user.id : null,
      naturalLanguageRequest: prompt,
      aiAnalysis,
      recommendedEquipment: validEquipment.map(r => ({ equipmentId: r._id, score: r.score, explanation: r.explanations }))
    });

    res.status(200).json({
      success: true,
      analysis: aiAnalysis,
      recommendations: validEquipment,
      historyId: history._id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get user recommendation history
// @route   GET /api/recommendations
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const history = await RecommendationHistory.find({ userId: req.user.id })
      .populate('recommendedEquipment.equipmentId')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

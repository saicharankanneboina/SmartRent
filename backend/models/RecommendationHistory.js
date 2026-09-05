const mongoose = require('mongoose');

const recommendationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Could be anonymous
  },
  naturalLanguageRequest: {
    type: String,
    required: true,
  },
  aiAnalysis: {
    type: Object, // Stores task, projectType, projectScale, suggestedEquipmentTypes
    required: true,
  },
  recommendedEquipment: [{
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
    },
    score: Number,
    explanation: [String]
  }],
}, { timestamps: true });

module.exports = mongoose.model('RecommendationHistory', recommendationHistorySchema);

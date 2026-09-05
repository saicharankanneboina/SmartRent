const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Construction', 'Agriculture', 'Industrial', 'Event', 'Other'],
  },
  description: {
    type: String,
    required: true,
  },
  pricePerDay: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  images: {
    type: [String],
    default: [],
  },
  rating: {
    type: Number,
    default: 0,
  },
  availability: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

// Geospatial index if we decide to use MongoDB native geo queries later
equipmentSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);

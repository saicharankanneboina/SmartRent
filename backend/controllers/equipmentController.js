const Equipment = require('../models/Equipment');

// @desc    Get all equipment (with optional filters)
// @route   GET /api/equipment
// @access  Public
exports.getEquipments = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, ownerId } = req.query;
    
    let query = {};
    
    if (category) query.category = category;
    if (ownerId) query.ownerId = ownerId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }

    const equipments = await Equipment.find(query).populate('ownerId', 'name email');
    res.status(200).json({ success: true, count: equipments.length, data: equipments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Public
exports.getEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id).populate('ownerId', 'name email');
    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }
    res.status(200).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private (Owner, Admin)
exports.createEquipment = async (req, res) => {
  try {
    // Add user to req.body
    req.body.ownerId = req.user.id;
    
    const equipment = await Equipment.create(req.body);
    res.status(201).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private (Owner, Admin)
exports.updateEquipment = async (req, res) => {
  try {
    let equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    // Make sure user is equipment owner
    if (equipment.ownerId.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to update this equipment' });
    }

    equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private (Owner, Admin)
exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }

    // Make sure user is equipment owner
    if (equipment.ownerId.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this equipment' });
    }


    await equipment.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Compare multiple equipment items (2 to 4 items)
// @route   POST /api/equipment/compare
// @access  Public
exports.compareEquipments = async (req, res) => {
  try {
    const { equipmentIds } = req.body;

    if (!equipmentIds || !Array.isArray(equipmentIds)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of equipmentIds to compare.'
      });
    }

    if (equipmentIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please select at least 2 equipment items to compare.'
      });
    }

    if (equipmentIds.length > 4) {
      return res.status(400).json({
        success: false,
        error: 'You can compare a maximum of 4 equipment items at a time.'
      });
    }

    const mongoose = require('mongoose');
    const areValidIds = equipmentIds.every(id => mongoose.Types.ObjectId.isValid(id));
    if (!areValidIds) {
      return res.status(400).json({
        success: false,
        error: 'One or more provided equipment IDs are invalid.'
      });
    }

    const items = await Equipment.find({ _id: { $in: equipmentIds } }).populate('ownerId', 'name email phone');

    if (items.length !== equipmentIds.length) {
      return res.status(404).json({
        success: false,
        error: 'One or more selected equipment items could not be found.'
      });
    }

    // Keep items in the order requested by equipmentIds
    const orderedItems = equipmentIds.map(id => items.find(item => item._id.toString() === id.toString()));

    const prices = orderedItems.map(item => item.pricePerDay);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const ratings = orderedItems.map(item => item.rating || 0);
    const maxRating = Math.max(...ratings);

    const enrichedItems = orderedItems.map(item => {
      const dailyPrice = item.pricePerDay;
      const securityDeposit = dailyPrice * 0.2; // 20% security deposit
      const est3DayTotal = (dailyPrice * 3) + (dailyPrice * 3 * 0.2);
      const est7DayTotal = (dailyPrice * 7) + (dailyPrice * 7 * 0.2);

      const baseItem = typeof item.toObject === 'function' ? item.toObject() : { ...item };

      return {
        ...baseItem,
        securityDeposit,
        est3DayTotal,
        est7DayTotal,
        isLowestPrice: dailyPrice === minPrice,
        isHighestRated: item.rating > 0 && item.rating === maxRating,
        priceDiffFromLowest: dailyPrice - minPrice
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedItems.length,
      metrics: {
        lowestPrice: minPrice,
        highestPrice: maxPrice,
        priceDifference: maxPrice - minPrice,
        highestRating: maxRating
      },
      data: enrichedItems
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


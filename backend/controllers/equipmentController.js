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

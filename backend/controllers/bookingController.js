const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Renter)
exports.createBooking = async (req, res) => {
  try {
    const { equipmentId, startDate, endDate, paymentMethod } = req.body;
    const renterId = req.user.id;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ success: false, error: 'Equipment not found' });
    }
    
    if (!equipment.availability) {
      return res.status(400).json({ success: false, error: 'Equipment is currently unavailable' });
    }

    // Check for double booking
    const overlappingBookings = await Booking.find({
      equipmentId,
      bookingStatus: { $in: ['Accepted', 'Active'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });

    if (overlappingBookings.length > 0) {
      return res.status(400).json({ success: false, error: 'Equipment is already booked for these dates' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (days <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid dates' });
    }

    const totalRentalPrice = days * equipment.pricePerDay;
    // Security deposit could be a fixed percentage or absolute value, let's say 20%
    const securityDeposit = totalRentalPrice * 0.2; 
    const totalAmount = totalRentalPrice + securityDeposit;

    const paymentStatus = paymentMethod === 'Online Payment' ? 'Paid' : 'Pending'; // Simplification for demo

    const booking = await Booking.create({
      equipmentId,
      renterId,
      ownerId: equipment.ownerId,
      startDate,
      endDate,
      totalRentalPrice,
      securityDeposit,
      totalAmount,
      paymentMethod,
      paymentStatus
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all bookings (filtered by user role)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Renter') {
      query.renterId = req.user.id;
    } else if (req.user.role === 'Equipment Owner') {
      query.ownerId = req.user.id;
    } // Admin gets all

    const bookings = await Booking.find(query)
      .populate('equipmentId', 'name category pricePerDay images')
      .populate('renterId', 'name email phone')
      .populate('ownerId', 'name email phone');

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingStatus, paymentStatus } = req.body;
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.ownerId.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to update this booking' });
    }

    if (bookingStatus) booking.bookingStatus = bookingStatus;
    if (paymentStatus) booking.paymentStatus = paymentStatus;

    await booking.save();
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRenters = await User.countDocuments({ role: 'Renter' });
    const totalOwners = await User.countDocuments({ role: 'Equipment Owner' });
    
    const totalEquipment = await Equipment.countDocuments();
    
    const activeBookings = await Booking.countDocuments({ bookingStatus: 'Active' });
    const completedBookings = await Booking.countDocuments({ bookingStatus: 'Completed' });
    
    const completedBookingsList = await Booking.find({ bookingStatus: 'Completed' });
    const totalRevenue = completedBookingsList.reduce((acc, curr) => acc + curr.totalRentalPrice, 0);

    const categoryAggregation = await Equipment.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalRenters,
        totalOwners,
        totalEquipment,
        activeBookings,
        completedBookings,
        totalRevenue,
        categories: categoryAggregation
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

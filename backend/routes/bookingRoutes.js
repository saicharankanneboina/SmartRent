const express = require('express');
const {
  createBooking,
  getBookings,
  updateBookingStatus
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createBooking)
  .get(protect, getBookings);

router.route('/:id/status')
  .put(protect, updateBookingStatus);

module.exports = router;

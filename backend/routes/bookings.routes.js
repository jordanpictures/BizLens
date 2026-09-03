const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings.controller');

router.get('/', bookingsController.getBookings);
router.get('/:id', bookingsController.getBookingById);
router.post('/', bookingsController.createBooking);

module.exports = router;

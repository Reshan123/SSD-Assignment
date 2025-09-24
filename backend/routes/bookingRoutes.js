const {authorize} = require('../middlewear/validateToken')
const { authenticateToken, requireDoctor } = require('../middlewear/authMiddleware')
const express = require('express')

const Booking = require('../models/bookingModel')

const router = express.Router()

const {createBooking, getBookings, getBooking, updateBooking, deleteBooking, getOwnerBookings, getDoctorBookings} = require('../controllers/bookingController')

// GET all
router.get('/', getBookings )

// GET a single
router.get('/getBooking/:id', getBooking)

// POST - Protected route to create a booking, accessible only to authenticated users
router.post('/', authorize, createBooking)

// DELETE - Protected route to delete a booking, accessible only to authenticated users
router.delete('/:id', authorize, deleteBooking)

// PATCH - Protected route to update a booking, accessible only to authenticated users
router.patch('/:id', authorize, updateBooking)

// Protected route to get bookings for a specific pet owner, accessible only to authenticated users
router.get("/getOwner", authorize, getOwnerBookings)

// Protected route to get bookings for a specific doctor, accessible only to authenticated doctors
router.get("/getDoctorBookings/:doctorName", authenticateToken, requireDoctor, getDoctorBookings);



module.exports = router
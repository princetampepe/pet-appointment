const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { isAuthenticated, isSecretary } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Apply middleware to all routes
router.use(isAuthenticated, isSecretary);

// Secretary Dashboard
router.get('/dashboard', (req, res) => {
    const stats = Appointment.getStats();
    const todayAppointments = Appointment.getTodayAppointments();
    const pendingAppointments = Appointment.findByStatus('pending');
    const doctors = User.getAllDoctors();

    res.render('secretary/dashboard', { 
        stats, 
        todayAppointments, 
        pendingAppointments,
        doctors 
    });
});

// View all appointments
router.get('/appointments', (req, res) => {
    const { status, doctor_id, date } = req.query;
    let appointments;

    if (status) {
        appointments = Appointment.findByStatus(status);
    } else {
        appointments = Appointment.findAll();
    }

    // Filter by doctor if specified
    if (doctor_id) {
        appointments = appointments.filter(apt => apt.doctor_id === parseInt(doctor_id));
    }

    // Filter by date if specified
    if (date) {
        appointments = appointments.filter(apt => apt.appointment_date === date);
    }

    const doctors = User.getAllDoctors();
    res.render('secretary/appointments', { appointments, doctors, filters: { status, doctor_id, date } });
});

// View appointment details
router.get('/appointments/:id', (req, res) => {
    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/secretary/appointments');
    }

    res.render('secretary/appointment-details', { appointment });
});

// Update appointment status
router.post('/appointments/:id/status', (req, res) => {
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
        req.flash('error_msg', 'Invalid status');
        return res.redirect('/secretary/appointments');
    }

    try {
        Appointment.updateStatus(req.params.id, status, notes);
        req.flash('success_msg', 'Appointment status updated');
        res.redirect('/secretary/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/secretary/appointments');
    }
});

// Confirm appointment
router.post('/appointments/:id/confirm', (req, res) => {
    try {
        Appointment.updateStatus(req.params.id, 'confirmed');
        req.flash('success_msg', 'Appointment confirmed');
        res.redirect('/secretary/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/secretary/appointments');
    }
});

// Cancel appointment
router.post('/appointments/:id/cancel', (req, res) => {
    const { notes } = req.body;
    try {
        Appointment.updateStatus(req.params.id, 'cancelled', notes);
        req.flash('success_msg', 'Appointment cancelled');
        res.redirect('/secretary/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/secretary/appointments');
    }
});

// Manage staff (add doctors/secretaries)
router.get('/staff', (req, res) => {
    const doctors = User.findByRole('doctor');
    const secretaries = User.findByRole('secretary');
    res.render('secretary/staff', { doctors, secretaries });
});

router.get('/staff/add', (req, res) => {
    res.render('secretary/add-staff');
});

router.post('/staff/add', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('role').isIn(['doctor', 'secretary']).withMessage('Invalid role')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect('/secretary/staff/add');
    }

    const { email, password, first_name, last_name, phone, role, specialization } = req.body;

    // Check if email already exists
    if (User.findByEmail(email)) {
        req.flash('error_msg', 'Email already registered');
        return res.redirect('/secretary/staff/add');
    }

    try {
        User.create({
            email,
            password,
            first_name,
            last_name,
            phone,
            role,
            specialization: role === 'doctor' ? specialization : null
        });

        req.flash('success_msg', `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!`);
        res.redirect('/secretary/staff');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/secretary/staff/add');
    }
});

// Schedule view (calendar-like view)
router.get('/schedule', (req, res) => {
    const doctors = User.getAllDoctors();
    const appointments = Appointment.findAll();
    res.render('secretary/schedule', { doctors, appointments });
});

module.exports = router;

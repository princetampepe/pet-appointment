const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { isAuthenticated, isSecretary } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

router.use(isAuthenticated, isSecretary);

// Dashboard
router.get('/dashboard', async (req, res) => {
    const [stats, todayAppointments, pendingAppointments, doctors] = await Promise.all([
        Appointment.getStats(),
        Appointment.getTodayAppointments(),
        Appointment.findByStatus('pending'),
        User.getAllDoctors()
    ]);
    res.render('secretary/dashboard', { stats, todayAppointments, pendingAppointments, doctors });
});

// Appointments
router.get('/appointments', async (req, res) => {
    const { status, doctor_id, date } = req.query;
    let appointments;

    if (status) {
        appointments = await Appointment.findByStatus(status);
    } else {
        appointments = await Appointment.findAll();
    }

    if (doctor_id) {
        appointments = appointments.filter(apt => apt.doctor_id === doctor_id);
    }
    if (date) {
        appointments = appointments.filter(apt => apt.appointment_date === date);
    }

    const doctors = await User.getAllDoctors();
    res.render('secretary/appointments', { appointments, doctors, filters: { status, doctor_id, date } });
});

router.get('/appointments/:id', async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/secretary/appointments');
    }
    res.render('secretary/appointment-details', { appointment });
});

router.post('/appointments/:id/status', async (req, res) => {
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        req.flash('error_msg', 'Invalid status');
        return res.redirect('/secretary/appointments');
    }
    try {
        await Appointment.updateStatus(req.params.id, status, notes);
        req.flash('success_msg', 'Appointment status updated');
        res.redirect('/secretary/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/secretary/appointments');
    }
});

router.post('/appointments/:id/confirm', async (req, res) => {
    try {
        await Appointment.updateStatus(req.params.id, 'confirmed');
        req.flash('success_msg', 'Appointment confirmed');
        res.redirect('/secretary/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/secretary/appointments');
    }
});

router.post('/appointments/:id/cancel', async (req, res) => {
    try {
        await Appointment.updateStatus(req.params.id, 'cancelled', req.body.notes);
        req.flash('success_msg', 'Appointment cancelled');
        res.redirect('/secretary/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/secretary/appointments');
    }
});

// Staff management
router.get('/staff', async (req, res) => {
    const [doctors, secretaries] = await Promise.all([
        User.findByRole('doctor'),
        User.findByRole('secretary')
    ]);
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
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect('/secretary/staff/add');
    }

    const { email, password, first_name, last_name, phone, role, specialization } = req.body;

    if (await User.findByEmail(email)) {
        req.flash('error_msg', 'Email already registered');
        return res.redirect('/secretary/staff/add');
    }

    try {
        await User.create({ email, password, first_name, last_name, phone, role, specialization: role === 'doctor' ? specialization : null });
        req.flash('success_msg', `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!`);
        res.redirect('/secretary/staff');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/secretary/staff/add');
    }
});

// Schedule
router.get('/schedule', async (req, res) => {
    const [doctors, appointments] = await Promise.all([
        User.getAllDoctors(),
        Appointment.findAll()
    ]);
    res.render('secretary/schedule', { doctors, appointments });
});

module.exports = router;

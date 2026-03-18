const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { isAuthenticated, isDoctor } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Pet = require('../models/Pet');

// Apply middleware to all routes
router.use(isAuthenticated, isDoctor);

// Doctor Dashboard
router.get('/dashboard', (req, res) => {
    const pendingAppointments = Appointment.findPendingByDoctorId(req.session.user.id);
    const allAppointments = Appointment.findByDoctorId(req.session.user.id);
    
    // Get today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = allAppointments.filter(apt => apt.appointment_date === today);
    
    // Stats
    const stats = {
        pending: pendingAppointments.length,
        today: todayAppointments.length,
        total: allAppointments.length,
        confirmed: allAppointments.filter(apt => apt.status === 'confirmed').length
    };

    res.render('doctor/dashboard', { 
        pendingAppointments, 
        todayAppointments,
        stats 
    });
});

// View all appointments
router.get('/appointments', (req, res) => {
    const appointments = Appointment.findByDoctorId(req.session.user.id);
    res.render('doctor/appointments', { appointments });
});

// View pending appointments only
router.get('/appointments/pending', (req, res) => {
    const appointments = Appointment.findPendingByDoctorId(req.session.user.id);
    res.render('doctor/pending-appointments', { appointments });
});

// View appointment details
router.get('/appointments/:id', (req, res) => {
    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }

    res.render('doctor/appointment-details', { appointment });
});

// Confirm appointment
router.post('/appointments/:id/confirm', (req, res) => {
    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }

    try {
        Appointment.updateStatus(req.params.id, 'confirmed');
        req.flash('success_msg', 'Appointment confirmed');
        res.redirect('/doctor/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/doctor/appointments');
    }
});

// Complete appointment
router.post('/appointments/:id/complete', (req, res) => {
    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }

    const { notes } = req.body;

    try {
        Appointment.updateStatus(req.params.id, 'completed', notes);
        req.flash('success_msg', 'Appointment marked as completed');
        res.redirect('/doctor/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/doctor/appointments');
    }
});

// Cancel appointment
router.post('/appointments/:id/cancel', (req, res) => {
    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }

    const { notes } = req.body;

    try {
        Appointment.updateStatus(req.params.id, 'cancelled', notes);
        req.flash('success_msg', 'Appointment cancelled');
        res.redirect('/doctor/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/doctor/appointments');
    }
});

// Medical Records
router.get('/records', (req, res) => {
    const records = MedicalRecord.findByDoctorId(req.session.user.id);
    res.render('doctor/records', { records });
});

// Add medical record from appointment
router.get('/appointments/:id/add-record', (req, res) => {
    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }

    // Check if record already exists for this appointment
    const existingRecord = MedicalRecord.findByAppointmentId(req.params.id);
    if (existingRecord) {
        return res.redirect(`/doctor/records/${existingRecord.id}/edit`);
    }

    res.render('doctor/add-record', { appointment });
});

router.post('/appointments/:id/add-record', [
    body('diagnosis').notEmpty().withMessage('Diagnosis is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect(`/doctor/appointments/${req.params.id}/add-record`);
    }

    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }

    const { diagnosis, treatment, prescription, notes } = req.body;

    try {
        MedicalRecord.create({
            pet_id: appointment.pet_id,
            appointment_id: parseInt(req.params.id),
            doctor_id: req.session.user.id,
            record_date: appointment.appointment_date,
            diagnosis,
            treatment,
            prescription,
            notes
        });

        req.flash('success_msg', 'Medical record added successfully');
        res.redirect('/doctor/records');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect(`/doctor/appointments/${req.params.id}/add-record`);
    }
});

// Edit medical record
router.get('/records/:id/edit', (req, res) => {
    const record = MedicalRecord.findById(req.params.id);
    
    if (!record || record.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Record not found');
        return res.redirect('/doctor/records');
    }

    res.render('doctor/edit-record', { record });
});

router.post('/records/:id/edit', (req, res) => {
    const record = MedicalRecord.findById(req.params.id);
    
    if (!record || record.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Record not found');
        return res.redirect('/doctor/records');
    }

    const { diagnosis, treatment, prescription, notes } = req.body;

    try {
        MedicalRecord.update(req.params.id, { diagnosis, treatment, prescription, notes });
        req.flash('success_msg', 'Medical record updated');
        res.redirect('/doctor/records');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect(`/doctor/records/${req.params.id}/edit`);
    }
});

module.exports = router;

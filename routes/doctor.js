const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { isAuthenticated, isDoctor } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Pet = require('../models/Pet');

router.use(isAuthenticated, isDoctor);

// Dashboard
router.get('/dashboard', async (req, res) => {
    const [pendingAppointments, allAppointments] = await Promise.all([
        Appointment.findPendingByDoctorId(req.session.user.id),
        Appointment.findByDoctorId(req.session.user.id)
    ]);
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = allAppointments.filter(apt => apt.appointment_date === today);
    const stats = {
        pending: pendingAppointments.length,
        today: todayAppointments.length,
        total: allAppointments.length,
        confirmed: allAppointments.filter(apt => apt.status === 'confirmed').length
    };
    res.render('doctor/dashboard', { pendingAppointments, todayAppointments, stats });
});

// Appointments
router.get('/appointments', async (req, res) => {
    const appointments = await Appointment.findByDoctorId(req.session.user.id);
    res.render('doctor/appointments', { appointments });
});

router.get('/appointments/pending', async (req, res) => {
    const appointments = await Appointment.findPendingByDoctorId(req.session.user.id);
    res.render('doctor/pending-appointments', { appointments });
});

router.get('/appointments/:id', async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }
    res.render('doctor/appointment-details', { appointment });
});

router.post('/appointments/:id/confirm', async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }
    try {
        await Appointment.updateStatus(req.params.id, 'confirmed');
        req.flash('success_msg', 'Appointment confirmed');
        res.redirect('/doctor/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/doctor/appointments');
    }
});

router.post('/appointments/:id/complete', async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }
    try {
        await Appointment.updateStatus(req.params.id, 'completed', req.body.notes);
        req.flash('success_msg', 'Appointment marked as completed');
        res.redirect('/doctor/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/doctor/appointments');
    }
});

router.post('/appointments/:id/cancel', async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }
    try {
        await Appointment.updateStatus(req.params.id, 'cancelled', req.body.notes);
        req.flash('success_msg', 'Appointment cancelled');
        res.redirect('/doctor/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/doctor/appointments');
    }
});

// Medical Records
router.get('/records', async (req, res) => {
    const records = await MedicalRecord.findByDoctorId(req.session.user.id);
    res.render('doctor/records', { records });
});

router.get('/appointments/:id/add-record', async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }
    const existingRecord = await MedicalRecord.findByAppointmentId(req.params.id);
    if (existingRecord) return res.redirect(`/doctor/records/${existingRecord.id}/edit`);
    res.render('doctor/add-record', { appointment });
});

router.post('/appointments/:id/add-record', [
    body('diagnosis').notEmpty().withMessage('Diagnosis is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect(`/doctor/appointments/${req.params.id}/add-record`);
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/doctor/appointments');
    }

    const { diagnosis, treatment, prescription, notes } = req.body;
    try {
        await MedicalRecord.create({
            pet_id: appointment.pet_id,
            appointment_id: req.params.id,
            doctor_id: req.session.user.id,
            record_date: appointment.appointment_date,
            diagnosis, treatment, prescription, notes,
            pet_name: appointment.pet_name,
            pet_species: appointment.pet_species,
            doctor_first_name: req.session.user.first_name,
            doctor_last_name: req.session.user.last_name,
            owner_first_name: appointment.patient_first_name,
            owner_last_name: appointment.patient_last_name
        });
        req.flash('success_msg', 'Medical record added successfully');
        res.redirect('/doctor/records');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect(`/doctor/appointments/${req.params.id}/add-record`);
    }
});

router.get('/records/:id/edit', async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record || record.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Record not found');
        return res.redirect('/doctor/records');
    }
    res.render('doctor/edit-record', { record });
});

router.post('/records/:id/edit', async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record || record.doctor_id !== req.session.user.id) {
        req.flash('error_msg', 'Record not found');
        return res.redirect('/doctor/records');
    }
    const { diagnosis, treatment, prescription, notes } = req.body;
    try {
        await MedicalRecord.update(req.params.id, { diagnosis, treatment, prescription, notes });
        req.flash('success_msg', 'Medical record updated');
        res.redirect('/doctor/records');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect(`/doctor/records/${req.params.id}/edit`);
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { isAuthenticated, isPatient } = require('../middleware/auth');
const Pet = require('../models/Pet');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');

// Apply middleware to all routes
router.use(isAuthenticated, isPatient);

// Patient Dashboard
router.get('/dashboard', (req, res) => {
    const pets = Pet.findByOwnerId(req.session.user.id);
    const appointments = Appointment.findByPatientId(req.session.user.id);
    
    res.render('patient/dashboard', { pets, appointments });
});

// Pets Management
router.get('/pets', (req, res) => {
    const pets = Pet.findByOwnerId(req.session.user.id);
    res.render('patient/pets', { pets });
});

router.get('/pets/add', (req, res) => {
    res.render('patient/add-pet');
});

router.post('/pets/add', [
    body('name').notEmpty().withMessage('Pet name is required'),
    body('species').notEmpty().withMessage('Species is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect('/patient/pets/add');
    }

    const { name, species, breed, age, weight, notes } = req.body;

    try {
        Pet.create({
            owner_id: req.session.user.id,
            name,
            species,
            breed,
            age: age || null,
            weight: weight || null,
            notes
        });

        req.flash('success_msg', 'Pet added successfully!');
        res.redirect('/patient/pets');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/patient/pets/add');
    }
});

router.get('/pets/edit/:id', (req, res) => {
    const pet = Pet.findById(req.params.id);
    
    if (!pet || pet.owner_id !== req.session.user.id) {
        req.flash('error_msg', 'Pet not found');
        return res.redirect('/patient/pets');
    }

    res.render('patient/edit-pet', { pet });
});

router.post('/pets/edit/:id', (req, res) => {
    const pet = Pet.findById(req.params.id);
    
    if (!pet || pet.owner_id !== req.session.user.id) {
        req.flash('error_msg', 'Pet not found');
        return res.redirect('/patient/pets');
    }

    const { name, species, breed, age, weight, notes } = req.body;

    try {
        Pet.update(req.params.id, { name, species, breed, age, weight, notes });
        req.flash('success_msg', 'Pet updated successfully!');
        res.redirect('/patient/pets');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/patient/pets');
    }
});

router.post('/pets/delete/:id', (req, res) => {
    const pet = Pet.findById(req.params.id);
    
    if (!pet || pet.owner_id !== req.session.user.id) {
        req.flash('error_msg', 'Pet not found');
        return res.redirect('/patient/pets');
    }

    try {
        Pet.delete(req.params.id);
        req.flash('success_msg', 'Pet removed successfully');
        res.redirect('/patient/pets');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/patient/pets');
    }
});

// Appointments
router.get('/appointments', (req, res) => {
    const appointments = Appointment.findByPatientId(req.session.user.id);
    res.render('patient/appointments', { appointments });
});

router.get('/appointments/book', (req, res) => {
    const pets = Pet.findByOwnerId(req.session.user.id);
    const doctors = User.getAllDoctors();
    res.render('patient/book-appointment', { pets, doctors });
});

router.post('/appointments/book', [
    body('pet_id').notEmpty().withMessage('Please select a pet'),
    body('doctor_id').notEmpty().withMessage('Please select a doctor'),
    body('appointment_date').notEmpty().withMessage('Please select a date'),
    body('appointment_time').notEmpty().withMessage('Please select a time'),
    body('reason').notEmpty().withMessage('Please provide a reason for the visit')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect('/patient/appointments/book');
    }

    const { pet_id, doctor_id, appointment_date, appointment_time, reason, notes } = req.body;

    // Verify pet belongs to patient
    const pet = Pet.findById(pet_id);
    if (!pet || pet.owner_id !== req.session.user.id) {
        req.flash('error_msg', 'Invalid pet selection');
        return res.redirect('/patient/appointments/book');
    }

    // Check if time slot is available
    const existingAppointments = Appointment.findByDateAndDoctor(appointment_date, doctor_id);
    const isSlotTaken = existingAppointments.some(apt => apt.appointment_time === appointment_time);
    
    if (isSlotTaken) {
        req.flash('error_msg', 'This time slot is already booked. Please choose another time.');
        return res.redirect('/patient/appointments/book');
    }

    try {
        Appointment.create({
            pet_id,
            patient_id: req.session.user.id,
            doctor_id,
            appointment_date,
            appointment_time,
            reason,
            notes
        });

        req.flash('success_msg', 'Appointment booked successfully! Please wait for confirmation.');
        res.redirect('/patient/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred while booking the appointment');
        res.redirect('/patient/appointments/book');
    }
});

router.post('/appointments/cancel/:id', (req, res) => {
    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment || appointment.patient_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/patient/appointments');
    }

    if (appointment.status === 'completed') {
        req.flash('error_msg', 'Cannot cancel a completed appointment');
        return res.redirect('/patient/appointments');
    }

    try {
        Appointment.updateStatus(req.params.id, 'cancelled');
        req.flash('success_msg', 'Appointment cancelled successfully');
        res.redirect('/patient/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/patient/appointments');
    }
});

// API endpoint to get available time slots
router.get('/api/available-slots', (req, res) => {
    const { date, doctor_id } = req.query;
    
    if (!date || !doctor_id) {
        return res.json({ error: 'Date and doctor are required' });
    }

    const bookedSlots = Appointment.findByDateAndDoctor(date, doctor_id);
    const bookedTimes = bookedSlots.map(apt => apt.appointment_time);

    // Check doctor availability for this day
    const dayOfWeek = new Date(date).getDay();
    const availability = User.getAvailability(doctor_id);
    const dayAvail = availability.find(a => a.day_of_week === dayOfWeek);
    
    let startHour = 9;
    let endHour = 17;
    
    if (dayAvail) {
        if (!dayAvail.is_available) {
            return res.json({ availableSlots: [], message: 'Doctor not available on this day' });
        }
        startHour = parseInt(dayAvail.start_time.split(':')[0]);
        endHour = parseInt(dayAvail.end_time.split(':')[0]);
    }

    // Available time slots based on doctor's schedule
    const allSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    res.json({ availableSlots });
});

// Reschedule appointment
router.get('/appointments/reschedule/:id', (req, res) => {
    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment || appointment.patient_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/patient/appointments');
    }

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        req.flash('error_msg', 'Cannot reschedule this appointment');
        return res.redirect('/patient/appointments');
    }

    const doctors = User.getAllDoctors();
    res.render('patient/reschedule', { appointment, doctors });
});

router.post('/appointments/reschedule/:id', [
    body('appointment_date').notEmpty().withMessage('Please select a date'),
    body('appointment_time').notEmpty().withMessage('Please select a time')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect(`/patient/appointments/reschedule/${req.params.id}`);
    }

    const appointment = Appointment.findById(req.params.id);
    
    if (!appointment || appointment.patient_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/patient/appointments');
    }

    const { appointment_date, appointment_time } = req.body;

    // Check if new time slot is available
    const existingAppointments = Appointment.findByDateAndDoctor(appointment_date, appointment.doctor_id);
    const isSlotTaken = existingAppointments.some(apt => 
        apt.appointment_time === appointment_time && apt.id !== parseInt(req.params.id)
    );
    
    if (isSlotTaken) {
        req.flash('error_msg', 'This time slot is already booked. Please choose another time.');
        return res.redirect(`/patient/appointments/reschedule/${req.params.id}`);
    }

    try {
        Appointment.reschedule(req.params.id, appointment_date, appointment_time);
        req.flash('success_msg', 'Appointment rescheduled successfully!');
        res.redirect('/patient/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/patient/appointments');
    }
});

// View pet medical records
router.get('/pets/:id/records', (req, res) => {
    const pet = Pet.findById(req.params.id);
    
    if (!pet || pet.owner_id !== req.session.user.id) {
        req.flash('error_msg', 'Pet not found');
        return res.redirect('/patient/pets');
    }

    const records = MedicalRecord.findByPetId(req.params.id);
    res.render('patient/pet-records', { pet, records });
});

module.exports = router;

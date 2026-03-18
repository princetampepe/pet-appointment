const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { isAuthenticated, isPatient } = require('../middleware/auth');
const Pet = require('../models/Pet');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');

router.use(isAuthenticated, isPatient);

// Dashboard
router.get('/dashboard', async (req, res) => {
    const [pets, appointments] = await Promise.all([
        Pet.findByOwnerId(req.session.user.id),
        Appointment.findByPatientId(req.session.user.id)
    ]);
    res.render('patient/dashboard', { pets, appointments });
});

// Pets
router.get('/pets', async (req, res) => {
    const pets = await Pet.findByOwnerId(req.session.user.id);
    res.render('patient/pets', { pets });
});

router.get('/pets/add', (req, res) => {
    res.render('patient/add-pet');
});

router.post('/pets/add', [
    body('name').notEmpty().withMessage('Pet name is required'),
    body('species').notEmpty().withMessage('Species is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect('/patient/pets/add');
    }

    const { name, species, breed, age, weight, notes } = req.body;
    try {
        await Pet.create({ owner_id: req.session.user.id, name, species, breed, age: age || null, weight: weight || null, notes });
        req.flash('success_msg', 'Pet added successfully!');
        res.redirect('/patient/pets');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/patient/pets/add');
    }
});

router.get('/pets/edit/:id', async (req, res) => {
    const pet = await Pet.findById(req.params.id);
    if (!pet || pet.owner_id !== req.session.user.id) {
        req.flash('error_msg', 'Pet not found');
        return res.redirect('/patient/pets');
    }
    res.render('patient/edit-pet', { pet });
});

router.post('/pets/edit/:id', async (req, res) => {
    const pet = await Pet.findById(req.params.id);
    if (!pet || pet.owner_id !== req.session.user.id) {
        req.flash('error_msg', 'Pet not found');
        return res.redirect('/patient/pets');
    }

    const { name, species, breed, age, weight, notes } = req.body;
    try {
        await Pet.update(req.params.id, { name, species, breed, age, weight, notes });
        req.flash('success_msg', 'Pet updated successfully!');
        res.redirect('/patient/pets');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/patient/pets');
    }
});

router.post('/pets/delete/:id', async (req, res) => {
    const pet = await Pet.findById(req.params.id);
    if (!pet || pet.owner_id !== req.session.user.id) {
        req.flash('error_msg', 'Pet not found');
        return res.redirect('/patient/pets');
    }

    try {
        await Pet.delete(req.params.id);
        req.flash('success_msg', 'Pet removed successfully');
        res.redirect('/patient/pets');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/patient/pets');
    }
});

// Appointments
router.get('/appointments', async (req, res) => {
    const appointments = await Appointment.findByPatientId(req.session.user.id);
    res.render('patient/appointments', { appointments });
});

router.get('/appointments/book', async (req, res) => {
    const [pets, doctors] = await Promise.all([
        Pet.findByOwnerId(req.session.user.id),
        User.getAllDoctors()
    ]);
    res.render('patient/book-appointment', { pets, doctors });
});

router.post('/appointments/book', [
    body('pet_id').notEmpty().withMessage('Please select a pet'),
    body('doctor_id').notEmpty().withMessage('Please select a doctor'),
    body('appointment_date').notEmpty().withMessage('Please select a date'),
    body('appointment_time').notEmpty().withMessage('Please select a time'),
    body('reason').notEmpty().withMessage('Please provide a reason for the visit')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect('/patient/appointments/book');
    }

    const { pet_id, doctor_id, appointment_date, appointment_time, reason, notes } = req.body;

    const pet = await Pet.findById(pet_id);
    if (!pet || pet.owner_id !== req.session.user.id) {
        req.flash('error_msg', 'Invalid pet selection');
        return res.redirect('/patient/appointments/book');
    }

    const existingAppointments = await Appointment.findByDateAndDoctor(appointment_date, doctor_id);
    if (existingAppointments.some(apt => apt.appointment_time === appointment_time)) {
        req.flash('error_msg', 'This time slot is already booked. Please choose another time.');
        return res.redirect('/patient/appointments/book');
    }

    const doctor = await User.findById(doctor_id);
    try {
        await Appointment.create({
            pet_id, patient_id: req.session.user.id, doctor_id,
            appointment_date, appointment_time, reason, notes,
            pet_name: pet.name, pet_species: pet.species, pet_breed: pet.breed || null,
            patient_first_name: req.session.user.first_name,
            patient_last_name: req.session.user.last_name,
            patient_phone: req.session.user.phone || null,
            patient_email: req.session.user.email,
            doctor_first_name: doctor.first_name,
            doctor_last_name: doctor.last_name,
            doctor_specialization: doctor.specialization || null
        });
        req.flash('success_msg', 'Appointment booked successfully! Please wait for confirmation.');
        res.redirect('/patient/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred while booking the appointment');
        res.redirect('/patient/appointments/book');
    }
});

router.post('/appointments/cancel/:id', async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.patient_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/patient/appointments');
    }
    if (appointment.status === 'completed') {
        req.flash('error_msg', 'Cannot cancel a completed appointment');
        return res.redirect('/patient/appointments');
    }

    try {
        await Appointment.updateStatus(req.params.id, 'cancelled');
        req.flash('success_msg', 'Appointment cancelled successfully');
        res.redirect('/patient/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/patient/appointments');
    }
});

// Available time slots API
router.get('/api/available-slots', async (req, res) => {
    const { date, doctor_id } = req.query;
    if (!date || !doctor_id) return res.json({ error: 'Date and doctor are required' });

    const [bookedSlots, availability] = await Promise.all([
        Appointment.findByDateAndDoctor(date, doctor_id),
        User.getAvailability(doctor_id)
    ]);

    const bookedTimes = bookedSlots.map(apt => apt.appointment_time);
    const dayOfWeek = new Date(date).getDay();
    const dayAvail = availability.find(a => a.day_of_week === dayOfWeek);

    let startHour = 9, endHour = 17;
    if (dayAvail) {
        if (!dayAvail.is_available) return res.json({ availableSlots: [], message: 'Doctor not available on this day' });
        startHour = parseInt(dayAvail.start_time.split(':')[0]);
        endHour = parseInt(dayAvail.end_time.split(':')[0]);
    }

    const allSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    res.json({ availableSlots: allSlots.filter(slot => !bookedTimes.includes(slot)) });
});

// Reschedule
router.get('/appointments/reschedule/:id', async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.patient_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/patient/appointments');
    }
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        req.flash('error_msg', 'Cannot reschedule this appointment');
        return res.redirect('/patient/appointments');
    }
    const doctors = await User.getAllDoctors();
    res.render('patient/reschedule', { appointment, doctors });
});

router.post('/appointments/reschedule/:id', [
    body('appointment_date').notEmpty().withMessage('Please select a date'),
    body('appointment_time').notEmpty().withMessage('Please select a time')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect(`/patient/appointments/reschedule/${req.params.id}`);
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.patient_id !== req.session.user.id) {
        req.flash('error_msg', 'Appointment not found');
        return res.redirect('/patient/appointments');
    }

    const { appointment_date, appointment_time } = req.body;
    const existingAppointments = await Appointment.findByDateAndDoctor(appointment_date, appointment.doctor_id);
    if (existingAppointments.some(apt => apt.appointment_time === appointment_time && apt.id !== req.params.id)) {
        req.flash('error_msg', 'This time slot is already booked. Please choose another time.');
        return res.redirect(`/patient/appointments/reschedule/${req.params.id}`);
    }

    try {
        await Appointment.reschedule(req.params.id, appointment_date, appointment_time);
        req.flash('success_msg', 'Appointment rescheduled successfully!');
        res.redirect('/patient/appointments');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/patient/appointments');
    }
});

// Pet medical records
router.get('/pets/:id/records', async (req, res) => {
    const pet = await Pet.findById(req.params.id);
    if (!pet || pet.owner_id !== req.session.user.id) {
        req.flash('error_msg', 'Pet not found');
        return res.redirect('/patient/pets');
    }
    const records = await MedicalRecord.findByPetId(req.params.id);
    res.render('patient/pet-records', { pet, records });
});

module.exports = router;

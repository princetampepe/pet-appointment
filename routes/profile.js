const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');

router.use(isAuthenticated);

router.get('/', async (req, res) => {
    const [user, availability] = await Promise.all([
        User.findById(req.session.user.id),
        req.session.user.role === 'doctor' ? User.getAvailability(req.session.user.id) : Promise.resolve([])
    ]);
    res.render('profile/index', { profile: user, availability });
});

router.post('/update', [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect('/profile');
    }

    const { first_name, last_name, phone, specialization, bio } = req.body;
    try {
        await User.update(req.session.user.id, {
            first_name, last_name, phone,
            specialization: req.session.user.role === 'doctor' ? specialization : null,
            bio: req.session.user.role === 'doctor' ? bio : null
        });
        req.session.user.first_name = first_name;
        req.session.user.last_name = last_name;
        if (req.session.user.role === 'doctor') req.session.user.specialization = specialization;
        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/profile');
    }
});

router.post('/change-password', [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirm_password').custom((value, { req }) => {
        if (value !== req.body.new_password) throw new Error('Passwords do not match');
        return true;
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect('/profile');
    }

    const { current_password, new_password } = req.body;
    const user = await User.findById(req.session.user.id);

    if (!User.verifyPassword(current_password, user.password)) {
        req.flash('error_msg', 'Current password is incorrect');
        return res.redirect('/profile');
    }

    try {
        await User.updatePassword(req.session.user.id, new_password);
        req.flash('success_msg', 'Password changed successfully');
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/profile');
    }
});

router.post('/availability', async (req, res) => {
    if (req.session.user.role !== 'doctor') {
        req.flash('error_msg', 'Access denied');
        return res.redirect('/profile');
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    try {
        await Promise.all(days.map((day, index) => {
            const isAvailable = req.body[`available_${day}`] === 'on';
            const startTime = req.body[`start_${day}`] || '09:00';
            const endTime = req.body[`end_${day}`] || '17:00';
            return User.setAvailability(req.session.user.id, index, startTime, endTime, isAvailable);
        }));
        req.flash('success_msg', 'Availability updated successfully');
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred');
        res.redirect('/profile');
    }
});

module.exports = router;

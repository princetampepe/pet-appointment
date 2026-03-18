const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Login page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('auth/login');
});

// Register page
router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('auth/register');
});

// Login handler
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect('/auth/login');
    }

    const { email, password } = req.body;
    const user = User.findByEmail(email);

    if (!user || !User.verifyPassword(password, user.password)) {
        req.flash('error_msg', 'Invalid email or password');
        return res.redirect('/auth/login');
    }

    // Store user in session (without password)
    req.session.user = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        specialization: user.specialization
    };

    req.flash('success_msg', `Welcome back, ${user.first_name}!`);
    
    // Redirect based on role
    if (user.role === 'patient') return res.redirect('/patient/dashboard');
    if (user.role === 'doctor') return res.redirect('/doctor/dashboard');
    if (user.role === 'secretary') return res.redirect('/secretary/dashboard');
    
    res.redirect('/');
});

// Register handler (for patients only)
router.post('/register', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirm_password').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error_msg', errors.array()[0].msg);
        return res.redirect('/auth/register');
    }

    const { email, password, first_name, last_name, phone } = req.body;

    // Check if email already exists
    if (User.findByEmail(email)) {
        req.flash('error_msg', 'Email already registered');
        return res.redirect('/auth/register');
    }

    try {
        User.create({
            email,
            password,
            first_name,
            last_name,
            phone,
            role: 'patient'
        });

        req.flash('success_msg', 'Registration successful! Please log in.');
        res.redirect('/auth/login');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred during registration');
        res.redirect('/auth/register');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.redirect('/');
    });
});

module.exports = router;

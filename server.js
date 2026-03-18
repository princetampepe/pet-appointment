const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const db = require('./config/firebase');
const FirestoreStore = require('firestore-store')(session);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

const { basicSecurityHeaders } = require('./middleware/security');
const { createRateLimiter } = require('./middleware/rateLimit');

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');
if (IS_PROD) {
    // Enables correct client IP/proto when behind a reverse proxy (e.g. Render/Heroku/Nginx).
    app.set('trust proxy', 1);
}

app.use(basicSecurityHeaders());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(express.json({ limit: '50kb' }));

// Simple, dependency-free rate limiting (best-effort; use a real store in production).
app.use(createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: IS_PROD ? 300 : 1200
}));

// Session configuration
app.use(session({
    store: new FirestoreStore({ database: db }),
    secret: process.env.SESSION_SECRET || 'dev-only-session-secret-change-me',
    resave: false,
    saveUninitialized: false,
    name: 'petcare.sid',
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax',
        secure: IS_PROD
    }
}));

app.use(flash());

// Global variables for templates
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user || null;
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const secretaryRoutes = require('./routes/secretary');
const profileRoutes = require('./routes/profile');

app.use('/auth', authRoutes);
app.use('/patient', patientRoutes);
app.use('/doctor', doctorRoutes);
app.use('/secretary', secretaryRoutes);
app.use('/profile', profileRoutes);

// Home route
app.get('/', (req, res) => {
    if (req.session.user) {
        const role = req.session.user.role;
        if (role === 'patient') return res.redirect('/patient/dashboard');
        if (role === 'doctor') return res.redirect('/doctor/dashboard');
        if (role === 'secretary') return res.redirect('/secretary/dashboard');
    }
    res.render('index', { title: 'Home' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    const safeMessage = IS_PROD ? 'Something went wrong.' : (err?.message || 'Unknown error');
    console.error(err);
    res.status(500).render('error', { title: 'Error', error: safeMessage });
});

app.listen(PORT, () => {
    console.log(`Pet Appointment System running on http://localhost:${PORT} (${NODE_ENV})`);
});

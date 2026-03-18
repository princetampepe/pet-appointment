// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.flash('error_msg', 'Please log in to access this page');
    res.redirect('/auth/login');
};

const isPatient = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'patient') {
        return next();
    }
    req.flash('error_msg', 'Access denied');
    res.redirect('/');
};

const isDoctor = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'doctor') {
        return next();
    }
    req.flash('error_msg', 'Access denied');
    res.redirect('/');
};

const isSecretary = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'secretary') {
        return next();
    }
    req.flash('error_msg', 'Access denied');
    res.redirect('/');
};

const isStaff = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'doctor' || req.session.user.role === 'secretary')) {
        return next();
    }
    req.flash('error_msg', 'Access denied');
    res.redirect('/');
};

module.exports = {
    isAuthenticated,
    isPatient,
    isDoctor,
    isSecretary,
    isStaff
};

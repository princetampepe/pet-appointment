const db = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
    create: (userData) => {
        const hashedPassword = bcrypt.hashSync(userData.password, 10);
        const stmt = db.prepare(`
            INSERT INTO users (email, password, first_name, last_name, phone, role, specialization, bio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            userData.email,
            hashedPassword,
            userData.first_name,
            userData.last_name,
            userData.phone || null,
            userData.role,
            userData.specialization || null,
            userData.bio || null
        );
        return result.lastInsertRowid;
    },

    findByEmail: (email) => {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    },

    findById: (id) => {
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id);
    },

    findByRole: (role) => {
        const stmt = db.prepare('SELECT * FROM users WHERE role = ?');
        return stmt.all(role);
    },

    getAllDoctors: () => {
        const stmt = db.prepare('SELECT id, first_name, last_name, specialization, bio FROM users WHERE role = ?');
        return stmt.all('doctor');
    },

    verifyPassword: (password, hashedPassword) => {
        return bcrypt.compareSync(password, hashedPassword);
    },

    update: (id, userData) => {
        const stmt = db.prepare(`
            UPDATE users SET first_name = ?, last_name = ?, phone = ?, specialization = ?, bio = ?
            WHERE id = ?
        `);
        return stmt.run(userData.first_name, userData.last_name, userData.phone, userData.specialization, userData.bio, id);
    },

    updatePassword: (id, newPassword) => {
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
        return stmt.run(hashedPassword, id);
    },

    // Doctor availability methods
    getAvailability: (doctorId) => {
        const stmt = db.prepare('SELECT * FROM doctor_availability WHERE doctor_id = ? ORDER BY day_of_week');
        return stmt.all(doctorId);
    },

    setAvailability: (doctorId, dayOfWeek, startTime, endTime, isAvailable) => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_available)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(doctorId, dayOfWeek, startTime, endTime, isAvailable ? 1 : 0);
    },

    getDoctorWithAvailability: (doctorId) => {
        const doctor = User.findById(doctorId);
        if (doctor) {
            doctor.availability = User.getAvailability(doctorId);
        }
        return doctor;
    }
};

module.exports = User;

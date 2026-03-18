const db = require('../config/database');

const Appointment = {
    create: (appointmentData) => {
        const stmt = db.prepare(`
            INSERT INTO appointments (pet_id, patient_id, doctor_id, appointment_date, appointment_time, reason, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            appointmentData.pet_id,
            appointmentData.patient_id,
            appointmentData.doctor_id,
            appointmentData.appointment_date,
            appointmentData.appointment_time,
            appointmentData.reason,
            appointmentData.notes || null
        );
        return result.lastInsertRowid;
    },

    findById: (id) => {
        const stmt = db.prepare(`
            SELECT a.*, 
                   p.name as pet_name, p.species as pet_species, p.breed as pet_breed,
                   pt.first_name as patient_first_name, pt.last_name as patient_last_name, pt.phone as patient_phone, pt.email as patient_email,
                   d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization as doctor_specialization
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN users pt ON a.patient_id = pt.id
            JOIN users d ON a.doctor_id = d.id
            WHERE a.id = ?
        `);
        return stmt.get(id);
    },

    findByPatientId: (patientId) => {
        const stmt = db.prepare(`
            SELECT a.*, 
                   p.name as pet_name, p.species as pet_species,
                   d.first_name as doctor_first_name, d.last_name as doctor_last_name
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN users d ON a.doctor_id = d.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `);
        return stmt.all(patientId);
    },

    findByDoctorId: (doctorId) => {
        const stmt = db.prepare(`
            SELECT a.*, 
                   p.name as pet_name, p.species as pet_species, p.breed as pet_breed,
                   pt.first_name as patient_first_name, pt.last_name as patient_last_name, pt.phone as patient_phone
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN users pt ON a.patient_id = pt.id
            WHERE a.doctor_id = ?
            ORDER BY a.appointment_date ASC, a.appointment_time ASC
        `);
        return stmt.all(doctorId);
    },

    findPendingByDoctorId: (doctorId) => {
        const stmt = db.prepare(`
            SELECT a.*, 
                   p.name as pet_name, p.species as pet_species, p.breed as pet_breed,
                   pt.first_name as patient_first_name, pt.last_name as patient_last_name, pt.phone as patient_phone
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN users pt ON a.patient_id = pt.id
            WHERE a.doctor_id = ? AND a.status = 'pending'
            ORDER BY a.appointment_date ASC, a.appointment_time ASC
        `);
        return stmt.all(doctorId);
    },

    findAll: () => {
        const stmt = db.prepare(`
            SELECT a.*, 
                   p.name as pet_name, p.species as pet_species,
                   pt.first_name as patient_first_name, pt.last_name as patient_last_name, pt.phone as patient_phone,
                   d.first_name as doctor_first_name, d.last_name as doctor_last_name
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN users pt ON a.patient_id = pt.id
            JOIN users d ON a.doctor_id = d.id
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `);
        return stmt.all();
    },

    findByStatus: (status) => {
        const stmt = db.prepare(`
            SELECT a.*, 
                   p.name as pet_name, p.species as pet_species,
                   pt.first_name as patient_first_name, pt.last_name as patient_last_name, pt.phone as patient_phone,
                   d.first_name as doctor_first_name, d.last_name as doctor_last_name
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN users pt ON a.patient_id = pt.id
            JOIN users d ON a.doctor_id = d.id
            WHERE a.status = ?
            ORDER BY a.appointment_date ASC, a.appointment_time ASC
        `);
        return stmt.all(status);
    },

    findByDateAndDoctor: (date, doctorId) => {
        const stmt = db.prepare(`
            SELECT appointment_time FROM appointments 
            WHERE appointment_date = ? AND doctor_id = ? AND status != 'cancelled'
        `);
        return stmt.all(date, doctorId);
    },

    updateStatus: (id, status, notes = null) => {
        const stmt = db.prepare(`
            UPDATE appointments SET status = ?, notes = COALESCE(?, notes)
            WHERE id = ?
        `);
        return stmt.run(status, notes, id);
    },

    delete: (id) => {
        const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
        return stmt.run(id);
    },

    reschedule: (id, newDate, newTime) => {
        const stmt = db.prepare(`
            UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = 'pending'
            WHERE id = ?
        `);
        return stmt.run(newDate, newTime, id);
    },

    getStats: () => {
        const totalStmt = db.prepare('SELECT COUNT(*) as count FROM appointments');
        const pendingStmt = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'");
        const confirmedStmt = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'");
        const completedStmt = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'");
        const cancelledStmt = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'");
        
        return {
            total: totalStmt.get().count,
            pending: pendingStmt.get().count,
            confirmed: confirmedStmt.get().count,
            completed: completedStmt.get().count,
            cancelled: cancelledStmt.get().count
        };
    },

    getTodayAppointments: () => {
        const today = new Date().toISOString().split('T')[0];
        const stmt = db.prepare(`
            SELECT a.*, 
                   p.name as pet_name, p.species as pet_species,
                   pt.first_name as patient_first_name, pt.last_name as patient_last_name,
                   d.first_name as doctor_first_name, d.last_name as doctor_last_name
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN users pt ON a.patient_id = pt.id
            JOIN users d ON a.doctor_id = d.id
            WHERE a.appointment_date = ?
            ORDER BY a.appointment_time ASC
        `);
        return stmt.all(today);
    }
};

module.exports = Appointment;

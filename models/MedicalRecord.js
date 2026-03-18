const db = require('../config/database');

const MedicalRecord = {
    create: (recordData) => {
        const stmt = db.prepare(`
            INSERT INTO medical_records (pet_id, appointment_id, doctor_id, record_date, diagnosis, treatment, prescription, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            recordData.pet_id,
            recordData.appointment_id || null,
            recordData.doctor_id,
            recordData.record_date,
            recordData.diagnosis || null,
            recordData.treatment || null,
            recordData.prescription || null,
            recordData.notes || null
        );
        return result.lastInsertRowid;
    },

    findById: (id) => {
        const stmt = db.prepare(`
            SELECT mr.*, 
                   p.name as pet_name, p.species as pet_species,
                   d.first_name as doctor_first_name, d.last_name as doctor_last_name
            FROM medical_records mr
            JOIN pets p ON mr.pet_id = p.id
            JOIN users d ON mr.doctor_id = d.id
            WHERE mr.id = ?
        `);
        return stmt.get(id);
    },

    findByPetId: (petId) => {
        const stmt = db.prepare(`
            SELECT mr.*, 
                   d.first_name as doctor_first_name, d.last_name as doctor_last_name
            FROM medical_records mr
            JOIN users d ON mr.doctor_id = d.id
            WHERE mr.pet_id = ?
            ORDER BY mr.record_date DESC, mr.created_at DESC
        `);
        return stmt.all(petId);
    },

    findByAppointmentId: (appointmentId) => {
        const stmt = db.prepare(`
            SELECT mr.*, 
                   p.name as pet_name,
                   d.first_name as doctor_first_name, d.last_name as doctor_last_name
            FROM medical_records mr
            JOIN pets p ON mr.pet_id = p.id
            JOIN users d ON mr.doctor_id = d.id
            WHERE mr.appointment_id = ?
        `);
        return stmt.get(appointmentId);
    },

    findByDoctorId: (doctorId) => {
        const stmt = db.prepare(`
            SELECT mr.*, 
                   p.name as pet_name, p.species as pet_species,
                   o.first_name as owner_first_name, o.last_name as owner_last_name
            FROM medical_records mr
            JOIN pets p ON mr.pet_id = p.id
            JOIN users o ON p.owner_id = o.id
            WHERE mr.doctor_id = ?
            ORDER BY mr.record_date DESC
        `);
        return stmt.all(doctorId);
    },

    update: (id, recordData) => {
        const stmt = db.prepare(`
            UPDATE medical_records 
            SET diagnosis = ?, treatment = ?, prescription = ?, notes = ?
            WHERE id = ?
        `);
        return stmt.run(recordData.diagnosis, recordData.treatment, recordData.prescription, recordData.notes, id);
    },

    delete: (id) => {
        const stmt = db.prepare('DELETE FROM medical_records WHERE id = ?');
        return stmt.run(id);
    }
};

module.exports = MedicalRecord;

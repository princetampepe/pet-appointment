const db = require('../config/firebase');

const APPOINTMENTS = 'appointments';

const Appointment = {
    create: async (data) => {
        const docRef = await db.collection(APPOINTMENTS).add({
            pet_id: data.pet_id,
            patient_id: data.patient_id,
            doctor_id: data.doctor_id,
            appointment_date: data.appointment_date,
            appointment_time: data.appointment_time,
            reason: data.reason,
            status: 'pending',
            notes: data.notes || null,
            pet_name: data.pet_name || null,
            pet_species: data.pet_species || null,
            pet_breed: data.pet_breed || null,
            patient_first_name: data.patient_first_name || null,
            patient_last_name: data.patient_last_name || null,
            patient_phone: data.patient_phone || null,
            patient_email: data.patient_email || null,
            doctor_first_name: data.doctor_first_name || null,
            doctor_last_name: data.doctor_last_name || null,
            doctor_specialization: data.doctor_specialization || null,
            created_at: new Date().toISOString()
        });
        return docRef.id;
    },

    findById: async (id) => {
        const doc = await db.collection(APPOINTMENTS).doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    findByPatientId: async (patientId) => {
        const snapshot = await db.collection(APPOINTMENTS).where('patient_id', '==', patientId).get();
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));
    },

    findByDoctorId: async (doctorId) => {
        const snapshot = await db.collection(APPOINTMENTS).where('doctor_id', '==', doctorId).get();
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
    },

    findPendingByDoctorId: async (doctorId) => {
        const snapshot = await db.collection(APPOINTMENTS).where('doctor_id', '==', doctorId).get();
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs
            .filter(d => d.status === 'pending')
            .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
    },

    findAll: async () => {
        const snapshot = await db.collection(APPOINTMENTS).get();
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));
    },

    findByStatus: async (status) => {
        const snapshot = await db.collection(APPOINTMENTS).where('status', '==', status).get();
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
    },

    findByDateAndDoctor: async (date, doctorId) => {
        const snapshot = await db.collection(APPOINTMENTS).where('doctor_id', '==', doctorId).get();
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.filter(d => d.appointment_date === date && d.status !== 'cancelled');
    },

    updateStatus: async (id, status, notes = null) => {
        const update = { status };
        if (notes) update.notes = notes;
        await db.collection(APPOINTMENTS).doc(id).update(update);
    },

    delete: async (id) => {
        await db.collection(APPOINTMENTS).doc(id).delete();
    },

    reschedule: async (id, newDate, newTime) => {
        await db.collection(APPOINTMENTS).doc(id).update({
            appointment_date: newDate,
            appointment_time: newTime,
            status: 'pending'
        });
    },

    getStats: async () => {
        const snapshot = await db.collection(APPOINTMENTS).get();
        const docs = snapshot.docs.map(doc => doc.data());
        return {
            total: docs.length,
            pending: docs.filter(d => d.status === 'pending').length,
            confirmed: docs.filter(d => d.status === 'confirmed').length,
            completed: docs.filter(d => d.status === 'completed').length,
            cancelled: docs.filter(d => d.status === 'cancelled').length
        };
    },

    getTodayAppointments: async () => {
        const today = new Date().toISOString().split('T')[0];
        const snapshot = await db.collection(APPOINTMENTS).where('appointment_date', '==', today).get();
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    }
};

module.exports = Appointment;

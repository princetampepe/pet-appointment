const db = require('../config/firebase');

const RECORDS = 'medical_records';

const MedicalRecord = {
    create: async (data) => {
        const docRef = await db.collection(RECORDS).add({
            pet_id: data.pet_id,
            appointment_id: data.appointment_id || null,
            doctor_id: data.doctor_id,
            record_date: data.record_date,
            diagnosis: data.diagnosis || null,
            treatment: data.treatment || null,
            prescription: data.prescription || null,
            notes: data.notes || null,
            pet_name: data.pet_name || null,
            pet_species: data.pet_species || null,
            doctor_first_name: data.doctor_first_name || null,
            doctor_last_name: data.doctor_last_name || null,
            owner_first_name: data.owner_first_name || null,
            owner_last_name: data.owner_last_name || null,
            created_at: new Date().toISOString()
        });
        return docRef.id;
    },

    findById: async (id) => {
        const doc = await db.collection(RECORDS).doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    findByPetId: async (petId) => {
        const snapshot = await db.collection(RECORDS).where('pet_id', '==', petId).get();
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => b.record_date.localeCompare(a.record_date));
    },

    findByAppointmentId: async (appointmentId) => {
        const snapshot = await db.collection(RECORDS).where('appointment_id', '==', appointmentId).limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    findByDoctorId: async (doctorId) => {
        const snapshot = await db.collection(RECORDS).where('doctor_id', '==', doctorId).get();
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => b.record_date.localeCompare(a.record_date));
    },

    update: async (id, data) => {
        await db.collection(RECORDS).doc(id).update({
            diagnosis: data.diagnosis,
            treatment: data.treatment,
            prescription: data.prescription,
            notes: data.notes
        });
    },

    delete: async (id) => {
        await db.collection(RECORDS).doc(id).delete();
    }
};

module.exports = MedicalRecord;

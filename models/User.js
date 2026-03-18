const db = require('../config/firebase');
const bcrypt = require('bcryptjs');

const USERS = 'users';

const User = {
    create: async (userData) => {
        const hashedPassword = bcrypt.hashSync(userData.password, 10);
        const docRef = await db.collection(USERS).add({
            email: userData.email,
            password: hashedPassword,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone || null,
            role: userData.role,
            specialization: userData.specialization || null,
            bio: userData.bio || null,
            created_at: new Date().toISOString()
        });
        return docRef.id;
    },

    findByEmail: async (email) => {
        const snapshot = await db.collection(USERS).where('email', '==', email).limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    findById: async (id) => {
        const doc = await db.collection(USERS).doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    findByRole: async (role) => {
        const snapshot = await db.collection(USERS).where('role', '==', role).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    getAllDoctors: async () => {
        const snapshot = await db.collection(USERS).where('role', '==', 'doctor').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            first_name: doc.data().first_name,
            last_name: doc.data().last_name,
            specialization: doc.data().specialization,
            bio: doc.data().bio
        }));
    },

    verifyPassword: (password, hashedPassword) => {
        return bcrypt.compareSync(password, hashedPassword);
    },

    update: async (id, userData) => {
        await db.collection(USERS).doc(id).update({
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone || null,
            specialization: userData.specialization || null,
            bio: userData.bio || null
        });
    },

    updatePassword: async (id, newPassword) => {
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await db.collection(USERS).doc(id).update({ password: hashedPassword });
    },

    getAvailability: async (doctorId) => {
        const snapshot = await db.collection(USERS).doc(doctorId).collection('availability').get();
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => a.day_of_week - b.day_of_week);
    },

    setAvailability: async (doctorId, dayOfWeek, startTime, endTime, isAvailable) => {
        await db.collection(USERS).doc(doctorId).collection('availability').doc(String(dayOfWeek)).set({
            doctor_id: doctorId,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            is_available: isAvailable ? 1 : 0
        });
    },

    getDoctorWithAvailability: async (doctorId) => {
        const doctor = await User.findById(doctorId);
        if (doctor) {
            doctor.availability = await User.getAvailability(doctorId);
        }
        return doctor;
    }
};

module.exports = User;

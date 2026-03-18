const db = require('../config/firebase');

const PETS = 'pets';

const Pet = {
    create: async (petData) => {
        const docRef = await db.collection(PETS).add({
            owner_id: petData.owner_id,
            name: petData.name,
            species: petData.species,
            breed: petData.breed || null,
            age: petData.age || null,
            weight: petData.weight || null,
            notes: petData.notes || null,
            created_at: new Date().toISOString()
        });
        return docRef.id;
    },

    findById: async (id) => {
        const doc = await db.collection(PETS).doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    findByOwnerId: async (ownerId) => {
        const snapshot = await db.collection(PETS).where('owner_id', '==', ownerId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    update: async (id, petData) => {
        await db.collection(PETS).doc(id).update({
            name: petData.name,
            species: petData.species,
            breed: petData.breed || null,
            age: petData.age || null,
            weight: petData.weight || null,
            notes: petData.notes || null
        });
    },

    delete: async (id) => {
        await db.collection(PETS).doc(id).delete();
    }
};

module.exports = Pet;

const db = require('../config/database');

const Pet = {
    create: (petData) => {
        const stmt = db.prepare(`
            INSERT INTO pets (owner_id, name, species, breed, age, weight, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            petData.owner_id,
            petData.name,
            petData.species,
            petData.breed || null,
            petData.age || null,
            petData.weight || null,
            petData.notes || null
        );
        return result.lastInsertRowid;
    },

    findById: (id) => {
        const stmt = db.prepare('SELECT * FROM pets WHERE id = ?');
        return stmt.get(id);
    },

    findByOwnerId: (ownerId) => {
        const stmt = db.prepare('SELECT * FROM pets WHERE owner_id = ?');
        return stmt.all(ownerId);
    },

    update: (id, petData) => {
        const stmt = db.prepare(`
            UPDATE pets SET name = ?, species = ?, breed = ?, age = ?, weight = ?, notes = ?
            WHERE id = ?
        `);
        return stmt.run(petData.name, petData.species, petData.breed, petData.age, petData.weight, petData.notes, id);
    },

    delete: (id) => {
        const stmt = db.prepare('DELETE FROM pets WHERE id = ?');
        return stmt.run(id);
    }
};

module.exports = Pet;

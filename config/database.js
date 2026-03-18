const Database = require('better-sqlite3');
const path = require('path');

const IS_VERCEL = process.env.VERCEL === '1';
const dbPath = IS_VERCEL
    ? '/tmp/database.sqlite'
    : path.join(__dirname, '..', 'database.sqlite');

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
    -- Users table (patients, doctors, secretaries)
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'secretary')),
        specialization TEXT,
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Doctor availability table
    CREATE TABLE IF NOT EXISTS doctor_availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_available INTEGER DEFAULT 1,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(doctor_id, day_of_week)
    );

    -- Pets table
    CREATE TABLE IF NOT EXISTS pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        species TEXT NOT NULL,
        breed TEXT,
        age INTEGER,
        weight REAL,
        notes TEXT,
        photo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Pet medical records table
    CREATE TABLE IF NOT EXISTS medical_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id INTEGER NOT NULL,
        appointment_id INTEGER,
        doctor_id INTEGER NOT NULL,
        record_date DATE NOT NULL,
        diagnosis TEXT,
        treatment TEXT,
        prescription TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Appointments table
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
    );
`);

module.exports = db;

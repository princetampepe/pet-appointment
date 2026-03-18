const db = require('../config/database');
const bcrypt = require('bcryptjs');

console.log('🔧 Initializing database with sample data...\n');

// Clear existing data
db.exec('DELETE FROM appointments');
db.exec('DELETE FROM pets');
db.exec('DELETE FROM users');

// Create sample users
const users = [
    // Doctors
    {
        email: 'dr.smith@petcare.com',
        password: bcrypt.hashSync('password123', 10),
        first_name: 'John',
        last_name: 'Smith',
        phone: '555-0101',
        role: 'doctor',
        specialization: 'Surgery'
    },
    {
        email: 'dr.johnson@petcare.com',
        password: bcrypt.hashSync('password123', 10),
        first_name: 'Emily',
        last_name: 'Johnson',
        phone: '555-0102',
        role: 'doctor',
        specialization: 'Internal Medicine'
    },
    {
        email: 'dr.williams@petcare.com',
        password: bcrypt.hashSync('password123', 10),
        first_name: 'Michael',
        last_name: 'Williams',
        phone: '555-0103',
        role: 'doctor',
        specialization: 'Dentistry'
    },
    // Secretary
    {
        email: 'secretary@petcare.com',
        password: bcrypt.hashSync('password123', 10),
        first_name: 'Sarah',
        last_name: 'Davis',
        phone: '555-0200',
        role: 'secretary',
        specialization: null
    },
    // Sample patients
    {
        email: 'patient1@example.com',
        password: bcrypt.hashSync('password123', 10),
        first_name: 'Alice',
        last_name: 'Brown',
        phone: '555-0301',
        role: 'patient',
        specialization: null
    },
    {
        email: 'patient2@example.com',
        password: bcrypt.hashSync('password123', 10),
        first_name: 'Bob',
        last_name: 'Wilson',
        phone: '555-0302',
        role: 'patient',
        specialization: null
    }
];

const insertUser = db.prepare(`
    INSERT INTO users (email, password, first_name, last_name, phone, role, specialization)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const userIds = {};
users.forEach(user => {
    const result = insertUser.run(
        user.email, user.password, user.first_name, user.last_name,
        user.phone, user.role, user.specialization
    );
    userIds[user.email] = result.lastInsertRowid;
    console.log(`✓ Created ${user.role}: ${user.first_name} ${user.last_name} (${user.email})`);
});

// Create sample pets
const pets = [
    { owner_email: 'patient1@example.com', name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', age: 3, weight: 30 },
    { owner_email: 'patient1@example.com', name: 'Whiskers', species: 'Cat', breed: 'Persian', age: 5, weight: 4.5 },
    { owner_email: 'patient2@example.com', name: 'Max', species: 'Dog', breed: 'German Shepherd', age: 2, weight: 35 },
    { owner_email: 'patient2@example.com', name: 'Tweety', species: 'Bird', breed: 'Canary', age: 1, weight: 0.02 }
];

const insertPet = db.prepare(`
    INSERT INTO pets (owner_id, name, species, breed, age, weight)
    VALUES (?, ?, ?, ?, ?, ?)
`);

const petIds = {};
pets.forEach(pet => {
    const result = insertPet.run(
        userIds[pet.owner_email], pet.name, pet.species, pet.breed, pet.age, pet.weight
    );
    petIds[pet.name] = result.lastInsertRowid;
    console.log(`✓ Created pet: ${pet.name} (${pet.species})`);
});

// Create sample appointments
const today = new Date();
const appointments = [
    {
        pet_name: 'Buddy',
        patient_email: 'patient1@example.com',
        doctor_email: 'dr.smith@petcare.com',
        date_offset: 0,
        time: '10:00',
        reason: 'General Checkup',
        status: 'confirmed'
    },
    {
        pet_name: 'Whiskers',
        patient_email: 'patient1@example.com',
        doctor_email: 'dr.johnson@petcare.com',
        date_offset: 1,
        time: '14:30',
        reason: 'Vaccination',
        status: 'pending'
    },
    {
        pet_name: 'Max',
        patient_email: 'patient2@example.com',
        doctor_email: 'dr.smith@petcare.com',
        date_offset: 2,
        time: '09:00',
        reason: 'Illness/Injury',
        status: 'pending'
    },
    {
        pet_name: 'Tweety',
        patient_email: 'patient2@example.com',
        doctor_email: 'dr.williams@petcare.com',
        date_offset: 3,
        time: '11:00',
        reason: 'General Checkup',
        status: 'pending'
    }
];

const insertAppointment = db.prepare(`
    INSERT INTO appointments (pet_id, patient_id, doctor_id, appointment_date, appointment_time, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

appointments.forEach(apt => {
    const appointmentDate = new Date(today);
    appointmentDate.setDate(today.getDate() + apt.date_offset);
    const dateStr = appointmentDate.toISOString().split('T')[0];
    
    insertAppointment.run(
        petIds[apt.pet_name],
        userIds[apt.patient_email],
        userIds[apt.doctor_email],
        dateStr,
        apt.time,
        apt.reason,
        apt.status
    );
    console.log(`✓ Created appointment: ${apt.pet_name} with Dr. on ${dateStr} at ${apt.time}`);
});

console.log('\n✅ Database initialized successfully!\n');
console.log('📋 Login Credentials:');
console.log('─'.repeat(50));
console.log('DOCTORS:');
console.log('  dr.smith@petcare.com / password123');
console.log('  dr.johnson@petcare.com / password123');
console.log('  dr.williams@petcare.com / password123');
console.log('');
console.log('SECRETARY:');
console.log('  secretary@petcare.com / password123');
console.log('');
console.log('PATIENTS:');
console.log('  patient1@example.com / password123');
console.log('  patient2@example.com / password123');
console.log('─'.repeat(50));

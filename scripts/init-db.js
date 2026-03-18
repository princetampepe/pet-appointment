const db = require('../config/firebase');
const bcrypt = require('bcryptjs');

async function initDb() {
    console.log('Initializing Firestore with sample data...\n');

    const usersData = [
        { email: 'dr.smith@petcare.com',     password: 'password123', first_name: 'John',    last_name: 'Smith',    phone: '555-0101', role: 'doctor',    specialization: 'Surgery',           bio: null },
        { email: 'dr.johnson@petcare.com',   password: 'password123', first_name: 'Emily',   last_name: 'Johnson',  phone: '555-0102', role: 'doctor',    specialization: 'Internal Medicine', bio: null },
        { email: 'dr.williams@petcare.com',  password: 'password123', first_name: 'Michael', last_name: 'Williams', phone: '555-0103', role: 'doctor',    specialization: 'Dentistry',         bio: null },
        { email: 'secretary@petcare.com',    password: 'password123', first_name: 'Sarah',   last_name: 'Davis',    phone: '555-0200', role: 'secretary', specialization: null,                bio: null },
        { email: 'patient1@example.com',     password: 'password123', first_name: 'Alice',   last_name: 'Brown',    phone: '555-0301', role: 'patient',   specialization: null,                bio: null },
        { email: 'patient2@example.com',     password: 'password123', first_name: 'Bob',     last_name: 'Wilson',   phone: '555-0302', role: 'patient',   specialization: null,                bio: null }
    ];

    const userIds = {};
    for (const user of usersData) {
        const ref = await db.collection('users').add({
            ...user,
            password: bcrypt.hashSync(user.password, 10),
            created_at: new Date().toISOString()
        });
        userIds[user.email] = ref.id;
        console.log(`Created ${user.role}: ${user.first_name} ${user.last_name} (${user.email})`);
    }

    const petsData = [
        { owner_email: 'patient1@example.com', name: 'Buddy',    species: 'Dog',  breed: 'Golden Retriever', age: 3, weight: 30   },
        { owner_email: 'patient1@example.com', name: 'Whiskers', species: 'Cat',  breed: 'Persian',          age: 5, weight: 4.5  },
        { owner_email: 'patient2@example.com', name: 'Max',      species: 'Dog',  breed: 'German Shepherd',  age: 2, weight: 35   },
        { owner_email: 'patient2@example.com', name: 'Tweety',   species: 'Bird', breed: 'Canary',           age: 1, weight: 0.02 }
    ];

    const petIds = {};
    for (const pet of petsData) {
        const ref = await db.collection('pets').add({
            owner_id: userIds[pet.owner_email],
            name: pet.name, species: pet.species, breed: pet.breed,
            age: pet.age, weight: pet.weight, notes: null,
            created_at: new Date().toISOString()
        });
        petIds[pet.name] = ref.id;
        console.log(`Created pet: ${pet.name} (${pet.species})`);
    }

    const today = new Date();
    const appointmentsData = [
        { pet: 'Buddy',    patient_email: 'patient1@example.com', doctor_email: 'dr.smith@petcare.com',    offset: 0, time: '10:00', reason: 'General Checkup', status: 'confirmed' },
        { pet: 'Whiskers', patient_email: 'patient1@example.com', doctor_email: 'dr.johnson@petcare.com',  offset: 1, time: '14:30', reason: 'Vaccination',      status: 'pending'   },
        { pet: 'Max',      patient_email: 'patient2@example.com', doctor_email: 'dr.smith@petcare.com',    offset: 2, time: '09:00', reason: 'Illness/Injury',   status: 'pending'   },
        { pet: 'Tweety',   patient_email: 'patient2@example.com', doctor_email: 'dr.williams@petcare.com', offset: 3, time: '11:00', reason: 'General Checkup', status: 'pending'   }
    ];

    for (const apt of appointmentsData) {
        const d = new Date(today);
        d.setDate(today.getDate() + apt.offset);
        const dateStr = d.toISOString().split('T')[0];

        const patientId = userIds[apt.patient_email];
        const doctorId  = userIds[apt.doctor_email];
        const patient   = usersData.find(u => u.email === apt.patient_email);
        const doctor    = usersData.find(u => u.email === apt.doctor_email);
        const petInfo   = petsData.find(p => p.name === apt.pet);

        await db.collection('appointments').add({
            pet_id: petIds[apt.pet], patient_id: patientId, doctor_id: doctorId,
            appointment_date: dateStr, appointment_time: apt.time,
            reason: apt.reason, status: apt.status, notes: null,
            pet_name: petInfo.name, pet_species: petInfo.species, pet_breed: petInfo.breed,
            patient_first_name: patient.first_name, patient_last_name: patient.last_name,
            patient_phone: patient.phone, patient_email: patient.email,
            doctor_first_name: doctor.first_name, doctor_last_name: doctor.last_name,
            doctor_specialization: doctor.specialization,
            created_at: new Date().toISOString()
        });
        console.log(`Created appointment: ${apt.pet} on ${dateStr} at ${apt.time}`);
    }

    console.log('\nFirestore initialized successfully!\n');
    console.log('Login Credentials:');
    console.log('─'.repeat(50));
    console.log('SECRETARY:  secretary@petcare.com / password123');
    console.log('DOCTORS:    dr.smith@petcare.com / password123');
    console.log('            dr.johnson@petcare.com / password123');
    console.log('            dr.williams@petcare.com / password123');
    console.log('PATIENTS:   patient1@example.com / password123');
    console.log('            patient2@example.com / password123');
    console.log('─'.repeat(50));
}

initDb().catch(console.error).finally(() => process.exit());

# PetCare Vet Clinic - Appointment System

A comprehensive pet appointment booking system for veterinary hospitals built with Node.js, Express, and SQLite.

## Features

### For Patients (Pet Owners)
- Register and login to account
- Add and manage pets (name, species, breed, age, weight, notes)
- Book appointments with preferred doctor and time slot
- View appointment history and status
- Cancel pending or confirmed appointments

### For Doctors
- View personal dashboard with stats
- See pending appointments requiring confirmation
- View today's appointments
- Confirm, complete, or cancel appointments
- Add notes to completed appointments

### For Secretaries/Admin
- Full dashboard with system-wide statistics
- View and filter all appointments (by status, doctor, date)
- Manage appointment statuses
- View schedule overview by doctor
- Add new staff members (doctors and secretaries)

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite with better-sqlite3
- **View Engine:** EJS
- **Authentication:** express-session, bcryptjs
- **Styling:** Bootstrap 5, Bootstrap Icons
- **Validation:** express-validator

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables (recommended):**
   - Copy `.env.example` to `.env` and set a strong `SESSION_SECRET`.
   - If you don’t want a `.env` file, you can also set env vars in your shell before running.

2. **Initialize database with sample data:**
   ```bash
   npm run init-db
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Troubleshooting

### better-sqlite3 / Node version mismatch (Windows)

If you see an error like `NODE_MODULE_VERSION ...` when starting the server, you’re using a Node.js version that your current `node_modules` were not built for.

- Use Node **20.x** (see `.nvmrc`)
- Then reinstall dependencies:

```bash
rm -r node_modules
npm install
```

### Starting with Node 20 while Node 24 is installed

If you have multiple Node versions installed and Windows keeps using the wrong one, you can start the app using:

```powershell
.\scripts\start-node20.ps1
```

## Sample Login Credentials

After running `npm run init-db`, you can use these accounts:

### Doctors
- `dr.smith@petcare.com` / `password123` (Surgery)
- `dr.johnson@petcare.com` / `password123` (Internal Medicine)
- `dr.williams@petcare.com` / `password123` (Dentistry)

### Secretary
- `secretary@petcare.com` / `password123`

### Patients
- `patient1@example.com` / `password123`
- `patient2@example.com` / `password123`

## Project Structure

```
pet-appointment/
├── config/
│   └── database.js         # Database configuration and schema
├── middleware/
│   └── auth.js             # Authentication middleware
├── models/
│   ├── User.js             # User model
│   ├── Pet.js              # Pet model
│   └── Appointment.js      # Appointment model
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── patient.js          # Patient routes
│   ├── doctor.js           # Doctor routes
│   └── secretary.js        # Secretary routes
├── views/
│   ├── layouts/
│   │   └── main.ejs        # Main layout template
│   ├── auth/               # Login/Register views
│   ├── patient/            # Patient dashboard views
│   ├── doctor/             # Doctor dashboard views
│   └── secretary/          # Secretary dashboard views
├── public/
│   ├── css/
│   │   └── style.css       # Custom styles
│   └── js/
│       └── main.js         # Client-side JavaScript
├── scripts/
│   └── init-db.js          # Database initialization script
├── server.js               # Main application entry point
├── package.json
└── README.md
```

## User Roles & Permissions

| Feature | Patient | Doctor | Secretary |
|---------|---------|--------|-----------|
| Register account | ✅ | ❌ | ❌ |
| Manage own pets | ✅ | ❌ | ❌ |
| Book appointments | ✅ | ❌ | ❌ |
| View own appointments | ✅ | ✅ (assigned) | ✅ (all) |
| Confirm appointments | ❌ | ✅ | ✅ |
| Complete appointments | ❌ | ✅ | ✅ |
| Cancel appointments | ✅ (own) | ✅ (assigned) | ✅ (all) |
| View all schedules | ❌ | ❌ | ✅ |
| Add staff members | ❌ | ❌ | ✅ |

## License

MIT License

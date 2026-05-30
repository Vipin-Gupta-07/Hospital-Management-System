// ============================================================
// data.js — HMS localStorage Data Layer
// ============================================================

const HMS_KEYS = {
  hospitals: 'hms_hospitals',
  doctors: 'hms_doctors',
  patients: 'hms_patients',
  admin: 'hms_admin',
  appointments: 'hms_appointments',
  rooms: 'hms_rooms',
  bills: 'hms_bills',
  prescriptions: 'hms_prescriptions',
  reports: 'hms_reports',
};

// Simple non-cryptographic hash for demo passwords
function hashPassword(pwd) {
  let h = 0xdeadbeef;
  for (let i = 0; i < pwd.length; i++) {
    h = Math.imul(h ^ pwd.charCodeAt(i), 2654435761);
  }
  return ((h ^ (h >>> 16)) >>> 0).toString(16).padStart(8, '0') + 'hms';
}

function generateId(prefix = 'ID') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

// ── Read / Write helpers ─────────────────────────────────────
function readStore(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function writeStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function readObj(key, fallback = {}) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

// ── Seed Data ────────────────────────────────────────────────
function seedDemoData() {
  if (localStorage.getItem('hms_seeded')) return;

  // Hospitals
  const hospitals = [
    { id: 'H1', name: 'Pavan Hospital', address: '12 Gandhi Nagar, Delhi', phone: '011-23456789', beds: 100, specializations: ['Cardiology', 'Neurology', 'Orthopedics'] },
    { id: 'H2', name: 'Rini Hospital', address: '45 MG Road, Mumbai', phone: '022-98765432', beds: 80, specializations: ['Pediatrics', 'Gynecology', 'Dermatology'] },
    { id: 'H3', name: 'Priyangshu Hospital', address: '78 Park Street, Kolkata', phone: '033-11223344', beds: 60, specializations: ['Oncology', 'Pulmonology', 'ENT'] },
  ];

  // Admin
  const admin = {
    username: 'admin', name: 'System Administrator',
    email: 'admin@hms.com', password: hashPassword('Admin@123'),
    role: 'admin', hospitalId: 'H1',
  };

  // Write to localStorage
  writeStore(HMS_KEYS.hospitals, hospitals);
  writeStore(HMS_KEYS.doctors, []);
  writeStore(HMS_KEYS.patients, []);
  writeStore(HMS_KEYS.rooms, rooms);
  writeStore(HMS_KEYS.appointments, []);
  writeStore(HMS_KEYS.prescriptions, []);
  writeStore(HMS_KEYS.reports, []);
  writeStore(HMS_KEYS.bills, []);
  localStorage.setItem(HMS_KEYS.admin, JSON.stringify({
    username: 'admin', name: 'System Administrator',
    email: 'admin@hms.com', password: hashPassword('Admin@123'),
    role: 'admin', hospitalId: 'H1',
  }));
  localStorage.setItem('hms_seeded', '1');
}

// ── HOSPITAL CRUD ─────────────────────────────────────────────
const Hospitals = {
  all: () => readStore(HMS_KEYS.hospitals),
  get: (id) => readStore(HMS_KEYS.hospitals).find(h => h.id === id),
  add: (data) => {
    const list = readStore(HMS_KEYS.hospitals);
    const item = { id: generateId('H'), ...data };
    list.push(item); writeStore(HMS_KEYS.hospitals, list); return item;
  },
  update: (id, data) => {
    const list = readStore(HMS_KEYS.hospitals).map(h => h.id === id ? { ...h, ...data } : h);
    writeStore(HMS_KEYS.hospitals, list);
  },
  delete: (id) => writeStore(HMS_KEYS.hospitals, readStore(HMS_KEYS.hospitals).filter(h => h.id !== id)),
};

// ── DOCTOR CRUD ───────────────────────────────────────────────
const Doctors = {
  all: () => readStore(HMS_KEYS.doctors),
  get: (id) => readStore(HMS_KEYS.doctors).find(d => d.id === id),
  getByUsername: (username) => readStore(HMS_KEYS.doctors).find(d => d.username === username),
  add: (data) => {
    const list = readStore(HMS_KEYS.doctors);
    const item = { id: generateId('D'), status: 'active', ...data, password: hashPassword(data.password || 'Doctor@123') };
    list.push(item); writeStore(HMS_KEYS.doctors, list); return item;
  },
  update: (id, data) => {
    const list = readStore(HMS_KEYS.doctors).map(d => d.id === id ? { ...d, ...data } : d);
    writeStore(HMS_KEYS.doctors, list);
  },
  delete: (id) => {
    writeStore(HMS_KEYS.doctors, readStore(HMS_KEYS.doctors).filter(d => d.id !== id));
    // unassign patients
    const pts = readStore(HMS_KEYS.patients).map(p => p.assignedDoctorId === id ? { ...p, assignedDoctorId: null } : p);
    writeStore(HMS_KEYS.patients, pts);
  },
};

// ── PATIENT CRUD ──────────────────────────────────────────────
const Patients = {
  all: () => readStore(HMS_KEYS.patients),
  get: (id) => readStore(HMS_KEYS.patients).find(p => p.id === id),
  getByUsername: (username) => readStore(HMS_KEYS.patients).find(p => p.username === username),
  add: (data) => {
    const list = readStore(HMS_KEYS.patients);
    const item = { id: generateId('P'), status: 'outpatient', ...data, password: hashPassword(data.password || 'Patient@123') };
    list.push(item); writeStore(HMS_KEYS.patients, list); return item;
  },
  update: (id, data) => {
    const list = readStore(HMS_KEYS.patients).map(p => p.id === id ? { ...p, ...data } : p);
    writeStore(HMS_KEYS.patients, list);
  },
  delete: (id) => {
    const p = Patients.get(id);
    if (p && p.roomId) Rooms.update(p.roomId, { status: 'available', patientId: null });
    writeStore(HMS_KEYS.patients, readStore(HMS_KEYS.patients).filter(p => p.id !== id));
  },
};

// ── ROOM CRUD ─────────────────────────────────────────────────
const Rooms = {
  all: () => readStore(HMS_KEYS.rooms),
  get: (id) => readStore(HMS_KEYS.rooms).find(r => r.id === id),
  available: (hospitalId) => readStore(HMS_KEYS.rooms).filter(r => r.status === 'available' && (!hospitalId || r.hospitalId === hospitalId)),
  update: (id, data) => {
    const list = readStore(HMS_KEYS.rooms).map(r => r.id === id ? { ...r, ...data } : r);
    writeStore(HMS_KEYS.rooms, list);
  },
  add: (data) => {
    const list = readStore(HMS_KEYS.rooms);
    const item = { id: generateId('R'), status: 'available', patientId: null, ...data };
    list.push(item); writeStore(HMS_KEYS.rooms, list); return item;
  },
  delete: (id) => writeStore(HMS_KEYS.rooms, readStore(HMS_KEYS.rooms).filter(r => r.id !== id)),
};

// ── APPOINTMENT CRUD ──────────────────────────────────────────
const Appointments = {
  all: () => readStore(HMS_KEYS.appointments),
  get: (id) => readStore(HMS_KEYS.appointments).find(a => a.id === id),
  forPatient: (pid) => readStore(HMS_KEYS.appointments).filter(a => a.patientId === pid),
  forDoctor: (did) => readStore(HMS_KEYS.appointments).filter(a => a.doctorId === did),
  today: () => {
    const t = new Date().toISOString().slice(0, 10);
    return readStore(HMS_KEYS.appointments).filter(a => a.date === t);
  },
  add: (data) => {
    const list = readStore(HMS_KEYS.appointments);
    const item = { id: generateId('A'), status: 'pending', createdAt: new Date().toISOString().slice(0, 10), ...data };
    list.push(item); writeStore(HMS_KEYS.appointments, list); return item;
  },
  update: (id, data) => {
    const list = readStore(HMS_KEYS.appointments).map(a => a.id === id ? { ...a, ...data } : a);
    writeStore(HMS_KEYS.appointments, list);
  },
  delete: (id) => writeStore(HMS_KEYS.appointments, readStore(HMS_KEYS.appointments).filter(a => a.id !== id)),
};

// ── PRESCRIPTION CRUD ─────────────────────────────────────────
const Prescriptions = {
  all: () => readStore(HMS_KEYS.prescriptions),
  forPatient: (pid) => readStore(HMS_KEYS.prescriptions).filter(p => p.patientId === pid),
  forDoctor: (did) => readStore(HMS_KEYS.prescriptions).filter(p => p.doctorId === did),
  add: (data) => {
    const list = readStore(HMS_KEYS.prescriptions);
    const item = { id: generateId('PR'), date: new Date().toISOString().slice(0, 10), ...data };
    list.push(item); writeStore(HMS_KEYS.prescriptions, list); return item;
  },
  delete: (id) => writeStore(HMS_KEYS.prescriptions, readStore(HMS_KEYS.prescriptions).filter(p => p.id !== id)),
};

// ── REPORT CRUD ───────────────────────────────────────────────
const Reports = {
  all: () => readStore(HMS_KEYS.reports),
  forPatient: (pid) => readStore(HMS_KEYS.reports).filter(r => r.patientId === pid),
  forDoctor: (did) => readStore(HMS_KEYS.reports).filter(r => r.doctorId === did),
  add: (data) => {
    const list = readStore(HMS_KEYS.reports);
    const item = { id: generateId('RP'), date: new Date().toISOString().slice(0, 10), ...data };
    list.push(item); writeStore(HMS_KEYS.reports, list); return item;
  },
  delete: (id) => writeStore(HMS_KEYS.reports, readStore(HMS_KEYS.reports).filter(r => r.id !== id)),
};

// ── BILL CRUD ─────────────────────────────────────────────────
const Bills = {
  all: () => readStore(HMS_KEYS.bills),
  forPatient: (pid) => readStore(HMS_KEYS.bills).filter(b => b.patientId === pid),
  add: (data) => {
    const list = readStore(HMS_KEYS.bills);
    const item = { id: generateId('B'), date: new Date().toISOString().slice(0, 10), status: 'pending', ...data };
    list.push(item); writeStore(HMS_KEYS.bills, list); return item;
  },
  update: (id, data) => {
    const list = readStore(HMS_KEYS.bills).map(b => b.id === id ? { ...b, ...data } : b);
    writeStore(HMS_KEYS.bills, list);
  },
  delete: (id) => writeStore(HMS_KEYS.bills, readStore(HMS_KEYS.bills).filter(b => b.id !== id)),
};

// ── ADMIN ─────────────────────────────────────────────────────
const Admin = {
  get: () => readObj(HMS_KEYS.admin),
  updatePassword: (newPwd) => {
    const a = Admin.get();
    a.password = hashPassword(newPwd);
    localStorage.setItem(HMS_KEYS.admin, JSON.stringify(a));
  },
};

// ── STATS ─────────────────────────────────────────────────────
const Stats = {
  overview: () => {
    const patients = Patients.all();
    const doctors = Doctors.all();
    const rooms = Rooms.all();
    const appts = Appointments.all();
    const bills = Bills.all();
    const todayStr = new Date().toISOString().slice(0, 10);
    return {
      totalPatients: patients.length,
      admittedPatients: patients.filter(p => p.status === 'admitted').length,
      totalDoctors: doctors.filter(d => d.status === 'active').length,
      totalRooms: rooms.length,
      availableRooms: rooms.filter(r => r.status === 'available').length,
      occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
      todayAppointments: appts.filter(a => a.date === todayStr).length,
      pendingAppointments: appts.filter(a => a.status === 'pending').length,
      totalRevenue: bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.total, 0),
      pendingRevenue: bills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.total, 0),
    };
  },
};

// Expose globally
window.HMS = {
  hashPassword, generateId,
  Hospitals, Doctors, Patients, Rooms,
  Appointments, Prescriptions, Reports, Bills,
  Admin, Stats, seedDemoData,
};

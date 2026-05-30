// ============================================================
// patient.js — Patient Portal Module
// ============================================================

const PatientModule = {
  currentPage: { appointments: 1, bills: 1 },

  render(view = 'dashboard') {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = '';
    content.classList.remove('fade-in');
    void content.offsetWidth;
    content.classList.add('fade-in');

    switch (view) {
      case 'dashboard':     this.renderDashboard(content); break;
      case 'book':          this.renderBookAppointment(content); break;
      case 'room':          this.renderRoomDetails(content); break;
      case 'prescriptions': this.renderPrescriptions(content); break;
      case 'reports':       this.renderReports(content); break;
      case 'billing':       this.renderBilling(content); break;
      case 'profile':       this.renderProfile(content); break;
    }
  },

  // ── Dashboard ─────────────────────────────────────────────
  renderDashboard(el) {
    const session = Auth.getSession();
    if (!session) return;
    const pat = HMS.Patients.get(session.id);
    const doc = pat.assignedDoctorId ? HMS.Doctors.get(pat.assignedDoctorId) : null;
    const room = pat.roomId ? HMS.Rooms.get(pat.roomId) : null;

    const myAppts = HMS.Appointments.forPatient(pat.id);
    const upcoming = myAppts.filter(a => a.status === 'confirmed' || a.status === 'pending');
    const prescriptions = HMS.Prescriptions.forPatient(pat.id);
    const reports = HMS.Reports.forPatient(pat.id);

    el.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Hello, ${pat.name}</h1>
          <p class="page-subtitle">Patient Portal · Access your medical records and book appointments</p>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header"><h2 class="card-title">My Health Summary</h2></div>
          <div class="info-grid">
            <div class="info-item"><label>Blood Group</label><span class="badge badge-info">${pat.bloodGroup || '—'}</span></div>
            <div class="info-item"><label>Status</label><span>${statusBadge(pat.status)}</span></div>
            <div class="info-item"><label>Assigned Doctor</label><span>${doc ? doc.name : 'No doctor assigned'}</span></div>
            <div class="info-item"><label>Room / Bed</label><span>${room ? `Room ${room.number} (${room.type})` : 'Outpatient'}</span></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Quick Actions</h2>
          </div>
          <div class="quick-actions">
            <button class="quick-action-btn" onclick="App.navigate('patient','book')">
              <span class="qa-icon">📅</span><span>Book Appointment</span>
            </button>
            <button class="quick-action-btn" onclick="App.navigate('patient','prescriptions')">
              <span class="qa-icon">💊</span><span>Prescriptions</span>
            </button>
            <button class="quick-action-btn" onclick="App.navigate('patient','reports')">
              <span class="qa-icon">🧪</span><span>Lab Reports</span>
            </button>
            <button class="quick-action-btn" onclick="App.navigate('patient','billing')">
              <span class="qa-icon">💰</span><span>Bills & Invoices</span>
            </button>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header"><h2 class="card-title">Upcoming Appointments</h2></div>
          ${this._upcomingTable(upcoming)}
        </div>
        <div class="card">
          <div class="card-header"><h2 class="card-title">Recent Prescriptions</h2></div>
          ${this._recentPrescriptions(prescriptions.slice(-2).reverse())}
        </div>
      </div>
    `;
  },

  _upcomingTable(appts) {
    if (!appts.length) return emptyState('📅', 'No upcoming appointments booked.');
    return `<table class="data-table">
      <thead><tr><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
      <tbody>${appts.map(a => {
        const d = HMS.Doctors.get(a.doctorId);
        return `<tr>
          <td><strong>${d ? d.name : 'Doctor'}</strong></td>
          <td>${Fmt.date(a.date)}</td>
          <td>${a.time}</td>
          <td>${statusBadge(a.status)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  },

  _recentPrescriptions(list) {
    if (!list.length) return emptyState('💊', 'No prescriptions issued yet.');
    return list.map(pr => {
      const d = HMS.Doctors.get(pr.doctorId);
      return `<div style="background:rgba(255,255,255,0.02); padding:0.75rem; border-radius:6px; margin-bottom:0.5rem">
        <div style="display:flex; justify-content:space-between"><strong>${d ? d.name : 'Doctor'}</strong><span class="text-sm text-muted">${Fmt.date(pr.date)}</span></div>
        <div class="text-sm text-muted" style="margin-top:0.25rem">
          ${pr.medicines.map(m => m.name).join(', ')}
        </div>
      </div>`;
    }).join('');
  },

  // ── Book Appointment ──────────────────────────────────────
  renderBookAppointment(el) {
    const hospitals = HMS.Hospitals.all();
    
    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Book Appointment</h1><p class="page-subtitle">Schedule a consultation with our doctors</p></div>
      </div>
      <div class="card" style="max-width: 600px">
        <form class="modal-form" onsubmit="PatientModule.handleBook(event)">
          <div class="form-group">
            <label>Select Hospital</label>
            <select id="book-hosp" required onchange="PatientModule.loadHospDoctors(this.value)">
              <option value="">Choose hospital...</option>
              ${hospitals.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Select Doctor</label>
            <select id="book-doc" required disabled>
              <option value="">Select hospital first...</option>
            </select>
          </div>
          <div class="form-group">
            <label>Preferred Date</label>
            <input type="date" id="book-date" required min="${Fmt.minDate()}">
          </div>
          <div class="form-group">
            <label>Time Slot</label>
            <select id="book-time" required>
              <option value="09:00">09:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="14:00">02:00 PM</option>
              <option value="15:00">03:00 PM</option>
              <option value="16:00">04:00 PM</option>
            </select>
          </div>
          <div class="form-group">
            <label>Reason / Notes</label>
            <textarea id="book-notes" rows="2" placeholder="Describe symptoms or request general health checkup..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Submit Booking</button>
        </form>
      </div>`;
  },

  loadHospDoctors(hospId) {
    const select = document.getElementById('book-doc');
    if (!hospId) {
      select.innerHTML = '<option value="">Select hospital first...</option>';
      select.disabled = true;
      return;
    }
    const docs = HMS.Doctors.all().filter(d => d.hospitalId === hospId && d.status === 'active');
    select.innerHTML = docs.map(d => `<option value="${d.id}">${d.name} (${d.specialization})</option>`).join('') || '<option value="">No doctors available</option>';
    select.disabled = false;
  },

  handleBook(e) {
    e.preventDefault();
    const session = Auth.getSession();
    const data = {
      patientId: session.id,
      hospitalId: document.getElementById('book-hosp').value,
      doctorId: document.getElementById('book-doc').value,
      date: document.getElementById('book-date').value,
      time: document.getElementById('book-time').value,
      notes: document.getElementById('book-notes').value,
    };
    HMS.Appointments.add(data);
    Toast.success('Appointment booking request submitted successfully!');
    this.render('dashboard');
  },

  // ── Room details ──────────────────────────────────────────
  renderRoomDetails(el) {
    const session = Auth.getSession();
    const pat = HMS.Patients.get(session.id);
    const room = pat.roomId ? HMS.Rooms.get(pat.roomId) : null;
    const hosp = room ? HMS.Hospitals.get(room.hospitalId) : null;

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">My Admission & Room</h1><p class="page-subtitle">Your inpatient stay information</p></div>
      </div>
      <div class="card" style="max-width:600px">
        ${room ? `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
            <h2>Room ${room.number}</h2>
            ${statusBadge(room.status)}
          </div>
          <div class="info-grid" style="--cols:1">
            <div class="info-item"><label>Hospital</label><span>${hosp ? hosp.name : '—'}</span></div>
            <div class="info-item"><label>Room Type</label><span>${room.type}</span></div>
            <div class="info-item"><label>Floor</label><span>Floor ${room.floor}</span></div>
            <div class="info-item"><label>Admission Date</label><span>${Fmt.date(pat.admissionDate)}</span></div>
            <div class="info-item"><label>Charges Per Day</label><span>${Fmt.currency(room.pricePerDay)}</span></div>
          </div>
        ` : emptyState('🛏️', 'No Current Admission', 'You are currently registered as an outpatient.')}
      </div>`;
  },

  // ── Prescriptions ─────────────────────────────────────────
  renderPrescriptions(el) {
    const session = Auth.getSession();
    const prescriptions = HMS.Prescriptions.forPatient(session.id).reverse();

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">My Prescriptions</h1><p class="page-subtitle">Historical medication prescribed by doctors</p></div>
      </div>
      <div class="hospital-grid">
        ${prescriptions.length ? prescriptions.map(pr => {
          const d = HMS.Doctors.get(pr.doctorId);
          return `<div class="card">
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:0.5rem;margin-bottom:0.75rem">
              <strong>${d ? d.name : 'Doctor'}</strong>
              <span class="text-sm text-muted">${Fmt.date(pr.date)}</span>
            </div>
            <table class="data-table text-sm">
              <thead><tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th></tr></thead>
              <tbody>${pr.medicines.map(m => `<tr><td><strong>${m.name}</strong></td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.duration}</td></tr>`).join('')}</tbody>
            </table>
            ${pr.notes ? `<div style="margin-top:0.75rem;padding:0.5rem;background:rgba(255,255,255,0.02);border-radius:4px" class="text-sm text-muted"><strong>Advice:</strong> ${pr.notes}</div>` : ''}
          </div>`;
        }).join('') : emptyState('💊', 'No prescriptions record found')}
      </div>`;
  },

  // ── Lab Reports ───────────────────────────────────────────
  renderReports(el) {
    const session = Auth.getSession();
    const reports = HMS.Reports.forPatient(session.id).reverse();

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">My Lab Reports</h1><p class="page-subtitle">Medical diagnosis and test reports</p></div>
      </div>
      <div class="hospital-grid">
        ${reports.length ? reports.map(rp => {
          const d = HMS.Doctors.get(rp.doctorId);
          return `<div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
              <h3>${rp.type}</h3>
              ${statusBadge(rp.status)}
            </div>
            <div class="text-xs text-muted" style="margin-bottom:0.75rem">Prescribed by ${d ? d.name : 'Doctor'} · ${Fmt.date(rp.date)}</div>
            <div style="background:rgba(255,255,255,0.02);padding:0.75rem;border-radius:6px" class="text-sm">
              ${rp.findings}
            </div>
          </div>`;
        }).join('') : emptyState('🧪', 'No diagnostic reports uploaded yet')}
      </div>`;
  },

  // ── Billing ───────────────────────────────────────────────
  renderBilling(el) {
    const session = Auth.getSession();
    const bills = HMS.Bills.forPatient(session.id).reverse();
    const { items, total } = paginate(bills, this.currentPage.bills, 6);

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Invoices & Billing</h1><p class="page-subtitle">Payment histories and pending bills</p></div>
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Invoice ID</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${items.length ? items.map(b => `<tr>
            <td class="text-muted text-sm">${b.id}</td>
            <td>${Fmt.date(b.date)}</td>
            <td class="fw-600">${Fmt.currency(b.total)}</td>
            <td>${statusBadge(b.status)}</td>
            <td>
              <button class="btn btn-sm btn-ghost" onclick="AdminModule.viewBill('${b.id}')">View Details</button>
            </td>
          </tr>`).join('') : `<tr><td colspan="5">${emptyState('💰', 'No billing transactions found')}</td></tr>`}</tbody>
        </table>
        ${paginationHtml(this.currentPage.bills, total, 'PatientModule._billsPage')}
      </div>`;
  },

  _billsPage(n) { PatientModule.currentPage.bills = n; PatientModule.renderBilling(document.getElementById('main-content')); },

  // ── Profile ───────────────────────────────────────────────
  renderProfile(el) {
    const session = Auth.getSession();
    const p = HMS.Patients.get(session.id);

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Account Details</h1><p class="page-subtitle">Manage your personal profiles</p></div>
      </div>
      <div class="settings-grid">
        <div class="card">
          <div class="card-header"><h2 class="card-title">My Information</h2></div>
          <div class="info-grid">
            <div class="info-item"><label>Full Name</label><span>${p.name}</span></div>
            <div class="info-item"><label>Username</label><span>${p.username}</span></div>
            <div class="info-item"><label>Email Address</label><span>${p.email}</span></div>
            <div class="info-item"><label>Contact Number</label><span>${p.phone || '—'}</span></div>
            <div class="info-item"><label>Blood Group</label><span>${p.bloodGroup || '—'}</span></div>
            <div class="info-item"><label>Emergency Contact</label><span>${p.emergencyContact || '—'}</span></div>
            <div class="info-item"><label>Registered Address</label><span>${p.address || '—'}</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h2 class="card-title">Update Details</h2></div>
          <form class="modal-form" onsubmit="PatientModule.updateProfile(event)">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="pat-email" value="${p.email}" required>
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="tel" id="pat-phone" value="${p.phone || ''}" required>
            </div>
            <div class="form-group">
              <label>Emergency Contact</label>
              <input type="tel" id="pat-emergency" value="${p.emergencyContact || ''}">
            </div>
            <button type="submit" class="btn btn-primary">Update Profile</button>
          </form>
        </div>
      </div>`;
  },

  updateProfile(e) {
    e.preventDefault();
    const session = Auth.getSession();
    const email = document.getElementById('pat-email').value;
    const phone = document.getElementById('pat-phone').value;
    const emergencyContact = document.getElementById('pat-emergency').value;

    HMS.Patients.update(session.id, { email, phone, emergencyContact });
    Auth.refreshSession();
    Toast.success('Contact info updated successfully!');
    this.render('profile');
  },
};

window.PatientModule = PatientModule;

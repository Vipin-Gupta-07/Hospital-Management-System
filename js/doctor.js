// ============================================================
// doctor.js — Doctor Portal Module
// ============================================================

const DoctorModule = {
  currentPage: { patients: 1, appointments: 1 },
  searchQ: { patients: '' },

  render(view = 'dashboard') {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = '';
    content.classList.remove('fade-in');
    void content.offsetWidth;
    content.classList.add('fade-in');

    switch (view) {
      case 'dashboard':    this.renderDashboard(content); break;
      case 'patients':     this.renderPatients(content); break;
      case 'appointments': this.renderAppointments(content); break;
      case 'prescriptions':this.renderPrescriptions(content); break;
      case 'reports':      this.renderReports(content); break;
      case 'profile':      this.renderProfile(content); break;
    }
  },

  // ── Dashboard ─────────────────────────────────────────────
  renderDashboard(el) {
    const session = Auth.getSession();
    if (!session) return;
    const docId = session.id;

    const myPatients = HMS.Patients.all().filter(p => p.assignedDoctorId === docId);
    const todayAppts = HMS.Appointments.forDoctor(docId).filter(a => a.date === Fmt.today());
    const pendingAppts = HMS.Appointments.forDoctor(docId).filter(a => a.status === 'pending');

    el.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Welcome, ${session.name}</h1>
          <p class="page-subtitle">${session.specialization} Department · ${Fmt.date(Fmt.today())}</p>
        </div>
      </div>

      <div class="stats-grid" style="--cols: 3">
        ${AdminModule._statCard('👤', 'My Patients', myPatients.length, 'Currently assigned', 'blue')}
        ${AdminModule._statCard('📅', "Today's Appointments", todayAppts.length, `${todayAppts.filter(a => a.status === 'pending').length} pending`, 'amber')}
        ${AdminModule._statCard('⏳', 'Pending Approvals', pendingAppts.length, 'Requires attention', 'purple')}
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Today's Schedule</h2>
            <button class="btn btn-sm btn-ghost" onclick="App.navigate('doctor','appointments')">View All</button>
          </div>
          ${this._scheduleTable(todayAppts)}
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Quick Actions</h2>
          </div>
          <div class="quick-actions">
            <button class="quick-action-btn" onclick="App.navigate('doctor','patients')">
              <span class="qa-icon">📋</span><span>Patient Records</span>
            </button>
            <button class="quick-action-btn" onclick="App.navigate('doctor','prescriptions')">
              <span class="qa-icon">✍️</span><span>Write Prescription</span>
            </button>
            <button class="quick-action-btn" onclick="App.navigate('doctor','reports')">
              <span class="qa-icon">🧪</span><span>Upload Lab Report</span>
            </button>
            <button class="quick-action-btn" onclick="App.navigate('doctor','appointments')">
              <span class="qa-icon">📅</span><span>Manage Schedule</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  _scheduleTable(appts) {
    if (!appts.length) return emptyState('📅', 'No appointments scheduled for today.');
    return `<table class="data-table">
      <thead><tr><th>Patient</th><th>Time</th><th>Status</th><th>Notes</th><th>Action</th></tr></thead>
      <tbody>${appts.map(a => {
        const p = HMS.Patients.get(a.patientId);
        return `<tr>
          <td><strong>${p ? p.name : 'Unknown'}</strong></td>
          <td>${a.time}</td>
          <td>${statusBadge(a.status)}</td>
          <td class="text-sm text-muted">${a.notes || '—'}</td>
          <td>
            ${a.status === 'confirmed' ? `<button class="btn btn-xs btn-primary" onclick="DoctorModule.completeAppointment('${a.id}')">Check-in</button>` : '—'}
          </td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  },

  // ── Patients ──────────────────────────────────────────────
  renderPatients(el) {
    const session = Auth.getSession();
    if (!session) return;
    const docId = session.id;

    const myPatients = HMS.Patients.all().filter(p => p.assignedDoctorId === docId);
    const q = this.searchQ.patients;
    const filtered = filterItems(myPatients, q, ['name', 'email', 'phone', 'bloodGroup']);
    const { items, total } = paginate(filtered, this.currentPage.patients);

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">My Patients</h1><p class="page-subtitle">${myPatients.length} patients under your care</p></div>
      </div>
      <div class="toolbar">
        <input type="text" class="search-input" placeholder="🔍 Search by name, blood group..." value="${q}"
          oninput="DoctorModule.searchQ.patients=this.value;DoctorModule.currentPage.patients=1;DoctorModule.renderPatients(document.getElementById('main-content'))">
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Patient</th><th>Age/Gender</th><th>Blood</th><th>Status</th><th>Room</th><th>Actions</th></tr></thead>
          <tbody>${items.length ? items.map(p => this._patientRow(p)).join('') : `<tr><td colspan="6">${emptyState('👤', 'No patients assigned to you')}</td></tr>`}</tbody>
        </table>
        ${paginationHtml(this.currentPage.patients, total, 'DoctorModule._patientsPage')}
      </div>`;
  },

  _patientRow(p) {
    const r = p.roomId ? HMS.Rooms.get(p.roomId) : null;
    return `<tr>
      <td><div class="name-cell"><div class="avatar-sm">${avatarInitials(p.name)}</div><div><div class="fw-600">${p.name}</div><div class="text-muted text-sm">${p.email}</div></div></div></td>
      <td>${p.age || '—'} / ${p.gender || '—'}</td>
      <td><span class="badge badge-info">${p.bloodGroup || '—'}</span></td>
      <td>${statusBadge(p.status)}</td>
      <td>${r ? `Room ${r.number}` : '<span class="text-muted">Outpatient</span>'}</td>
      <td class="actions-cell">
        <button class="btn btn-sm btn-ghost" onclick="DoctorModule.viewPatientRecord('${p.id}')">👁️ View Records</button>
      </td>
    </tr>`;
  },

  _patientsPage(n) { DoctorModule.currentPage.patients = n; DoctorModule.renderPatients(document.getElementById('main-content')); },

  viewPatientRecord(id) {
    const p = HMS.Patients.get(id);
    if (!p) return;
    const prescriptions = HMS.Prescriptions.forPatient(id);
    const reports = HMS.Reports.forPatient(id);

    Modal.show({
      title: `Medical Records — ${p.name}`,
      body: `
        <div class="profile-modal" style="max-height: 70vh; overflow-y: auto;">
          <div class="info-grid">
            <div class="info-item"><label>Age</label><span>${p.age}</span></div>
            <div class="info-item"><label>Gender</label><span>${p.gender}</span></div>
            <div class="info-item"><label>Blood Group</label><span>${p.bloodGroup || '—'}</span></div>
            <div class="info-item"><label>Status</label><span>${statusBadge(p.status)}</span></div>
          </div>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 1rem 0;">
          <h4>Prescriptions History</h4>
          ${prescriptions.length ? prescriptions.map(pr => `
            <div class="record-item card" style="background: rgba(255,255,255,0.02); padding: 0.75rem; margin-bottom: 0.5rem;">
              <div style="display:flex; justify-content:space-between"><strong>Date: ${Fmt.date(pr.date)}</strong></div>
              <ul style="margin: 0.5rem 0 0 1rem; padding: 0;">
                ${pr.medicines.map(m => `<li>${m.name} — ${m.dosage} (${m.frequency}, ${m.duration})</li>`).join('')}
              </ul>
              ${pr.notes ? `<p class="text-muted text-sm" style="margin-top:0.25rem">Note: ${pr.notes}</p>` : ''}
            </div>
          `).join('') : '<p class="text-muted text-sm">No prescriptions found.</p>'}
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 1rem 0;">
          <h4>Lab Reports</h4>
          ${reports.length ? reports.map(rp => `
            <div class="record-item card" style="background: rgba(255,255,255,0.02); padding: 0.75rem; margin-bottom: 0.5rem;">
              <div style="display:flex; justify-content:space-between"><strong>${rp.type} (${Fmt.date(rp.date)})</strong> ${statusBadge(rp.status)}</div>
              <p style="margin: 0.5rem 0 0 0;" class="text-sm">${rp.findings}</p>
            </div>
          `).join('') : '<p class="text-muted text-sm">No lab reports found.</p>'}
        </div>`,
      confirmText: 'Close',
      cancelText: '',
    });
  },

  // ── Appointments ──────────────────────────────────────────
  renderAppointments(el) {
    const session = Auth.getSession();
    if (!session) return;
    const docId = session.id;

    const all = HMS.Appointments.forDoctor(docId).sort((a, b) => b.date.localeCompare(a.date));
    const { items, total } = paginate(all, this.currentPage.appointments);

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Appointment Schedule</h1><p class="page-subtitle">Total ${all.length} bookings</p></div>
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>${items.map(a => {
            const p = HMS.Patients.get(a.patientId);
            return `<tr>
              <td><strong>${p ? p.name : 'Unknown'}</strong></td>
              <td>${Fmt.date(a.date)}</td>
              <td>${a.time}</td>
              <td>${statusBadge(a.status)}</td>
              <td class="text-sm text-muted">${a.notes || '—'}</td>
              <td class="actions-cell">
                ${a.status === 'pending' ? `
                  <button class="btn btn-sm btn-success" onclick="DoctorModule.updateAppt('${a.id}','confirmed')">Approve</button>
                  <button class="btn btn-sm btn-danger" onclick="DoctorModule.updateAppt('${a.id}','cancelled')">Decline</button>
                ` : ''}
                ${a.status === 'confirmed' ? `<button class="btn btn-sm btn-primary" onclick="DoctorModule.completeAppointment('${a.id}')">Complete</button>` : ''}
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>
        ${paginationHtml(this.currentPage.appointments, total, 'DoctorModule._apptsPage')}
      </div>`;
  },

  _apptsPage(n) { DoctorModule.currentPage.appointments = n; DoctorModule.renderAppointments(document.getElementById('main-content')); },

  updateAppt(id, status) {
    HMS.Appointments.update(id, { status });
    Toast.success(`Appointment ${status}!`);
    this.renderAppointments(document.getElementById('main-content'));
  },

  completeAppointment(id) {
    const appt = HMS.Appointments.get(id);
    if (!appt) return;
    
    // Auto populate prescription dialog
    Modal.form({
      title: 'Complete Visit & Add Prescription',
      fields: [
        { name: 'med1', label: 'Medicine 1 Name', required: true, placeholder: 'e.g. Paracetamol' },
        { name: 'dos1', label: 'Dosage 1', required: true, placeholder: 'e.g. 500mg' },
        { name: 'freq1', label: 'Frequency 1', required: true, placeholder: 'e.g. Twice daily' },
        { name: 'dur1', label: 'Duration 1', required: true, placeholder: 'e.g. 5 days' },
        { name: 'notes', label: 'Clinical Notes & Advice', type: 'textarea', placeholder: 'Advice to patient...' },
      ],
      onSubmit: (data) => {
        HMS.Appointments.update(id, { status: 'completed' });
        HMS.Prescriptions.add({
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          medicines: [{ name: data.med1, dosage: data.dos1, frequency: data.freq1, duration: data.dur1 }],
          notes: data.notes,
        });
        Toast.success('Appointment marked complete and prescription added!');
        this.render('dashboard');
      },
    });
  },

  // ── Prescriptions ─────────────────────────────────────────
  renderPrescriptions(el) {
    const session = Auth.getSession();
    if (!session) return;
    const docId = session.id;
    const myPatients = HMS.Patients.all().filter(p => p.assignedDoctorId === docId).map(p => ({ value: p.id, label: p.name }));

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">New Prescription</h1><p class="page-subtitle">Prescribe medicines to patients assigned to you</p></div>
      </div>
      <div class="card" style="max-width: 600px">
        <form class="modal-form" onsubmit="DoctorModule.savePrescription(event)">
          <div class="form-group">
            <label>Select Patient</label>
            <select id="pr-patient" required>
              <option value="">Choose patient...</option>
              ${myPatients.map(p => `<option value="${p.value}">${p.label}</option>`).join('')}
            </select>
          </div>
          <div id="medicine-rows">
            <div class="form-group-row" style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
              <input type="text" placeholder="Medicine" class="med-name" required style="flex:2">
              <input type="text" placeholder="Dosage" class="med-dose" required style="flex:1">
              <input type="text" placeholder="Freq" class="med-freq" required style="flex:1">
              <input type="text" placeholder="Duration" class="med-dur" required style="flex:1">
            </div>
          </div>
          <div class="form-group">
            <label>Clinical Notes</label>
            <textarea id="pr-notes" rows="3" placeholder="Rest advised, monitor temperature..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Save Prescription</button>
        </form>
      </div>`;
  },

  savePrescription(e) {
    e.preventDefault();
    const session = Auth.getSession();
    const pid = document.getElementById('pr-patient').value;
    const medNames = document.querySelectorAll('.med-name');
    const medDoses = document.querySelectorAll('.med-dose');
    const medFreqs = document.querySelectorAll('.med-freq');
    const medDurs = document.querySelectorAll('.med-dur');

    const medicines = [];
    medNames.forEach((el, i) => {
      medicines.push({
        name: el.value,
        dosage: medDoses[i].value,
        frequency: medFreqs[i].value,
        duration: medDurs[i].value,
      });
    });

    HMS.Prescriptions.add({
      patientId: pid,
      doctorId: session.id,
      medicines,
      notes: document.getElementById('pr-notes').value,
    });
    Toast.success('Prescription created!');
    this.render('patients');
  },

  // ── Reports ───────────────────────────────────────────────
  renderReports(el) {
    const session = Auth.getSession();
    if (!session) return;
    const docId = session.id;
    const myPatients = HMS.Patients.all().filter(p => p.assignedDoctorId === docId).map(p => ({ value: p.id, label: p.name }));

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Lab Reports</h1><p class="page-subtitle">Upload laboratory diagnostic reports</p></div>
      </div>
      <div class="card" style="max-width: 600px">
        <form class="modal-form" onsubmit="DoctorModule.saveReport(event)">
          <div class="form-group">
            <label>Patient</label>
            <select id="rp-patient" required>
              <option value="">Choose patient...</option>
              ${myPatients.map(p => `<option value="${p.value}">${p.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Report Type</label>
            <input type="text" id="rp-type" required placeholder="e.g. Blood Test, X-Ray, MRI">
          </div>
          <div class="form-group">
            <label>Findings & Details</label>
            <textarea id="rp-findings" rows="4" required placeholder="Findings details..."></textarea>
          </div>
          <div class="form-group">
            <label>Severity Status</label>
            <select id="rp-status" required>
              <option value="normal">Normal</option>
              <option value="review">Needs Review</option>
              <option value="abnormal">Abnormal / Critical</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Submit Report</button>
        </form>
      </div>`;
  },

  saveReport(e) {
    e.preventDefault();
    const session = Auth.getSession();
    const pid = document.getElementById('rp-patient').value;
    const type = document.getElementById('rp-type').value;
    const findings = document.getElementById('rp-findings').value;
    const status = document.getElementById('rp-status').value;

    HMS.Reports.add({
      patientId: pid,
      doctorId: session.id,
      type,
      findings,
      status,
    });
    Toast.success('Lab report added successfully!');
    this.render('patients');
  },

  // ── Profile ───────────────────────────────────────────────
  renderProfile(el) {
    const session = Auth.getSession();
    if (!session) return;
    const d = HMS.Doctors.get(session.id);

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">My Profile</h1><p class="page-subtitle">Personal and professional details</p></div>
      </div>
      <div class="settings-grid">
        <div class="card">
          <div class="card-header"><h2 class="card-title">Profile Information</h2></div>
          <div class="info-grid">
            <div class="info-item"><label>Name</label><span>${d.name}</span></div>
            <div class="info-item"><label>Username</label><span>${d.username}</span></div>
            <div class="info-item"><label>Email</label><span>${d.email}</span></div>
            <div class="info-item"><label>Phone</label><span>${d.phone || '—'}</span></div>
            <div class="info-item"><label>Specialization</label><span>${d.specialization}</span></div>
            <div class="info-item"><label>Experience</label><span>${d.experience || '—'}</span></div>
            <div class="info-item"><label>Consultation Fee</label><span>${Fmt.currency(d.fee)}</span></div>
            <div class="info-item"><label>Hospital</label><span>${HMS.Hospitals.get(d.hospitalId)?.name || '—'}</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h2 class="card-title">Update Contact Details</h2></div>
          <form class="modal-form" onsubmit="DoctorModule.updateProfile(event)">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="prof-email" value="${d.email}" required>
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" id="prof-phone" value="${d.phone || ''}" required>
            </div>
            <button type="submit" class="btn btn-primary">Save Profile</button>
          </form>
        </div>
      </div>`;
  },

  updateProfile(e) {
    e.preventDefault();
    const session = Auth.getSession();
    const email = document.getElementById('prof-email').value;
    const phone = document.getElementById('prof-phone').value;

    HMS.Doctors.update(session.id, { email, phone });
    Auth.refreshSession();
    Toast.success('Profile updated successfully!');
    this.render('profile');
  },
};

window.DoctorModule = DoctorModule;

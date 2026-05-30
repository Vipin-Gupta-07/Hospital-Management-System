// ============================================================
// admin.js — Admin Dashboard Module
// ============================================================

const AdminModule = {
  currentPage: { patients: 1, doctors: 1, rooms: 1, appointments: 1, bills: 1 },
  searchQ: { patients: '', doctors: '' },

  render(view = 'dashboard') {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = '';
    content.classList.remove('fade-in');
    void content.offsetWidth;
    content.classList.add('fade-in');

    switch (view) {
      case 'dashboard':    this.renderDashboard(content); break;
      case 'hospitals':    this.renderHospitals(content); break;
      case 'patients':     this.renderPatients(content); break;
      case 'doctors':      this.renderDoctors(content); break;
      case 'rooms':        this.renderRooms(content); break;
      case 'appointments': this.renderAppointments(content); break;
      case 'billing':      this.renderBilling(content); break;
      case 'settings':     this.renderSettings(content); break;
    }
  },

  // ── Dashboard ─────────────────────────────────────────────
  renderDashboard(el) {
    const s = HMS.Stats.overview();
    const appts = HMS.Appointments.all();
    const patients = HMS.Patients.all();
    const today = Fmt.today();

    el.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Welcome back, Administrator — ${Fmt.date(today)}</p>
        </div>
      </div>

      <div class="stats-grid">
        ${this._statCard('👤', 'Total Patients', s.totalPatients, `${s.admittedPatients} admitted`, 'blue')}
        ${this._statCard('🩺', 'Active Doctors', s.totalDoctors, 'Across all hospitals', 'purple')}
        ${this._statCard('🏥', 'Available Rooms', s.availableRooms, `${s.occupiedRooms} occupied`, 'green')}
        ${this._statCard('📅', "Today's Appointments", s.todayAppointments, `${s.pendingAppointments} pending`, 'amber')}
        ${this._statCard('💰', 'Revenue Collected', Fmt.currency(s.totalRevenue), `${Fmt.currency(s.pendingRevenue)} pending`, 'emerald')}
        ${this._statCard('🏨', 'Total Hospitals', HMS.Hospitals.all().length, 'Under management', 'pink')}
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Today's Appointments</h2>
            <button class="btn btn-sm btn-ghost" onclick="App.navigate('admin','appointments')">View All</button>
          </div>
          ${this._todayApptsTable(appts.filter(a => a.date === today))}
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Bed Occupancy</h2>
          </div>
          <canvas id="bed-chart" width="300" height="200"></canvas>
          <div class="chart-legend" id="bed-legend"></div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Recent Patients</h2>
            <button class="btn btn-sm btn-ghost" onclick="App.navigate('admin','patients')">View All</button>
          </div>
          ${this._recentPatientsTable(patients.slice(-5).reverse())}
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Quick Actions</h2>
          </div>
          <div class="quick-actions">
            <button class="quick-action-btn" onclick="App.navigate('admin','patients');setTimeout(()=>AdminModule.openAddPatient(),100)">
              <span class="qa-icon">👤</span><span>Add Patient</span>
            </button>
            <button class="quick-action-btn" onclick="App.navigate('admin','doctors');setTimeout(()=>AdminModule.openAddDoctor(),100)">
              <span class="qa-icon">🩺</span><span>Add Doctor</span>
            </button>
            <button class="quick-action-btn" onclick="App.navigate('admin','rooms')">
              <span class="qa-icon">🛏️</span><span>Manage Rooms</span>
            </button>
            <button class="quick-action-btn" onclick="App.navigate('admin','billing')">
              <span class="qa-icon">💰</span><span>View Bills</span>
            </button>
            <button class="quick-action-btn" onclick="App.navigate('admin','hospitals')">
              <span class="qa-icon">🏥</span><span>Hospitals</span>
            </button>
            <button class="quick-action-btn" onclick="App.navigate('admin','appointments')">
              <span class="qa-icon">📅</span><span>Appointments</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Draw bed occupancy donut chart
    setTimeout(() => {
      const rooms = HMS.Rooms.all();
      const avail = rooms.filter(r => r.status === 'available').length;
      const occup = rooms.filter(r => r.status === 'occupied').length;
      const maint = rooms.filter(r => r.status === 'maintenance').length;
      drawDonutChart('bed-chart',
        [{ label: 'Available', value: avail }, { label: 'Occupied', value: occup }, { label: 'Maintenance', value: maint }],
        ['#10b981', '#ef4444', '#f59e0b']
      );
      const legend = document.getElementById('bed-legend');
      if (legend) {
        legend.innerHTML = [
          { color: '#10b981', label: 'Available', val: avail },
          { color: '#ef4444', label: 'Occupied', val: occup },
          { color: '#f59e0b', label: 'Maintenance', val: maint },
        ].map(l => `<div class="legend-item"><span style="background:${l.color}"></span>${l.label}: <strong>${l.val}</strong></div>`).join('');
      }
    }, 50);
  },

  _statCard(icon, label, value, sub, color) {
    return `<div class="stat-card stat-${color}">
      <div class="stat-icon">${icon}</div>
      <div class="stat-info">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
        <div class="stat-sub">${sub}</div>
      </div>
    </div>`;
  },

  _todayApptsTable(appts) {
    if (!appts.length) return emptyState('📅', 'No appointments today');
    return `<table class="data-table">
      <thead><tr><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th></tr></thead>
      <tbody>${appts.map(a => {
        const p = HMS.Patients.get(a.patientId);
        const d = HMS.Doctors.get(a.doctorId);
        return `<tr>
          <td>${p ? p.name : '—'}</td>
          <td>${d ? d.name : '—'}</td>
          <td>${a.time}</td>
          <td>${statusBadge(a.status)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  },

  _recentPatientsTable(patients) {
    if (!patients.length) return emptyState('👤', 'No patients yet');
    return `<table class="data-table">
      <thead><tr><th>Name</th><th>Age</th><th>Status</th><th>Doctor</th></tr></thead>
      <tbody>${patients.map(p => {
        const d = p.assignedDoctorId ? HMS.Doctors.get(p.assignedDoctorId) : null;
        return `<tr>
          <td><div class="name-cell"><div class="avatar-sm">${avatarInitials(p.name)}</div>${p.name}</div></td>
          <td>${p.age || '—'}</td>
          <td>${statusBadge(p.status)}</td>
          <td>${d ? d.name : '<span class="text-muted">Unassigned</span>'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
  },

  // ── Hospitals ─────────────────────────────────────────────
  renderHospitals(el) {
    const hospitals = HMS.Hospitals.all();
    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Hospitals</h1><p class="page-subtitle">${hospitals.length} hospitals under management</p></div>
        <button class="btn btn-primary" onclick="AdminModule.openAddHospital()">+ Add Hospital</button>
      </div>
      <div class="hospital-grid">
        ${hospitals.map(h => this._hospitalCard(h)).join('')}
      </div>`;
  },

  _hospitalCard(h) {
    const rooms = HMS.Rooms.all().filter(r => r.hospitalId === h.id);
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const doctors = HMS.Doctors.all().filter(d => d.hospitalId === h.id);
    return `<div class="hospital-card card">
      <div class="hospital-header">
        <div class="hospital-icon">🏥</div>
        <div class="hospital-actions">
          <button class="btn-icon" onclick="AdminModule.openEditHospital('${h.id}')" title="Edit">✏️</button>
          <button class="btn-icon" onclick="AdminModule.deleteHospital('${h.id}')" title="Delete">🗑️</button>
        </div>
      </div>
      <h3>${h.name}</h3>
      <p class="hospital-address">📍 ${h.address}</p>
      <p class="hospital-phone">📞 ${h.phone}</p>
      <div class="hospital-stats">
        <div class="hs-item"><span>${rooms.length}</span><label>Rooms</label></div>
        <div class="hs-item"><span>${occupied}</span><label>Occupied</label></div>
        <div class="hs-item"><span>${doctors.length}</span><label>Doctors</label></div>
      </div>
      <div class="specializations">
        ${(h.specializations || []).map(s => `<span class="tag">${s}</span>`).join('')}
      </div>
    </div>`;
  },

  openAddHospital() {
    Modal.form({
      title: 'Add Hospital',
      fields: [
        { name: 'name', label: 'Hospital Name', required: true, placeholder: 'e.g. City General Hospital' },
        { name: 'address', label: 'Address', required: true, placeholder: 'Full address' },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '011-XXXXXXXX' },
        { name: 'beds', label: 'Total Beds', type: 'number', required: true, placeholder: '100', min: '1' },
        { name: 'specializations', label: 'Specializations (comma-separated)', placeholder: 'Cardiology, Neurology' },
      ],
      onSubmit: (data) => {
        data.specializations = data.specializations ? data.specializations.split(',').map(s => s.trim()).filter(Boolean) : [];
        HMS.Hospitals.add(data);
        Toast.success('Hospital added successfully!');
        this.render('hospitals');
      },
    });
  },

  openEditHospital(id) {
    const h = HMS.Hospitals.get(id);
    if (!h) return;
    Modal.form({
      title: 'Edit Hospital',
      fields: [
        { name: 'name', label: 'Hospital Name', required: true, value: h.name },
        { name: 'address', label: 'Address', required: true, value: h.address },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, value: h.phone },
        { name: 'beds', label: 'Total Beds', type: 'number', required: true, value: h.beds, min: '1' },
        { name: 'specializations', label: 'Specializations (comma-separated)', value: (h.specializations || []).join(', ') },
      ],
      onSubmit: (data) => {
        data.specializations = data.specializations ? data.specializations.split(',').map(s => s.trim()).filter(Boolean) : [];
        HMS.Hospitals.update(id, data);
        Toast.success('Hospital updated!');
        this.render('hospitals');
      },
    });
  },

  deleteHospital(id) {
    const h = HMS.Hospitals.get(id);
    confirmDelete(h.name, () => {
      HMS.Hospitals.delete(id);
      Toast.success('Hospital deleted.');
      this.render('hospitals');
    });
  },

  // ── Patients ──────────────────────────────────────────────
  renderPatients(el) {
    const allPatients = HMS.Patients.all();
    const q = this.searchQ.patients;
    const filtered = filterItems(allPatients, q, ['name', 'email', 'phone', 'username', 'bloodGroup']);
    const { items, total } = paginate(filtered, this.currentPage.patients);

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Patients</h1><p class="page-subtitle">${allPatients.length} total patients</p></div>
        <button class="btn btn-primary" onclick="AdminModule.openAddPatient()">+ Add Patient</button>
      </div>
      <div class="toolbar">
        <input type="text" class="search-input" placeholder="🔍 Search patients..." value="${q}"
          oninput="AdminModule.searchQ.patients=this.value;AdminModule.currentPage.patients=1;AdminModule.renderPatients(document.getElementById('main-content'))">
        <select class="filter-select" onchange="AdminModule._filterPatients(this.value)">
          <option value="">All Status</option>
          <option value="admitted">Admitted</option>
          <option value="outpatient">Outpatient</option>
        </select>
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Patient</th><th>Age/Gender</th><th>Blood</th><th>Status</th><th>Doctor</th><th>Room</th><th>Actions</th></tr></thead>
          <tbody>${items.length ? items.map(p => this._patientRow(p)).join('') : `<tr><td colspan="7">${emptyState('👤', 'No patients found')}</td></tr>`}</tbody>
        </table>
        ${paginationHtml(this.currentPage.patients, total, 'AdminModule._patientsPage')}
      </div>`;
  },

  _patientRow(p) {
    const d = p.assignedDoctorId ? HMS.Doctors.get(p.assignedDoctorId) : null;
    const r = p.roomId ? HMS.Rooms.get(p.roomId) : null;
    return `<tr>
      <td><div class="name-cell"><div class="avatar-sm">${avatarInitials(p.name)}</div><div><div class="fw-600">${p.name}</div><div class="text-muted text-sm">${p.username}</div></div></div></td>
      <td>${p.age || '—'} / ${p.gender || '—'}</td>
      <td><span class="badge badge-info">${p.bloodGroup || '—'}</span></td>
      <td>${statusBadge(p.status)}</td>
      <td>${d ? `<span class="text-sm">${d.name}</span>` : '<span class="text-muted">—</span>'}</td>
      <td>${r ? `Room ${r.number}` : '<span class="text-muted">—</span>'}</td>
      <td class="actions-cell">
        <button class="btn-icon" title="View" onclick="AdminModule.viewPatient('${p.id}')">👁️</button>
        <button class="btn-icon" title="Edit" onclick="AdminModule.openEditPatient('${p.id}')">✏️</button>
        <button class="btn-icon" title="Delete" onclick="AdminModule.deletePatient('${p.id}')">🗑️</button>
      </td>
    </tr>`;
  },

  _patientsPage(n) { AdminModule.currentPage.patients = n; AdminModule.renderPatients(document.getElementById('main-content')); },
  _filterPatients(status) {
    // simple filter via search
    AdminModule.searchQ.patients = status;
    AdminModule.currentPage.patients = 1;
    AdminModule.renderPatients(document.getElementById('main-content'));
  },

  viewPatient(id) {
    const p = HMS.Patients.get(id);
    if (!p) return;
    const d = p.assignedDoctorId ? HMS.Doctors.get(p.assignedDoctorId) : null;
    const r = p.roomId ? HMS.Rooms.get(p.roomId) : null;
    const prescriptions = HMS.Prescriptions.forPatient(id);
    const reports = HMS.Reports.forPatient(id);
    const bills = HMS.Bills.forPatient(id);

    Modal.show({
      title: `Patient Profile — ${p.name}`,
      body: `
        <div class="profile-modal">
          <div class="profile-header">
            <div class="avatar-lg">${avatarInitials(p.name)}</div>
            <div>
              <h3>${p.name}</h3>
              <p class="text-muted">${p.username} · ${p.email}</p>
              ${statusBadge(p.status)}
            </div>
          </div>
          <div class="info-grid">
            <div class="info-item"><label>Age</label><span>${p.age || '—'}</span></div>
            <div class="info-item"><label>Gender</label><span>${p.gender || '—'}</span></div>
            <div class="info-item"><label>Blood Group</label><span>${p.bloodGroup || '—'}</span></div>
            <div class="info-item"><label>Phone</label><span>${p.phone || '—'}</span></div>
            <div class="info-item"><label>Address</label><span>${p.address || '—'}</span></div>
            <div class="info-item"><label>Emergency</label><span>${p.emergencyContact || '—'}</span></div>
            <div class="info-item"><label>Assigned Doctor</label><span>${d ? d.name : 'Unassigned'}</span></div>
            <div class="info-item"><label>Room</label><span>${r ? `Room ${r.number} (${r.type})` : 'Not assigned'}</span></div>
            <div class="info-item"><label>Admission Date</label><span>${Fmt.date(p.admissionDate)}</span></div>
            <div class="info-item"><label>Hospital</label><span>${HMS.Hospitals.get(p.hospitalId)?.name || '—'}</span></div>
          </div>
          <div class="profile-summary">
            <span>📋 ${prescriptions.length} Prescriptions</span>
            <span>🧪 ${reports.length} Reports</span>
            <span>💰 ${bills.length} Bills</span>
          </div>
        </div>`,
      confirmText: 'Close',
      cancelText: '',
    });
  },

  openAddPatient() {
    const doctors = HMS.Doctors.all().map(d => ({ value: d.id, label: d.name + ' (' + d.specialization + ')' }));
    const hospitals = HMS.Hospitals.all().map(h => ({ value: h.id, label: h.name }));
    const rooms = HMS.Rooms.available().map(r => ({ value: r.id, label: `Room ${r.number} — ${r.type} (₹${r.pricePerDay}/day)` }));

    Modal.form({
      title: 'Add New Patient',
      fields: [
        { name: 'name', label: 'Full Name', required: true, placeholder: 'e.g. Rajesh Kumar' },
        { name: 'username', label: 'Username', required: true, placeholder: 'e.g. rajesh.kumar' },
        { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Min 6 characters' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'patient@email.com' },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '9XXXXXXXXX' },
        { name: 'age', label: 'Age', type: 'number', required: true, placeholder: '25', min: '0', max: '150' },
        { name: 'gender', label: 'Gender', type: 'select', required: true, placeholder: 'Select gender', options: [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }] },
        { name: 'bloodGroup', label: 'Blood Group', type: 'select', placeholder: 'Select blood group', options: ['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => ({ value: b, label: b })) },
        { name: 'address', label: 'Address', type: 'textarea', placeholder: 'Full address' },
        { name: 'emergencyContact', label: 'Emergency Contact', type: 'tel', placeholder: '9XXXXXXXXX' },
        { name: 'hospitalId', label: 'Hospital', type: 'select', required: true, placeholder: 'Select hospital', options: hospitals },
        { name: 'assignedDoctorId', label: 'Assign Doctor', type: 'select', placeholder: 'Select doctor (optional)', options: doctors },
        { name: 'roomId', label: 'Assign Room', type: 'select', placeholder: 'Select room (optional)', options: rooms },
        { name: 'status', label: 'Status', type: 'select', required: true, value: 'outpatient', options: [{ value: 'outpatient', label: 'Outpatient' }, { value: 'admitted', label: 'Admitted' }] },
      ],
      onSubmit: (data) => {
        // Check username uniqueness
        if (HMS.Patients.getByUsername(data.username)) {
          Toast.error('Username already exists!'); return;
        }
        if (data.status === 'admitted') data.admissionDate = Fmt.today();
        const patient = HMS.Patients.add(data);
        if (data.roomId) {
          HMS.Rooms.update(data.roomId, { status: 'occupied', patientId: patient.id });
        }
        Toast.success(`Patient "${data.name}" added successfully!`);
        this.render('patients');
      },
    });
  },

  openEditPatient(id) {
    const p = HMS.Patients.get(id);
    if (!p) return;
    const doctors = HMS.Doctors.all().map(d => ({ value: d.id, label: d.name + ' (' + d.specialization + ')' }));
    const allRooms = HMS.Rooms.all().filter(r => r.status === 'available' || r.patientId === id);
    const rooms = allRooms.map(r => ({ value: r.id, label: `Room ${r.number} — ${r.type}` }));

    Modal.form({
      title: 'Edit Patient',
      fields: [
        { name: 'name', label: 'Full Name', required: true, value: p.name },
        { name: 'email', label: 'Email', type: 'email', required: true, value: p.email },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, value: p.phone },
        { name: 'age', label: 'Age', type: 'number', required: true, value: p.age, min: '0' },
        { name: 'gender', label: 'Gender', type: 'select', required: true, value: p.gender, options: [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }] },
        { name: 'bloodGroup', label: 'Blood Group', type: 'select', value: p.bloodGroup, options: ['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => ({ value: b, label: b })) },
        { name: 'address', label: 'Address', type: 'textarea', value: p.address },
        { name: 'emergencyContact', label: 'Emergency Contact', type: 'tel', value: p.emergencyContact },
        { name: 'assignedDoctorId', label: 'Assign Doctor', type: 'select', value: p.assignedDoctorId, placeholder: 'Unassigned', options: doctors },
        { name: 'roomId', label: 'Room', type: 'select', value: p.roomId, placeholder: 'No room', options: rooms },
        { name: 'status', label: 'Status', type: 'select', required: true, value: p.status, options: [{ value: 'outpatient', label: 'Outpatient' }, { value: 'admitted', label: 'Admitted' }] },
      ],
      onSubmit: (data) => {
        // Handle room changes
        if (p.roomId && p.roomId !== data.roomId) {
          HMS.Rooms.update(p.roomId, { status: 'available', patientId: null });
        }
        if (data.roomId && data.roomId !== p.roomId) {
          HMS.Rooms.update(data.roomId, { status: 'occupied', patientId: id });
        }
        if (data.status === 'admitted' && !p.admissionDate) data.admissionDate = Fmt.today();
        HMS.Patients.update(id, data);
        Toast.success('Patient updated!');
        this.render('patients');
      },
    });
  },

  deletePatient(id) {
    const p = HMS.Patients.get(id);
    confirmDelete(p.name, () => {
      HMS.Patients.delete(id);
      Toast.success('Patient deleted.');
      this.render('patients');
    });
  },

  // ── Doctors ───────────────────────────────────────────────
  renderDoctors(el) {
    const allDoctors = HMS.Doctors.all();
    const q = this.searchQ.doctors;
    const filtered = filterItems(allDoctors, q, ['name', 'username', 'email', 'specialization']);
    const { items, total } = paginate(filtered, this.currentPage.doctors);

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Doctors</h1><p class="page-subtitle">${allDoctors.length} registered doctors</p></div>
        <button class="btn btn-primary" onclick="AdminModule.openAddDoctor()">+ Add Doctor</button>
      </div>
      <div class="toolbar">
        <input type="text" class="search-input" placeholder="🔍 Search doctors..." value="${q}"
          oninput="AdminModule.searchQ.doctors=this.value;AdminModule.currentPage.doctors=1;AdminModule.renderDoctors(document.getElementById('main-content'))">
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Doctor</th><th>Specialization</th><th>Hospital</th><th>Experience</th><th>Fee</th><th>Patients</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${items.length ? items.map(d => this._doctorRow(d)).join('') : `<tr><td colspan="8">${emptyState('🩺', 'No doctors found')}</td></tr>`}</tbody>
        </table>
        ${paginationHtml(this.currentPage.doctors, total, 'AdminModule._doctorsPage')}
      </div>`;
  },

  _doctorRow(d) {
    const h = HMS.Hospitals.get(d.hospitalId);
    const patientCount = HMS.Patients.all().filter(p => p.assignedDoctorId === d.id).length;
    return `<tr>
      <td><div class="name-cell"><div class="avatar-sm avatar-purple">${avatarInitials(d.name)}</div><div><div class="fw-600">${d.name}</div><div class="text-muted text-sm">${d.username}</div></div></div></td>
      <td><span class="tag">${d.specialization}</span></td>
      <td>${h ? h.name : '—'}</td>
      <td>${d.experience || '—'}</td>
      <td>${Fmt.currency(d.fee)}</td>
      <td><span class="badge badge-info">${patientCount}</span></td>
      <td>${statusBadge(d.status || 'active')}</td>
      <td class="actions-cell">
        <button class="btn-icon" title="Edit" onclick="AdminModule.openEditDoctor('${d.id}')">✏️</button>
        <button class="btn-icon" title="Delete" onclick="AdminModule.deleteDoctor('${d.id}')">🗑️</button>
      </td>
    </tr>`;
  },

  _doctorsPage(n) { AdminModule.currentPage.doctors = n; AdminModule.renderDoctors(document.getElementById('main-content')); },

  openAddDoctor() {
    const hospitals = HMS.Hospitals.all().map(h => ({ value: h.id, label: h.name }));
    Modal.form({
      title: 'Add New Doctor',
      fields: [
        { name: 'name', label: 'Full Name', required: true, placeholder: 'Dr. Firstname Lastname' },
        { name: 'username', label: 'Username', required: true, placeholder: 'e.g. dr.sharma' },
        { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Min 6 characters' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'doctor@hospital.com' },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '9XXXXXXXXX' },
        { name: 'specialization', label: 'Specialization', required: true, placeholder: 'e.g. Cardiology' },
        { name: 'experience', label: 'Experience', placeholder: 'e.g. 10 years' },
        { name: 'fee', label: 'Consultation Fee (₹)', type: 'number', placeholder: '500', min: '0' },
        { name: 'hospitalId', label: 'Hospital', type: 'select', required: true, placeholder: 'Select hospital', options: hospitals },
        { name: 'joinDate', label: 'Joining Date', type: 'date', value: Fmt.today() },
      ],
      onSubmit: (data) => {
        if (HMS.Doctors.getByUsername(data.username)) { Toast.error('Username already exists!'); return; }
        HMS.Doctors.add(data);
        Toast.success(`Dr. ${data.name} added successfully!`);
        this.render('doctors');
      },
    });
  },

  openEditDoctor(id) {
    const d = HMS.Doctors.get(id);
    if (!d) return;
    const hospitals = HMS.Hospitals.all().map(h => ({ value: h.id, label: h.name }));
    Modal.form({
      title: 'Edit Doctor',
      fields: [
        { name: 'name', label: 'Full Name', required: true, value: d.name },
        { name: 'email', label: 'Email', type: 'email', required: true, value: d.email },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, value: d.phone },
        { name: 'specialization', label: 'Specialization', required: true, value: d.specialization },
        { name: 'experience', label: 'Experience', value: d.experience },
        { name: 'fee', label: 'Consultation Fee (₹)', type: 'number', value: d.fee, min: '0' },
        { name: 'hospitalId', label: 'Hospital', type: 'select', required: true, value: d.hospitalId, options: hospitals },
        { name: 'status', label: 'Status', type: 'select', required: true, value: d.status || 'active', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
      ],
      onSubmit: (data) => {
        HMS.Doctors.update(id, data);
        Toast.success('Doctor updated!');
        this.render('doctors');
      },
    });
  },

  deleteDoctor(id) {
    const d = HMS.Doctors.get(id);
    confirmDelete(d.name, () => {
      HMS.Doctors.delete(id);
      Toast.success('Doctor deleted.');
      this.render('doctors');
    });
  },

  // ── Rooms ─────────────────────────────────────────────────
  renderRooms(el) {
    const rooms = HMS.Rooms.all();
    const hospitals = HMS.Hospitals.all();

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Room & Bed Management</h1>
          <p class="page-subtitle">${rooms.filter(r => r.status === 'available').length} of ${rooms.length} rooms available</p>
        </div>
        <button class="btn btn-primary" onclick="AdminModule.openAddRoom()">+ Add Room</button>
      </div>

      ${hospitals.map(h => {
        const hRooms = rooms.filter(r => r.hospitalId === h.id);
        if (!hRooms.length) return '';
        return `<div class="card" style="margin-bottom:1.5rem">
          <div class="card-header"><h2 class="card-title">🏥 ${h.name}</h2>
            <span class="text-muted text-sm">${hRooms.filter(r => r.status === 'available').length} available / ${hRooms.length} total</span>
          </div>
          <div class="room-grid">
            ${hRooms.map(r => this._roomCard(r)).join('')}
          </div>
        </div>`;
      }).join('')}`;
  },

  _roomCard(r) {
    const p = r.patientId ? HMS.Patients.get(r.patientId) : null;
    const typeColors = { General: 'blue', 'Semi-Private': 'purple', Private: 'amber', ICU: 'red' };
    const color = typeColors[r.type] || 'blue';
    return `<div class="room-card room-${r.status}" onclick="AdminModule.viewRoom('${r.id}')">
      <div class="room-number">Room ${r.number}</div>
      <div class="room-type tag tag-${color}">${r.type}</div>
      <div class="room-floor">Floor ${r.floor}</div>
      ${statusBadge(r.status)}
      ${p ? `<div class="room-patient text-sm">${p.name}</div>` : ''}
      <div class="room-price text-sm text-muted">${Fmt.currency(r.pricePerDay)}/day</div>
    </div>`;
  },

  viewRoom(id) {
    const r = HMS.Rooms.get(id);
    if (!r) return;
    const p = r.patientId ? HMS.Patients.get(r.patientId) : null;

    Modal.show({
      title: `Room ${r.number} Details`,
      body: `<div class="info-grid">
        <div class="info-item"><label>Room Number</label><span>${r.number}</span></div>
        <div class="info-item"><label>Type</label><span>${r.type}</span></div>
        <div class="info-item"><label>Floor</label><span>${r.floor}</span></div>
        <div class="info-item"><label>Status</label><span>${statusBadge(r.status)}</span></div>
        <div class="info-item"><label>Price/Day</label><span>${Fmt.currency(r.pricePerDay)}</span></div>
        <div class="info-item"><label>Patient</label><span>${p ? p.name : 'Vacant'}</span></div>
      </div>
      <div style="display:flex;gap:.5rem;margin-top:1rem;flex-wrap:wrap">
        ${r.status !== 'available' ? `<button class="btn btn-sm btn-success" onclick="Modal.hide();AdminModule.freeRoom('${id}')">Mark Available</button>` : ''}
        ${r.status !== 'maintenance' ? `<button class="btn btn-sm btn-warning" onclick="Modal.hide();AdminModule.maintenanceRoom('${id}')">Maintenance</button>` : ''}
        <button class="btn btn-sm btn-danger" onclick="Modal.hide();AdminModule.deleteRoom('${id}')">Delete Room</button>
      </div>`,
      confirmText: 'Close',
      cancelText: '',
    });
  },

  freeRoom(id) {
    const r = HMS.Rooms.get(id);
    if (r.patientId) {
      HMS.Patients.update(r.patientId, { roomId: null, status: 'outpatient' });
    }
    HMS.Rooms.update(id, { status: 'available', patientId: null });
    Toast.success('Room marked as available.');
    this.render('rooms');
  },

  maintenanceRoom(id) {
    HMS.Rooms.update(id, { status: 'maintenance' });
    Toast.warning('Room marked for maintenance.');
    this.render('rooms');
  },

  openAddRoom() {
    const hospitals = HMS.Hospitals.all().map(h => ({ value: h.id, label: h.name }));
    Modal.form({
      title: 'Add Room',
      fields: [
        { name: 'number', label: 'Room Number', required: true, placeholder: 'e.g. 201' },
        { name: 'type', label: 'Room Type', type: 'select', required: true, placeholder: 'Select type', options: ['General', 'Semi-Private', 'Private', 'ICU'].map(t => ({ value: t, label: t })) },
        { name: 'floor', label: 'Floor', type: 'number', required: true, placeholder: '1', min: '0' },
        { name: 'pricePerDay', label: 'Price per Day (₹)', type: 'number', required: true, placeholder: '1500', min: '0' },
        { name: 'hospitalId', label: 'Hospital', type: 'select', required: true, placeholder: 'Select hospital', options: hospitals },
      ],
      onSubmit: (data) => {
        HMS.Rooms.add(data);
        Toast.success('Room added!');
        this.render('rooms');
      },
    });
  },

  deleteRoom(id) {
    const r = HMS.Rooms.get(id);
    confirmDelete(`Room ${r.number}`, () => {
      HMS.Rooms.delete(id);
      Toast.success('Room deleted.');
      this.render('rooms');
    });
  },

  // ── Appointments ──────────────────────────────────────────
  renderAppointments(el) {
    const all = HMS.Appointments.all().sort((a, b) => b.date.localeCompare(a.date));
    const { items, total } = paginate(all, this.currentPage.appointments);

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Appointments</h1><p class="page-subtitle">${all.length} total appointments</p></div>
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>${items.map(a => {
            const p = HMS.Patients.get(a.patientId);
            const d = HMS.Doctors.get(a.doctorId);
            return `<tr>
              <td>${p ? p.name : '—'}</td>
              <td>${d ? d.name : '—'}</td>
              <td>${Fmt.date(a.date)}</td>
              <td>${a.time}</td>
              <td>${statusBadge(a.status)}</td>
              <td class="text-sm text-muted">${a.notes || '—'}</td>
              <td class="actions-cell">
                ${a.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="AdminModule.updateAppt('${a.id}','confirmed')">Confirm</button>` : ''}
                ${a.status !== 'cancelled' && a.status !== 'completed' ? `<button class="btn btn-sm btn-danger" onclick="AdminModule.updateAppt('${a.id}','cancelled')">Cancel</button>` : ''}
                ${a.status === 'confirmed' ? `<button class="btn btn-sm btn-ghost" onclick="AdminModule.updateAppt('${a.id}','completed')">Complete</button>` : ''}
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>
        ${paginationHtml(this.currentPage.appointments, total, 'AdminModule._apptsPage')}
      </div>`;
  },

  _apptsPage(n) { AdminModule.currentPage.appointments = n; AdminModule.renderAppointments(document.getElementById('main-content')); },

  updateAppt(id, status) {
    HMS.Appointments.update(id, { status });
    Toast.success(`Appointment ${status}!`);
    this.renderAppointments(document.getElementById('main-content'));
  },

  // ── Billing ───────────────────────────────────────────────
  renderBilling(el) {
    const all = HMS.Bills.all().sort((a, b) => b.date.localeCompare(a.date));
    const { items, total } = paginate(all, this.currentPage.bills);
    const totalRevenue = all.filter(b => b.status === 'paid').reduce((s, b) => s + b.total, 0);
    const pending = all.filter(b => b.status === 'pending').reduce((s, b) => s + b.total, 0);

    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Billing & Revenue</h1><p class="page-subtitle">${all.length} total bills</p></div>
        <button class="btn btn-primary" onclick="AdminModule.openAddBill()">+ Generate Bill</button>
      </div>
      <div class="stats-grid" style="--cols:3">
        ${this._statCard('💰', 'Total Collected', Fmt.currency(totalRevenue), `${all.filter(b => b.status === 'paid').length} bills paid`, 'green')}
        ${this._statCard('⏳', 'Pending Amount', Fmt.currency(pending), `${all.filter(b => b.status !== 'paid').length} unpaid bills`, 'amber')}
        ${this._statCard('📊', 'Total Bills', all.length, 'All time', 'blue')}
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Bill ID</th><th>Patient</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${items.map(b => {
            const p = HMS.Patients.get(b.patientId);
            return `<tr>
              <td class="text-muted text-sm">${b.id}</td>
              <td>${p ? p.name : '—'}</td>
              <td>${Fmt.date(b.date)}</td>
              <td class="fw-600">${Fmt.currency(b.total)}</td>
              <td>${statusBadge(b.status)}</td>
              <td class="actions-cell">
                <button class="btn-icon" title="View" onclick="AdminModule.viewBill('${b.id}')">👁️</button>
                ${b.status !== 'paid' ? `<button class="btn btn-sm btn-success" onclick="AdminModule.markBillPaid('${b.id}')">Mark Paid</button>` : ''}
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>
        ${paginationHtml(this.currentPage.bills, total, 'AdminModule._billsPage')}
      </div>`;
  },

  _billsPage(n) { AdminModule.currentPage.bills = n; AdminModule.renderBilling(document.getElementById('main-content')); },

  viewBill(id) {
    const b = HMS.Bills.get ? HMS.Bills.all().find(x => x.id === id) : null;
    if (!b) return;
    const p = HMS.Patients.get(b.patientId);
    const h = HMS.Hospitals.get(b.hospitalId);
    Modal.show({
      title: `Invoice — ${b.id}`,
      body: `<div class="invoice">
        <div class="invoice-header">
          <div><strong>${h ? h.name : 'Hospital'}</strong></div>
          <div class="text-muted text-sm">Date: ${Fmt.date(b.date)}</div>
        </div>
        <div class="invoice-patient">Patient: <strong>${p ? p.name : '—'}</strong></div>
        <table class="data-table" style="margin:1rem 0">
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>${b.items.map(item => `<tr><td>${item.description}</td><td>${Fmt.currency(item.amount)}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td><strong>Total</strong></td><td><strong>${Fmt.currency(b.total)}</strong></td></tr></tfoot>
        </table>
        <div>Status: ${statusBadge(b.status)} ${b.paidDate ? '· Paid on ' + Fmt.date(b.paidDate) : ''}</div>
      </div>`,
      confirmText: 'Close',
      cancelText: '',
    });
  },

  markBillPaid(id) {
    HMS.Bills.update(id, { status: 'paid', paidDate: Fmt.today() });
    Toast.success('Bill marked as paid!');
    this.renderBilling(document.getElementById('main-content'));
  },

  openAddBill() {
    const patients = HMS.Patients.all().map(p => ({ value: p.id, label: p.name }));
    Modal.form({
      title: 'Generate Bill',
      fields: [
        { name: 'patientId', label: 'Patient', type: 'select', required: true, placeholder: 'Select patient', options: patients },
        { name: 'description1', label: 'Item 1 Description', required: true, placeholder: 'e.g. Consultation Fee' },
        { name: 'amount1', label: 'Item 1 Amount (₹)', type: 'number', required: true, placeholder: '500', min: '0' },
        { name: 'description2', label: 'Item 2 Description', placeholder: 'e.g. Room Charges' },
        { name: 'amount2', label: 'Item 2 Amount (₹)', type: 'number', placeholder: '0', min: '0' },
        { name: 'description3', label: 'Item 3 Description', placeholder: 'e.g. Lab Tests' },
        { name: 'amount3', label: 'Item 3 Amount (₹)', type: 'number', placeholder: '0', min: '0' },
      ],
      onSubmit: (data) => {
        const items = [];
        if (data.description1 && data.amount1) items.push({ description: data.description1, amount: +data.amount1 });
        if (data.description2 && data.amount2) items.push({ description: data.description2, amount: +data.amount2 });
        if (data.description3 && data.amount3) items.push({ description: data.description3, amount: +data.amount3 });
        const total = items.reduce((s, i) => s + i.amount, 0);
        const patient = HMS.Patients.get(data.patientId);
        HMS.Bills.add({ patientId: data.patientId, hospitalId: patient?.hospitalId, items, total });
        Toast.success('Bill generated!');
        this.renderBilling(document.getElementById('main-content'));
      },
    });
  },

  // ── Settings ──────────────────────────────────────────────
  renderSettings(el) {
    const admin = HMS.Admin.get();
    el.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Settings</h1><p class="page-subtitle">System configuration</p></div>
      </div>
      <div class="settings-grid">
        <div class="card">
          <div class="card-header"><h2 class="card-title">👤 Admin Profile</h2></div>
          <div class="info-grid">
            <div class="info-item"><label>Name</label><span>${admin.name}</span></div>
            <div class="info-item"><label>Username</label><span>${admin.username}</span></div>
            <div class="info-item"><label>Email</label><span>${admin.email}</span></div>
            <div class="info-item"><label>Role</label><span>Administrator</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h2 class="card-title">🔒 Change Password</h2></div>
          <form class="modal-form" onsubmit="AdminModule.changePassword(event)">
            <div class="form-group">
              <label>New Password</label>
              <input type="password" id="new-pwd" required minlength="6" placeholder="Min 6 characters">
            </div>
            <div class="form-group">
              <label>Confirm Password</label>
              <input type="password" id="confirm-pwd" required placeholder="Repeat password">
            </div>
            <button type="submit" class="btn btn-primary">Update Password</button>
          </form>
        </div>
        <div class="card">
          <div class="card-header"><h2 class="card-title">🗄️ Data Management</h2></div>
          <p class="text-muted" style="margin-bottom:1rem">Warning: These actions are irreversible.</p>
          <button class="btn btn-warning" onclick="AdminModule.resetData()">Reset Demo Data</button>
        </div>
      </div>`;
  },

  changePassword(e) {
    e.preventDefault();
    const pwd = document.getElementById('new-pwd').value;
    const confirm = document.getElementById('confirm-pwd').value;
    if (pwd !== confirm) { Toast.error('Passwords do not match!'); return; }
    HMS.Admin.updatePassword(pwd);
    Toast.success('Password updated successfully!');
  },

  resetData() {
    Modal.show({
      title: 'Reset Demo Data',
      body: '<p>This will clear all data and re-seed with demo data. Continue?</p>',
      confirmText: 'Reset',
      danger: true,
      onConfirm: () => {
        localStorage.removeItem('hms_seeded');
        HMS.seedDemoData();
        Toast.success('Data reset to demo state!');
        this.render('dashboard');
      },
    });
  },
};

window.AdminModule = AdminModule;

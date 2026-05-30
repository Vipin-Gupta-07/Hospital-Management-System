// ============================================================
// app.js — Main Router and Page Orchestrator
// ============================================================

const App = {
  currentRole: null,
  currentView: 'dashboard',

  init() {
    // 1. Seed demo data if first load
    HMS.seedDemoData();

    // 2. Setup toast containers
    Toast.init();

    // 3. Bind Global Events
    this.bindEvents();

    // 4. Check Authentication session
    this.restoreSession();
  },

  bindEvents() {
    // Role selection change triggers login placeholder update
    const roleSelect = document.getElementById('login-role');
    if (roleSelect) {
      roleSelect.addEventListener('change', (e) => {
        const usernameInput = document.getElementById('login-user');
        if (usernameInput) {
          usernameInput.placeholder = e.target.value === 'admin' ? 'e.g. admin' :
                                       e.target.value === 'doctor' ? 'e.g. dr.sharma' : 'e.g. john.doe';
        }
      });
    }

    // Modal forms confirm dismiss behavior
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => Modal.hide());
  },

  restoreSession() {
    if (Auth.isLoggedIn()) {
      const session = Auth.getSession();
      this.currentRole = session.role;
      this.showPortal();
    } else {
      this.showLogin();
    }
  },

  showLogin() {
    document.getElementById('app-shell').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
  },

  handleLogin(e) {
    e.preventDefault();
    const role = document.getElementById('login-role').value;
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;

    const res = Auth.login(role, user, pass);
    if (res.success) {
      this.currentRole = role;
      Toast.success(`Logged in successfully as ${res.user.name}`);
      this.showPortal();
      
      // Clear forms
      document.getElementById('login-user').value = '';
      document.getElementById('login-pass').value = '';
    } else {
      Toast.error(res.error);
    }
  },

  handleLogout() {
    Auth.logout();
    this.currentRole = null;
    this.currentView = 'dashboard';
    Toast.info('Logged out from system.');
    this.showLogin();
  },

  showPortal() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    
    // Update header name
    const session = Auth.getSession();
    document.getElementById('header-username').textContent = session ? session.name : 'User';
    document.getElementById('header-avatar').textContent = avatarInitials(session ? session.name : 'HMS');

    // Populate Sidebar items according to roles
    this.renderSidebar();

    // Load initial View
    this.navigate(this.currentRole, 'dashboard');
  },

  renderSidebar() {
    const list = document.getElementById('sidebar-menu');
    if (!list) return;
    list.innerHTML = '';

    const menus = {
      admin: [
        { label: '📊 Dashboard', view: 'dashboard' },
        { label: '🏥 Hospitals', view: 'hospitals' },
        { label: '👤 Patients', view: 'patients' },
        { label: '🩺 Doctors', view: 'doctors' },
        { label: '🛏️ Rooms & Beds', view: 'rooms' },
        { label: '📅 Appointments', view: 'appointments' },
        { label: '💰 Billing & Invoice', view: 'billing' },
        { label: '⚙️ Settings', view: 'settings' },
      ],
      doctor: [
        { label: '📊 Dashboard', view: 'dashboard' },
        { label: '👤 My Patients', view: 'patients' },
        { label: '📅 Schedule', view: 'appointments' },
        { label: '💊 Write Prescription', view: 'prescriptions' },
        { label: '🧪 Lab Reports', view: 'reports' },
        { label: '⚙️ Profile Settings', view: 'profile' },
      ],
      patient: [
        { label: '📊 Summary', view: 'dashboard' },
        { label: '📅 Book Consultation', view: 'book' },
        { label: '🛏️ Admission Info', view: 'room' },
        { label: '💊 Prescriptions', view: 'prescriptions' },
        { label: '🧪 Lab Reports', view: 'reports' },
        { label: '💰 Bills & Invoices', view: 'billing' },
        { label: '⚙️ Settings', view: 'profile' },
      ]
    };

    const roleItems = menus[this.currentRole] || [];
    roleItems.forEach(item => {
      const li = document.createElement('li');
      li.className = 'menu-item' + (item.view === this.currentView ? ' active' : '');
      li.innerHTML = `<span>${item.label}</span>`;
      li.addEventListener('click', () => {
        // Toggle Active
        document.querySelectorAll('#sidebar-menu .menu-item').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        this.navigate(this.currentRole, item.view);
      });
      list.appendChild(li);
    });
  },

  navigate(role, view) {
    this.currentView = view;
    
    // Toggle active status in sidebar visually
    document.querySelectorAll('#sidebar-menu .menu-item').forEach((el, index) => {
      const label = el.textContent.toLowerCase();
      // Check if menu-item label matches view keyword
      if (label.includes(view === 'dashboard' ? 'dashboard' : view === 'book' ? 'consultation' : view)) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    if (role === 'admin') {
      AdminModule.render(view);
    } else if (role === 'doctor') {
      DoctorModule.render(view);
    } else if (role === 'patient') {
      PatientModule.render(view);
    }
  }
};

window.App = App;

// Bootstrap application on page load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

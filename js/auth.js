// ============================================================
// auth.js — Authentication & Session Management
// ============================================================

const Auth = {
  SESSION_KEY: 'hms_session',

  login(role, username, password) {
    const hashed = HMS.hashPassword(password);
    let user = null;

    if (role === 'admin') {
      const admin = HMS.Admin.get();
      if (admin.username === username && admin.password === hashed) {
        user = { ...admin, role: 'admin' };
      }
    } else if (role === 'doctor') {
      const doc = HMS.Doctors.getByUsername(username);
      if (doc && doc.password === hashed) {
        user = { ...doc, role: 'doctor' };
      }
    } else if (role === 'patient') {
      const pat = HMS.Patients.getByUsername(username);
      if (pat && pat.password === hashed) {
        user = { ...pat, role: 'patient' };
      }
    }

    if (user) {
      // Store session (omit password)
      const { password: _, ...safeUser } = user;
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(safeUser));
      return { success: true, user: safeUser };
    }
    return { success: false, error: 'Invalid username or password.' };
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(this.SESSION_KEY)) || null;
    } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  getRole() {
    const s = this.getSession();
    return s ? s.role : null;
  },

  // Refresh session from store (after profile update)
  refreshSession() {
    const s = this.getSession();
    if (!s) return;
    if (s.role === 'doctor') {
      const doc = HMS.Doctors.get(s.id);
      if (doc) {
        const { password: _, ...safeUser } = { ...doc, role: 'doctor' };
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(safeUser));
      }
    } else if (s.role === 'patient') {
      const pat = HMS.Patients.get(s.id);
      if (pat) {
        const { password: _, ...safeUser } = { ...pat, role: 'patient' };
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(safeUser));
      }
    }
  },
};

window.Auth = Auth;

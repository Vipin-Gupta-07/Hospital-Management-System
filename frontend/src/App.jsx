import React, { useState, useEffect } from 'react';
import { Activity, Shield, User, Stethoscope } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hms_token') || '');
  const [role, setRole] = useState(localStorage.getItem('hms_role') || '');
  const [username, setUsername] = useState(localStorage.getItem('hms_username') || '');

  // Logins states
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('patient');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const details = new URLSearchParams();
      details.append('username', formUsername);
      details.append('password', formPassword);

      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: details.toString(),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Incorrect username or password');
      }

      localStorage.setItem('hms_token', data.access_token);
      localStorage.setItem('hms_role', data.role);
      localStorage.setItem('hms_username', data.username);

      setToken(data.access_token);
      setRole(data.role);
      setUsername(data.username);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formUsername,
          password: formPassword,
          role: formRole,
          name: formName,
          email: formEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed. Try a different username.');
      }

      setAuthSuccess('Registration successful! Please log in now.');
      setIsLoginTab(true);
      setFormPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_role');
    localStorage.removeItem('hms_username');
    setToken('');
    setRole('');
    setUsername('');
    setFormUsername('');
    setFormPassword('');
  };

  // If already logged in, mount dashboard based on role
  if (token) {
    if (role === 'admin') return <AdminDashboard token={token} onLogout={handleLogout} />;
    if (role === 'doctor') return <DoctorDashboard token={token} onLogout={handleLogout} />;
    if (role === 'patient') return <PatientDashboard token={token} onLogout={handleLogout} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Brand logo & tagline */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #3b82f6, #10b981)', padding: '14px', borderRadius: '18px', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)', marginBottom: '16px' }}>
          <Activity size={36} color="white" />
        </div>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Hospital Management System
        </h1>
        <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '15px' }}>Access your healthcare metrics instantly and securely</p>
      </div>

      {/* Auth Panel */}
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
          <button onClick={() => { setIsLoginTab(true); setAuthError(''); setAuthSuccess(''); }} style={{ flex: 1, background: 'none', border: 'none', color: isLoginTab ? '#3b82f6' : '#94a3b8', borderBottom: isLoginTab ? '2px solid #3b82f6' : '2px solid transparent', paddingBottom: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
            Login
          </button>
          <button onClick={() => { setIsLoginTab(false); setAuthError(''); setAuthSuccess(''); }} style={{ flex: 1, background: 'none', border: 'none', color: !isLoginTab ? '#3b82f6' : '#94a3b8', borderBottom: !isLoginTab ? '2px solid #3b82f6' : '2px solid transparent', paddingBottom: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
            Register
          </button>
        </div>

        {/* Notices */}
        {authError && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '14px', marginBottom: '20px' }}>
            {authError}
          </div>
        )}
        {authSuccess && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '14px', marginBottom: '20px' }}>
            {authSuccess}
          </div>
        )}

        {/* Login Mode */}
        {isLoginTab ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input required type="text" className="form-input" placeholder="Enter username" value={formUsername} onChange={e => setFormUsername(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input required type="password" className="form-input" placeholder="••••••••" value={formPassword} onChange={e => setFormPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              Sign In
            </button>
          </form>
        ) : (
          /* Register Mode */
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input required type="text" className="form-input" placeholder="e.g. Dr. John Doe" value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input required type="email" className="form-input" placeholder="john@example.com" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input required type="text" className="form-input" placeholder="Create username" value={formUsername} onChange={e => setFormUsername(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input required type="password" className="form-input" placeholder="Minimum 6 characters" value={formPassword} onChange={e => setFormPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={formRole} onChange={e => setFormRole(e.target.value)}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              Create Account
            </button>
          </form>
        )}
      </div>

      <div style={{ marginTop: '24px', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Shield size={14} /> Secure HIPAA-Compliant Gateway
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, HeartHandshake, ShieldAlert, Building2, LogOut } from 'lucide-react';

export default function AdminDashboard({ token, onLogout }) {
  const [data, setData] = useState({ admins: [], doctors: [], patients: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Forms
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', email: '', role: 'patient', specialization: '' });
  const [assignment, setAssignment] = useState({ patient_username: '', doctor_username: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSummary = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch hospital records');
      const json = await res.ok ? await res.json() : {};
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [token]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('http://localhost:8000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create user');
      
      setSuccessMsg(`User ${newUser.username} (${newUser.role}) created successfully!`);
      setNewUser({ username: '', password: '', name: '', email: '', role: 'patient', specialization: '' });
      fetchSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Are you sure you want to delete ${username}?`)) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`http://localhost:8000/api/admin/users/${username}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to delete user');
      
      setSuccessMsg(data.message);
      fetchSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignDoctor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const queryParams = new URLSearchParams(assignment).toString();
      const res = await fetch(`http://localhost:8000/api/admin/assign-doctor?${queryParams}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to assign doctor');
      
      setSuccessMsg(data.message);
      setAssignment({ patient_username: '', doctor_username: '' });
      fetchSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px' }}>Loading Admin Panel...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }} className="animate-fade-in">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="glass-panel" padding="16px 24px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px' }}>
          <ShieldAlert size={32} color="#3b82f6" />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Admin Dashboard</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Hospital Management Command Center</p>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-secondary" style={{ marginRight: '24px' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Messages */}
      {error && <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--danger)', marginBottom: '24px', color: '#f87171' }}>{error}</div>}
      {successMsg && <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--accent)', marginBottom: '24px', color: '#34d399' }}>{successMsg}</div>}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px' }}>
            <Users color="#3b82f6" size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Total Patients</h3>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>{data.patients.length}</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}>
            <Building2 color="#10b981" size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Total Doctors</h3>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>{data.doctors.length}</p>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px' }}>
            <Building2 color="#f59e0b" size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Partner Hospitals</h3>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>3</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', marginBottom: '32px' }}>
        {/* Registration Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="#3b82f6" /> Register New Account
          </h2>
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input required type="text" className="form-input" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="e.g. johndoe" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input required type="password" className="form-input" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required type="text" className="form-input" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input required type="email" className="form-input" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="john@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Account Role</label>
              <select className="form-select" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {newUser.role === 'doctor' && (
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input type="text" className="form-input" value={newUser.specialization} onChange={e => setNewUser({...newUser, specialization: e.target.value})} placeholder="e.g. Cardiologist" />
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register Account</button>
          </form>
        </div>

        {/* Doctor Assignment */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartHandshake size={20} color="#10b981" /> Assign Doctor to Patient
            </h2>
            <form onSubmit={handleAssignDoctor}>
              <div className="form-group">
                <label className="form-label">Select Patient</label>
                <select required className="form-select" value={assignment.patient_username} onChange={e => setAssignment({...assignment, patient_username: e.target.value})}>
                  <option value="">-- Choose Patient --</option>
                  {data.patients.map(p => (
                    <option key={p.id} value={p.user.username}>{p.user.name} ({p.user.username})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Select Doctor</label>
                <select required className="form-select" value={assignment.doctor_username} onChange={e => setAssignment({...assignment, doctor_username: e.target.value})}>
                  <option value="">-- Choose Doctor --</option>
                  {data.doctors.map(d => (
                    <option key={d.id} value={d.user.username}>{d.user.name} - {d.specialization}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)' }}>Assign Doctor</button>
            </form>
          </div>

          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} /> Partner Hospitals
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#cbd5e1', lineHeight: '1.8' }}>
              <li><strong>Pavan Hospital</strong> - General Medicine</li>
              <li><strong>Rini Hospital</strong> - Pediatrics & Surgical</li>
              <li><strong>Priyanshu Hospital</strong> - Cardiac Care</li>
            </ul>
          </div>
        </div>
      </div>

      {/* User Directories */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        {/* Doctors Table */}
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '16px' }}>Doctor Directory</h2>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Specialization</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.doctors.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8' }}>No doctors registered yet.</td></tr>
              ) : (
                data.doctors.map(doc => (
                  <tr key={doc.id}>
                    <td><strong>{doc.user.name}</strong></td>
                    <td>{doc.user.username}</td>
                    <td>{doc.user.email}</td>
                    <td><span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>{doc.specialization}</span></td>
                    <td>
                      <button onClick={() => handleDeleteUser(doc.user.username)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Patients Table */}
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '16px' }}>Patient Directory</h2>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Ward / Bed</th>
                <th>Assigned Doctor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.patients.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>No patients registered yet.</td></tr>
              ) : (
                data.patients.map(pat => (
                  <tr key={pat.id}>
                    <td><strong>{pat.user.name}</strong></td>
                    <td>{pat.user.username}</td>
                    <td>{pat.user.email}</td>
                    <td>{pat.room_number ? `Room ${pat.room_number}, Bed ${pat.bed_letter}` : 'Not Assigned'}</td>
                    <td>{pat.doctor ? `${pat.doctor.user.name} (${pat.doctor.specialization})` : <span style={{ color: '#f59e0b' }}>Unassigned</span>}</td>
                    <td>
                      <button onClick={() => handleDeleteUser(pat.user.username)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

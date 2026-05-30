import React, { useState, useEffect } from 'react';
import { User, Pill, FileText, Calendar, LogOut, CheckCircle } from 'lucide-react';

export default function PatientDashboard({ token, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [resProfile, resMeds, resReps, resAppts] = await Promise.all([
          fetch('http://localhost:8000/api/patient/profile', { headers }),
          fetch('http://localhost:8000/api/patient/medicines', { headers }),
          fetch('http://localhost:8000/api/patient/reports', { headers }),
          fetch('http://localhost:8000/api/patient/appointments', { headers })
        ]);

        if (!resProfile.ok || !resMeds.ok || !resReps.ok || !resAppts.ok) {
          throw new Error('Error retrieving patient health records');
        }

        setProfile(await resProfile.json());
        setMedicines(await resMeds.json());
        setReports(await resReps.json());
        setAppointments(await resAppts.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px' }}>Loading Patient Health Records...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }} className="animate-fade-in">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="glass-panel" padding="16px 24px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px' }}>
          <User size={32} color="#3b82f6" />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Patient Health Dashboard</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Personal Health Records & Care Plan</p>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-secondary" style={{ marginRight: '24px' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Profile Overview */}
      {profile && (
        <div className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 41, 59, 0.5))' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#94a3b8' }}>Patient Identity</h3>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>{profile.user.name}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>@{profile.user.username} | {profile.user.email}</p>
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#94a3b8' }}>Hospital Ward Details</h3>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Room {profile.room_number || 'N/A'}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>Bed Location: Bed {profile.bed_letter || 'N/A'}</p>
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#94a3b8' }}>Assigned Primary Doctor</h3>
            {profile.doctor ? (
              <>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Dr. {profile.doctor.user.name}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>{profile.doctor.specialization} ({profile.doctor.user.email})</p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '16px', color: '#f59e0b', fontWeight: '500' }}>Awaiting Assignment</p>
            )}
          </div>
        </div>
      )}

      {error && <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--danger)', marginBottom: '24px', color: '#f87171' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {/* Prescribed Medicines */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Pill color="#3b82f6" size={20} /> Prescribed Medicines
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {medicines.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>No prescribed medicines yet.</p>
            ) : (
              medicines.map(med => (
                <div key={med.id} className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #3b82f6', background: 'rgba(59, 130, 246, 0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '16px' }}>{med.name}</strong>
                    <span style={{ fontSize: '13px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '2px 8px', borderRadius: '4px' }}>{med.dosage}</span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#cbd5e1' }}>Frequency: <strong>{med.frequency}</strong></p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Diagnostics & Medical Reports */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText color="#10b981" size={20} /> Diagnostics & Reports
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reports.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>No reports recorded.</p>
            ) : (
              reports.map(rep => (
                <div key={rep.id} className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '15px' }}>{rep.title}</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(rep.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', whiteSpace: 'pre-line' }}>{rep.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '32px' }}>
        <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} color="#f59e0b" /> Scheduled Consultations
        </h2>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Date / Time</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8' }}>No upcoming appointments scheduled.</td></tr>
            ) : (
              appointments.map(appt => (
                <tr key={appt.id}>
                  <td><strong>Dr. {appt.doctor.user.name}</strong> ({appt.doctor.specialization})</td>
                  <td>{new Date(appt.date).toLocaleString()}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>
                      <CheckCircle size={12} /> {appt.status}
                    </span>
                  </td>
                  <td>{appt.notes || 'None'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

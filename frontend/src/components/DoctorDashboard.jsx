import React, { useState, useEffect } from 'react';
import { Stethoscope, ClipboardList, Pill, Calendar, LogOut, ChevronRight, CheckCircle2, User } from 'lucide-react';

export default function DoctorDashboard({ token, onLogout }) {
  const [patients, setPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [medicineForm, setMedicineForm] = useState({ name: '', dosage: '', frequency: '' });
  const [reportForm, setReportForm] = useState({ title: '', content: '' });
  const [appointmentForm, setAppointmentForm] = useState({ date: '', notes: '' });

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resPatients, resAll, resAppts] = await Promise.all([
        fetch('http://localhost:8000/api/doctor/patients', { headers }),
        fetch('http://localhost:8000/api/doctor/all-patients', { headers }),
        fetch('http://localhost:8000/api/doctor/appointments', { headers })
      ]);

      if (!resPatients.ok || !resAll.ok || !resAppts.ok) {
        throw new Error('Error retrieving doctor records');
      }

      setPatients(await resPatients.json());
      setAllPatients(await resAll.json());
      setAppointments(await resAppts.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const selectPatientDetail = async (patient) => {
    setSelectedPatient(patient);
    setSuccessMsg('');
    setError('');
  };

  const handlePrescribeMedicine = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('http://localhost:8000/api/doctor/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_username: selectedPatient.user.username,
          ...medicineForm
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to prescribe medicine');

      setSuccessMsg(`Prescribed ${medicineForm.name} to ${selectedPatient.user.name} successfully!`);
      setMedicineForm({ name: '', dosage: '', frequency: '' });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('http://localhost:8000/api/doctor/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_username: selectedPatient.user.username,
          ...reportForm
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add report');

      setSuccessMsg(`Medical report added for ${selectedPatient.user.name}!`);
      setReportForm({ title: '', content: '' });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('http://localhost:8000/api/doctor/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_username: selectedPatient.user.username,
          doctor_username: selectedPatient.doctor ? selectedPatient.doctor.user.username : '',
          ...appointmentForm
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to schedule appointment');

      setSuccessMsg(`Appointment scheduled with ${selectedPatient.user.name} for ${appointmentForm.date}!`);
      setAppointmentForm({ date: '', notes: '' });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px' }}>Loading Doctor Dashboard...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }} className="animate-fade-in">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="glass-panel" padding="16px 24px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px' }}>
          <Stethoscope size={32} color="#10b981" />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Doctor's Portal</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Patient Care & Clinical Administration</p>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-secondary" style={{ marginRight: '24px' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Messages */}
      {error && <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--danger)', marginBottom: '24px', color: '#f87171' }}>{error}</div>}
      {successMsg && <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--accent)', marginBottom: '24px', color: '#34d399' }}>{successMsg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        {/* Left Column - Patient Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '16px' }}>My Assigned Patients</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {patients.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>No patients assigned yet.</p>
              ) : (
                patients.map(p => (
                  <button key={p.id} onClick={() => selectPatientDetail(p)} className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px', border: selectedPatient?.id === p.id ? '1px solid #10b981' : '1px solid var(--card-border)', background: selectedPatient?.id === p.id ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.4)', textAlign: 'left', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>{p.user.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Room {p.room_number || 'N/A'}, Bed {p.bed_letter || 'N/A'}</div>
                    </div>
                    <ChevronRight size={16} color={selectedPatient?.id === p.id ? '#10b981' : '#94a3b8'} />
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '16px' }}>All Hospital Patients</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {allPatients.map(p => (
                <button key={p.id} onClick={() => selectPatientDetail(p)} className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px', border: selectedPatient?.id === p.id ? '1px solid #10b981' : '1px solid var(--card-border)', background: selectedPatient?.id === p.id ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.4)', textAlign: 'left', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{p.user.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>@{p.user.username}</div>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Selected Patient Details & Forms */}
        <div>
          {selectedPatient ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Profile Card */}
              <div className="glass-panel animate-fade-in" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: '#10b981', color: 'white', padding: '16px', borderRadius: '50%' }}>
                    <User size={32} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '22px' }}>{selectedPatient.user.name}</h2>
                    <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
                      @{selectedPatient.user.username} | {selectedPatient.user.email}
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', background: 'rgba(255,255,255,0.05)', display: 'inline-block', padding: '4px 10px', borderRadius: '20px' }}>
                      Ward Room <strong>{selectedPatient.room_number}</strong>, Bed <strong>{selectedPatient.bed_letter}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Tabs / Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {/* Prescribe Medicine */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '16px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pill color="#3b82f6" size={18} /> Prescribe Medicine
                  </h3>
                  <form onSubmit={handlePrescribeMedicine}>
                    <div className="form-group">
                      <label className="form-label">Medicine Name</label>
                      <input required type="text" className="form-input" value={medicineForm.name} onChange={e => setMedicineForm({ ...medicineForm, name: e.target.value })} placeholder="e.g. Paracetamol" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Dosage</label>
                      <input required type="text" className="form-input" value={medicineForm.dosage} onChange={e => setMedicineForm({ ...medicineForm, dosage: e.target.value })} placeholder="e.g. 500mg" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Frequency</label>
                      <input required type="text" className="form-input" value={medicineForm.frequency} onChange={e => setMedicineForm({ ...medicineForm, frequency: e.target.value })} placeholder="e.g. Twice daily" />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Prescribe</button>
                  </form>
                </div>

                {/* Add Report */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '16px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardList color="#10b981" size={18} /> File Medical Report
                  </h3>
                  <form onSubmit={handleAddReport}>
                    <div className="form-group">
                      <label className="form-label">Report Title</label>
                      <input required type="text" className="form-input" value={reportForm.title} onChange={e => setReportForm({ ...reportForm, title: e.target.value })} placeholder="e.g. Blood Test Result" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Content / Diagnostics</label>
                      <textarea required rows={4} className="form-input" value={reportForm.content} onChange={e => setReportForm({ ...reportForm, content: e.target.value })} placeholder="Detailed findings..." style={{ resize: 'none' }}></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)' }}>File Report</button>
                  </form>
                </div>
              </div>

              {/* Schedule Appointment */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar color="#f59e0b" size={18} /> Schedule Next Appointment
                </h3>
                <form onSubmit={handleScheduleAppointment} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Appointment Date & Time</label>
                    <input required type="datetime-local" className="form-input" value={appointmentForm.date} onChange={e => setAppointmentForm({ ...appointmentForm, date: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Notes</label>
                    <input type="text" className="form-input" value={appointmentForm.notes} onChange={e => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} placeholder="Purpose of visit..." />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '12px' }}>Schedule Appointment</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={64} color="#475569" style={{ marginBottom: '16px' }} />
              <h3>No Patient Selected</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>Select a patient from the directories on the left to manage prescriptions, reports, and schedule appointments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '32px' }}>
        <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} color="#f59e0b" /> Scheduled Appointments
        </h2>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date / Time</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8' }}>No scheduled appointments.</td></tr>
            ) : (
              appointments.map(appt => (
                <tr key={appt.id}>
                  <td><strong>{appt.patient.user.name}</strong></td>
                  <td>{new Date(appt.date).toLocaleString()}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>
                      <CheckCircle2 size={12} /> {appt.status}
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

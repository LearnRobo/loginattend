import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Save, ShieldCheck } from 'lucide-react';

const Settings = () => {
  const [formData, setFormData] = useState({
    officeLat: '',
    officeLong: '',
    allowedRadius: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/settings', {
        headers: { 'x-auth-token': token }
      });
      setFormData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/settings', formData, {
        headers: { 'x-auth-token': token }
      });
      alert('Settings updated successfully');
    } catch (err) {
      alert('Error updating settings');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>System Settings</h2>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ color: 'var(--primary)' }}><MapPin size={24} /></div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>GPS & Location Verification</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Office Latitude</label>
              <input 
                type="text" 
                className="input-field" 
                value={formData.officeLat} 
                onChange={e => setFormData({...formData, officeLat: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Office Longitude</label>
              <input 
                type="text" 
                className="input-field" 
                value={formData.officeLong} 
                onChange={e => setFormData({...formData, officeLong: e.target.value})}
              />
            </div>
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Allowed Radius (Meters)</label>
            <input 
              type="number" 
              className="input-field" 
              value={formData.allowedRadius} 
              onChange={e => setFormData({...formData, allowedRadius: e.target.value})}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Employees must be within this distance from the office coordinates to mark attendance.
            </p>
          </div>
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={18} /> Save Settings
          </button>
        </form>
      </div>

      <div className="card" style={{ opacity: 0.7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ color: 'var(--primary)' }}><ShieldCheck size={24} /></div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Security & Access Control</h3>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Role-based access control and JWT session management are active.</p>
      </div>
    </div>
  );
};

export default Settings;

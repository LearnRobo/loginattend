import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { API_BASE, UPLOADS_BASE } from '../api/config';

const AttendanceList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/attendance/all`, {
        headers: { 'x-auth-token': token }
      });
      setLogs(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-0.025em' }}>Attendance Logs</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Monitor real-time staff movement and verification logs.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.875rem 1.25rem', 
              background: 'white', 
              border: '1px solid var(--border)', 
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--secondary)'
          }}>
            <Filter size={18} /> Filter
          </button>
          <button className="btn-primary" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.875rem 1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
          }}>
            <Download size={18} /> Export Daily Report
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EMPLOYEE</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DATE</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CHECK-IN</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CHECK-OUT</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VERIFICATION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Synchronizing log data...</td></tr>
            ) : logs.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No logs found for the selected period.</td></tr>
            ) : logs.map((log) => (
              <tr key={log._id} style={{ borderBottom: '1px solid var(--border)', transition: '0.2s' }} className="table-row-hover">
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {log.checkIn?.faceImage ? (
                              <img 
                                src={`${UPLOADS_BASE}/${log.checkIn.faceImage}`} 
                                alt="Face" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : null}
                            {(!log.checkIn?.faceImage) && (
                              <span style={{ fontWeight: '800', fontSize: '12px', color: 'var(--primary)' }}>
                                {log.user?.name?.charAt(0)}
                              </span>
                            )}
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '15px' }}>{log.user?.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {log.user?.employeeId}</div>
                        </div>
                    </div>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{log.date}</div>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)' }}>
                        {log.checkIn?.time ? format(new Date(log.checkIn.time), 'hh:mm a') : '--:--'}
                    </div>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)' }}>
                        {log.checkOut?.time ? format(new Date(log.checkOut.time), 'hh:mm a') : '--:--'}
                    </div>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    background: log.status === 'present' ? '#ecfdf5' : '#fff7ed',
                    color: log.status === 'present' ? '#059669' : '#d97706',
                    border: `1px solid ${log.status === 'present' ? '#d1fae5' : '#ffedd5'}`
                  }}>
                    {log.status}
                  </span>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {log.checkIn?.faceImage ? (
                      <button 
                        onClick={() => window.open(`${UPLOADS_BASE}/${log.checkIn.faceImage}`, '_blank')}
                        style={{ 
                          padding: '6px 12px', 
                          background: '#ecfdf5', 
                          border: '1px solid #a7f3d0', 
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '800',
                          color: '#047857',
                          cursor: 'pointer'
                        }}
                      >
                        In Photo
                      </button>
                    ) : null}
                    {log.checkOut?.faceImage ? (
                      <button 
                        onClick={() => window.open(`${UPLOADS_BASE}/${log.checkOut.faceImage}`, '_blank')}
                        style={{ 
                          padding: '6px 12px', 
                          background: '#faf5ff', 
                          border: '1px solid #e9d5ff', 
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '800',
                          color: '#7e22ce',
                          cursor: 'pointer'
                        }}
                      >
                        Out Photo
                      </button>
                    ) : null}
                    {!log.checkIn?.faceImage && !log.checkOut?.faceImage && (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>No Photo</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceList;

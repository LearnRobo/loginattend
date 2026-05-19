import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { API_BASE, UPLOADS_BASE } from '../api/config';

const AttendanceList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);

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
            ) : logs.map((log) => {
              const inImg = log.checkIn?.faceImage ? (log.checkIn.faceImage.startsWith('data:') ? log.checkIn.faceImage : `${UPLOADS_BASE}/${log.checkIn.faceImage}`) : null;
              const outImg = log.checkOut?.faceImage ? (log.checkOut.faceImage.startsWith('data:') ? log.checkOut.faceImage : `${UPLOADS_BASE}/${log.checkOut.faceImage}`) : null;

              return (
                <tr key={log._id} style={{ borderBottom: '1px solid var(--border)', transition: '0.2s' }} className="table-row-hover">
                  <td style={{ padding: '1.25rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inImg ? 'pointer' : 'default' }} onClick={() => inImg && setActivePhoto({ url: inImg, name: log.user?.name, date: log.date, type: 'Punch-In', empId: log.user?.employeeId, time: log.checkIn?.time ? format(new Date(log.checkIn.time), 'hh:mm a') : '--:--' })}>
                              {inImg ? (
                                <img 
                                  src={inImg} 
                                  alt="Face" 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : null}
                              {(!inImg) && (
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
                      {inImg ? (
                        <button 
                          onClick={() => setActivePhoto({ url: inImg, name: log.user?.name, date: log.date, type: 'Punch-In', empId: log.user?.employeeId, time: log.checkIn?.time ? format(new Date(log.checkIn.time), 'hh:mm a') : '--:--' })}
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
                      {outImg ? (
                        <button 
                          onClick={() => setActivePhoto({ url: outImg, name: log.user?.name, date: log.date, type: 'Punch-Out', empId: log.user?.employeeId, time: log.checkOut?.time ? format(new Date(log.checkOut.time), 'hh:mm a') : '--:--' })}
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
                      {!inImg && !outImg && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>No Photo</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activePhoto && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }} onClick={() => setActivePhoto(null)}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ 
                  background: activePhoto.type === 'Punch-In' ? '#ecfdf5' : '#faf5ff',
                  color: activePhoto.type === 'Punch-In' ? '#047857' : '#7e22ce',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase'
                }}>{activePhoto.type} Photo</span>
                <h3 style={{ margin: '8px 0 2px 0', fontSize: '1.25rem', fontWeight: '800', color: 'var(--secondary)' }}>{activePhoto.name}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>ID: {activePhoto.empId} • {activePhoto.date} at {activePhoto.time}</p>
              </div>
              <button 
                onClick={() => setActivePhoto(null)}
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  width: '32px', height: '32px', 
                  borderRadius: '50%', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}
              >✕</button>
            </div>
            
            <div style={{ width: '100%', height: '320px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <img 
                src={activePhoto.url} 
                alt="Face Verification Selfie" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            
            <button 
              className="btn-primary" 
              onClick={() => setActivePhoto(null)} 
              style={{ width: '100%', padding: '0.875rem', borderRadius: '12px' }}
            >
              Close Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;

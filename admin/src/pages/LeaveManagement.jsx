import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Clock, User } from 'lucide-react';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/leaves/all', {
        headers: { 'x-auth-token': token }
      });
      setLeaves(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/leaves/${id}`, { status }, {
        headers: { 'x-auth-token': token }
      });
      fetchLeaves();
    } catch (err) {
      alert('Error updating status');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-0.025em' }}>Leave Requests</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Review and process employee time-off applications.</p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EMPLOYEE</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LEAVE TYPE</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DURATION</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REASON / REMARKS</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</th>
              <th style={{ textAlign: 'right', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Retrieving pending requests...</td></tr>
            ) : leaves.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No leave requests found.</td></tr>
            ) : leaves.map((leave) => (
              <tr key={leave._id} style={{ borderBottom: '1px solid var(--border)', transition: '0.2s' }} className="table-row-hover">
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <User size={20} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '15px' }}>{leave.user?.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {leave.user?.employeeId}</div>
                        </div>
                    </div>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                  <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      background: '#f8fafc', 
                      padding: '4px 10px', 
                      borderRadius: '6px',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border)',
                      textTransform: 'uppercase'
                  }}>
                    {leave.type}
                  </span>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)' }}>
                        {new Date(leave.startDate).toLocaleDateString('en-GB')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to {new Date(leave.endDate).toLocaleDateString('en-GB')}</div>
                </td>
                <td style={{ padding: '1.25rem 2rem', fontSize: '14px', color: 'var(--text-main)', maxWidth: '240px' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{leave.reason}</div>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    background: leave.status === 'approved' ? '#ecfdf5' : leave.status === 'rejected' ? '#fef2f2' : '#fff7ed',
                    color: leave.status === 'approved' ? '#059669' : leave.status === 'rejected' ? '#dc2626' : '#d97706',
                    border: `1px solid ${leave.status === 'approved' ? '#d1fae5' : leave.status === 'rejected' ? '#fee2e2' : '#ffedd5'}`
                  }}>
                    {leave.status}
                  </span>
                </td>
                <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                  {leave.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleStatusUpdate(leave._id, 'approved')}
                        style={{ padding: '0.625rem', borderRadius: '10px', background: '#ecfdf5', color: '#059669', border: '1px solid #d1fae5', cursor: 'pointer' }}
                        title="Approve"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(leave._id, 'rejected')}
                        style={{ padding: '0.625rem', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', cursor: 'pointer' }}
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }}></div>
                        Processed
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveManagement;

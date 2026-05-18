import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, User as UserIcon, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../api/config';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Custom modal state for deletion to prevent browser/webview blocking window.confirm
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/employees`, {
        headers: { 'x-auth-token': token }
      });
      setEmployees(res.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError('Failed to fetch employee records. Please try again later.');
    }
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/employees/${employeeToDelete._id}`, {
        headers: { 'x-auth-token': token }
      });
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting employee: ' + (err.response?.data?.msg || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchName = emp.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchId = emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEmail = emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchName || matchId || matchEmail;
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-0.025em' }}>Employee Management</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>View, edit, and manage staff members and their system credentials.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => navigate('/add-employee')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.875rem 1.5rem', 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} /> Add New Employee
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', background: '#fcfcfd' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field" 
              placeholder="Search by employee name, ID or email..." 
              style={{ paddingLeft: '44px', background: 'white', borderRadius: '10px' }}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EMPLOYEE</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ROLE</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BASE SALARY</th>
              <th style={{ textAlign: 'right', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Fetching staff records...</td></tr>
            ) : error ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</td></tr>
            ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No employees matching search criteria.</td></tr>
            ) : filteredEmployees.map((emp) => (
              <tr key={emp._id} style={{ borderBottom: '1px solid var(--border)', transition: '0.2s' }} className="table-row-hover">
                <td style={{ padding: '1.25rem 2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '15px' }}>{emp.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                    <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>{emp.employeeId}</span>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', textTransform: 'capitalize' }}>{emp.role}</div>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#059669' }}>₹{emp.salaryDetails?.baseSalary?.toLocaleString() || '0'}</div>
                </td>
                <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => navigate(`/edit-employee/${emp._id}`)}
                      style={{ padding: '0.625rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="Edit Employee"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setEmployeeToDelete(emp)}
                      style={{ padding: '0.625rem', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer' }}
                      title="Delete Employee Profile"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Premium Deletion Confirmation Modal */}
      {employeeToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div className="scale-in" style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Trash2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Confirm Profile Deletion</h3>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
              Are you sure you want to permanently remove <strong style={{ color: 'var(--secondary)' }}>{employeeToDelete.name}</strong> ({employeeToDelete.employeeId})? All associated attendance logs and leave records will also be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setEmployeeToDelete(null)}
                style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'white', fontWeight: '700', color: 'var(--secondary)', cursor: 'pointer' }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: 'none', background: '#ef4444', fontWeight: '700', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;

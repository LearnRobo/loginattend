import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, User as UserIcon } from 'lucide-react';
import { API_BASE } from '../api/config';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', employeeId: '', baseSalary: ''
  });

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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE}/employees/${id}`, {
          headers: { 'x-auth-token': token }
        });
        fetchEmployees();
      } catch (err) {
        alert('Error deleting employee');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/employees`, {
        ...formData,
        salaryDetails: { baseSalary: formData.baseSalary }
      }, {
        headers: { 'x-auth-token': token }
      });
      setShowModal(false);
      fetchEmployees();
      setFormData({ name: '', email: '', password: '', employeeId: '', baseSalary: '' });
    } catch (err) {
      alert('Error adding employee');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-0.025em' }}>Employee Management</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>View and manage your academic and administrative staff.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => window.location.href = '/add-employee'} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.875rem 1.5rem', 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
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
              className="input-field" 
              placeholder="Search by name, ID or email..." 
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
            ) : employees.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No employees found.</td></tr>
            ) : employees.map((emp) => (
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
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#059669' }}>₹{emp.salaryDetails?.baseSalary?.toLocaleString()}</div>
                </td>
                <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => window.location.href = `/edit-employee/${emp._id}`}
                      style={{ padding: '0.625rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(emp._id)}
                      style={{ padding: '0.625rem', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer' }}
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

    </div>
  );
};

export default EmployeeList;

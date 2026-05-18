import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { API_BASE } from '../api/config';

const Payroll = () => {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/payroll`, {
        headers: { 'x-auth-token': token }
      });
      setPayroll(res.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError('Failed to calculate payroll data.');
    }
  };

  const generateSlipDoc = (emp) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138);
    doc.text('SALARY DISBURSEMENT SLIP', 105, 20, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Pay Period: ${emp.monthString || new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}`, 105, 28, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Employee Name: ${emp.name}`, 20, 48);
    doc.text(`Employee ID: ${emp.employeeId}`, 20, 56);
    const workingDays = emp.workingDaysInMonth || 24;
    doc.text(`Attendance: ${emp.presentDays} / ${workingDays} Working Days`, 120, 48);
    
    const tableColumn = ["Earnings & Deductions", "Amount (INR)"];
    const baseSalary = emp.salaryDetails?.baseSalary || 0;
    const bonus = emp.salaryDetails?.bonus || 0;
    const deductions = emp.salaryDetails?.deductions || 0;
    const proRataPay = Math.round((baseSalary / workingDays) * emp.presentDays);
    
    const tableRows = [
      ["Base Monthly Pay", `Rs. ${baseSalary.toLocaleString()}`],
      [`Pro-rata Pay (${emp.presentDays} days)`, `Rs. ${proRataPay.toLocaleString()}`],
      ["Allowances / Bonus", `Rs. ${bonus.toLocaleString()}`],
      ["Deductions", `- Rs. ${deductions.toLocaleString()}`],
      ["NET DISBURSEMENT", `Rs. ${(emp.netSalary !== undefined ? emp.netSalary : proRataPay).toLocaleString()}`]
    ];
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      bodyStyles: { textColor: 50, fontSize: 11 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
    });
    
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer-generated salary slip and does not require a physical signature.', 105, doc.lastAutoTable.finalY + 25, { align: 'center' });
    
    return doc;
  };

  const handleDownloadPDF = (emp) => {
    const doc = generateSlipDoc(emp);
    doc.save(`Salary_Slip_${emp.employeeId}_${emp.monthString || 'Current'}.pdf`);
  };

  const handlePrintSlip = (emp) => {
    const doc = generateSlipDoc(emp);
    window.open(doc.output('bloburl'), '_blank');
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-0.025em' }}>Payroll Management</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Automated salary processing and disbursement tracking.</p>
        </div>
        <button 
            onClick={fetchPayroll}
            className="btn-primary" 
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
          <DollarSign size={18} /> Run Payroll Engine
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EMPLOYEE</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ATTENDANCE</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BASE PAY</th>
              <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NET DISBURSEMENT</th>
              <th style={{ textAlign: 'right', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Calculating financial data...</td></tr>
            ) : error ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</td></tr>
            ) : payroll.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No payroll data generated yet.</td></tr>
            ) : payroll.map((item) => (
              <tr key={item._id} style={{ borderBottom: '1px solid var(--border)', transition: '0.2s' }} className="table-row-hover">
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                            <DollarSign size={18} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '15px' }}>{item.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {item.employeeId}</div>
                        </div>
                    </div>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{item.presentDays} / {item.workingDaysInMonth || 24} Days</div>
                    <div style={{ width: '100px', height: '4px', background: '#f1f5f9', borderRadius: '2px', marginTop: '6px' }}>
                        <div style={{ width: `${Math.min(100, (item.presentDays / (item.workingDaysInMonth || 24)) * 100)}%`, height: '100%', background: '#10b981', borderRadius: '2px' }}></div>
                    </div>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>₹{item.salaryDetails?.baseSalary?.toLocaleString()}</div>
                </td>
                <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)' }}>₹{item.netSalary?.toLocaleString()}</div>
                </td>
                <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handlePrintSlip(item)}
                      style={{ padding: '0.625rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }} 
                      title="Print Slip"
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                      onClick={() => handleDownloadPDF(item)}
                      style={{ padding: '0.625rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }} 
                      title="Download PDF"
                    >
                      <Download size={16} />
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

export default Payroll;

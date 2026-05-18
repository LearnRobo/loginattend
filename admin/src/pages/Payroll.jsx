import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Download, Printer, Calendar as CalendarIcon, Check, X, Edit3 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { API_BASE } from '../api/config';

const Payroll = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payroll, setPayroll] = useState([]);
  const [monthSummary, setMonthSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar configuration modal state
  const [showCalModal, setShowCalModal] = useState(false);
  const [modalDays, setModalDays] = useState([]);
  const [savingCal, setSavingCal] = useState(false);

  useEffect(() => {
    fetchPayroll(selectedMonth);
  }, [selectedMonth]);

  const fetchPayroll = async (monthStr = selectedMonth) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/payroll?month=${monthStr}`, {
        headers: { 'x-auth-token': token }
      });
      setPayroll(res.data.payroll || res.data);
      if (res.data.calendar) {
        setMonthSummary({
          workingDays: res.data.workingDaysInMonth,
          calendar: res.data.calendar
        });
        setModalDays(res.data.calendar.days || []);
      }
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError('Failed to calculate payroll data.');
    }
  };

  const handleDayClick = (index) => {
    const days = [...modalDays];
    const current = days[index];
    let nextType = 'working';
    if (current.type === 'working') nextType = 'sunday';
    else if (current.type === 'sunday') nextType = 'holiday';
    
    days[index] = { ...current, type: nextType };
    setModalDays(days);
  };

  const handleSaveCalendar = async () => {
    setSavingCal(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/payroll/calendar`, {
        monthString: selectedMonth,
        days: modalDays
      }, {
        headers: { 'x-auth-token': token }
      });
      setShowCalModal(false);
      fetchPayroll(selectedMonth);
    } catch (err) {
      console.error('Save Calendar Error:', err);
      alert('Failed to save calendar configuration.');
    } finally {
      setSavingCal(false);
    }
  };

  const generateSlipDoc = (emp) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138);
    doc.text('SALARY DISBURSEMENT SLIP', 105, 20, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Pay Period: ${emp.monthString || selectedMonth}`, 105, 28, { align: 'center' });
    
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
    doc.save(`Salary_Slip_${emp.employeeId}_${emp.monthString || selectedMonth}.pdf`);
  };

  const handlePrintSlip = (emp) => {
    const doc = generateSlipDoc(emp);
    window.open(doc.output('bloburl'), '_blank');
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary)', letterSpacing: '-0.025em' }}>Payroll Management</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Automated salary processing and monthly working calendar controls.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <CalendarIcon size={18} color="var(--primary)" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ border: 'none', outline: 'none', fontWeight: '700', fontSize: '14px', color: 'var(--secondary)', background: 'transparent', cursor: 'pointer' }}
            />
          </div>

          <button 
            onClick={() => setShowCalModal(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.25rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid var(--border)', color: 'var(--secondary)', fontWeight: '700', cursor: 'pointer', transition: '0.2s'
            }}
          >
            <Edit3 size={18} color="#0284c7" /> Configure Working Days ({monthSummary ? monthSummary.workingDays : 24})
          </button>

          <button 
              onClick={() => fetchPayroll(selectedMonth)}
              className="btn-primary" 
              style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)', cursor: 'pointer'
              }}
          >
            <DollarSign size={18} /> Recalculate Payroll
          </button>
        </div>
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

      {/* Calendar Configuration Modal */}
      {showCalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--secondary)' }}>Month Working Calendar ({selectedMonth})</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Click any day box to cycle between Working Day, Sunday, and Holiday.</p>
              </div>
              <button onClick={() => setShowCalModal(false)} style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: 14, height: 14, borderRadius: 4, background: '#10b981' }}></span> <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--secondary)' }}>Working Days ({modalDays.filter(d=>d.type==='working').length})</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: 14, height: 14, borderRadius: 4, background: '#8b5cf6' }}></span> <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--secondary)' }}>Sundays ({modalDays.filter(d=>d.type==='sunday').length})</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ width: 14, height: 14, borderRadius: 4, background: '#ef4444' }}></span> <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--secondary)' }}>Holidays ({modalDays.filter(d=>d.type==='holiday').length})</span></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', marginBottom: '2.5rem' }}>
              {modalDays.map((d, index) => (
                <div 
                  key={d.day} 
                  onClick={() => handleDayClick(index)}
                  style={{ 
                    padding: '1rem 0.5rem', borderRadius: '16px', border: '2px solid', 
                    borderColor: d.type === 'working' ? '#a7f3d0' : d.type === 'sunday' ? '#ddd6fe' : '#fecaca',
                    background: d.type === 'working' ? '#ecfdf5' : d.type === 'sunday' ? '#f5f3ff' : '#fef2f2',
                    textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none'
                  }}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--secondary)' }}>{d.day}</div>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginTop: '6px', color: d.type === 'working' ? '#059669' : d.type === 'sunday' ? '#7c3aed' : '#dc2626' }}>
                    {d.type}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setShowCalModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveCalendar} disabled={savingCal} className="btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={18} /> {savingCal ? 'Saving...' : 'Save & Apply to Payroll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;

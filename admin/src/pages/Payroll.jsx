import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Download, Printer, Calendar as CalendarIcon, Check, X, Edit3, Eye, FileText } from 'lucide-react';
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
  const [previewEmp, setPreviewEmp] = useState(null);

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
    
    // Corporate Header
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text('ROBO HR TECHNOLOGIES PVT. LTD.', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text('Tech Park Tower B, Electronic City, Bengaluru - 560100 | GSTIN: 29AABCR1234Z', 105, 26, { align: 'center' });
    
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.8);
    doc.line(20, 31, 190, 31);
    
    // Title
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text('SALARY DISBURSEMENT SLIP', 105, 40, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(`Pay Period: ${emp.monthString || selectedMonth}`, 105, 46, { align: 'center' });
    
    // Employee Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(20, 52, 170, 38, 3, 3, "FD");
    
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(`Employee Name: ${emp.name}`, 25, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`Employee ID: ${emp.employeeId}`, 25, 67);
    doc.text(`Designation: ${emp.designation || 'Senior Software Engineer'}`, 25, 74);
    doc.text(`Department: ${emp.department || 'Engineering'}`, 25, 81);
    
    const workingDays = emp.workingDaysInMonth || 24;
    doc.setFont("helvetica", "bold");
    doc.text(`Attendance: ${emp.presentDays} / ${workingDays} Days`, 110, 60);
    doc.setFont("helvetica", "normal");
    const bankDetails = emp.bankDetails || {};
    doc.text(`Bank: ${bankDetails.bankName || 'HDFC Bank'}`, 110, 67);
    doc.text(`A/C No: ${bankDetails.accountNumber || '50100293847281'}`, 110, 74);
    doc.text(`PAN: ${bankDetails.panNumber || 'ABCDE1234F'}`, 110, 81);
    
    // Financial Breakdown Table
    const tableColumn = ["Earnings & Deductions Description", "Amount (INR)"];
    const baseSalary = emp.salaryDetails?.baseSalary || 0;
    const bonus = emp.salaryDetails?.bonus || 0;
    const deductions = emp.salaryDetails?.deductions || 0;
    const proRataPay = Math.round((baseSalary / workingDays) * emp.presentDays);
    const netPay = emp.netSalary !== undefined ? emp.netSalary : proRataPay;
    
    const tableRows = [
      ["Base Monthly Pay (Gross Standard)", `Rs. ${baseSalary.toLocaleString()}`],
      [`Earned Pro-rata Pay (${emp.presentDays} Days Attendance)`, `Rs. ${proRataPay.toLocaleString()}`],
      ["Allowances / Overtime / Monthly Bonus", `+ Rs. ${bonus.toLocaleString()}`],
      ["Deductions (TDS / Professional Tax / PF / LOP)", `- Rs. ${deductions.toLocaleString()}`],
      ["NET DISBURSEMENT PAY", `Rs. ${netPay.toLocaleString()}`]
    ];
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 96,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 11, fontStyle: 'bold' },
      bodyStyles: { textColor: 40, fontSize: 11 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      didParseCell: function(data) {
        if (data.row.index === 4 && data.section === 'body') {
          data.cell.styles.fillColor = [240, 248, 255];
          data.cell.styles.textColor = [15, 23, 42];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer-generated salary slip and does not require a physical signature or rubber stamp.', 105, finalY, { align: 'center' });
    
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
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)' }}>{item.presentDays} / {item.workingDaysInMonth || 24} Days</div>
                    {item.absentLeaveDays > 0 ? (
                      <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700', marginTop: '2px' }}>
                        ({item.absentLeaveDays} Days Deducted / Absent Leave)
                      </div>
                    ) : item.leaveDays > 0 ? (
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginTop: '2px' }}>
                        ({item.attendanceCount} Punches + {item.leaveDays} Paid Leaves)
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Physical Attendance
                      </div>
                    )}
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
                      onClick={() => setPreviewEmp(item)}
                      style={{ padding: '0.625rem', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', cursor: 'pointer' }} 
                      title="Interactive Payslip Preview"
                    >
                      <Eye size={16} />
                    </button>
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

      {/* Interactive High-Fidelity Payslip Preview Modal */}
      {previewEmp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}>
          <div className="scale-in" style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border)', position: 'relative' }}>
            <div style={{ height: '12px', background: 'linear-gradient(90deg, #4f46e5, #818cf8, #38bdf8)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}></div>
            
            <div style={{ padding: '2.5rem 3rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800' }}>R</div>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--secondary)' }}>ROBO HR TECHNOLOGIES PVT. LTD.</h1>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tech Park Tower B, Electronic City, Bengaluru | GSTIN: 29AABCR1234Z</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  onClick={() => handleDownloadPDF(previewEmp)}
                  style={{ padding: '0.625rem 1rem', borderRadius: '10px', background: '#4f46e5', color: 'white', fontWeight: '700', fontSize: '13px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Download size={16} /> Download PDF
                </button>
                <button 
                  onClick={() => setPreviewEmp(null)}
                  style={{ padding: '0.625rem', borderRadius: '10px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ padding: '2rem 3rem', background: '#fcfcfd', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SALARY DISBURSEMENT SLIP</h3>
                <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#e0e7ff', color: '#3730a3', fontSize: '12px', fontWeight: '700' }}>Pay Period: {previewEmp.monthString || selectedMonth}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#4f46e5', marginBottom: '12px', letterSpacing: '0.5px' }}>Employee Summary</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Name:</span> <strong style={{ color: 'var(--secondary)' }}>{previewEmp.name}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Employee ID:</span> <strong style={{ color: 'var(--secondary)' }}>{previewEmp.employeeId}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Designation:</span> <strong style={{ color: 'var(--secondary)' }}>{previewEmp.designation || 'Senior Software Engineer'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Department:</span> <strong style={{ color: 'var(--secondary)' }}>{previewEmp.department || 'Engineering'}</strong></div>
                </div>

                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#4f46e5', marginBottom: '12px', letterSpacing: '0.5px' }}>Banking & Compliance</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Bank Name:</span> <strong style={{ color: 'var(--secondary)' }}>{previewEmp.bankDetails?.bankName || 'HDFC Bank'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Account No:</span> <strong style={{ color: 'var(--secondary)' }}>{previewEmp.bankDetails?.accountNumber || '50100293847281'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>PAN Number:</span> <strong style={{ color: 'var(--secondary)' }}>{previewEmp.bankDetails?.panNumber || 'ABCDE1234F'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>PF / UAN No:</span> <strong style={{ color: 'var(--secondary)' }}>{previewEmp.bankDetails?.uanNumber || '100928374652'}</strong></div>
                </div>
              </div>
            </div>

            <div style={{ padding: '2rem 3rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px 16px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}><span>Earnings Description</span> <span>Amount</span></div>
                  <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', fontSize: '14px' }}><span>Base Monthly Pay</span> <strong>₹{(previewEmp.salaryDetails?.baseSalary || 0).toLocaleString()}</strong></div>
                  <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', fontSize: '14px' }}><span>Earned Pro-rata Pay ({previewEmp.presentDays} Days)</span> <strong>₹{Math.round(((previewEmp.salaryDetails?.baseSalary || 0) / (previewEmp.workingDaysInMonth || 24)) * previewEmp.presentDays).toLocaleString()}</strong></div>
                  <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#10b981' }}><span>Allowances / Bonus</span> <strong>+₹{(previewEmp.salaryDetails?.bonus || 0).toLocaleString()}</strong></div>
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}><span>Deductions Description</span> <span>Amount</span></div>
                  <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', fontSize: '14px', color: '#ef4444' }}><span>Deductions / LOP / Tax</span> <strong>-₹{(previewEmp.salaryDetails?.deductions || 0).toLocaleString()}</strong></div>
                  <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}><span>Absent Days ({previewEmp.absentLeaveDays})</span> <strong>₹0</strong></div>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', color: 'white', padding: '2rem 2.5rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '4px' }}>Net Pay Disbursed</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#38bdf8' }}>₹{(previewEmp.netSalary !== undefined ? previewEmp.netSalary : Math.round(((previewEmp.salaryDetails?.baseSalary || 0) / (previewEmp.workingDaysInMonth || 24)) * previewEmp.presentDays)).toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 20px', borderRadius: '16px', textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>{previewEmp.presentDays} / {previewEmp.workingDaysInMonth || 24} Days</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Verified Attendance</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '18px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #a7f3d0', fontWeight: '800' }}>✓</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#10b981' }}>Digitally Verified System Payslip</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Certified secure document. No physical stamp required.</div>
                  </div>
                </div>
                <button 
                  onClick={() => handlePrintSlip(previewEmp)} 
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: '#0f172a', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Printer size={18} /> Print Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;

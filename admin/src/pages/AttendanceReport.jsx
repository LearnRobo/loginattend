import React, { useState, useEffect } from 'react';
import { Filter, Download, FileText, Table as TableIcon, Loader2, Search, Trash2, AlertTriangle, Eye, Clock, MapPin as MapPinIcon, ShieldCheck } from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { API_BASE, UPLOADS_BASE } from '../api/config';

const AttendanceReport = () => {
  const [attendance, setAttendance] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reseting, setReseting] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    employee: '',
    month: '',
  });
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/attendance/all`, {
        headers: { 'x-auth-token': token }
      });
      
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const rawData = await response.json();
      
      const mappedData = rawData.map(log => ({
        id: log._id,
        empId: log.user?.employeeId || 'N/A',
        empName: log.user?.name || 'N/A',
        officeName: log.office?.name || 'Main Office',
        date: log.date,
        checkInTime: log.checkIn?.time ? new Date(log.checkIn.time).toLocaleTimeString() : '--:--',
        checkInPhoto: log.checkIn?.faceImage ? (log.checkIn.faceImage.startsWith('data:') ? log.checkIn.faceImage : `${UPLOADS_BASE}/${log.checkIn.faceImage}`) : null,
        checkOutTime: log.checkOut?.time ? new Date(log.checkOut.time).toLocaleTimeString() : '--:--',
        checkOutPhoto: log.checkOut?.faceImage ? (log.checkOut.faceImage.startsWith('data:') ? log.checkOut.faceImage : `${UPLOADS_BASE}/${log.checkOut.faceImage}`) : null,
        status: log.status,
      }));

      setAttendance(mappedData);
      setFilteredData(mappedData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm("⚠️ DANGER ZONE: This will permanently delete ALL attendance logs. Are you absolutely sure?");
    if (!confirmed) return;

    setReseting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/attendance/reset`, {
        headers: { 'x-auth-token': token }
      });
      alert("Database reset successful.");
      fetchAttendance();
    } catch (err) {
      alert("Failed to reset database: " + (err.response?.data?.msg || err.message));
    } finally {
      setReseting(false);
    }
  };

  const applyFilters = () => {
    let result = [...attendance];
    if (filters.date) result = result.filter(item => item.date === filters.date);
    if (filters.employee) {
      result = result.filter(item => 
        item.empName.toLowerCase().includes(filters.employee.toLowerCase()) || 
        item.empId.toLowerCase().includes(filters.employee.toLowerCase())
      );
    }
    if (filters.month) result = result.filter(item => item.date.startsWith(filters.month));
    setFilteredData(result);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, attendance]);

  const exportCSV = () => {
    const csvData = filteredData.map(item => ({
      'Employee ID': item.empId, 'Name': item.empName, 'Office': item.officeName, 'Date': item.date, 'Check-In': item.checkInTime, 'Check-Out': item.checkOutTime, 'Status': item.status
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Detailed_Report_${new Date().toLocaleDateString()}.csv`);
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Detailed Attendance Report', 14, 15);
    const tableColumn = ["Emp ID", "Name", "Office", "Date", "In Time", "Out Time", "Status"];
    const tableRows = filteredData.map(item => [item.empId, item.empName, item.officeName, item.date, item.checkInTime, item.checkOutTime, item.status]);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30 });
    doc.save(`Detailed_Report_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="p-8 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Attendance Intelligence</h2>
          <p className="text-gray-500 mt-1">Full shift details with visual verification and multi-site tracking.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold shadow-sm">
            <Download size={18} /> CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold shadow-sm">
            <FileText size={18} /> PDF
          </button>
          <button 
            onClick={handleReset} 
            disabled={reseting}
            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-bold shadow-sm"
          >
            {reseting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            {reseting ? 'Resetting...' : 'Reset DB'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Search Staff</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text" placeholder="Name or Employee ID..." 
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium"
                value={filters.employee}
                onChange={(e) => setFilters({...filters, employee: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Specific Day</label>
            <input 
              type="date" 
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium"
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Monthly View</label>
            <input 
              type="month" 
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium"
              value={filters.month}
              onChange={(e) => setFilters({...filters, month: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-32 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            <p className="text-gray-500 font-bold text-lg">Analyzing Data Logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Employee Detail</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Branch</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Punch In</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Punch Out</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Shift Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.length > 0 ? filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-800 text-base">{record.empName}</div>
                      <div className="text-xs text-gray-400 font-bold mt-0.5 tracking-wider uppercase">{record.empId} • {record.date}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                          <MapPinIcon size={14} />
                        </div>
                        <span className="font-bold text-gray-700 text-sm">{record.officeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                          <Clock size={14} /> {record.checkInTime}
                        </div>
                        {record.checkInPhoto && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0 cursor-pointer" onClick={() => setActivePhoto({ url: record.checkInPhoto, name: record.empName, date: record.date, type: 'Punch-In', empId: record.empId, time: record.checkInTime })}>
                              <img 
                                src={record.checkInPhoto} 
                                alt="Check In" 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                            <button 
                               onClick={() => setActivePhoto({ url: record.checkInPhoto, name: record.empName, date: record.date, type: 'Punch-In', empId: record.empId, time: record.checkInTime })}
                               className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-[10px] font-black text-gray-500 transition-all border border-gray-100 cursor-pointer">
                              <Eye size={12} /> VIEW
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-purple-600 font-black text-sm">
                          <Clock size={14} /> {record.checkOutTime}
                        </div>
                        {record.checkOutPhoto && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0 cursor-pointer" onClick={() => setActivePhoto({ url: record.checkOutPhoto, name: record.empName, date: record.date, type: 'Punch-Out', empId: record.empId, time: record.checkOutTime })}>
                              <img 
                                src={record.checkOutPhoto} 
                                alt="Check Out" 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                            <button 
                               onClick={() => setActivePhoto({ url: record.checkOutPhoto, name: record.empName, date: record.date, type: 'Punch-Out', empId: record.empId, time: record.checkOutTime })}
                               className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-[10px] font-black text-gray-500 transition-all border border-gray-100 cursor-pointer">
                              <Eye size={12} /> VIEW
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase ${
                        record.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-6 bg-gray-50 rounded-full mb-4">
                          <TableIcon size={48} className="text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold text-xl">No logs found for this period.</p>
                        <p className="text-gray-300 text-sm mt-1">New data will appear here as employees complete their shifts.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-6 p-6 bg-indigo-900 rounded-[2rem] text-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-all">
          <ShieldCheck size={120} />
        </div>
        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
          <AlertTriangle size={28} />
        </div>
        <div>
          <h4 className="font-bold text-lg mb-0.5">Visual Verification Active</h4>
          <p className="text-indigo-200 text-sm">All punch actions are timestamped and verified against facial data and geofence coordinates.</p>
        </div>
      </div>

      {activePhoto && (
        <div 
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-[2rem] p-8 max-w-[440px] w-full border border-gray-100 shadow-2xl flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  activePhoto.type === 'Punch-In' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                }`}>{activePhoto.type} Photo</span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-2 mb-0.5">{activePhoto.name}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">ID: {activePhoto.empId} • {activePhoto.date} at {activePhoto.time}</p>
              </div>
              <button 
                onClick={() => setActivePhoto(null)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center font-bold text-gray-400 hover:bg-gray-100 transition-all outline-none"
              >✕</button>
            </div>
            
            <div className="w-full h-[320px] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50/50">
              <img 
                src={activePhoto.url} 
                alt="Verification Selfie" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <button 
              onClick={() => setActivePhoto(null)} 
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-100"
            >
              Dismiss Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReport;

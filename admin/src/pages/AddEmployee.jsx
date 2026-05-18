import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, Camera, Save, Loader2, ArrowLeft, DollarSign, MapPin, Building2, Check, Briefcase, CreditCard } from 'lucide-react';
import axios from 'axios';
import { API_BASE, BASE_URL } from '../api/config';

const AddEmployee = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [existingPhoto, setExistingPhoto] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    empId: '',
    phone: '',
    email: '',
    password: '',
    officeLat: '25.3745',
    officeLng: '82.9213',
    baseSalary: '',
    bonus: '0',
    deductions: '0',
    assignedOffices: [],
    designation: 'Software Engineer',
    department: 'Engineering',
    bankName: 'HDFC Bank',
    accountNumber: '50100293847281',
    ifscCode: 'HDFC0001234',
    panNumber: 'ABCDE1234F',
    uanNumber: '100928374652',
    pfNumber: 'MH/BAN/0019283/000/0001234'
  });
  
  const [offices, setOffices] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchOffices();
    if (isEdit) {
      fetchEmployeeData();
    }
  }, [id]);

  const fetchOffices = async () => {
    setLoadingOffices(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/offices`, {
        headers: { 'x-auth-token': token }
      });
      console.log("Fetched offices:", res.data);
      setOffices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching offices", err);
    } finally {
      setLoadingOffices(false);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/employees/${id}`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      
      if (response.ok) {
        if (data.faceImage) {
          setExistingPhoto(data.faceImage);
        }
        setFormData({
          name: data.name || '',
          empId: data.employeeId || '',
          phone: data.phone || '',
          email: data.email || '',
          password: '',
          officeLat: data.officeCoords?.lat?.toString() || '25.3745',
          officeLng: data.officeCoords?.lng?.toString() || '82.9213',
          baseSalary: data.salaryDetails?.baseSalary?.toString() || '',
          bonus: data.salaryDetails?.bonus?.toString() || '0',
          deductions: data.salaryDetails?.deductions?.toString() || '0',
          assignedOffices: data.assignedOffices?.map(o => (o && typeof o === 'object') ? (o._id || o) : o) || [],
          designation: data.designation || 'Software Engineer',
          department: data.department || 'Engineering',
          bankName: data.bankDetails?.bankName || 'HDFC Bank',
          accountNumber: data.bankDetails?.accountNumber || '50100293847281',
          ifscCode: data.bankDetails?.ifscCode || 'HDFC0001234',
          panNumber: data.bankDetails?.panNumber || 'ABCDE1234F',
          uanNumber: data.bankDetails?.uanNumber || '100928374652',
          pfNumber: data.bankDetails?.pfNumber || 'MH/BAN/0019283/000/0001234'
        });
      } else {
        setMessage({ type: 'error', text: data.msg || 'Failed to load employee data' });
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage({ type: 'error', text: 'Failed to load employee data' });
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleOffice = (officeId) => {
    const current = [...formData.assignedOffices];
    const index = current.indexOf(officeId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(officeId);
    }
    setFormData({ ...formData, assignedOffices: current });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      if (formData.password) data.append('password', formData.password);
      data.append('employeeId', formData.empId);
      data.append('phone', formData.phone);
      data.append('officeLat', formData.officeLat);
      data.append('officeLng', formData.officeLng);
      data.append('baseSalary', formData.baseSalary);
      data.append('bonus', formData.bonus);
      data.append('deductions', formData.deductions);
      data.append('designation', formData.designation);
      data.append('department', formData.department);
      data.append('bankName', formData.bankName);
      data.append('accountNumber', formData.accountNumber);
      data.append('ifscCode', formData.ifscCode);
      data.append('panNumber', formData.panNumber);
      data.append('uanNumber', formData.uanNumber);
      data.append('pfNumber', formData.pfNumber);
      
      // Append faceImage if a new file was selected
      if (image) {
        data.append('faceImage', image);
      }

      // Append assigned offices or empty indicator
      if (formData.assignedOffices.length === 0) {
        data.append('assignedOffices', '');
      } else {
        formData.assignedOffices.forEach(id => {
          data.append('assignedOffices', id);
        });
      }

      const url = isEdit ? `${API_BASE}/employees/${id}` : `${API_BASE}/employees`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'x-auth-token': token
        },
        body: data
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || 'Action failed');
      }

      setMessage({ type: 'success', text: isEdit ? 'Employee updated successfully!' : 'Employee created successfully!' });
      setTimeout(() => navigate('/employees'), 2000);
      
    } catch (error) {
      console.error('Submit Error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/employees')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Employee Profile' : 'Create Full Employee Profile'}</h1>
            <p className="text-gray-500 text-sm">{isEdit ? 'Modify the existing details of this staff member.' : 'Fill in all details including location and salary.'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50">
                <UserPlus size={20} className="text-indigo-600" />
                <h2 className="font-bold text-gray-800">Personal Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Employee ID</label>
                  <input type="text" name="empId" value={formData.empId} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Login Password {isEdit && '(Leave blank to keep current)'}</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required={!isEdit} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50">
                <DollarSign size={20} className="text-green-600" />
                <h2 className="font-bold text-gray-800">Salary Configuration</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Salary (₹)</label>
                  <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Bonus (₹)</label>
                  <input type="number" name="bonus" value={formData.bonus} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deductions (₹)</label>
                  <input type="number" name="deductions" value={formData.deductions} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50">
                <Briefcase size={20} className="text-blue-600" />
                <h2 className="font-bold text-gray-800">Corporate & Banking Details (For Professional Payslip)</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Designation</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                  <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Account Number</label>
                  <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IFSC Code</label>
                  <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PAN Number</label>
                  <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UAN Number</label>
                  <input type="text" name="uanNumber" value={formData.uanNumber} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PF Number</label>
                  <input type="text" name="pfNumber" value={formData.pfNumber} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50">
                <Building2 size={20} className="text-orange-600" />
                <h2 className="font-bold text-gray-800">Allot Offices</h2>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {loadingOffices ? (
                  <div className="py-4 flex justify-center">
                    <Loader2 className="animate-spin text-gray-300" size={24} />
                  </div>
                ) : offices.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No offices found. Please add offices first.</p>
                ) : (
                  offices.map(office => (
                    <button
                      key={office._id}
                      type="button"
                      onClick={() => toggleOffice(office._id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        formData.assignedOffices.includes(office._id)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${formData.assignedOffices.includes(office._id) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <Building2 size={14} />
                        </div>
                        <span className="text-sm font-bold">{office.name}</span>
                      </div>
                      {formData.assignedOffices.includes(office._id) && <Check size={16} />}
                    </button>
                  ))
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-widest">Select one or more offices</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50">
                <Camera size={20} className="text-purple-600" />
                <h2 className="font-bold text-gray-800">Verification Photo</h2>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                  {image ? (
                    <img src={URL.createObjectURL(image)} alt="Preview" className="w-full h-full object-cover" />
                  ) : existingPhoto ? (
                    <img src={`${BASE_URL}/uploads/${existingPhoto}`} alt="Existing Verification Photo" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="text-gray-300" size={32} />
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} required={!isEdit} className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end gap-4 pb-12">
          <button type="button" onClick={() => navigate('/employees')} className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancel</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? (isEdit ? 'Updating Profile...' : 'Creating Profile...') : (isEdit ? 'Update Employee' : 'Save & Create Employee')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;

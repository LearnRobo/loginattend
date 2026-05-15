import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, MapPin, Trash2, Building2, Globe, Navigation, X, Loader2, XCircle, Edit2 } from 'lucide-react';
import { API_BASE } from '../api/config';

const OfficeManagement = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '', lat: '', lng: '', address: '', radius: '100'
  });

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/offices`, {
        headers: { 'x-auth-token': token }
      });
      setOffices(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleEdit = (office) => {
    setEditingId(office._id);
    setFormData({
      name: office.name,
      lat: office.location.lat.toString(),
      lng: office.location.lng.toString(),
      address: office.address || '',
      radius: office.radius.toString()
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      if (editingId) {
        // UPDATE Existing
        await axios.put(`${API_BASE}/offices/${editingId}`, formData, config);
      } else {
        // CREATE New
        await axios.post(`${API_BASE}/offices`, formData, config);
      }
      
      setShowModal(false);
      fetchOffices();
      resetForm();
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Could not save office. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', lat: '', lng: '', address: '', radius: '100' });
    setEditingId(null);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this office? Employees assigned to it will need reassignment.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE}/offices/${id}`, {
          headers: { 'x-auth-token': token }
        });
        fetchOffices();
      } catch (err) {
        alert('Error deleting office');
      }
    }
  };

  return (
    <div className="p-8 fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Office Locations</h2>
          <p className="text-gray-500 mt-1">Manage multiple branches and their geofencing perimeters.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus size={20} /> Add New Office
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center py-20">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="text-gray-500 font-medium">Loading your offices...</p>
          </div>
        ) : offices.length === 0 ? (
          <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-20 flex flex-col items-center">
            <Building2 size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold">No offices added yet</p>
            <p className="text-gray-400 text-sm">Add your first branch location to get started.</p>
          </div>
        ) : offices.map((office) => (
          <div key={office._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                <Building2 size={24} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(office)}
                  className="text-gray-300 hover:text-indigo-600 p-2 transition-colors"
                  title="Edit Office"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(office._id)}
                  className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                  title="Delete Office"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-1">{office.name}</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-1">{office.address || 'No address provided'}</p>
            
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Globe size={16} className="text-gray-400" />
                <span>{office.location.lat}, {office.location.lng}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Navigation size={16} className="text-gray-400" />
                <span className="font-medium text-indigo-600">Radius: {office.radius} Meters</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-0 shadow-2xl scale-in overflow-hidden">
            <div className="p-8 bg-indigo-600 text-white relative">
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-white/70 hover:text-white">
                <X size={24} />
              </button>
              <h3 className="text-2xl font-bold mb-1">{editingId ? 'Edit Office' : 'Add New Branch'}</h3>
              <p className="text-indigo-100 text-sm">{editingId ? 'Update branch details and geofence.' : 'Define a new geofenced office location.'}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                  <XCircle size={16} /> {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">Office Name (Required)</label>
                  <input 
                    type="text" required value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                    placeholder="e.g. Headquarters / Branch 1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">Full Office Address</label>
                  <input 
                    type="text" value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                    placeholder="Street name, City, State"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">Latitude</label>
                    <input 
                      type="number" step="any" required value={formData.lat}
                      onChange={e => setFormData({...formData, lat: e.target.value})}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                      placeholder="25.3740"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">Longitude</label>
                    <input 
                      type="number" step="any" required value={formData.lng}
                      onChange={e => setFormData({...formData, lng: e.target.value})}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                      placeholder="82.9210"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">Geofence Radius (Meters)</label>
                  <div className="relative">
                    <input 
                      type="number" required value={formData.radius}
                      onChange={e => setFormData({...formData, radius: e.target.value})}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">METERS</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-4 rounded-2xl font-bold bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-[1.5] px-8 py-4 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Building2 size={20} />}
                  {saving ? 'Saving...' : (editingId ? 'Update Office' : 'Save Office')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeManagement;

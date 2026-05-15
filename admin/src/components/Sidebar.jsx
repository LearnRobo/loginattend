import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UserPlus, FileBarChart, LogOut, ShieldCheck, Building2 } from 'lucide-react';

const Sidebar = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/employees', icon: <UserPlus size={20} />, label: 'Employee Management' },
    { to: '/offices', icon: <Building2 size={20} />, label: 'Offices' },
    { to: '/reports', icon: <FileBarChart size={20} />, label: 'Reports' },
  ];

  return (
    <div className="w-64 h-screen bg-indigo-900 text-white flex flex-col sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-indigo-800">
        <div className="bg-white p-2 rounded-lg">
          <ShieldCheck className="text-indigo-900" size={24} />
        </div>
        <span className="font-bold text-lg tracking-tight">Smart Attendance</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'
              }`
            }
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-indigo-200 hover:bg-indigo-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

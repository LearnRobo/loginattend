import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentAttendance, setRecentAttendance] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/attendance/stats', {
        headers: { 'x-auth-token': token }
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);

      // Get recent activity
      const recentRes = await fetch('http://localhost:5000/api/attendance/all', {
        headers: { 'x-auth-token': token }
      });
      const recentData = await recentRes.json();
      setRecentAttendance(recentData.slice(0, 5));
      
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [stats.presentToday || 0, stats.absentToday || 0],
        backgroundColor: ['#4caf50', '#f44336'],
        hoverBackgroundColor: ['#45a049', '#e53935'],
      },
    ],
  };

  if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Employees" 
          value={stats.totalEmployees} 
          icon={<Users className="text-blue-500" />} 
          color="bg-blue-50"
        />
        <StatCard 
          title="Present Today" 
          value={stats.presentToday} 
          icon={<UserCheck className="text-green-500" />} 
          color="bg-green-50"
        />
        <StatCard 
          title="Absent Today" 
          value={stats.absentToday} 
          icon={<UserX className="text-red-500" />} 
          color="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Today's Attendance Ratio</h2>
          <div className="h-64 flex justify-center">
            <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentAttendance.length > 0 ? recentAttendance.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {item.user?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">
                      {item.checkIn?.time ? new Date(item.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No Time'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
            )) : (
              <p className="text-gray-500 text-sm italic">No attendance records found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className={`${color} p-6 rounded-xl border border-opacity-50`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className="p-3 bg-white rounded-lg shadow-sm">
        {icon}
      </div>
    </div>
  </div>
);

export default Dashboard;

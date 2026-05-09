import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import AdminService from '../../services/AdminService';
import { useAuth } from '../../hooks/useAuth';
import { Users, ShieldAlert, CheckCircle, Sun, Moon, UserPlus } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, donors: 0, recipients: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await AdminService.monitorActivity();
        if (res.success) {
          setStats({
            total: res.data.length,
            donors: res.data.filter(u => u.Role === 'Donor').length,
            recipients: res.data.filter(u => u.Role === 'Recipient').length,
            inactive: res.data.filter(u => u.status === 'Deactivated').length
          });
        }
      } catch { console.error("Stats sync failed"); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white font-black animate-pulse uppercase tracking-[0.5em]">
        Initialising Authority...
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>
      <Sidebar isDarkMode={isDarkMode} />
      
      <main className="flex-1 ml-72 p-10 relative overflow-y-auto h-screen">
        {/* HEADER AREA */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>Portal Overview</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1 italic">
              System Authority: <span className="text-medical-red font-black">{user?.FirstName}</span>
            </p>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`p-3.5 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}
          >
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* PRIMARY STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard 
            icon={<Users size={22}/>} 
            label="Total Members" 
            val={stats.total} 
            color="bg-blue-600" 
            dark={isDarkMode} 
          />
          <StatCard 
            icon={<CheckCircle size={22}/>} 
            label="Verified Donors" 
            val={stats.donors} 
            color="bg-medical-red" 
            dark={isDarkMode} 
          />
          <StatCard 
            icon={<UserPlus size={22}/>} 
            label="Patients Registry" 
            val={stats.recipients} 
            color="bg-green-600" 
            dark={isDarkMode} 
          />
          <StatCard 
            icon={<ShieldAlert size={22}/>} 
            label="Deactivated" 
            val={stats.inactive} 
            color="bg-slate-700" 
            dark={isDarkMode} 
          />
        </div>
      </main>
    </div>
  );
};

// Simplified, Professional Stat Card
const StatCard = ({ icon, label, val, color, dark }) => (
  <div className={`p-8 rounded-[45px] border flex items-center gap-6 transition-all duration-500 shadow-xl ${
    dark ? 'bg-[#1e293b] border-white/5 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'
  }`}>
    <div className={`w-14 h-14 rounded-2xl text-white ${color} flex items-center justify-center shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-4xl font-black tracking-tighter ${dark ? 'text-white' : 'text-[#1B2559]'}`}>
        {val}
      </p>
    </div>
  </div>
);

export default AdminDashboard;
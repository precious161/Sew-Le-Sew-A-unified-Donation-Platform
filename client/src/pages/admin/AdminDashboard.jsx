import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import AdminService from '../../services/AdminService';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, ShieldAlert, UserCog, CheckCircle, 
  XCircle, Search, Sun, Moon 
} from 'lucide-react';
import bgImage from '../../assets/auth-bg.jpg';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearch] = useState('');

  // 1. Operation: MonitorActivity() - Fetch all users from registry
  const fetchUsers = async () => {
    try {
      const res = await AdminService.monitorActivity();
      if (res.success) setUsers(res.data);
    } catch {
      console.error("Failed to synchronize system records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // 2. Operation: DeactivateAccount() - Toggle User Status
  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Deactivated' : 'Active';
    if (window.confirm(`Are you sure you want to set this user to ${newStatus}?`)) {
      const res = await AdminService.updateUserStatus(userId, newStatus);
      if (res.success) fetchUsers(); 
    }
  };

  // 3. Operation: AssignRole() - Change Authorization Level
  const handleRoleChange = async (userId, newRole) => {
    const res = await AdminService.updateUserRole(userId, newRole);
    if (res.success) fetchUsers();
  };

  // Search/Filter Logic
  const filteredUsers = users.filter(u => 
    u.EmailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.LastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading Screen (Satisfies ESLint 'loading' variable requirement)
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0f172a]">
        <div className="w-12 h-12 border-4 border-medical-red border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
          Synchronizing Registry...
        </p>
      </div>
    );
  }

  return (
    <div 
      className="flex min-h-screen transition-all duration-700 relative overflow-hidden"
      style={{ 
        // NIGHT MODE: Gradient | DAY MODE: Pure White
        backgroundImage: isDarkMode 
          ? 'radial-gradient(at 0% 0%, #2e0202 0, transparent 50%), radial-gradient(at 100% 100%, #0f172a 0, transparent 50%)' 
          : 'none',
        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff'
      }}
    >
      <Sidebar isDarkMode={isDarkMode} />

      {/* Optional image overlay for Night mode depth */}
      {isDarkMode && (
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover' }}></div>
      )}

      <main className="flex-1 ml-72 p-10 relative z-10 overflow-y-auto h-screen custom-scrollbar">
        {/* Header Section */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className={`text-4xl font-black tracking-tighter uppercase italic transition-colors duration-500 ${
              isDarkMode ? 'text-white' : 'text-[#1B2559]'
            }`}>
                System Administration
            </h1>
            <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mt-2 ${
              isDarkMode ? 'text-white/40' : 'text-gray-400'
            }`}>
                Admin: <span className="text-medical-red">{user?.FirstName} {user?.LastName}</span> • Registry Control
            </p>
          </div>
          
          <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 rounded-2xl transition-all shadow-lg ${
                isDarkMode ? 'bg-yellow-400 text-black scale-110' : 'bg-[#111C44] text-white'
              }`}
          >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Population Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard 
            icon={<Users size={24}/>} 
            label="Total Population" 
            val={users.length} 
            color="bg-blue-600" 
            dark={isDarkMode} 
          />
          <StatCard 
            icon={<CheckCircle size={24}/>} 
            label="Active Donors" 
            val={users.filter(u => u.Role === 'Donor' && u.status === 'Active').length} 
            color="bg-green-600" 
            dark={isDarkMode} 
          />
          <StatCard 
            icon={<ShieldAlert size={24}/>} 
            label="Deactivated" 
            val={users.filter(u => u.status === 'Deactivated').length} 
            color="bg-medical-red" 
            dark={isDarkMode} 
          />
        </div>

        {/* Registry Table Card */}
        <div className={`rounded-[45px] shadow-2xl border transition-all duration-500 overflow-hidden ${
          isDarkMode 
          ? 'bg-[#1e293b]/60 backdrop-blur-xl border-white/5' 
          : 'bg-white border-gray-100 shadow-gray-200'
        }`}>
          <div className={`p-10 border-b flex flex-col md:flex-row justify-between items-center gap-6 ${
            isDarkMode ? 'border-white/10' : 'border-gray-50'
          }`}>
            <h2 className={`font-black uppercase italic tracking-tighter ${
              isDarkMode ? 'text-white' : 'text-[#1B2559]'
            }`}>Database Identities</h2>
            
            <div className="relative w-full md:w-96">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`} size={20} />
              <input 
                placeholder="Search by name or email address..."
                className={`w-full pl-12 pr-6 py-4 rounded-[20px] text-sm outline-none transition-all border ${
                  isDarkMode 
                  ? 'bg-white/5 border-white/10 text-white focus:border-medical-red' 
                  : 'bg-gray-50 border-gray-100 text-[#1B2559] focus:border-blue-500'
                }`}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className={`${isDarkMode ? 'bg-black/20 text-white/30' : 'bg-gray-50 text-gray-800'} text-[10px] font-black uppercase tracking-[0.25em]`}>
                <tr>
                  <th className="px-10 py-6">User Profile</th>
                  <th className="px-10 py-6">Authorization</th>
                  <th className="px-10 py-6">Life Cycle</th>
                  <th className="px-10 py-6 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-50'}`}>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={`transition-all duration-300 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-blue-50/40'}`}>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-medical-red text-white flex items-center justify-center font-black text-sm shadow-lg shadow-red-900/20">
                          {u.FirstName[0]}{u.LastName[0]}
                        </div>
                        <div>
                          <p className={`font-black text-sm uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>{u.FirstName} {u.LastName}</p>
                          <p className={`text-[11px] font-medium ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>{u.EmailAddress}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="relative max-w-[150px]">
                        <UserCog size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`} />
                        <select 
                          value={u.Role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`w-full border text-[10px] font-black uppercase py-3 pl-9 pr-2 rounded-xl outline-none appearance-none cursor-pointer transition-all ${
                            isDarkMode 
                            ? 'bg-white/5 border-white/10 text-white' 
                            : 'bg-white border-gray-200 text-[#1B2559]'
                          }`}
                        >
                          <option value="Donor" className="bg-[#0f172a]">Donor</option>
                          <option value="Recipient" className="bg-[#0f172a]">Recipient</option>
                          <option value="Red_Cross_Admin" className="bg-[#0f172a]">Admin</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-[0.1em] border transition-all ${
                        u.status === 'Active' 
                        ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                        : 'bg-red-500/10 border-red-500/30 text-red-500'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <button 
                        onClick={() => handleStatusToggle(u.id, u.status)}
                        className={`p-3 rounded-2xl transition-all shadow-sm active:scale-90 ${
                          u.status === 'Active' 
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                          : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'
                        }`}
                      >
                        {u.status === 'Active' ? <XCircle size={22}/> : <CheckCircle size={22}/>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
              <div className={`p-20 text-center text-sm font-bold uppercase tracking-widest opacity-20 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                No registered users found
              </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Helper Component for Stats
const StatCard = ({ icon, label, val, color, dark }) => (
  <div className={`p-8 rounded-[40px] border transition-all duration-500 flex items-center gap-6 shadow-2xl ${
    dark ? 'bg-[#1e293b] border-white/5 shadow-black/30' : 'bg-white border-gray-100 shadow-gray-200/40'
  }`}>
    <div className={`w-16 h-16 rounded-[22px] text-white ${color} shadow-xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className={`text-4xl font-black tracking-tighter ${dark ? 'text-white' : 'text-[#1B2559]'}`}>{val}</p>
    </div>
  </div>
);

export default AdminDashboard;
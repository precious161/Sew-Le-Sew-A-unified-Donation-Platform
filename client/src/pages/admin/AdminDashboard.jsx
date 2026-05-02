import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import NotificationHub from '../../components/notifications/NotificationHub';
import AdminService from '../../services/AdminService';
import AlertService from '../../services/AlertService';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, ShieldAlert, UserCog, CheckCircle, 
  XCircle, Search, Sun, Moon, Send, AlertTriangle, X 
} from 'lucide-react';
import bgImage from '../../assets/auth-bg.jpg';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearch] = useState('');
  
  // Custom Modal States
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, userId: null, name: '', newStatus: '' });
  const [alertModal, setAlertModal] = useState({ isOpen: false, userId: null, name: '', message: '' });

  const fetchUsers = async () => {
    try {
      const res = await AdminService.monitorActivity();
      if (res.success) setUsers(res.data);
    } catch { 
      console.error("Registry sync failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const triggerStatusToggle = (u) => {
    const newStatus = u.status === 'Active' ? 'Deactivated' : 'Active';
    setConfirmModal({ isOpen: true, userId: u.id, name: u.FirstName, newStatus });
  };

  const executeStatusChange = async () => {
    try {
      const res = await AdminService.updateUserStatus(confirmModal.userId, confirmModal.newStatus);
      if (res.success) {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await fetchUsers();
      }
    } catch (err) {
      console.error("Status update failed");
    }
  };

  const triggerAlertModal = (u) => {
    setAlertModal({ isOpen: true, userId: u.id, name: u.FirstName, message: '' });
  };

  const executeSendAlert = async () => {
    if (!alertModal.message.trim()) return;
    try {
      const res = await AlertService.sendAlert(alertModal.userId, alertModal.message);
      if (res.success) {
        setAlertModal({ isOpen: false, userId: null, name: '', message: '' });
      }
    } catch (err) {
      console.error("Alert dispatch failed");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await AdminService.updateUserRole(userId, newRole);
      if (res.success) await fetchUsers();
    } catch (err) {
      console.error("Role change failed");
    }
  };

  // Filter out the logged-in admin from the management list
  const filteredUsers = users.filter(u => 
    u.id !== user?.id && 
    (u.EmailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.LastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white font-black italic tracking-widest animate-pulse">
        SYNCHRONIZING REGISTRY...
    </div>
  );

  return (
    <div 
      className={`flex min-h-screen transition-all duration-500 relative overflow-hidden ${
        isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'
      }`}
    >
      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10 relative z-10 overflow-y-auto h-screen custom-scrollbar">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className={`text-4xl font-black tracking-tighter  transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>Administration</h1>
            <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mt-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Admin: <span className="text-medical-red">{user?.FirstName}</span> </p>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className={`p-3 rounded-2xl transition-all shadow-lg ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}
             >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>
        </header>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard icon={<Users/>} label="Total Registered Users" val={users.length} color="bg-blue-600" dark={isDarkMode} />
          <StatCard icon={<CheckCircle/>} label="Verified Donors" val={users.filter(u => u.Role === 'Donor').length} color="bg-green-600" dark={isDarkMode} />
          <StatCard icon={<ShieldAlert/>} label="Deactivated Users" val={users.filter(u => u.status === 'Deactivated').length} color="bg-medical-red" dark={isDarkMode} />
        </div>

        {/* Registry Table Card */}
        <div className={`rounded-[45px] shadow-2xl border transition-all ${
          isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'
        }`}>
          <div className={`p-10 border-b flex flex-col md:flex-row justify-between items-center gap-4 ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}>
            <h2 className={`font-black  tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>Registered Users</h2>
            <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                placeholder="Search user..." 
                className={`w-full pl-12 pr-4 py-4 rounded-2xl text-sm outline-none border transition-all ${
                  isDarkMode 
                  ? 'bg-white/5 border-white/10 text-white focus:border-medical-red' 
                  : 'bg-gray-50 border-gray-100 text-[#1B2559] focus:border-blue-400'
                }`} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className={`${isDarkMode ? 'bg-black/20 text-white/30' : 'bg-gray-50 text-gray-400'} text-[10px] font-black  tracking-[0.25em]`}>
                <tr>
                  <th className="px-10 py-6">User </th>
                  <th className="px-10 py-6">Assign Role</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6">Notify</th>
                  <th className="px-10 py-6 text-right">Control</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-50'}`}>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={`transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-blue-50/30'}`}>
                    <td className="px-10 py-6 font-bold text-sm">
                      <p className={isDarkMode ? 'text-white' : 'text-[#1B2559]'}>{u.FirstName} {u.LastName}</p>
                      <p className="text-[11px] opacity-40 font-normal italic">{u.EmailAddress}</p>
                    </td>
                    <td className="px-10 py-6">
                       <select value={u.Role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className={`bg-transparent border-none text-[10px] font-black uppercase cursor-pointer outline-none ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                         <option value="Donor" className="bg-[#1e293b] text-white">Donor</option>
                         <option value="Recipient" className="bg-[#1e293b] text-white">Recipient</option>
                       </select>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase border ${u.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{u.status}</span>
                    </td>
                    <td className="px-10 py-6">
                      <button onClick={() => triggerAlertModal(u)} className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Send size={20}/></button>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button onClick={() => triggerStatusToggle(u)} className={`p-3 rounded-2xl transition-all ${u.status === 'Active' ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>{u.status === 'Active' ? <XCircle size={22}/> : <CheckCircle size={22}/>}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL 1: STATUS CHANGE */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in zoom-in">
           <div className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl text-center border border-gray-100">
              <div className="w-16 h-16 bg-red-100 text-medical-red rounded-3xl flex items-center justify-center mx-auto mb-6"><ShieldAlert size={32} /></div>
              <h3 className="text-2xl font-black  tracking-tighter text-[#1B2559]">Security Check</h3>
              <p className="text-gray-500 text-sm mt-4 font-medium leading-relaxed">Confirm transition to <span className="text-medical-red font-black underline ">{confirmModal.newStatus}</span>?</p>
              <div className="grid grid-cols-2 gap-4 mt-10">
                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="py-4 rounded-2xl bg-gray-100 text-gray-400 font-bold text-xs uppercase tracking-widest hover:bg-gray-200">Cancel</button>
                <button onClick={executeStatusChange} className="py-4 rounded-2xl bg-medical-red text-white font-black text-xs uppercase shadow-lg shadow-red-400 hover:bg-red-700">Confirm</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL 2: DISPATCH ALERT */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#111C44]/90 backdrop-blur-lg">
           <div className="bg-white rounded-[45px] p-10 max-w-md w-full shadow-2xl relative animate-in fade-in slide-in-from-bottom-4">
              <button onClick={() => setAlertModal({ ...alertModal, isOpen: false })} className="absolute top-8 right-8 text-gray-300 hover:text-red-500"><X size={24} /></button>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl shadow-inner"><Send size={24} /></div>
                <div><h3 className="text-xl font-black  tracking-tighter text-[#1B2559]">Dispatch Alert</h3><p className="text-[10px] font-bold text-gray-400 tracking-widest">Recipient: {alertModal.name}</p></div>
              </div>
              <textarea value={alertModal.message} onChange={(e) => setAlertModal({ ...alertModal, message: e.target.value })} placeholder="Enter message..." className="w-full h-40 p-6 bg-gray-50 border border-gray-100 rounded-3xl outline-none text-sm text-gray-800" />
              <button onClick={executeSendAlert} disabled={!alertModal.message.trim()} className="w-full mt-8 py-5 bg-[#111C44] text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl shadow-xl hover:bg-black transition-all disabled:opacity-30 flex items-center justify-center gap-3"><Send size={16}/> Send Reminder</button>
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, val, color, dark }) => (
  <div className={`p-8 rounded-[40px] border transition-all duration-500 flex items-center gap-6 shadow-xl ${
    dark ? 'bg-[#1e293b] border-white/5 shadow-black/20' : 'bg-white border-gray-100 shadow-gray-200/50'
  }`}>
    <div className={`p-5 rounded-2xl text-white ${color} shadow-lg flex items-center justify-center`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-4xl font-black tracking-tighter ${dark ? 'text-white' : 'text-[#1B2559]'}`}>{val}</p>
    </div>
  </div>
);

export default AdminDashboard;
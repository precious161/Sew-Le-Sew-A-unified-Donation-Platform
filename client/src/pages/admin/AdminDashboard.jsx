import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { AdminService } from '../../services/AdminService'; 
import authBackgroundImage from "../../assets/auth-bg.jpg"; 
import { ShieldAlert, UserX, History, Sun, Moon, CheckCircle, ArrowLeft, RefreshCw, UserCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { theme, toggleTheme } = useContext(AuthContext);
  const isNight = theme === 'night';
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        const [usersData, logsData] = await Promise.all([
          AdminService.getAllUsers?.() || [], 
          AdminService.getAuditLogs()
        ]);
        setUsers(usersData);
        setLogs(logsData);
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, []);

  /**
   * INTERFACE: DeactivateUser
   * Uses 'name' and 'error' to clear ESLint warnings and provide feedback.
   */
  const toggleUserStatus = async (id, name) => {
    try {
      await AdminService.deactivateUser(id);
      setUsers(prev => prev.map(u => (u.UserId === id || u.id === id) 
        ? { ...u, status: u.status === 'Active' ? 'Deactivated' : 'Active' } 
        : u
      ));
      
      const newLogs = await AdminService.getAuditLogs();
      setLogs(newLogs);
      console.log(`Action successful for user: ${name}`);
    } catch (error) {
      // Log the specific error to clear the warning and help debugging
      console.error(`Status toggle failed for ${name}:`, error);
      alert(`System Error: Could not update status for ${name}.`);
    }
  };

  /**
   * INTERFACE: AssignRole
   * Uses 'name' and 'error' to clear ESLint warnings and provide feedback.
   */
  const handleAssignRole = async (id, name, currentRole) => {
    try {
      const newRole = currentRole === 'Donor' ? 'Recipient' : 'Donor';
      await AdminService.assignRole(id, newRole);
      
      setUsers(prev => prev.map(u => (u.UserId === id || u.id === id) 
        ? { ...u, Role: newRole, role: newRole } 
        : u
      ));
      
      const newLogs = await AdminService.getAuditLogs();
      setLogs(newLogs);
      console.log(`Role assigned: ${name} is now a ${newRole}`);
    } catch (error) {
      // Log the specific error to clear the warning and help debugging
      console.error(`Role update failed for ${name}:`, error);
      alert(`System Error: Could not assign role to ${name}.`);
    }
  };

  const cardStyle = isNight ? "bg-white/5 border-white/10 backdrop-blur-md" : "bg-white/40 border-white/30 backdrop-blur-md shadow-xl";

  if (loading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isNight ? 'bg-slate-900 text-white' : 'bg-[#F9FAFB]'}`}>
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="font-black uppercase tracking-widest text-xs opacity-50">Synchronizing Command Records...</p>
    </div>
  );

  return (
    <div className={`min-h-screen w-full relative overflow-x-hidden transition-colors duration-500 ${isNight ? 'bg-slate-900 text-white' : 'bg-[#F9FAFB] text-slate-900'} p-4 md:p-8`}>
      <div className="absolute inset-0 z-0">
        <img src={authBackgroundImage} alt="BG" className={`w-full h-full object-cover transition-opacity duration-700 ${isNight ? 'opacity-20' : 'opacity-[0.12]'}`} />
        <div className={`absolute inset-0 ${isNight ? 'bg-slate-900/60' : 'bg-[#F9FAFB]/40'}`}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 font-sans">
        <div className="flex justify-between items-center mb-6 md:mb-10">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
            <ArrowLeft size={14} className="text-[#E31E24]" /> Return to Command
          </button>
          <button onClick={toggleTheme} className={`p-2.5 md:p-3 rounded-xl border transition-all ${isNight ? "bg-white/5 border-white/10 text-yellow-400" : "bg-white border-slate-200 text-slate-700 shadow-sm"}`}>
            {isNight ? <Sun size={18}/> : <Moon size={18}/>}
          </button>
        </div>

        <header className="mb-8 md:mb-12 border-l-4 border-blue-600 pl-4 md:pl-6 text-left">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight flex items-center gap-3 italic uppercase">
            <ShieldAlert className="text-blue-600 shrink-0" size={32} /> Admin Suite
          </h1>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] mt-2 opacity-50">Authorized Personnel Only</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className={`lg:col-span-2 rounded-[2rem] border overflow-hidden ${cardStyle}`}>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className={isNight ? "bg-white/5" : "bg-black/5"}>
                  <tr className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    <th className="px-8 py-6">User Database</th>
                    <th className="px-8 py-6">Role</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u, index) => (
                    <tr key={u.UserId || u.id || index} className={`transition-all ${u.status === 'Deactivated' ? 'opacity-30 grayscale' : 'hover:bg-blue-500/5'}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                          <div>
                            <p className="font-black text-sm uppercase">{u.FirstName || u.name} {u.LastName || ''}</p>
                            <p className="text-[9px] opacity-30 font-black tracking-tighter">ID: {u.UserId || u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 rounded-lg border border-blue-500/30 text-blue-500 text-[9px] font-black uppercase bg-blue-500/5">
                          {u.Role || u.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleAssignRole(u.UserId || u.id, u.FirstName || u.name, u.Role || u.role)} className="p-2 hover:bg-blue-600 hover:text-white transition-all rounded-lg text-blue-500">
                            <RefreshCw size={16}/>
                          </button>
                          <button onClick={() => toggleUserStatus(u.UserId || u.id, u.FirstName || u.name)} className={`p-2 transition-all rounded-lg ${u.status === 'Active' ? 'text-red-500 hover:bg-red-600 hover:text-white' : 'text-green-500 hover:bg-green-600 hover:text-white'}`}>
                            {u.status === 'Active' ? <UserX size={16}/> : <UserCheck size={16}/>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-white/10">
              {users.map((u, index) => (
                <div key={u.UserId || u.id || index} className={`p-6 space-y-4 ${u.status === 'Deactivated' ? 'opacity-40 grayscale' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <p className="font-black text-base uppercase tracking-tighter">{u.FirstName || u.name}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-blue-500 text-[8px] font-black uppercase border border-blue-500/30 bg-blue-500/5">{u.Role || u.role}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAssignRole(u.UserId || u.id, u.FirstName || u.name, u.Role || u.role)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600/10 text-blue-500 rounded-xl font-black text-[10px] uppercase">
                      <RefreshCw size={14}/> Switch Role
                    </button>
                    <button onClick={() => toggleUserStatus(u.UserId || u.id, u.FirstName || u.name)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase ${u.status === 'Active' ? 'bg-red-600/10 text-red-500' : 'bg-green-600/10 text-green-500'}`}>
                      {u.status === 'Active' ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-6 md:p-8 rounded-[2rem] border ${cardStyle} h-fit`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 text-left">
                <History className="text-blue-600" size={20} />
                <h3 className="text-xs font-black uppercase tracking-widest opacity-40">System Audit Logs</h3>
              </div>
            </div>
            
            <div className="space-y-6 max-h-[300px] md:max-h-[450px] overflow-y-auto pr-2 custom-scrollbar text-left">
              {logs.length > 0 ? logs.map((log, index) => (
                <div key={log.id || index} className="border-l-2 border-blue-600 pl-4 py-1">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{log.action}</p>
                  <p className="text-[11px] opacity-70 font-bold uppercase tracking-tight">{log.target}</p>
                  <p className="text-[8px] opacity-30 font-black mt-1">{new Date(log.date || log.timestamp || Date.now()).toLocaleTimeString()}</p>
                </div>
              )) : <p className="text-[10px] opacity-30 font-black italic">No logs recorded.</p>}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3 text-green-500">
              <CheckCircle size={18} className="animate-pulse shrink-0" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em]">Security: Operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
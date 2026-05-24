import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import AdminService from '../../services/AdminService';
import AlertService from '../../services/AlertService';
import { useAuth } from '../../hooks/useAuth';
import { UserPlus, ShieldAlert, CheckCircle, XCircle, Sun, Moon, X, Radio, Filter, Mail, BellRing, RefreshCw } from 'lucide-react';

const AdminRecipients = () => {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, userId: null, name: '', newStatus: '' });
  const [broadcastModal, setBroadcastModal] = useState({ isOpen: false, message: '' });

  // NEW: Role change modal state
  const [roleModal, setRoleModal] = useState({
    isOpen: false,
    userId: null,
    name: '',
    currentRole: '',
    newRole: '',
    reason: '',
    loading: false
  });

  const fetchRecipients = async () => {
    try {
      const res = await AdminService.monitorActivity(1, 100);
      if (res.success) {
        const onlyRecipients = res.data.filter(u => u.Role === 'Recipient');
        setRecipients(onlyRecipients);
      }
    } catch {
      console.error("Sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecipients(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const filteredRecipients = recipients.filter(r => {
    if (filterType === 'ALL') return true;
    if (filterType === 'Active') return r.status === 'Active';
    if (filterType === 'Inactive') return r.status === 'Deactivated';
    return true;
  });

  const executeBroadcast = async () => {
    if (!broadcastModal.message.trim()) return;
    try {
      await Promise.all(filteredRecipients.map(r => AlertService.sendAlert(r.id, broadcastModal.message)));
      setBroadcastModal({ isOpen: false, message: '' });
      showToast(`Emergency alert sent to ${filteredRecipients.length} recipients.`);
    } catch { showToast("Dispatch failed.", "error"); }
  };

  const handleStatusUpdate = async () => {
    try {
      const res = await AdminService.updateUserStatus(confirmModal.userId, confirmModal.newStatus);
      if (res.success) {
        setConfirmModal({isOpen: false});
        fetchRecipients();
        showToast(`Account for ${confirmModal.name} updated successfully.`);
      }
    } catch { showToast("Update failed.", "error"); }
  };

  // NEW: Safe role change handler
  const handleSafeRoleChange = async () => {
    setRoleModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await AdminService.safeRoleChange(
        roleModal.userId,
        roleModal.newRole,
        roleModal.reason
      );

      if (res.success) {
        if (res.data.warnings && res.data.warnings.length > 0) {
          showToast(`Role changed! ${res.data.warnings.join(', ')}`, 'warning');
        } else {
          showToast(`${roleModal.name} changed from ${roleModal.currentRole} to ${roleModal.newRole}`, 'success');
        }

        setRoleModal({ isOpen: false, userId: null, name: '', currentRole: '', newRole: '', reason: '', loading: false });
        await fetchRecipients();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Role change failed";
      showToast(errorMsg, "error");
      setRoleModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Open role change modal
  const openRoleModal = (recipient) => {
    setRoleModal({
      isOpen: true,
      userId: recipient.id,
      name: recipient.FirstName,
      currentRole: recipient.Role,
      newRole: 'Donor', // Recipient -> Donor
      reason: '',
      loading: false
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white font-black animate-pulse">Accessing Patient Registry...</div>;

  return (
    <div className={`flex min-h-screen transition-all duration-500 relative ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>

      {toast.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-full duration-300">
           <div className={`px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-xl ${
             toast.type === 'success' ? 'bg-blue-600 text-white' : toast.type === 'warning' ? 'bg-yellow-500 text-black' : 'bg-medical-red text-white'
           }`}>
              <BellRing size={20} className="animate-bounce" /><p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
           </div>
        </div>
      )}

      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10 relative overflow-y-auto h-screen custom-scrollbar text-left">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setBroadcastModal({isOpen: true, message: ''})} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-lg hover:bg-blue-700 transition-all"><Radio size={16}/> Group Broadcast</button>
            <button onClick={fetchRecipients} className="p-3.5 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white hover:bg-blue-600 hover:text-white transition-all"><RefreshCw size={18}/></button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3.5 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          </div>
        </header>

        <div className={`p-6 rounded-[35px] mb-8 flex justify-between items-center shadow-xl border ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
           <div className="flex items-center gap-6">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`pl-9 pr-8 py-2.5 rounded-xl text-[10px] font-black uppercase outline-none border appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-[#1B2559]'}`}>
                  <option value="ALL">All Recipients</option>
                  <option value="Active">Active Requests</option>
                  <option value="Inactive">Closed/Deactivated</option>
                </select>
              </div>
           </div>
           <span className="text-[10px] font-black uppercase text-gray-400 italic">Total Recipients: {filteredRecipients.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipients.map((u) => (
            <div key={u.id} className={`p-8 rounded-[45px] border shadow-lg transition-all group ${isDarkMode ? 'bg-[#1e293b] border-white/5 hover:bg-[#24314d]' : 'bg-white border-gray-100'}`}>
              <div className="flex justify-between items-start mb-6 text-left">
                <div className={`w-14 h-14 rounded-[20px] bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-inner`}>{u.FirstName[0]}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openRoleModal(u)}
                    className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all text-[9px] font-black uppercase"
                    title="Change Role to Donor"
                  >
                    Change Role
                  </button>
                  <button
                    onClick={() => setConfirmModal({ isOpen: true, userId: u.id, name: u.FirstName, newStatus: u.status === 'Active' ? 'Deactivated' : 'Active' })}
                    className={`p-2 rounded-xl transition-all ${u.status === 'Active' ? 'bg-red-50 text-red-500 hover:bg-red-600 hover:text-white' : 'bg-green-50 text-green-500 hover:bg-green-600 hover:text-white'}`}
                  >
                    {u.status === 'Active' ? <XCircle size={18}/> : <CheckCircle size={18}/>}
                  </button>
                </div>
              </div>
              <div className="mb-8">
                <h3 className={`font-black text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>{u.FirstName} {u.LastName}</h3>
                <div className="flex items-center gap-2 mt-2 opacity-40"><Mail size={12} /><span className="text-[11px] font-bold tracking-tight lowercase">{u.EmailAddress}</span></div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                <div className={`text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter ${u.status === 'Active' ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-medical-red bg-red-500/10 border border-red-500/20'}`}>{u.status}</div>
                <div className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${
                  u.identityStatus === 'Verified'
                    ? 'text-green-500 bg-green-500/10'
                    : u.identityStatus === 'Pending'
                    ? 'text-yellow-500 bg-yellow-500/10'
                    : 'text-gray-400 bg-gray-400/10'
                }`}>
                  ID: {u.identityStatus || 'Unverified'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* BROADCAST MODAL */}
      {broadcastModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0f172a]/95 backdrop-blur-md">
           <div className="bg-white rounded-[50px] p-12 max-w-md w-full shadow-2xl relative border border-white/10">
              <button onClick={() => setBroadcastModal({ isOpen: false, message: '' })} className="absolute top-10 right-10 text-gray-300 hover:text-medical-red"><X size={24} /></button>
              <div className="flex items-center gap-4 mb-8 text-[#1B2559]">
                <div className="p-4 bg-blue-600 text-white rounded-[25px] shadow-lg shadow-blue-200"><Radio size={28} /></div>
                <div><h3 className="text-2xl font-black tracking-tighter">Mass Alert</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">To: All Registered Recipients ({recipients.length})</p></div>
              </div>
              <textarea value={broadcastModal.message} onChange={(e) => setBroadcastModal({ ...broadcastModal, message: e.target.value })} placeholder="Type recruitment/resource notification message..." className="w-full h-44 p-8 bg-gray-50 border border-gray-100 rounded-[35px] outline-none text-sm text-gray-800 shadow-inner" />
              <button onClick={executeBroadcast} className="w-full mt-8 py-5 bg-[#111C44] text-white font-black text-xs uppercase tracking-[0.4em] rounded-[25px] shadow-xl hover:bg-black transition-all">Dispatch Broadcast</button>
           </div>
        </div>
      )}

      {/* STATUS CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
           <div className="bg-white rounded-[40px] p-12 max-w-sm w-full shadow-2xl text-center border border-gray-50 text-left">
              <div className="w-16 h-16 bg-red-50 text-medical-red rounded-3xl flex items-center justify-center mx-auto mb-6"><ShieldAlert size={32} /></div>
              <h3 className="text-2xl font-black text-[#1B2559] tracking-tighter text-left">Authorize Change?</h3>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed text-left italic">Change <span className="font-black text-medical-red uppercase underline">{confirmModal.name}</span> to {confirmModal.newStatus} state?</p>
              <div className="grid grid-cols-2 gap-4 mt-10">
                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="py-4 rounded-2xl bg-gray-50 text-gray-400 font-bold text-[10px] uppercase tracking-widest">Abort</button>
                <button onClick={handleStatusUpdate} className="py-4 rounded-2xl bg-medical-red text-white font-black text-[10px] uppercase shadow-lg shadow-red-200">Authorize</button>
              </div>
           </div>
        </div>
      )}

      {/* NEW: ROLE CHANGE CONFIRMATION MODAL */}
      {roleModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-[#1B2559] tracking-tighter">Change User Role</h3>
                <p className="text-gray-500 text-sm mt-1">Modify account type with safety checks</p>
              </div>
              <button onClick={() => setRoleModal(prev => ({ ...prev, isOpen: false }))} className="text-gray-400 hover:text-medical-red"><X size={20} /></button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-800 text-sm font-medium">
                Changing <span className="font-black">{roleModal.name}</span> from
                <span className="font-black"> {roleModal.currentRole} </span> to
                <span className="font-black text-green-600"> {roleModal.newRole}</span>
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 text-xs font-medium">
                ⚠️ This will cancel any active donation requests.
                The user will be notified via in-app notification.
              </p>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Reason for change (optional)</label>
              <textarea
                value={roleModal.reason}
                onChange={(e) => setRoleModal(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full p-3 rounded-xl border border-gray-200 mt-2 text-sm focus:border-medical-red focus:outline-none"
                rows="3"
                placeholder="Why is this role change needed? This will be visible to the user and in audit logs."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRoleModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-wider hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSafeRoleChange}
                disabled={roleModal.loading}
                className="flex-1 py-3 rounded-xl bg-medical-red text-white font-black text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {roleModal.loading ? <><RefreshCw size={14} className="animate-spin" /> Processing...</> : 'Confirm Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecipients;
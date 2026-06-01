import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import AdminService from '../../services/AdminService';
import AlertService from '../../services/AlertService';
import NotificationHub from '../../components/notifications/NotificationHub';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import {
  Users, ShieldAlert, CheckCircle, XCircle, Sun, Moon, X, Radio, Filter, Mail, BellRing, RefreshCw, Menu,
  UserCheck, UserX, AlertTriangle, Shield, Heart
} from 'lucide-react';

const AdminRecipients = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, userId: null, name: '', newStatus: '' });
  const [broadcastModal, setBroadcastModal] = useState({ isOpen: false, message: '' });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Role change modal state
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

  // Close sidebar when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const openRoleModal = (recipient) => {
    setRoleModal({
      isOpen: true,
      userId: recipient.id,
      name: recipient.FirstName,
      currentRole: recipient.Role,
      newRole: 'Donor',
      reason: '',
      loading: false
    });
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white font-black animate-pulse">
      Accessing Patient Registry...
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-all duration-500 relative ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isDarkMode={isDarkMode} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <Sidebar isDarkMode={isDarkMode} isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-full duration-300">
           <div className={`px-6 md:px-8 py-3 md:py-4 rounded-3xl shadow-2xl flex items-center gap-3 md:gap-4 ${
             toast.type === 'success' ? 'bg-blue-600 text-white' :
             toast.type === 'warning' ? 'bg-yellow-500 text-black' :
             'bg-medical-red text-white'
           }`}>
              <BellRing size={16} className="md:size-[20px] animate-bounce" />
              <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">{toast.message}</p>
           </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-72 w-full">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#0b1121] border-b border-gray-100 dark:border-white/5 sticky top-0 z-50">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="bg-medical-red p-2.5 rounded-xl shadow-lg"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <NotificationHub isDarkMode={isDarkMode} />
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-8">
          {/* Mobile Title */}
          <div className="md:hidden mb-6">
            <h1 className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              Recipient Registry
            </h1>
            <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mt-1 italic">
              Manage {recipients.length} registered recipients
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center mb-8">
            <div>
              <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                Recipient Registry
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                Manage {recipients.length} registered recipients
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setBroadcastModal({isOpen: true, message: ''})} className="bg-blue-600 text-white px-6 md:px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-lg hover:bg-blue-700 transition-all">
                <Radio size={16}/> Group Broadcast
              </button>
              <button onClick={fetchRecipients} className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white hover:bg-blue-600 hover:text-white transition-all">
                <RefreshCw size={18}/>
              </button>
              <NotificationHub isDarkMode={isDarkMode} />
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className={`p-4 md:p-6 rounded-[25px] md:rounded-[35px] mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl border ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={`pl-9 pr-8 py-2.5 rounded-xl text-[10px] font-black uppercase outline-none border appearance-none cursor-pointer transition-all w-full sm:w-auto ${
                    isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-[#1B2559]'
                  }`}
                >
                  <option value="ALL">All Recipients</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Deactivated Only</option>
                </select>
              </div>
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 italic w-full sm:w-auto text-left sm:text-right">
              Total Recipients: {filteredRecipients.length}
            </span>
          </div>

          {/* Recipients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredRecipients.map((u) => (
              <div key={u.id} className={`p-5 md:p-8 rounded-[35px] md:rounded-[45px] border shadow-lg transition-all group ${isDarkMode ? 'bg-[#1e293b] border-white/5 hover:bg-[#24314d]' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-start mb-6 text-left">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-[20px] bg-blue-600 flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-inner">
                    {u.FirstName?.[0] || '?'}
                  </div>

                  {/* ✅ IMPROVED: Clear Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openRoleModal(u)}
                      className="px-2 md:px-3 py-1.5 md:py-2 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-600 hover:text-white transition-all text-[9px] md:text-[10px] font-black uppercase flex items-center gap-1"
                      title="Change Role to Donor"
                    >
                      <Heart size={12} /> Role
                    </button>

                    {/* ✅ NEW: Toggle Switch Style Button */}
                    {u.status === 'Active' ? (
                      <button
                        onClick={() => setConfirmModal({ isOpen: true, userId: u.id, name: u.FirstName, newStatus: 'Deactivated' })}
                        className="px-2 md:px-3 py-1.5 md:py-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white transition-all text-[9px] md:text-[10px] font-black uppercase flex items-center gap-1"
                        title="Deactivate Account"
                      >
                        <UserX size={12} /> Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmModal({ isOpen: true, userId: u.id, name: u.FirstName, newStatus: 'Active' })}
                        className="px-2 md:px-3 py-1.5 md:py-2 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-600 hover:text-white transition-all text-[9px] md:text-[10px] font-black uppercase flex items-center gap-1"
                        title="Activate Account"
                      >
                        <UserCheck size={12} /> Activate
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-6 md:mb-8">
                  <h3 className={`font-black text-lg md:text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                    {u.FirstName} {u.LastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 opacity-40">
                    <Mail size={12} className="md:size-[14px]" />
                    <span className="text-[10px] md:text-[11px] font-bold tracking-tight lowercase">{u.EmailAddress}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-gray-100 dark:border-white/10 mt-auto">
                  {/* ✅ IMPROVED: Status Badge with better visual */}
                  <div className={`flex items-center gap-1.5 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase ${
                    u.status === 'Active'
                      ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                      : 'bg-red-500/20 text-red-600 border border-red-500/30'
                  }`}>
                    {u.status === 'Active' ? (
                      <><CheckCircle size={10} className="text-green-500" /> Active</>
                    ) : (
                      <><XCircle size={10} className="text-red-500" /> Deactivated</>
                    )}
                  </div>

                  <div className={`text-[7px] md:text-[8px] font-black px-2 md:px-3 py-1 rounded-full uppercase ${
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
        </div>
      </main>

      {/* STATUS CONFIRMATION MODAL - IMPROVED UX */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
           <div className="bg-white dark:bg-[#1e293b] rounded-[30px] md:rounded-[40px] p-6 md:p-8 max-w-md w-full shadow-2xl text-center mx-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                confirmModal.newStatus === 'Deactivated' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'
              }`}>
                {confirmModal.newStatus === 'Deactivated' ? <UserX size={32} /> : <UserCheck size={32} />}
              </div>
              <h3 className="text-2xl font-black text-[#1B2559] dark:text-white">
                {confirmModal.newStatus === 'Deactivated' ? 'Deactivate Account?' : 'Activate Account?'}
              </h3>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                Are you sure you want to <span className="font-bold">{confirmModal.newStatus === 'Deactivated' ? 'deactivate' : 'activate'}</span> {confirmModal.name}'s account?
              </p>
              {confirmModal.newStatus === 'Deactivated' && (
                <p className="text-red-500 text-xs mt-2">
                  ⚠️ Deactivated users cannot log in or access the platform.
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                  Cancel
                </button>
                <button onClick={handleStatusUpdate} className={`py-3 rounded-xl text-white font-black text-[10px] uppercase shadow-lg transition-all ${
                  confirmModal.newStatus === 'Deactivated' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}>
                  Confirm {confirmModal.newStatus === 'Deactivated' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* BROADCAST MODAL */}
      {broadcastModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0f172a]/95 backdrop-blur-md">
           <div className="bg-white dark:bg-[#1e293b] rounded-[40px] md:rounded-[50px] p-6 md:p-12 max-w-md w-full shadow-2xl relative mx-4">
              <button onClick={() => setBroadcastModal({ isOpen: false, message: '' })} className="absolute top-4 md:top-10 right-4 md:right-10 text-gray-400 hover:text-medical-red">
                <X size={20} className="md:size-[24px]" />
              </button>
              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="p-3 md:p-4 bg-blue-600 text-white rounded-[20px] md:rounded-[25px] shadow-lg shadow-blue-200">
                  <Radio size={24} className="md:size-[28px]" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-[#1B2559] dark:text-white tracking-tighter">Mass Alert</h3>
                  <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    To: All Registered Recipients ({recipients.length})
                  </p>
                </div>
              </div>
              <textarea
                value={broadcastModal.message}
                onChange={(e) => setBroadcastModal({ ...broadcastModal, message: e.target.value })}
                placeholder="Type recruitment/resource notification message..."
                className="w-full h-36 md:h-44 p-4 md:p-8 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[25px] md:rounded-[35px] outline-none text-sm text-gray-800 dark:text-white leading-relaxed"
              />
              <button
                onClick={executeBroadcast}
                className="w-full mt-6 md:mt-8 py-4 md:py-5 bg-[#111C44] dark:bg-medical-red text-white font-black text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em] rounded-[20px] md:rounded-[25px] shadow-xl hover:bg-black dark:hover:bg-red-700 transition-all"
              >
                Dispatch Broadcast
              </button>
           </div>
        </div>
      )}

      {/* ROLE CHANGE MODAL */}
      {roleModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-[30px] md:rounded-[40px] p-6 md:p-8 max-w-md w-full shadow-2xl mx-4">
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-[#1B2559] dark:text-white tracking-tighter">Change User Role</h3>
                <p className="text-gray-500 text-xs md:text-sm mt-1">Modify account type with safety checks</p>
              </div>
              <button onClick={() => setRoleModal(prev => ({ ...prev, isOpen: false }))} className="text-gray-400 hover:text-medical-red">
                <X size={18} className="md:size-[20px]" />
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3 md:p-4 mb-4 md:mb-6">
              <p className="text-blue-800 dark:text-blue-300 text-xs md:text-sm font-medium">
                Changing <span className="font-black">{roleModal.name}</span> from
                <span className="font-black"> {roleModal.currentRole} </span> to
                <span className="font-black text-green-600"> {roleModal.newRole}</span>
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-3 md:p-4 mb-4 md:mb-6">
              <p className="text-yellow-800 dark:text-yellow-300 text-[10px] md:text-xs font-medium">
                ⚠️ This will cancel any active donation requests.
                The user will be notified via in-app notification.
              </p>
            </div>

            <div className="mb-4 md:mb-6">
              <label className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-wider">Reason for change (optional)</label>
              <textarea
                value={roleModal.reason}
                onChange={(e) => setRoleModal(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 mt-2 text-xs md:text-sm focus:border-medical-red focus:outline-none"
                rows="3"
                placeholder="Why is this role change needed? This will be visible to the user and in audit logs."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRoleModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 md:py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 font-black text-[9px] md:text-[10px] uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSafeRoleChange}
                disabled={roleModal.loading}
                className="flex-1 py-2.5 md:py-3 rounded-xl bg-medical-red text-white font-black text-[9px] md:text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {roleModal.loading ? <><RefreshCw size={12} className="animate-spin" /> Processing...</> : 'Confirm Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecipients;
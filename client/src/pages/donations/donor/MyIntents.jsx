import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import DonationService from '../../../services/DonationService';
import NotificationHub from '../../../components/notifications/NotificationHub';
import {
  HeartPulse, Calendar, MapPin, Package,
  Clock, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Droplets, Box, Heart, Trash2, Menu, Sun, Moon
} from 'lucide-react';

const MyIntents = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [cancelModal, setCancelModal] = useState({ isOpen: false, intentId: null, intentType: '' });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchIntents = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await DonationService.getMyIntents();
      if (res.success && res.data && res.data.length > 0) {
        setIntents(res.data);
      } else {
        setIntents([]);
      }
    } catch (err) {
      console.error("Failed to fetch intents:", err);
      setError(err.response?.data?.message || err.message || "Failed to load your intents");
      setIntents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntents();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const initiateCancel = (intentId, intentType) => {
    setCancelModal({ isOpen: true, intentId, intentType });
  };

  const confirmCancel = async () => {
    const { intentId } = cancelModal;
    setCancelModal({ isOpen: false, intentId: null, intentType: '' });

    try {
      const res = await DonationService.cancelIntent(intentId);
      if (res.success) {
        showToast("Donation intent cancelled successfully.", "success");
        fetchIntents();
      } else {
        showToast(res.message || 'Failed to cancel intent', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel intent', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      Active: { color: 'bg-green-500', icon: <CheckCircle size={10} className="md:size-[12px] mr-1" />, text: 'Active' },
      PendingVerification: { color: 'bg-yellow-500', icon: <Clock size={10} className="md:size-[12px] mr-1" />, text: 'Under Review' },
      Matched: { color: 'bg-purple-500', icon: <HeartPulse size={10} className="md:size-[12px] mr-1" />, text: 'Matched' },
      Completed: { color: 'bg-blue-500', icon: <CheckCircle size={10} className="md:size-[12px] mr-1" />, text: 'Completed' },
      Cancelled: { color: 'bg-gray-500', icon: <XCircle size={10} className="md:size-[12px] mr-1" />, text: 'Cancelled' },
    };
    const cfg = config[status] || { color: 'bg-gray-500', icon: null, text: status };
    return (
      <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest text-white flex items-center ${cfg.color}`}>
        {cfg.icon} {cfg.text}
      </span>
    );
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Blood': return <Droplets size={24} className="md:size-[28px] text-medical-red" />;
      case 'In_Kind': return <Box size={24} className="md:size-[28px] text-orange-500" />;
      case 'Organ': return <Heart size={24} className="md:size-[28px] text-pink-500" />;
      default: return <Package size={24} className="md:size-[28px] text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 ml-72 p-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
        </main>
      </div>
    );
  }

  if (user?.Role !== 'Donor') {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 ml-72 p-10 flex flex-col items-center justify-center">
          <AlertTriangle size={48} className="text-yellow-500 mb-4" />
          <h2 className="text-2xl font-black text-[#1B2559] dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500">Only donors can view this page.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-6 px-6 py-3 bg-medical-red text-white rounded-2xl font-black text-[10px] uppercase tracking-wider">
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  const activeIntents = intents.filter(i => ['Active', 'PendingVerification', 'Matched'].includes(i.status));
  const pastIntents = intents.filter(i => ['Completed', 'Cancelled'].includes(i.status));

  return (
    <div className={`flex min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isDarkMode={isDarkMode} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <Sidebar isDarkMode={isDarkMode} isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-full duration-300">
          <div className={`px-5 md:px-8 py-2.5 md:py-4 rounded-3xl shadow-2xl flex items-center gap-2 md:gap-4 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-medical-red text-white'}`}>
            {toast.type === 'success' ? <CheckCircle size={14} className="md:size-[20px] animate-bounce" /> : <AlertTriangle size={14} className="md:size-[20px] animate-bounce" />}
            <p className="text-[9px] md:text-xs font-black uppercase tracking-widest">{toast.message}</p>
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
        <div className="p-4 md:p-10">
          {/* Mobile Title */}
          <div className="md:hidden mb-4">
            <h1 className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              My Donation Intents
            </h1>
            <p className="text-gray-400 text-[8px] font-bold uppercase tracking-[0.3em] mt-1">
              {activeIntents.length} active pledges
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center mb-8">
            <div>
              <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                My Donation Intents
              </h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
                Track your active pledges • {activeIntents.length} active
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchIntents} disabled={refreshing} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-lg hover:bg-medical-red hover:text-white transition-all">
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => navigate('/donations/donor/register-intent')} className="px-6 py-3 bg-medical-red text-white rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all">
                + New Intent
              </button>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="md:hidden flex gap-3 mb-6">
            <button onClick={fetchIntents} disabled={refreshing} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-medical-red hover:text-white transition-all text-[9px] font-black uppercase tracking-wider">
              <RefreshCw size={14} className={refreshing ? 'animate-spin inline mr-1' : 'inline mr-1'} /> Refresh
            </button>
            <button onClick={() => navigate('/donations/donor/register-intent')} className="flex-1 py-2.5 rounded-xl bg-medical-red text-white font-black text-[9px] uppercase tracking-wider hover:bg-red-700 transition-all">
              + New Intent
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} />
                <span className="text-xs font-medium">{error}</span>
              </div>
              <button onClick={fetchIntents} className="text-red-500 hover:text-red-700 text-xs font-black uppercase tracking-widest">
                Retry
              </button>
            </div>
          )}

          {/* Active Intents Section */}
          {activeIntents.length > 0 && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-green-600 dark:text-green-400 flex items-center gap-2">
                <HeartPulse size={16} className="md:size-[20px]" /> Active Pledges ({activeIntents.length})
              </h2>
              <div className="space-y-3 md:space-y-4">
                {activeIntents.map((intent) => (
                  <div key={intent.id} className={`p-4 md:p-6 rounded-[25px] md:rounded-[30px] shadow-lg border transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-start flex-wrap gap-3 md:gap-4">
                      <div className="flex gap-3 md:gap-5 flex-1">
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                          {getCategoryIcon(intent.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <h3 className={`font-black text-base md:text-xl uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                              {intent.category} Donation
                            </h3>
                            {getStatusBadge(intent.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                            <span className="flex items-center gap-1 text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              <Calendar size={10} className="md:size-[12px]" /> {new Date(intent.plannedDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1 text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              <MapPin size={10} className="md:size-[12px]" /> {intent.location}
                            </span>
                            {intent.itemType && (
                              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                                {intent.category === 'Organ' ? 'Organ: ' : 'Item: '} {intent.itemType}
                                {intent.quantity && ` x${intent.quantity}`}
                              </span>
                            )}
                          </div>
                          {intent.rejectionReason && (
                            <p className="text-[10px] md:text-xs text-red-500 mt-2">Rejection: {intent.rejectionReason}</p>
                          )}
                        </div>
                      </div>
                      {(intent.status === 'Active' || intent.status === 'PendingVerification') && (
                        <button
                          onClick={() => initiateCancel(intent.id, intent.category)}
                          className="px-3 md:px-5 py-1.5 md:py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-1 shrink-0"
                        >
                          <Trash2 size={12} className="md:size-[14px]" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Intents Section */}
          {pastIntents.length > 0 && (
            <div>
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Clock size={16} className="md:size-[20px]" /> Past Pledges ({pastIntents.length})
              </h2>
              <div className="space-y-3 md:space-y-4">
                {pastIntents.map((intent) => (
                  <div key={intent.id} className={`p-4 md:p-6 rounded-[25px] md:rounded-[30px] shadow-lg border opacity-70 ${isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-start flex-wrap gap-3 md:gap-4">
                      <div className="flex gap-3 md:gap-5">
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center opacity-50 shrink-0">
                          {getCategoryIcon(intent.category)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <h3 className={`font-black text-base md:text-xl uppercase tracking-tight ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                              {intent.category} Donation
                            </h3>
                            {getStatusBadge(intent.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                            <span className="flex items-center gap-1 text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              <Calendar size={10} className="md:size-[12px]" /> {new Date(intent.plannedDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1 text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              <MapPin size={10} className="md:size-[12px]" /> {intent.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {intents.length === 0 && !error && (
            <div className="text-center py-12 md:py-20 bg-white dark:bg-[#111C44] rounded-[30px] md:rounded-[40px] shadow-xl border border-gray-100 dark:border-white/5">
              <HeartPulse size={40} className="md:size-[48px] mx-auto text-gray-400 mb-4 opacity-50" />
              <p className="text-gray-500 dark:text-white/60 font-black uppercase tracking-widest text-[10px] md:text-sm">No donation pledges yet</p>
              <p className="text-gray-400 text-[8px] md:text-xs mt-2 italic">Click "New Intent" to register your first donation pledge.</p>
            </div>
          )}
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-[30px] md:rounded-[40px] p-6 md:p-12 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 dark:bg-red-500/10 text-medical-red rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <AlertTriangle size={24} className="md:size-[32px]" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-[#1B2559] dark:text-white tracking-tighter">Cancel Donation Pledge?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-3 leading-relaxed">
              Are you sure you want to cancel your {cancelModal.intentType} donation pledge? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-10">
              <button
                onClick={() => setCancelModal({ isOpen: false, intentId: null, intentType: '' })}
                className="py-2.5 md:py-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-white/60 font-bold text-[8px] md:text-[10px] uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                Keep It
              </button>
              <button
                onClick={confirmCancel}
                className="py-2.5 md:py-4 rounded-2xl bg-medical-red text-white font-black text-[8px] md:text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-700 transition-all"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyIntents;
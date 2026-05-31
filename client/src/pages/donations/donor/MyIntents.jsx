import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import DonationService from '../../../services/DonationService';
import NotificationHub from '../../../components/notifications/NotificationHub';
import {
  HeartPulse, Calendar, MapPin, Clock, AlertTriangle, CheckCircle,
  XCircle, RefreshCw, Droplets, Box, Heart, Trash2, Menu, Sun, Moon,
  ArrowLeft, Filter
} from 'lucide-react';

const MyIntents = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [intents, setIntents] = useState([]);
  const [filteredIntents, setFilteredIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [intentFilter, setIntentFilter] = useState('all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [cancelModal, setCancelModal] = useState({ isOpen: false, intentId: null, intentType: '' });

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

  const fetchIntents = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await DonationService.getMyIntents();
      if (res.success && res.data && res.data.length > 0) {
        setIntents(res.data);
        setFilteredIntents(res.data);
      } else {
        setIntents([]);
        setFilteredIntents([]);
      }
    } catch (err) {
      console.error("Failed to fetch intents:", err);
      setError(err.response?.data?.message || err.message || "Failed to load your intents");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntents();
  }, []);

  // ✅ FIXED: Filter logic using correct intent statuses
  useEffect(() => {
    if (intentFilter === 'all') {
      setFilteredIntents(intents);
    } else {
      setFilteredIntents(intents.filter(intent => intent.status === intentFilter));
    }
  }, [intentFilter, intents]);

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

  // ✅ FIXED: Status badge for each intent status
  const getStatusBadge = (status) => {
    const config = {
      PendingVerification: {
        color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
        icon: <Clock size={10} />,
        label: 'Under Review'
      },
      Active: {
        color: 'bg-green-500/20 text-green-600 border-green-500/30',
        icon: <CheckCircle size={10} />,
        label: 'Active'
      },
      Matched: {
        color: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
        icon: <HeartPulse size={10} />,
        label: 'Matched'
      },
      Completed: {
        color: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
        icon: <CheckCircle size={10} />,
        label: 'Completed'
      },
      Cancelled: {
        color: 'bg-red-500/20 text-red-600 border-red-500/30',
        icon: <XCircle size={10} />,
        label: 'Cancelled'
      },
    };
    return config[status] || config.PendingVerification;
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Blood': return <Droplets size={20} className="md:size-[24px] text-medical-red" />;
      case 'In_Kind': return <Box size={20} className="md:size-[24px] text-orange-500" />;
      case 'Organ': return <Heart size={20} className="md:size-[24px] text-pink-500" />;
      default: return <HeartPulse size={20} className="md:size-[24px] text-gray-500" />;
    }
  };

  // ✅ FIXED: Filter counts using correct statuses
  const getFilterCount = (filterStatus) => {
    if (filterStatus === 'all') return intents.length;
    return intents.filter(intent => intent.status === filterStatus).length;
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 md:ml-72 p-4 md:p-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
        </main>
      </div>
    );
  }

  if (user?.Role !== 'Donor') {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 md:ml-72 p-4 md:p-10 flex flex-col items-center justify-center">
          <AlertTriangle size={48} className="text-yellow-500 mb-4" />
          <h2 className="text-xl md:text-2xl font-black text-[#1B2559] dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">Only donors can view this page.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-6 px-5 md:px-6 py-2.5 md:py-3 bg-medical-red text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase">
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  // Separate intents by status for display
  const pendingIntents = filteredIntents.filter(i => i.status === 'PendingVerification');
  const activeIntents = filteredIntents.filter(i => i.status === 'Active');
  const matchedIntents = filteredIntents.filter(i => i.status === 'Matched');
  const completedIntents = filteredIntents.filter(i => i.status === 'Completed');
  const cancelledIntents = filteredIntents.filter(i => i.status === 'Cancelled');

  return (
    <div className={`flex min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-full duration-300">
          <div className={`px-4 md:px-8 py-2 md:py-4 rounded-3xl shadow-2xl flex items-center gap-2 md:gap-4 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-medical-red text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={14} className="md:size-[20px] animate-bounce" /> : <AlertTriangle size={14} className="md:size-[20px] animate-bounce" />}
            <p className="text-[9px] md:text-xs font-black uppercase tracking-widest">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isDarkMode={isDarkMode} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <Sidebar isDarkMode={isDarkMode} isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 md:ml-72 w-full">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#0b1121] border-b border-gray-100 dark:border-white/5 sticky top-0 z-50">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="bg-medical-red p-2.5 rounded-xl shadow-lg">
            <Menu size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <NotificationHub isDarkMode={isDarkMode} />
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl shadow-lg ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>
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
              {activeIntents.length + pendingIntents.length + matchedIntents.length} active pledges
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center mb-8">
            <div>
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-medical-red mb-4 transition-all">
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
              <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                My Donation Intents
              </h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
                Track your active pledges • {activeIntents.length + pendingIntents.length + matchedIntents.length} active
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={fetchIntents} disabled={refreshing} className="p-3 rounded-2xl bg-white dark:bg-white/5 shadow-lg">
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <NotificationHub isDarkMode={isDarkMode} />
              <button onClick={toggleTheme} className={`p-3 rounded-2xl shadow-lg ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="md:hidden flex gap-3 mb-6">
            <button onClick={fetchIntents} className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-[9px] font-black uppercase">
              <RefreshCw size={14} className="inline mr-1" /> Refresh
            </button>
            <button onClick={() => navigate('/donations/donor/register-intent')} className="flex-1 py-2 rounded-xl bg-medical-red text-white text-[9px] font-black uppercase">
              + New Intent
            </button>
          </div>

          {/* ✅ FIXED: Filter Bar with correct statuses */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={14} className="text-gray-400 hidden sm:inline" />
              <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-wider hidden sm:inline">Filter:</span>

              <button
                onClick={() => setIntentFilter('all')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  intentFilter === 'all'
                    ? 'bg-medical-red text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600'
                }`}
              >
                All ({getFilterCount('all')})
              </button>

              <button
                onClick={() => setIntentFilter('PendingVerification')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  intentFilter === 'PendingVerification'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-500/10 text-yellow-600'
                }`}
              >
                Under Review ({getFilterCount('PendingVerification')})
              </button>

              <button
                onClick={() => setIntentFilter('Active')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  intentFilter === 'Active'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-500/10 text-green-600'
                }`}
              >
                Active ({getFilterCount('Active')})
              </button>

              <button
                onClick={() => setIntentFilter('Matched')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  intentFilter === 'Matched'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-500/10 text-purple-600'
                }`}
              >
                Matched ({getFilterCount('Matched')})
              </button>

              <button
                onClick={() => setIntentFilter('Completed')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  intentFilter === 'Completed'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500/10 text-blue-600'
                }`}
              >
                Completed ({getFilterCount('Completed')})
              </button>

              <button
                onClick={() => setIntentFilter('Cancelled')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  intentFilter === 'Cancelled'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-500/10 text-gray-600'
                }`}
              >
                Cancelled ({getFilterCount('Cancelled')})
              </button>

              {intentFilter !== 'all' && (
                <button onClick={() => setIntentFilter('all')} className="text-[7px] md:text-[8px] text-gray-400">
                  ✕ Clear
                </button>
              )}
            </div>
            {intentFilter !== 'all' && filteredIntents.length > 0 && (
              <div className="mt-2 text-[7px] md:text-[8px] text-gray-400">
                Showing {filteredIntents.length} {filteredIntents.length === 1 ? 'intent' : 'intents'}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between">
              <span className="text-xs">{error}</span>
              <button onClick={fetchIntents} className="text-red-500 text-xs font-black uppercase">Retry</button>
            </div>
          )}

          {/* Pending Intents Section - Under Review */}
          {pendingIntents.length > 0 && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                <Clock size={16} className="md:size-[20px]" /> Under Review ({pendingIntents.length})
              </h2>
              <div className="space-y-3 md:space-y-4">
                {pendingIntents.map((intent) => {
                  const badge = getStatusBadge(intent.status);
                  return (
                    <IntentCard
                      key={intent.id}
                      intent={intent}
                      badge={badge}
                      getCategoryIcon={getCategoryIcon}
                      initiateCancel={initiateCancel}
                      isDarkMode={isDarkMode}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Intents Section */}
          {activeIntents.length > 0 && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle size={16} className="md:size-[20px]" /> Active Pledges ({activeIntents.length})
              </h2>
              <div className="space-y-3 md:space-y-4">
                {activeIntents.map((intent) => {
                  const badge = getStatusBadge(intent.status);
                  return (
                    <IntentCard
                      key={intent.id}
                      intent={intent}
                      badge={badge}
                      getCategoryIcon={getCategoryIcon}
                      initiateCancel={initiateCancel}
                      isDarkMode={isDarkMode}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Intents Section */}
          {matchedIntents.length > 0 && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <HeartPulse size={16} className="md:size-[20px]" /> Matched ({matchedIntents.length})
              </h2>
              <div className="space-y-3 md:space-y-4">
                {matchedIntents.map((intent) => {
                  const badge = getStatusBadge(intent.status);
                  return (
                    <IntentCard
                      key={intent.id}
                      intent={intent}
                      badge={badge}
                      getCategoryIcon={getCategoryIcon}
                      initiateCancel={initiateCancel}
                      isDarkMode={isDarkMode}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Intents Section */}
          {completedIntents.length > 0 && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <CheckCircle size={16} className="md:size-[20px]" /> Completed ({completedIntents.length})
              </h2>
              <div className="space-y-3 md:space-y-4 opacity-70">
                {completedIntents.map((intent) => {
                  const badge = getStatusBadge(intent.status);
                  return (
                    <IntentCard
                      key={intent.id}
                      intent={intent}
                      badge={badge}
                      getCategoryIcon={getCategoryIcon}
                      initiateCancel={initiateCancel}
                      isDarkMode={isDarkMode}
                      isPast
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancelled Intents Section */}
          {cancelledIntents.length > 0 && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <XCircle size={16} className="md:size-[20px]" /> Cancelled ({cancelledIntents.length})
              </h2>
              <div className="space-y-3 md:space-y-4 opacity-70">
                {cancelledIntents.map((intent) => {
                  const badge = getStatusBadge(intent.status);
                  return (
                    <IntentCard
                      key={intent.id}
                      intent={intent}
                      badge={badge}
                      getCategoryIcon={getCategoryIcon}
                      initiateCancel={initiateCancel}
                      isDarkMode={isDarkMode}
                      isPast
                    />
                  );
                })}
              </div>
            </div>
          )}

          {intents.length === 0 && !error && (
            <div className="text-center py-12 md:py-20 bg-white dark:bg-[#111C44] rounded-[30px] md:rounded-[40px] shadow-xl">
              <HeartPulse size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
              <p className="text-gray-500 font-black uppercase tracking-widest text-sm">No donation pledges yet</p>
              <p className="text-gray-400 text-[10px] md:text-xs mt-2">Click "New Intent" to register your first donation pledge.</p>
            </div>
          )}

          {filteredIntents.length === 0 && intents.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No {intentFilter === 'PendingVerification' ? 'Under Review' : intentFilter} intents found</p>
              <button onClick={() => setIntentFilter('all')} className="mt-2 text-medical-red text-xs font-black uppercase">View all intents</button>
            </div>
          )}
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-[30px] md:rounded-[40px] p-6 md:p-8 max-w-sm w-full shadow-2xl text-center mx-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 dark:bg-red-500/10 text-medical-red rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <AlertTriangle size={24} className="md:size-[32px]" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-[#1B2559] dark:text-white">Cancel Donation Pledge?</h3>
            <p className="text-gray-500 text-xs md:text-sm mt-3 leading-relaxed">
              Are you sure you want to cancel your {cancelModal.intentType} donation pledge? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-10">
              <button onClick={() => setCancelModal({ isOpen: false, intentId: null, intentType: '' })} className="py-2.5 md:py-4 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-600 font-bold text-[9px] md:text-[10px] uppercase">
                Keep It
              </button>
              <button onClick={confirmCancel} className="py-2.5 md:py-4 rounded-2xl bg-medical-red text-white font-black text-[9px] md:text-[10px] uppercase shadow-lg">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Intent Card Component
const IntentCard = ({ intent, badge, getCategoryIcon, initiateCancel, isDarkMode, isPast }) => {
  const canCancel = intent.status === 'Active' || intent.status === 'PendingVerification';

  return (
    <div className={`p-4 md:p-6 rounded-[25px] md:rounded-[30px] shadow-lg border transition-all ${isPast ? 'opacity-70' : ''} ${
      isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'
    }`}>
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
              <span className={`inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black uppercase ${badge.color}`}>
                {badge.icon} {badge.label}
              </span>
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
        {canCancel && !isPast && (
          <button
            onClick={() => initiateCancel(intent.id, intent.category)}
            className="px-3 md:px-5 py-1.5 md:py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[7px] md:text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center gap-1 shrink-0"
          >
            <Trash2 size={12} className="md:size-[14px]" /> Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default MyIntents;
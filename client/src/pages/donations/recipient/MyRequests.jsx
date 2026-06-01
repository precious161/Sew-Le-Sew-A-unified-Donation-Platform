import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import DonationService from '../../../services/DonationService';
import NotificationHub from '../../../components/notifications/NotificationHub';
import {
  Activity, AlertTriangle, CheckCircle, XCircle, Clock, Search,
  HeartPulse, RefreshCw, Menu, Sun, Moon, ArrowLeft, Filter,
  Droplets, Heart, Box, Banknote
} from 'lucide-react';

const MyRequests = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [requestFilter, setRequestFilter] = useState('all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, requestId: null });

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

  const fetchRequests = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await DonationService.getMyRequests();
      if (res.success && res.data) {
        setRequests(res.data);
        setFilteredRequests(res.data);
      } else {
        setRequests([]);
        setFilteredRequests([]);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setError(err.response?.data?.message || err.message || "Failed to load your requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ✅ FIXED: Filter logic using correct request statuses
  useEffect(() => {
    if (requestFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(req => req.status === requestFilter));
    }
  }, [requestFilter, requests]);

  const initiateCancel = (requestId) => {
    setConfirmModal({ isOpen: true, requestId });
  };

  const confirmCancel = async () => {
    const idToCancel = confirmModal.requestId;
    setConfirmModal({ isOpen: false, requestId: null });

    try {
      const res = await DonationService.cancelDonationRequest(idToCancel);
      if (res.success) {
        showToast("Request cancelled successfully.", "success");
        fetchRequests();
      } else {
        showToast(res.message || 'Failed to cancel request', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel request', 'error');
    }
  };

  // ✅ FIXED: Status badge for each request status
  const getStatusBadge = (status) => {
    const config = {
      PendingVerification: {
        color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
        icon: <Clock size={10} />,
        label: 'Under Review'
      },
      Pending: {
        color: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
        icon: <Clock size={10} />,
        label: 'Pending Match'
      },
      Matching: {
        color: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
        icon: <HeartPulse size={10} />,
        label: 'Matching'
      },
      Fulfilled: {
        color: 'bg-green-500/20 text-green-600 border-green-500/30',
        icon: <CheckCircle size={10} />,
        label: 'Fulfilled'
      },
      Cancelled: {
        color: 'bg-red-500/20 text-red-600 border-red-500/30',
        icon: <XCircle size={10} />,
        label: 'Cancelled'
      },
    };
    return config[status] || config.PendingVerification;
  };

  const getCategoryIcon = (type) => {
    switch(type) {
      case 'Blood': return <Droplets size={16} className="text-medical-red" />;
      case 'Organ': return <Heart size={16} className="text-pink-500" />;
      case 'In_Kind': return <Box size={16} className="text-orange-500" />;
      case 'Financial': return <Banknote size={16} className="text-green-500" />;
      default: return <Activity size={16} className="text-gray-500" />;
    }
  };

  // ✅ FIXED: Filter counts using correct statuses
  const getFilterCount = (filterStatus) => {
    if (filterStatus === 'all') return requests.length;
    return requests.filter(req => req.status === filterStatus).length;
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

  if (user?.Role !== 'Recipient') {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 md:ml-72 p-4 md:p-10 flex flex-col items-center justify-center">
          <AlertTriangle size={48} className="text-yellow-500 mb-4" />
          <h2 className="text-xl md:text-2xl font-black text-[#1B2559] dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">Only recipients can view this page.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-6 px-5 md:px-6 py-2.5 md:py-3 bg-medical-red text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase">
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  // Separate requests by status for display
  const pendingVerificationReqs = filteredRequests.filter(r => r.status === 'PendingVerification');
  const pendingReqs = filteredRequests.filter(r => r.status === 'Pending');
  const matchingReqs = filteredRequests.filter(r => r.status === 'Matching');
  const fulfilledReqs = filteredRequests.filter(r => r.status === 'Fulfilled');
  const cancelledReqs = filteredRequests.filter(r => r.status === 'Cancelled');

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
              My Requests
            </h1>
            <p className="text-gray-400 text-[8px] font-bold uppercase tracking-[0.3em] mt-1">{requests.length} total requests</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center mb-8">
            <div>
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-medical-red mb-4 transition-all">
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
              <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                My Donation Requests
              </h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Track your requests • {requests.length} total</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={fetchRequests} disabled={refreshing} className="p-3 rounded-2xl bg-white dark:bg-white/5 shadow-lg">
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
            <button onClick={fetchRequests} className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-[9px] font-black uppercase">
              <RefreshCw size={14} className="inline mr-1" /> Refresh
            </button>
            <button onClick={() => navigate('/donations/recipient/request')} className="flex-1 py-2 rounded-xl bg-medical-red text-white text-[9px] font-black uppercase">
              + New Request
            </button>
          </div>

          {/* ✅ FIXED: Filter Bar with correct statuses */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={14} className="text-gray-400 hidden sm:inline" />
              <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-wider hidden sm:inline">Filter:</span>

              <button
                onClick={() => setRequestFilter('all')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  requestFilter === 'all'
                    ? 'bg-medical-red text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600'
                }`}
              >
                All ({getFilterCount('all')})
              </button>

              <button
                onClick={() => setRequestFilter('PendingVerification')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  requestFilter === 'PendingVerification'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-500/10 text-yellow-600'
                }`}
              >
                Under Review ({getFilterCount('PendingVerification')})
              </button>

              <button
                onClick={() => setRequestFilter('Pending')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  requestFilter === 'Pending'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500/10 text-blue-600'
                }`}
              >
                Pending Match ({getFilterCount('Pending')})
              </button>

              <button
                onClick={() => setRequestFilter('Matching')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  requestFilter === 'Matching'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-500/10 text-purple-600'
                }`}
              >
                Matching ({getFilterCount('Matching')})
              </button>

              <button
                onClick={() => setRequestFilter('Fulfilled')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  requestFilter === 'Fulfilled'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-500/10 text-green-600'
                }`}
              >
                Completed ({getFilterCount('Fulfilled')})
              </button>

              <button
                onClick={() => setRequestFilter('Cancelled')}
                className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase transition-all ${
                  requestFilter === 'Cancelled'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-500/10 text-gray-600'
                }`}
              >
                Cancelled ({getFilterCount('Cancelled')})
              </button>

              {requestFilter !== 'all' && (
                <button onClick={() => setRequestFilter('all')} className="text-[7px] md:text-[8px] text-gray-400">
                  ✕ Clear
                </button>
              )}
            </div>
            {requestFilter !== 'all' && filteredRequests.length > 0 && (
              <div className="mt-2 text-[7px] md:text-[8px] text-gray-400">
                Showing {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between">
              <span className="text-xs">{error}</span>
              <button onClick={fetchRequests} className="text-red-500 text-xs font-black uppercase">Retry</button>
            </div>
          )}

          {/* Pending Verification Section - Under Review */}
          {pendingVerificationReqs.length > 0 && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                <Clock size={16} className="md:size-[20px]" /> Under Review ({pendingVerificationReqs.length})
              </h2>
              <div className="space-y-3 md:space-y-4">
                {pendingVerificationReqs.map((req) => {
                  const badge = getStatusBadge(req.status);
                  const requestedAmount = req.quantity || req.financialAmount || 0;
                  const canCancel = true;

                  return (
                    <RequestCard
                      key={req.id}
                      req={req}
                      badge={badge}
                      requestedAmount={requestedAmount}
                      getCategoryIcon={getCategoryIcon}
                      initiateCancel={initiateCancel}
                      canCancel={canCancel}
                      isDarkMode={isDarkMode}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Section - Pending Match */}
          {pendingReqs.length > 0 && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Clock size={16} className="md:size-[20px]" /> Pending Match ({pendingReqs.length})
              </h2>
              <div className="space-y-3 md:space-y-4">
                {pendingReqs.map((req) => {
                  const badge = getStatusBadge(req.status);
                  const requestedAmount = req.quantity || req.financialAmount || 0;
                  const canCancel = true;

                  return (
                    <RequestCard
                      key={req.id}
                      req={req}
                      badge={badge}
                      requestedAmount={requestedAmount}
                      getCategoryIcon={getCategoryIcon}
                      initiateCancel={initiateCancel}
                      canCancel={canCancel}
                      isDarkMode={isDarkMode}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Matching Section */}
          {matchingReqs.length > 0 && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <HeartPulse size={16} className="md:size-[20px]" /> Matching ({matchingReqs.length})
              </h2>
              <div className="space-y-3 md:space-y-4 opacity-90">
                {matchingReqs.map((req) => {
                  const badge = getStatusBadge(req.status);
                  const requestedAmount = req.quantity || req.financialAmount || 0;
                  const canCancel = false; // Cannot cancel once matching started

                  return (
                    <RequestCard
                      key={req.id}
                      req={req}
                      badge={badge}
                      requestedAmount={requestedAmount}
                      getCategoryIcon={getCategoryIcon}
                      initiateCancel={initiateCancel}
                      canCancel={canCancel}
                      isDarkMode={isDarkMode}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Fulfilled Section - Completed */}
          {fulfilledReqs.length > 0 && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle size={16} className="md:size-[20px]" /> Completed ({fulfilledReqs.length})
              </h2>
              <div className="space-y-3 md:space-y-4 opacity-70">
                {fulfilledReqs.map((req) => {
                  const badge = getStatusBadge(req.status);
                  const requestedAmount = req.quantity || req.financialAmount || 0;
                  const canCancel = false;

                  return (
                    <RequestCard
                      key={req.id}
                      req={req}
                      badge={badge}
                      requestedAmount={requestedAmount}
                      getCategoryIcon={getCategoryIcon}
                      initiateCancel={initiateCancel}
                      canCancel={canCancel}
                      isDarkMode={isDarkMode}
                      isPast
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancelled Section */}
          {cancelledReqs.length > 0 && (
            <div className="mb-8 md:mb-10">
              <h2 className="text-base md:text-xl font-black mb-3 md:mb-4 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <XCircle size={16} className="md:size-[20px]" /> Cancelled ({cancelledReqs.length})
              </h2>
              <div className="space-y-3 md:space-y-4 opacity-70">
                {cancelledReqs.map((req) => {
                  const badge = getStatusBadge(req.status);
                  const requestedAmount = req.quantity || req.financialAmount || 0;
                  const canCancel = false;

                  return (
                    <RequestCard
                      key={req.id}
                      req={req}
                      badge={badge}
                      requestedAmount={requestedAmount}
                      getCategoryIcon={getCategoryIcon}
                      initiateCancel={initiateCancel}
                      canCancel={canCancel}
                      isDarkMode={isDarkMode}
                      isPast
                    />
                  );
                })}
              </div>
            </div>
          )}

          {requests.length === 0 && !error && (
            <div className="text-center py-12 md:py-20 bg-white dark:bg-[#111C44] rounded-[30px] md:rounded-[40px] shadow-xl">
              <Activity size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
              <p className="text-gray-500 font-black uppercase tracking-widest text-sm">No donation requests yet</p>
              <p className="text-gray-400 text-[10px] md:text-xs mt-2">Click "New Request" to submit your first clinical request.</p>
            </div>
          )}

          {filteredRequests.length === 0 && requests.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No {requestFilter === 'PendingVerification' ? 'Under Review' : requestFilter === 'Fulfilled' ? 'Completed' : requestFilter} requests found</p>
              <button onClick={() => setRequestFilter('all')} className="mt-2 text-medical-red text-xs font-black uppercase">View all requests</button>
            </div>
          )}
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-[30px] md:rounded-[40px] p-6 md:p-8 max-w-sm w-full shadow-2xl text-center mx-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 dark:bg-red-500/10 text-medical-red rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <AlertTriangle size={24} className="md:size-[32px]" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-[#1B2559] dark:text-white">Cancel Request?</h3>
            <p className="text-gray-500 text-xs md:text-sm mt-3 leading-relaxed">
              Are you sure you want to cancel this donation request? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-10">
              <button onClick={() => setConfirmModal({ isOpen: false, requestId: null })} className="py-2.5 md:py-4 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-600 font-bold text-[9px] md:text-[10px] uppercase">
                No, Keep
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

// Request Card Component
const RequestCard = ({ req, badge, requestedAmount, getCategoryIcon, initiateCancel, canCancel, isDarkMode, isPast }) => {
  return (
    <div key={req.id} className={`p-4 md:p-6 rounded-[25px] md:rounded-[30px] shadow-lg border transition-all ${isPast ? 'opacity-70' : ''} ${
      isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'
    }`}>
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              {getCategoryIcon(req.donationType)}
              <h3 className="font-black text-base md:text-lg uppercase tracking-tight">{req.donationType} Request</h3>
            </div>
            <span className={`inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black uppercase ${badge.color}`}>
              {badge.icon} {badge.label}
            </span>
          </div>

          <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">
            {req.hospitalName || 'General Registry'}
            {req.attendingDoctor && ` • Dr. ${req.attendingDoctor}`}
          </p>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3">
            <span className="flex items-center gap-1 text-[8px] md:text-[10px] text-gray-400">
              <Clock size={10} className="md:size-[12px]" /> {new Date(req.requestDate).toLocaleDateString()}
            </span>
            {req.requiredBloodType && (
              <span className="flex items-center gap-1 text-[8px] md:text-[10px] text-medical-red font-black">
                <Droplets size={10} className="md:size-[12px]" /> Blood: {req.requiredBloodType}
              </span>
            )}
            {req.donationType === 'Financial' && requestedAmount > 0 && (
              <span className="flex items-center gap-1 text-[8px] md:text-[10px] text-green-600 font-black">
                <Banknote size={10} className="md:size-[12px]" /> {requestedAmount.toLocaleString()} Birr
              </span>
            )}
            <span className={`px-1.5 md:px-2 py-0.5 rounded-lg text-[7px] md:text-[8px] font-black uppercase ${
              req.urgencyLevel === 'Critical' ? 'bg-medical-red/20 text-medical-red' : 'bg-blue-500/20 text-blue-500'
            }`}>
              {req.urgencyLevel}
            </span>
          </div>

          {req.notes && (
            <p className="text-[9px] md:text-xs text-gray-500 mt-3 italic border-l-2 border-gray-200 dark:border-white/10 pl-2">"{req.notes}"</p>
          )}

          {req.rejectionReason && (
            <div className="mt-3 p-2 bg-red-500/10 rounded-lg">
              <p className="text-[8px] md:text-[9px] text-red-500 font-black">Rejection Reason:</p>
              <p className="text-[9px] md:text-xs text-red-600">{req.rejectionReason}</p>
            </div>
          )}
        </div>

        {canCancel && !isPast && (
          <button
            onClick={() => initiateCancel(req.id)}
            className="px-4 md:px-5 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[8px] md:text-[9px] font-black uppercase hover:bg-medical-red hover:text-white transition-all self-start md:self-center"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
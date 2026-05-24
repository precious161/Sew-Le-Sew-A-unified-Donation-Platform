import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import DonationService from '../../../services/DonationService';

// FIXED: Imported the missing Droplets, Heart, and Box icons!
import {
  Clock, Activity, AlertTriangle, CheckCircle,
  XCircle, FileText, RefreshCw, Banknote,
  Droplets, Heart, Box
} from 'lucide-react';

const MyRequests = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Professional UI States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, requestId: null });

  const fetchRequests = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await DonationService.getMyRequests();
      if (res.success && res.data) {
        setRequests(res.data);
      } else {
        setError(res.message || "Failed to load your requests");
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

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Custom Cancellation Logic
  const initiateCancel = (requestId) => {
    setConfirmModal({ isOpen: true, requestId });
  };

  const confirmCancel = async () => {
    const idToCancel = confirmModal.requestId;
    setConfirmModal({ isOpen: false, requestId: null }); // Close modal immediately

    try {
      const res = await DonationService.cancelDonationRequest(idToCancel);
      if (res.success) {
        showToast("Request cancelled successfully.", "success");
        fetchRequests(); // Refresh the list
      } else {
        showToast(res.message || 'Failed to cancel request', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel request', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PendingVerification: 'bg-yellow-500',
      Pending: 'bg-blue-500',
      Matching: 'bg-purple-500',
      Fulfilled: 'bg-green-500',
      Cancelled: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Fulfilled':
        return <CheckCircle size={14} className="mr-1" />;
      case 'Cancelled':
        return <XCircle size={14} className="mr-1" />;
      default:
        return <Clock size={14} className="mr-1" />;
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

  if (user?.Role !== 'Recipient') {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 ml-72 p-10 flex flex-col items-center justify-center">
          <AlertTriangle size={48} className="text-yellow-500 mb-4" />
          <h2 className="text-2xl font-black text-[#1B2559] dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500">Only recipients can view this page.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-6 px-6 py-3 bg-medical-red text-white rounded-2xl font-black text-[10px] uppercase tracking-wider">
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>

      {/* ── TOAST NOTIFICATION ── */}
      {toast.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-full duration-300">
           <div className={`px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-medical-red text-white'}`}>
              {toast.type === 'success' ? <CheckCircle size={20} className="animate-bounce" /> : <AlertTriangle size={20} className="animate-bounce" />}
              <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
           </div>
        </div>
      )}

      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10 relative text-left">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              My Donation Requests
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
              Track your requests • {requests.length} total
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchRequests} disabled={refreshing} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-lg hover:bg-medical-red hover:text-white transition-all">
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => navigate('/donations/recipient/request')} className="px-6 py-3 bg-medical-red text-white rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all">
              + New Request
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} />
              <span className="text-xs font-medium">{error}</span>
            </div>
            <button onClick={fetchRequests} className="text-red-500 hover:text-red-700 text-xs font-black uppercase tracking-widest">
              Retry
            </button>
          </div>
        )}

        {requests.length === 0 && !error ? (
          <div className="text-center py-20 bg-white dark:bg-[#111C44] rounded-[40px] shadow-xl border border-gray-100 dark:border-white/5">
            <Activity size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
            <p className="text-gray-500 dark:text-white/60 font-black uppercase tracking-widest text-sm">No donation requests yet</p>
            <p className="text-gray-400 text-xs mt-2 italic">Click "New Request" to submit your first clinical request.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className={`p-6 rounded-[30px] shadow-lg border transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className={`font-black text-lg uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                        {req.donationType} Request
                      </h3>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white flex items-center ${getStatusColor(req.status)} shadow-sm`}>
                        {getStatusIcon(req.status)} {req.status === 'PendingVerification' ? 'Under Review' : req.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-bold uppercase tracking-widest">
                      {req.hospitalName || 'General Registry'}
                      {req.attendingDoctor && ` • Dr. ${req.attendingDoctor}`}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <Clock size={12} /> {new Date(req.requestDate).toLocaleDateString()}
                      </span>
                      {req.requiredBloodType && (
                        <span className="flex items-center gap-1 text-[10px] text-medical-red font-black uppercase tracking-widest">
                          <Droplets size={12} /> Blood Type: {req.requiredBloodType}
                        </span>
                      )}
                      {req.organType && (
                        <span className="flex items-center gap-1 text-[10px] text-pink-500 font-black uppercase tracking-widest">
                          <Heart size={12} /> Organ: {req.organType}
                        </span>
                      )}
                      {req.itemType && (
                        <span className="flex items-center gap-1 text-[10px] text-orange-500 font-black uppercase tracking-widest">
                          <Box size={12} /> Item: {req.itemType} x{req.itemQuantity}
                        </span>
                      )}
                      {req.donationType === 'Financial' && (
                        <span className="flex items-center gap-1 text-[10px] text-green-500 font-black uppercase tracking-widest">
                          <Banknote size={12} /> Amount: {req.financialAmount} ETB
                        </span>
                      )}
                      <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                        req.urgencyLevel === 'Critical' ? 'text-red-500 bg-red-500/10' :
                        req.urgencyLevel === 'High' ? 'text-orange-500 bg-orange-500/10' : 'text-blue-500 bg-blue-500/10'
                      }`}>
                        <AlertTriangle size={12} /> {req.urgencyLevel} Urgency
                      </span>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic border-l-2 border-gray-200 dark:border-white/10 pl-3">"{req.notes}"</p>
                    )}

                    {req.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">Rejection Reason:</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{req.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* CANCELLATION BUTTON */}
                  {(req.status === 'Pending' || req.status === 'PendingVerification') && (
                    <button
                      onClick={() => initiateCancel(req.id)}
                      className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-medical-red hover:text-white transition-all"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── CONFIRMATION MODAL ── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
           <div className="bg-white dark:bg-[#1e293b] rounded-[40px] p-12 max-w-sm w-full shadow-2xl text-center border border-gray-50 dark:border-white/10">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-medical-red rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-black text-[#1B2559] dark:text-white tracking-tighter">Cancel Request?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-relaxed">
                Are you sure you want to cancel this donation request? This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-10">
                <button
                  onClick={() => setConfirmModal({ isOpen: false, requestId: null })}
                  className="py-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-white/60 font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  Abort
                </button>
                <button
                  onClick={confirmCancel}
                  className="py-4 rounded-2xl bg-medical-red text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-700 transition-all"
                >
                  Confirm
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
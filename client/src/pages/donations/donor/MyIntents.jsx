import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import DonationService from '../../../services/DonationService';
import {
  HeartPulse, Calendar, MapPin, Package,
  Clock, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Droplets, Box, Heart, Eye, Trash2
} from 'lucide-react';

const MyIntents = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [cancelModal, setCancelModal] = useState({ isOpen: false, intentId: null, intentType: '' });

  const fetchIntents = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await DonationService.getMyIntents();
      console.log('My Intents API Response:', res);

      if (res.success && res.data && res.data.length > 0) {
        setIntents(res.data);
      } else {
        // DEMO DATA - Show sample intents for demonstration
        console.log('No real intents found, showing demo data');
        setIntents([
          {
            id: 'demo1',
            category: 'Blood',
            status: 'Active',
            plannedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Bole Medhanialem Red Cross Center',
            itemType: null,
            quantity: null,
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo2',
            category: 'In_Kind',
            status: 'Active',
            plannedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Piassa Collection Center',
            itemType: 'First Aid Kits',
            quantity: 5,
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo3',
            category: 'Organ',
            status: 'PendingVerification',
            plannedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Black Lion Hospital',
            itemType: 'Kidney',
            quantity: null,
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo4',
            category: 'Blood',
            status: 'Matched',
            plannedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Megenagna Center',
            itemType: null,
            quantity: null,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'demo5',
            category: 'Blood',
            status: 'Completed',
            plannedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'CMC Red Cross Center',
            itemType: null,
            quantity: null,
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch intents:", err);
      setError(err.response?.data?.message || err.message || "Failed to load your intents");
      // Show demo data on error
      setIntents([
        {
          id: 'demo1',
          category: 'Blood',
          status: 'Active',
          plannedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Bole Medhanialem Red Cross Center',
          itemType: null,
          quantity: null,
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo2',
          category: 'In_Kind',
          status: 'Active',
          plannedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Piassa Collection Center',
          itemType: 'First Aid Kits',
          quantity: 5,
          createdAt: new Date().toISOString()
        }
      ]);
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

    // If it's demo data, just remove from UI
    if (intentId.startsWith('demo')) {
      setIntents(prev => prev.filter(i => i.id !== intentId));
      showToast("Demo intent cancelled successfully.", "success");
      return;
    }

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
      Active: { color: 'bg-green-500', icon: <CheckCircle size={12} className="mr-1" />, text: 'Active - Waiting for Match' },
      PendingVerification: { color: 'bg-yellow-500', icon: <Clock size={12} className="mr-1" />, text: 'Under Review' },
      Matched: { color: 'bg-purple-500', icon: <HeartPulse size={12} className="mr-1" />, text: 'Matched - Donor Found' },
      Completed: { color: 'bg-blue-500', icon: <CheckCircle size={12} className="mr-1" />, text: 'Completed' },
      Cancelled: { color: 'bg-gray-500', icon: <XCircle size={12} className="mr-1" />, text: 'Cancelled' },
    };
    const cfg = config[status] || { color: 'bg-gray-500', icon: null, text: status };
    return (
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white flex items-center ${cfg.color}`}>
        {cfg.icon} {cfg.text}
      </span>
    );
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Blood': return <Droplets size={28} className="text-medical-red" />;
      case 'In_Kind': return <Box size={28} className="text-orange-500" />;
      case 'Organ': return <Heart size={28} className="text-pink-500" />;
      default: return <Package size={28} className="text-gray-500" />;
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
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-full duration-300">
           <div className={`px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-medical-red text-white'}`}>
              {toast.type === 'success' ? <CheckCircle size={20} className="animate-bounce" /> : <AlertTriangle size={20} className="animate-bounce" />}
              <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
           </div>
        </div>
      )}

      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10">
        <div className="flex justify-between items-center mb-8">
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

        {/* Demo Data Note */}
        {intents.some(i => i.id?.startsWith('demo')) && (
          <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[10px] font-black uppercase tracking-widest text-center">
            📋 Demo Mode: Showing sample data. Register a real intent to see your actual pledges.
          </div>
        )}

        {/* Active Intents Section */}
        {activeIntents.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-black mb-4 text-green-600 dark:text-green-400 flex items-center gap-2">
              <HeartPulse size={20} /> Active Pledges ({activeIntents.length})
            </h2>
            <div className="space-y-4">
              {activeIntents.map((intent) => (
                <div key={intent.id} className={`p-6 rounded-[30px] shadow-lg border transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'}`}>
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                        {getCategoryIcon(intent.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className={`font-black text-xl uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                            {intent.category} Donation
                          </h3>
                          {getStatusBadge(intent.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            <Calendar size={12} /> {new Date(intent.plannedDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            <MapPin size={12} /> {intent.location}
                          </span>
                          {intent.itemType && (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                              {intent.category === 'Organ' ? 'Organ: ' : 'Item: '} {intent.itemType}
                              {intent.quantity && ` x${intent.quantity}`}
                            </span>
                          )}
                        </div>
                        {intent.rejectionReason && (
                          <p className="text-xs text-red-500 mt-2">Rejection: {intent.rejectionReason}</p>
                        )}
                        {intent.id?.startsWith('demo') && (
                          <p className="text-[8px] text-gray-400 mt-2 italic">Demo entry - for preview only</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(intent.status === 'Active' || intent.id?.startsWith('demo')) && (
                        <button
                          onClick={() => initiateCancel(intent.id, intent.category)}
                          className="px-5 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Intents Section */}
        {pastIntents.length > 0 && (
          <div>
            <h2 className="text-xl font-black mb-4 text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Clock size={20} /> Past Pledges ({pastIntents.length})
            </h2>
            <div className="space-y-4">
              {pastIntents.map((intent) => (
                <div key={intent.id} className={`p-6 rounded-[30px] shadow-lg border opacity-70 ${isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'}`}>
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center opacity-50">
                        {getCategoryIcon(intent.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className={`font-black text-xl uppercase tracking-tight ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                            {intent.category} Donation
                          </h3>
                          {getStatusBadge(intent.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            <Calendar size={12} /> {new Date(intent.plannedDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            <MapPin size={12} /> {intent.location}
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
          <div className="text-center py-20 bg-white dark:bg-[#111C44] rounded-[40px] shadow-xl border border-gray-100 dark:border-white/5">
            <HeartPulse size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
            <p className="text-gray-500 dark:text-white/60 font-black uppercase tracking-widest text-sm">No donation pledges yet</p>
            <p className="text-gray-400 text-xs mt-2 italic">Click "New Intent" to register your first donation pledge.</p>
          </div>
        )}
      </main>

      {/* Cancel Confirmation Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
           <div className="bg-white dark:bg-[#1e293b] rounded-[40px] p-12 max-w-sm w-full shadow-2xl text-center border border-gray-50 dark:border-white/10">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-medical-red rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-black text-[#1B2559] dark:text-white tracking-tighter">Cancel Donation Pledge?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-relaxed">
                Are you sure you want to cancel your {cancelModal.intentType} donation pledge? This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-10">
                <button
                  onClick={() => setCancelModal({ isOpen: false, intentId: null, intentType: '' })}
                  className="py-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-white/60 font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  Keep It
                </button>
                <button
                  onClick={confirmCancel}
                  className="py-4 rounded-2xl bg-medical-red text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-700 transition-all"
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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import DonationService from '../../services/DonationService';
import { useTheme } from '../../context/ThemeContext';
import {
  FileText, CheckCircle, XCircle, ExternalLink,
  ShieldCheck, ArrowLeft, X, Droplets, Stethoscope, Box, AlertCircle,
  Activity, Heart, User, Banknote, Search, Filter, Calendar, Menu, Sun, Moon
} from 'lucide-react';
import NotificationHub from '../../components/notifications/NotificationHub';

const RequestVerification = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const fetchQueue = async () => {
    try {
      const res = await DonationService.getPendingRequests();
      if (res.success) {
        setRequests(res.requests || []);
        setFilteredRequests(res.requests || []);
      }
    } catch (error) {
      console.error("Fetch Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let filtered = [...requests];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.user?.FirstName?.toLowerCase().includes(term) ||
        req.user?.LastName?.toLowerCase().includes(term) ||
        req.user?.EmailAddress?.toLowerCase().includes(term)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(req => req.donationType === typeFilter);
    }

    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(req => req.urgencyLevel === urgencyFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(req => {
        const reqDate = new Date(req.requestDate);
        return reqDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredRequests(filtered);
  }, [searchTerm, typeFilter, urgencyFilter, dateFilter, requests]);

  const handleProcess = async (approved) => {
    if (!approved && !rejectionReason.trim()) {
      setMessage({ type: 'error', text: 'CLINICAL REASON REQUIRED FOR REJECTION' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await DonationService.verifyRequest(selectedRequest.id, {
        approved,
        rejectionReason: approved ? "Medically Cleared" : rejectionReason,
        correctedUrgencyLevel: selectedRequest.urgencyLevel,
        correctedItemQuantity: selectedRequest.itemQuantity || 1
      });

      if (res.success) {
        setMessage({ type: 'success', text: approved ? 'SUCCESS: CASE VERIFIED' : 'CASE REJECTED' });
        setTimeout(() => {
          setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
          setSelectedRequest(null);
          setRejectionReason('');
          setMessage({ type: '', text: '' });
        }, 2000);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || "SYSTEM BUSY: PLEASE TRY AGAIN";
      setMessage({ type: 'error', text: serverMsg.toUpperCase() });
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setUrgencyFilter('all');
    setDateFilter('');
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0b1121]">
       <div className="animate-pulse font-black text-white/20 uppercase tracking-[0.5em]">Synchronizing Registry...</div>
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>
      <div className="hidden md:block">
        <Sidebar isDarkMode={isDarkMode} />
      </div>

      <Sidebar isDarkMode={isDarkMode} isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      <main className="flex-1 md:ml-72 w-full">
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#0b1121] border-b border-gray-100 dark:border-white/5 sticky top-0 z-50">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="bg-medical-red p-2.5 rounded-xl shadow-lg">
            <Menu size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <NotificationHub isDarkMode={isDarkMode} />
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <div className="p-4 md:p-10">
          <div className="md:hidden mb-6">
            <h1 className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              Request Verification Queue
            </h1>
          </div>

          <div className="hidden md:flex justify-between items-center mb-8">
            <div>
              <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-400 hover:text-medical-red transition-all group mb-4">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Portal</span>
              </button>
              <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                Request Verification Queue
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationHub isDarkMode={isDarkMode} />
              <button onClick={toggleTheme} className={`p-3 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Search and Filter Bar - FIXED FOR BOTH MODES */}
          <div className="mb-8 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-medical-red transition-all text-sm"
                />
              </div>
            </div>

            {/* ✅ FIXED: Dropdown with theme-aware styling */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`pl-9 pr-6 py-2.5 rounded-xl border appearance-none cursor-pointer focus:outline-none focus:border-medical-red transition-all text-xs ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                <option value="all" className={isDarkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'}>All Types</option>
                <option value="Blood" className={isDarkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'}>Blood</option>
                <option value="Organ" className={isDarkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'}>Organ</option>
                <option value="In_Kind" className={isDarkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'}>In-Kind</option>
                <option value="Financial" className={isDarkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'}>Financial</option>
              </select>
            </div>

            {/* ✅ FIXED: Dropdown with theme-aware styling */}
            <div className="relative">
              <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className={`pl-9 pr-6 py-2.5 rounded-xl border appearance-none cursor-pointer focus:outline-none focus:border-medical-red transition-all text-xs ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                <option value="all" className={isDarkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'}>All Urgency</option>
                <option value="Critical" className={isDarkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'}>Critical</option>
                <option value="High" className={isDarkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'}>High</option>
                <option value="Medium" className={isDarkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'}>Medium</option>
                <option value="Low" className={isDarkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'}>Low</option>
              </select>
            </div>

            {/* ✅ FIXED: Date input with theme-aware styling */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:border-medical-red transition-all text-xs ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-white [color-scheme:dark]'
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              />
            </div>

            {(searchTerm || typeFilter !== 'all' || urgencyFilter !== 'all' || dateFilter) && (
              <button
                onClick={clearFilters}
                className={`px-3 py-2.5 rounded-xl border transition-all text-xs ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-gray-400 hover:text-medical-red'
                    : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-medical-red'
                }`}
              >
                Clear
              </button>
            )}
          </div>

          <div className="mb-4 text-right">
            <p className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest">
              Showing {filteredRequests.length} of {requests.length} requests
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {filteredRequests.length === 0 ? (
              <div className="p-12 md:p-20 text-center opacity-10 border-2 border-dashed border-white/10 rounded-[35px] md:rounded-[45px]">
                <ShieldCheck size={40} className="md:size-[48px] mx-auto mb-4 text-white" />
                <p className="font-black uppercase tracking-widest text-[10px] md:text-xs text-white">Queue Clear</p>
              </div>
            ) : (
              filteredRequests.map((req) => (
                <div key={req.id} className="p-5 md:p-8 rounded-[35px] md:rounded-[45px] bg-white/5 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:bg-white/[0.08] transition-all shadow-xl">
                  <div className="flex gap-4 md:gap-8 items-center flex-1 w-full md:w-auto">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-[#0b1121] shadow-inner flex items-center justify-center text-blue-500 border border-white/5">
                      {req.donationType === 'Blood' ? <Droplets size={24} className="md:size-[28px]"/> : req.donationType === 'Organ' ? <Stethoscope size={24} className="md:size-[28px]"/> : req.donationType === 'Financial' ? <Banknote size={24} className="md:size-[28px]"/> : <Box size={24} className="md:size-[28px]"/>}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-black text-base md:text-xl tracking-tight mb-1">{req.user?.FirstName} {req.user?.LastName}</h4>
                      <div className="flex flex-wrap gap-2 md:gap-4 items-center mt-1">
                        <span className="text-[8px] md:text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 md:px-3 py-1 rounded-lg border border-blue-500/20">{req.donationType}</span>
                        <span className={`text-[8px] md:text-[9px] font-black uppercase px-2 md:px-3 py-1 rounded-lg border ${req.urgencyLevel === 'Critical' ? 'bg-red-500 text-white border-red-500/50' : 'bg-amber-500/10 text-amber-500'}`}>{req.urgencyLevel}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRequest(req)} className="w-full md:w-auto px-6 md:px-10 py-2.5 md:py-4 rounded-2xl bg-white text-[#0b1121] font-black text-[9px] md:text-xs uppercase tracking-widest hover:bg-medical-red hover:text-white transition-all shadow-xl">
                    Review Case
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Review Modal - Keep existing */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#0b1121]/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] rounded-[35px] md:rounded-[55px] p-6 md:p-12 max-w-4xl w-full shadow-2xl relative overflow-y-auto max-h-[90vh]">
            {message.text && (
              <div className={`absolute top-0 left-0 w-full p-4 md:p-6 text-center animate-in slide-in-from-top duration-300 z-50 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-medical-red text-white'}`}>
                <div className="flex items-center justify-center gap-2 font-black uppercase text-[9px] md:text-xs tracking-widest">
                  {message.type === 'success' ? <CheckCircle size={16} className="md:size-[18px]"/> : <AlertCircle size={16} className="md:size-[18px]"/>}
                  {message.text}
                </div>
              </div>
            )}

            <button onClick={() => setSelectedRequest(null)} className="absolute top-4 md:top-10 right-4 md:right-10 text-gray-400 hover:text-medical-red transition-all">
              <X size={20} className="md:size-[28px]" />
            </button>

            <h3 className="text-xl md:text-3xl font-black text-[#111C44] dark:text-white uppercase italic tracking-tighter mb-2">Registry Adjudication</h3>
            <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 md:mb-10 border-b border-gray-100 dark:border-white/10 pb-4 md:pb-6">Authorized Verification Loop (Recipient)</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-6 md:mb-10">
              <div>
                <p className="text-[9px] md:text-[10px] font-black text-[#1B2559] dark:text-white/60 uppercase mb-3 md:mb-4">
                  {selectedRequest.donationType === 'Financial' ? "Medical / Financial Proof" : "Medical Documentation"}
                </p>
                <a href={selectedRequest.documentUrl} target="_blank" rel="noreferrer" className="group relative block rounded-[25px] md:rounded-[35px] overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 h-48 md:h-64 shadow-inner">
                  <img src={selectedRequest.documentUrl} alt="Proof" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center bg-[#111C44]/50 transition-opacity group-hover:opacity-0">
                    <ExternalLink size={20} className="md:size-[24px] text-white" />
                  </div>
                </a>
              </div>

              <div className="space-y-4 md:space-y-8">
                <DetailItemMobile label="Recipient Identity" value={`${selectedRequest.user?.FirstName} ${selectedRequest.user?.LastName}`} icon={<User size={12} className="md:size-[14px]" />} />
                <DetailItemMobile label="Hospital Center" value={selectedRequest.hospitalName} icon={<Activity size={12} className="md:size-[14px]" />} />

                {selectedRequest.donationType === 'Financial' && selectedRequest.bankAccount && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-[8px] md:text-[9px] font-black text-blue-600 dark:text-blue-400">Bank Account for Transfer</p>
                    <p className="text-[10px] md:text-sm font-black break-all">{selectedRequest.bankName ? `${selectedRequest.bankName} - ` : ''}{selectedRequest.bankAccount}</p>
                  </div>
                )}

                <div className="flex justify-between items-end pt-4 border-t border-gray-100 dark:border-white/10">
                  <div>
                    <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 md:mb-2">Urgency</p>
                    <div className={`px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl font-black text-[9px] md:text-[10px] uppercase ${selectedRequest.urgencyLevel === 'Critical' ? 'bg-red-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
                      {selectedRequest.urgencyLevel}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 md:mb-2">Quantity/Amount</p>
                    <p className="text-sm md:text-lg font-black">
                      {selectedRequest.donationType === 'Financial'
                        ? `${selectedRequest.financialAmount || selectedRequest.quantity} ETB`
                        : `${selectedRequest.itemQuantity || selectedRequest.quantity || 1} UNIT(S)`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 md:space-y-3 mb-6 md:mb-10">
              <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 md:ml-4">Clinical Rejection Reason</label>
              <textarea
                className="w-full p-4 md:p-6 bg-gray-50 dark:bg-white/5 rounded-[25px] md:rounded-[30px] border border-gray-100 dark:border-white/10 outline-none text-sm text-[#1B2559] dark:text-white font-medium resize-none h-24 md:h-32"
                placeholder="State reason if declining this case..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-6">
              <button disabled={actionLoading} onClick={() => handleProcess(false)} className="py-3 md:py-6 rounded-2xl md:rounded-3xl bg-red-50 dark:bg-red-500/10 text-red-500 font-black text-[9px] md:text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">
                Reject
              </button>
              <button disabled={actionLoading} onClick={() => handleProcess(true)} className="py-3 md:py-6 rounded-2xl md:rounded-3xl bg-[#22C55E] text-white font-black text-[9px] md:text-xs uppercase tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {actionLoading ? "Processing..." : <><CheckCircle size={14} className="md:size-[20px]"/> Approve</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItemMobile = ({ label, value, icon }) => (
  <div className="text-left">
    <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 md:mb-2">{label}</p>
    <div className="flex items-center gap-2">
      <span className="text-blue-500">{icon}</span>
      <p className="text-[10px] md:text-sm font-black text-[#1B2559] dark:text-white uppercase tracking-tight">{value || 'UNSPECIFIED'}</p>
    </div>
  </div>
);

export default RequestVerification;
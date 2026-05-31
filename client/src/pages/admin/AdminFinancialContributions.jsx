import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import FinancialService from '../../services/FinancialService';
import NotificationHub from '../../components/notifications/NotificationHub';
import {
  Eye, CheckCircle, XCircle, RefreshCw, DollarSign, Clock, Filter,
  Menu, Sun, Moon, ArrowLeft, AlertCircle, ExternalLink
} from 'lucide-react';

const AdminFinancialContributions = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, approved: false, rejectionReason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const res = await FinancialService.getAllContributions();
      if (res.success) {
        setContributions(res.contributions || []);
      }
    } catch (error) {
      console.error("Failed to fetch contributions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, []);

  const filteredContributions = contributions.filter(c => {
    if (filter === 'all') return true;
    return c.status.toLowerCase() === filter.toLowerCase();
  });

  const handleReview = async () => {
    setActionLoading(true);
    try {
      const res = await FinancialService.reviewContribution(
        selectedContribution.id,
        reviewModal.approved,
        reviewModal.rejectionReason
      );
      if (res.success) {
        await fetchContributions();
        setSelectedContribution(null);
        setReviewModal({ isOpen: false, approved: false, rejectionReason: '' });
      }
    } catch (error) {
      alert(error.response?.data?.message || "Review failed");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: 'bg-yellow-500',
      Verified: 'bg-green-500',
      Allocated: 'bg-blue-500',
      Failed: 'bg-red-500',
    };
    return `px-2 py-1 rounded-full text-[8px] font-black text-white ${colors[status] || 'bg-gray-500'}`;
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 md:ml-72 p-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>
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
          <div className="md:hidden mb-6">
            <h1 className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              Financial Contributions
            </h1>
            <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mt-1">
              Manage donor contributions
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center mb-8">
            <div>
              <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-400 hover:text-medical-red mb-4 group transition-all">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Portal</span>
              </button>
              <h1 className="text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}">
                Financial Contributions
              </h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
                Manage donor contributions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationHub isDarkMode={isDarkMode} />
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Filter and Refresh Bar - Responsive */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={`pl-9 pr-6 py-2.5 rounded-xl border appearance-none cursor-pointer text-xs font-black uppercase tracking-wider ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="allocated">Allocated</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <button
                onClick={fetchContributions}
                className={`p-2.5 rounded-xl border transition-all ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-gray-400 hover:text-medical-red'
                    : 'bg-white border-gray-200 text-gray-600 hover:text-medical-red'
                }`}
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-widest">
              Total: {filteredContributions.length} contributions
            </p>
          </div>

          {/* Contributions Grid */}
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {filteredContributions.length === 0 ? (
              <div className="text-center py-12 md:py-20 bg-white dark:bg-[#111C44] rounded-[30px] md:rounded-[40px] shadow-xl">
                <DollarSign size={40} className="md:size-[48px] mx-auto text-gray-400 mb-4 opacity-50" />
                <p className="text-gray-500 dark:text-white/60 font-black uppercase tracking-widest text-[10px] md:text-sm">No contributions found</p>
              </div>
            ) : (
              filteredContributions.map((contribution) => (
                <div key={contribution.id} className={`p-4 md:p-6 rounded-2xl shadow-lg border transition-all ${isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'}`}>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <h3 className={`font-black text-base md:text-lg ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                          {contribution.donor?.FirstName} {contribution.donor?.LastName}
                        </h3>
                        <span className={getStatusBadge(contribution.status)}>{contribution.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 md:gap-4 mt-2">
                        <p className="text-[10px] md:text-sm text-gray-500">{contribution.donor?.EmailAddress}</p>
                        <p className="text-[11px] md:text-sm font-black text-green-600">{contribution.amount} Birr</p>
                        <p className="text-[9px] md:text-xs text-gray-400">{new Date(contribution.createdAt).toLocaleString()}</p>
                      </div>
                      {contribution.purpose && (
                        <p className="text-[10px] md:text-xs text-gray-500 mt-2 italic">"{contribution.purpose}"</p>
                      )}
                      {contribution.rejectionReason && (
                        <p className="text-[10px] md:text-xs text-red-500 mt-2">Rejected: {contribution.rejectionReason}</p>
                      )}
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => window.open(contribution.documentUrl, '_blank')}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-blue-500 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase flex items-center justify-center gap-1"
                      >
                        <ExternalLink size={12} /> View
                      </button>
                      {contribution.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedContribution(contribution);
                              setReviewModal({ isOpen: true, approved: true, rejectionReason: '' });
                            }}
                            className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-green-500 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase flex items-center justify-center gap-1"
                          >
                            <CheckCircle size={12} /> Verify
                          </button>
                          <button
                            onClick={() => {
                              setSelectedContribution(contribution);
                              setReviewModal({ isOpen: true, approved: false, rejectionReason: '' });
                            }}
                            className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-red-500 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase flex items-center justify-center gap-1"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Review Modal - Responsive */}
      {reviewModal.isOpen && selectedContribution && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-[30px] md:rounded-[40px] p-6 md:p-8 max-w-md w-full shadow-2xl mx-4">
            <h3 className="text-xl md:text-2xl font-black text-[#1B2559] dark:text-white mb-4">
              {reviewModal.approved ? 'Verify Contribution' : 'Reject Contribution'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {reviewModal.approved
                ? `Confirm that ${selectedContribution.donor?.FirstName} ${selectedContribution.donor?.LastName}'s payment of ${selectedContribution.amount} Birr is valid.`
                : `Provide a reason for rejecting ${selectedContribution.donor?.FirstName} ${selectedContribution.donor?.LastName}'s contribution.`
              }
            </p>
            {!reviewModal.approved && (
              <textarea
                value={reviewModal.rejectionReason}
                onChange={(e) => setReviewModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                placeholder="Reason for rejection..."
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 mt-2 text-sm"
                rows="3"
              />
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setReviewModal({ isOpen: false, approved: false, rejectionReason: '' })}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 font-black text-[9px] md:text-[10px] uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={actionLoading || (!reviewModal.approved && !reviewModal.rejectionReason.trim())}
                className="flex-1 py-3 rounded-xl bg-medical-red text-white font-black text-[9px] md:text-[10px] uppercase hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : (reviewModal.approved ? 'Verify' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinancialContributions;
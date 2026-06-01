import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import FinancialService from '../../services/FinancialService';
import DonationService from '../../services/DonationService';
import NotificationHub from '../../components/notifications/NotificationHub';
import {
  DollarSign, Users, RefreshCw, Send, AlertCircle, Banknote,
  Menu, Sun, Moon, ArrowLeft, CheckCircle, XCircle, TrendingUp,
  Wallet, HandCoins, PiggyBank, Coins, Filter
} from 'lucide-react';

const AdminFinancialDistribution = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [verifiedContributions, setVerifiedContributions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [distributionModal, setDistributionModal] = useState({
    isOpen: false,
    amount: '',
    note: '',
    requestId: null,
    contributionId: null
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const contributionsRes = await FinancialService.getAllContributions();
      const requestsRes = await DonationService.getApprovedFinancialRequests();

      if (contributionsRes.success) {
        const verified = contributionsRes.contributions?.filter(c =>
          c.status === 'Verified' && (c.remainingAmount > 0 || c.remainingAmount === undefined)
        ) || [];

        const verifiedWithRemaining = verified.map(c => ({
          ...c,
          remainingAmount: c.remainingAmount !== undefined ? c.remainingAmount : c.amount,
          distributedAmount: c.amount - (c.remainingAmount !== undefined ? c.remainingAmount : c.amount)
        }));

        setVerifiedContributions(verifiedWithRemaining);
      }

      if (requestsRes.success) {
        setPendingRequests(requestsRes.requests || []);
        setFilteredRequests(requestsRes.requests || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError(error.message);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply urgency filter
  useEffect(() => {
    if (urgencyFilter === 'all') {
      setFilteredRequests(pendingRequests);
    } else {
      setFilteredRequests(pendingRequests.filter(req => req.urgencyLevel === urgencyFilter));
    }
  }, [urgencyFilter, pendingRequests]);

  const openDistributionForRequest = (request) => {
    if (verifiedContributions.length === 0) {
      showToast("No verified contributions available. Please verify donor contributions first.", 'error');
      return;
    }

    const firstContribution = verifiedContributions[0];
    const maxAmount = Math.min(
      firstContribution.remainingAmount,
      request.quantity || request.financialAmount || 0
    );

    setSelectedRequest(request);
    setDistributionModal({
      isOpen: true,
      amount: maxAmount.toString(),
      note: `Distribution for ${request.user?.FirstName} ${request.user?.LastName} - ${request.hospitalName || 'Medical need'}`,
      requestId: request.id,
      contributionId: firstContribution.id
    });
  };

  const selectContributionForDistribution = (contributionId) => {
    const contribution = verifiedContributions.find(c => c.id === contributionId);
    if (contribution && selectedRequest) {
      const maxAmount = Math.min(
        contribution.remainingAmount,
        selectedRequest.quantity || selectedRequest.financialAmount || 0
      );
      setDistributionModal(prev => ({
        ...prev,
        contributionId,
        amount: maxAmount.toString()
      }));
    }
  };

  const confirmDistribution = async () => {
    if (!distributionModal.contributionId || !distributionModal.requestId) {
      showToast("Please select a contribution source first", 'error');
      return;
    }

    const amount = parseFloat(distributionModal.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid amount", 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await FinancialService.distributeToRecipient(
        distributionModal.contributionId,
        distributionModal.requestId,
        amount,
        distributionModal.note
      );
      if (res.success) {
        await fetchData();
        setDistributionModal({ isOpen: false, amount: '', note: '', requestId: null, contributionId: null });
        setSelectedRequest(null);
        showToast(`✅ Successfully distributed ${amount.toLocaleString()} Birr!`, 'success');
      } else {
        showToast(res.message || "Distribution failed", 'error');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Distribution failed";
      showToast(errorMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getUrgencyBadgeClass = (urgency) => {
    switch(urgency) {
      case 'Critical': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'High': return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
    }
  };

  const calculateTotalAvailable = () => {
    return verifiedContributions.reduce((sum, c) => sum + (c.remainingAmount || c.amount), 0);
  };

  const calculateTotalRequested = () => {
    return filteredRequests.reduce((sum, r) => sum + (r.quantity || r.financialAmount || 0), 0);
  };

  const getUrgencyCount = (urgency) => {
    return pendingRequests.filter(r => r.urgencyLevel === urgency).length;
  };

  const getFilterIcon = () => {
    switch(urgencyFilter) {
      case 'Critical': return '🔴';
      case 'High': return '🟠';
      case 'Medium': return '🟡';
      case 'Low': return '🔵';
      default: return '📋';
    }
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

  const totalAvailable = calculateTotalAvailable();
  const totalRequested = calculateTotalRequested();
  const matchPercentage = totalAvailable > 0 ? (Math.min(totalRequested, totalAvailable) / totalAvailable) * 100 : 0;
  const selectedContribution = verifiedContributions.find(c => c.id === distributionModal.contributionId);
  const maxAmount = selectedContribution && selectedRequest
    ? Math.min(selectedContribution.remainingAmount, selectedRequest.quantity || selectedRequest.financialAmount || 0)
    : 0;

  return (
    <div className={`flex min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-full duration-300">
          <div className={`px-5 md:px-8 py-2.5 md:py-4 rounded-3xl shadow-2xl flex items-center gap-2 md:gap-4 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
              ? 'bg-medical-red text-white'
              : 'bg-yellow-500 text-black'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle size={16} className="md:size-[20px] animate-bounce" />
            ) : (
              <AlertCircle size={16} className="md:size-[20px] animate-bounce" />
            )}
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">{toast.message}</p>
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
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-10">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-400 hover:text-medical-red mb-3 md:mb-4 group transition-all">
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Back to Portal</span>
                </button>
                <h1 className={`text-xl md:text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                  Financial Distribution
                </h1>
                <p className="text-gray-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
                  Match donor funds with patient needs
                </p>
              </div>
              <button onClick={fetchData} className={`p-2 md:p-3 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-white/5 text-white' : 'bg-white text-gray-600'}`}>
                <RefreshCw size={16} className="md:size-[18px]" />
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <SummaryCard
              title="Total Available"
              value={`${totalAvailable.toLocaleString()} Birr`}
              icon={<Wallet size={16} className="md:size-[20px]" />}
              color="green"
              isDarkMode={isDarkMode}
            />
            <SummaryCard
              title="Total Requested"
              value={`${totalRequested.toLocaleString()} Birr`}
              icon={<HandCoins size={16} className="md:size-[20px]" />}
              color="blue"
              isDarkMode={isDarkMode}
            />
            <SummaryCard
              title="Pending Requests"
              value={filteredRequests.length}
              icon={<Users size={16} className="md:size-[20px]" />}
              color="yellow"
              isDarkMode={isDarkMode}
            />
            <SummaryCard
              title="Match Rate"
              value={`${matchPercentage.toFixed(1)}%`}
              icon={<TrendingUp size={16} className="md:size-[20px]" />}
              color="purple"
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Urgency Filter Bar */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1 mr-2">
                <Filter size={14} className="text-gray-400" />
                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-wider">Filter:</span>
              </div>

              <button
                onClick={() => setUrgencyFilter('all')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all ${
                  urgencyFilter === 'all'
                    ? 'bg-medical-red text-white shadow-md'
                    : isDarkMode
                      ? 'bg-white/10 text-gray-400 hover:bg-white/20'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({pendingRequests.length})
              </button>

              <button
                onClick={() => setUrgencyFilter('Critical')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                  urgencyFilter === 'Critical'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                }`}
              >
                <span className="text-[10px] md:text-[12px]">🔴</span> Critical ({getUrgencyCount('Critical')})
              </button>

              <button
                onClick={() => setUrgencyFilter('High')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                  urgencyFilter === 'High'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
                }`}
              >
                <span className="text-[10px] md:text-[12px]">🟠</span> High ({getUrgencyCount('High')})
              </button>

              <button
                onClick={() => setUrgencyFilter('Medium')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                  urgencyFilter === 'Medium'
                    ? 'bg-yellow-500 text-black shadow-md'
                    : 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20'
                }`}
              >
                <span className="text-[10px] md:text-[12px]">🟡</span> Medium ({getUrgencyCount('Medium')})
              </button>

              <button
                onClick={() => setUrgencyFilter('Low')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                  urgencyFilter === 'Low'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                }`}
              >
                <span className="text-[10px] md:text-[12px]">🔵</span> Low ({getUrgencyCount('Low')})
              </button>

              {urgencyFilter !== 'all' && (
                <button
                  onClick={() => setUrgencyFilter('all')}
                  className="px-2 md:px-3 py-1.5 md:py-2 rounded-full text-[8px] md:text-[9px] font-black text-gray-400 hover:text-medical-red transition-all"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Active filter indicator */}
            {urgencyFilter !== 'all' && (
              <div className="mt-3 text-[8px] md:text-[9px] text-gray-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-medical-red animate-pulse"></span>
                Showing {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} with <span className="font-bold text-medical-red uppercase">{urgencyFilter}</span> urgency
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Main Distribution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column: Available Funds */}
            <div className={`p-4 md:p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <PiggyBank size={20} className="md:size-[24px] text-green-500" />
                  <h2 className="text-base md:text-xl font-black">Available Funds</h2>
                </div>
                <span className="px-2 md:px-3 py-1 bg-green-100 text-green-700 rounded-full text-[8px] md:text-[10px] font-black">
                  {verifiedContributions.length} sources
                </span>
              </div>

              {verifiedContributions.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Coins size={40} className="md:size-[48px] mx-auto text-gray-400 mb-4 opacity-50" />
                  <p className="text-gray-500 text-sm font-medium">No verified contributions available</p>
                  <p className="text-gray-400 text-[10px] md:text-xs mt-2">Go to Financial Contributions to verify donor receipts</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {verifiedContributions.map(cont => {
                    const remainingAmount = cont.remainingAmount || cont.amount;
                    const distributedAmount = cont.amount - remainingAmount;
                    const percentageUsed = (distributedAmount / cont.amount) * 100;
                    const isSelected = distributionModal.contributionId === cont.id;

                    return (
                      <div
                        key={cont.id}
                        className={`p-3 md:p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-medical-red bg-medical-red/5 ring-2 ring-medical-red/20'
                            : 'border-gray-100 dark:border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2 md:mb-3">
                          <div>
                            <p className="font-black text-sm md:text-base">{cont.donor?.FirstName} {cont.donor?.LastName}</p>
                            <p className="text-[8px] md:text-[10px] text-gray-500">Donor ID: {cont.donor?.id?.slice(-8) || 'N/A'}</p>
                          </div>
                          {isSelected && (
                            <div className="bg-medical-red text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-[7px] md:text-[8px] font-black">
                              Selected
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-2 md:mb-3">
                          <div>
                            <p className="text-[7px] md:text-[8px] text-gray-400 uppercase">Original</p>
                            <p className="font-black text-base md:text-lg text-green-600">{cont.amount.toLocaleString()} Birr</p>
                          </div>
                          <div>
                            <p className="text-[7px] md:text-[8px] text-gray-400 uppercase">Remaining</p>
                            <p className="font-black text-lg md:text-xl text-medical-red">{remainingAmount.toLocaleString()} Birr</p>
                          </div>
                        </div>

                        <div className="mb-2 md:mb-3">
                          <div className="flex justify-between text-[7px] md:text-[8px] text-gray-400 mb-1">
                            <span>Distributed</span>
                            <span>{distributedAmount.toLocaleString()} / {cont.amount.toLocaleString()} Birr</span>
                          </div>
                          <div className="h-1.5 md:h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentageUsed}%` }}
                            />
                          </div>
                        </div>

                        {cont.purpose && (
                          <p className="text-[9px] md:text-[10px] text-gray-500 mt-2 italic line-clamp-1">"{cont.purpose}"</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Filtered Pending Requests */}
            <div className={`p-4 md:p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <HandCoins size={20} className="md:size-[24px] text-medical-red" />
                  <h2 className="text-base md:text-xl font-black">Patient Requests</h2>
                </div>
                <div className="flex items-center gap-2">
                  {urgencyFilter !== 'all' && (
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${getUrgencyBadgeClass(urgencyFilter)}`}>
                      {urgencyFilter}
                    </span>
                  )}
                  <span className="px-2 md:px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[8px] md:text-[10px] font-black">
                    {filteredRequests.length} showing
                  </span>
                </div>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Users size={40} className="md:size-[48px] mx-auto text-gray-400 mb-4 opacity-50" />
                  <p className="text-gray-500 text-sm font-medium">
                    {pendingRequests.length === 0
                      ? "No pending financial requests"
                      : `No ${urgencyFilter} urgency requests found`}
                  </p>
                  <p className="text-gray-400 text-[10px] md:text-xs mt-2">
                    {pendingRequests.length === 0
                      ? "Go to Request Queue to approve financial aid requests"
                      : "Try changing the filter to see other requests"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {filteredRequests.map(req => {
                    const requestedAmount = req.quantity || req.financialAmount || 0;

                    return (
                      <div
                        key={req.id}
                        className={`p-3 md:p-4 rounded-xl border transition-all ${
                          distributionModal.requestId === req.id
                            ? 'border-medical-red bg-medical-red/5'
                            : 'border-gray-100 dark:border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2 md:mb-3">
                          <div className="flex-1">
                            <p className="font-black text-sm md:text-base">{req.user?.FirstName} {req.user?.LastName}</p>
                            <p className="text-[8px] md:text-[10px] text-gray-500">{req.hospitalName || 'Medical Facility'}</p>
                          </div>
                          <div className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-[7px] md:text-[8px] font-black uppercase ${getUrgencyColor(req.urgencyLevel)}`}>
                            {req.urgencyLevel}
                          </div>
                        </div>

                        <div className="mb-2 md:mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[7px] md:text-[8px] text-gray-400 uppercase">Requested Amount</p>
                            <p className="font-black text-base md:text-xl text-medical-red">{requestedAmount.toLocaleString()} Birr</p>
                          </div>
                          {req.notes && (
                            <p className="text-[9px] md:text-[10px] text-gray-500 mt-2 italic line-clamp-2">"{req.notes}"</p>
                          )}
                        </div>

                        {req.bankAccount && (
                          <div className="mt-2 md:mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <Banknote size={8} className="md:size-[10px] text-blue-500" />
                              <p className="text-[6px] md:text-[7px] font-black text-blue-600 dark:text-blue-400">Transfer Details:</p>
                            </div>
                            <p className="text-[8px] md:text-[9px] font-black break-all">{req.bankName} - {req.bankAccount}</p>
                          </div>
                        )}

                        <button
                          onClick={() => openDistributionForRequest(req)}
                          className="w-full mt-3 md:mt-4 py-2 md:py-2.5 bg-medical-red text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Send size={12} className="md:size-[14px]" /> Distribute Funds
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Distribution Modal */}
      {distributionModal.isOpen && selectedRequest && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-[30px] md:rounded-[40px] p-6 md:p-8 max-w-md w-full shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl md:text-2xl font-black text-[#1B2559] dark:text-white mb-4">Distribute Funds</h3>

            {/* Recipient Info */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 md:p-4 mb-4">
              <p className="text-[10px] md:text-xs text-gray-500 mb-2">Recipient:</p>
              <p className="font-black text-base md:text-lg">{selectedRequest.user?.FirstName} {selectedRequest.user?.LastName}</p>
              <p className="text-[9px] md:text-[10px] text-gray-500 mt-1">{selectedRequest.hospitalName}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] md:text-sm font-bold text-medical-red">
                  Requested: {(selectedRequest.quantity || selectedRequest.financialAmount || 0).toLocaleString()} Birr
                </p>
                <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${getUrgencyColor(selectedRequest.urgencyLevel)}`}>
                  {selectedRequest.urgencyLevel}
                </div>
              </div>
            </div>

            {/* Select Contribution Source */}
            <div className="mb-4">
              <label htmlFor="contributionSource" className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-2">
                Select Contribution Source
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto" id="contributionSource" role="group" aria-label="Available contribution sources">
                {verifiedContributions.length === 0 ? (
                  <p className="text-red-500 text-sm">No verified contributions available</p>
                ) : (
                  verifiedContributions.map(cont => {
                    const isSelected = distributionModal.contributionId === cont.id;
                    return (
                      <button
                        key={cont.id}
                        type="button"
                        onClick={() => selectContributionForDistribution(cont.id)}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-medical-red bg-medical-red/5 ring-2 ring-medical-red/20'
                            : 'border-gray-200 dark:border-white/10 hover:border-medical-red/50'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-black text-sm">{cont.donor?.FirstName} {cont.donor?.LastName}</p>
                            <p className="text-[9px] text-gray-500">Remaining: {cont.remainingAmount.toLocaleString()} Birr</p>
                          </div>
                          {isSelected && (
                            <CheckCircle size={16} className="text-medical-red" aria-hidden="true" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label htmlFor="distributionAmount" className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-2">
                Distribution Amount (Birr)
              </label>
              <input
                type="number"
                id="distributionAmount"
                name="distributionAmount"
                value={distributionModal.amount}
                onChange={(e) => setDistributionModal(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-base md:text-lg font-black"
                min="1"
                max={maxAmount}
                aria-describedby="amountHelpText"
              />
              <p id="amountHelpText" className="text-[7px] md:text-[8px] text-gray-400 mt-1">
                Max available: {maxAmount.toLocaleString()} Birr
              </p>
            </div>

            {/* Note Input */}
            <div className="mb-6">
              <label htmlFor="distributionNote" className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-2">
                Distribution Note
              </label>
              <textarea
                id="distributionNote"
                name="distributionNote"
                value={distributionModal.note}
                onChange={(e) => setDistributionModal(prev => ({ ...prev, note: e.target.value }))}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm resize-none"
                rows="3"
                placeholder="Add a note about this distribution..."
                aria-describedby="noteHelpText"
              />
              <p id="noteHelpText" className="text-[7px] md:text-[8px] text-gray-400 mt-1">
                This note will be visible to the donor and recipient
              </p>
            </div>

            {/* Bank Account Info */}
            {selectedRequest.bankAccount && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <Banknote size={10} className="md:size-[12px] text-blue-500" aria-hidden="true" />
                  <p className="text-[7px] md:text-[8px] font-black text-blue-600 dark:text-blue-400">Bank Account for Transfer</p>
                </div>
                <p className="text-[9px] md:text-[10px] font-black break-all">{selectedRequest.bankName} - {selectedRequest.bankAccount}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDistributionModal({ isOpen: false, amount: '', note: '', requestId: null, contributionId: null })}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 font-black text-[9px] md:text-[10px] uppercase"
              >
                Cancel
              </button>
              <button
                onClick={confirmDistribution}
                disabled={actionLoading || !distributionModal.contributionId || !distributionModal.amount || parseFloat(distributionModal.amount) <= 0}
                className="flex-1 py-3 rounded-xl bg-medical-red text-white font-black text-[9px] md:text-[10px] uppercase hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                aria-label="Confirm distribution"
              >
                {actionLoading ? (
                  <><RefreshCw size={14} className="animate-spin" aria-hidden="true" /> Processing...</>
                ) : (
                  <><Send size={14} aria-hidden="true" /> Confirm Distribution</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, icon, color, isDarkMode }) => {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-600 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  };

  return (
    <div className={`p-3 md:p-5 rounded-xl border ${colorClasses[color]} ${isDarkMode ? 'bg-opacity-5' : ''}`}>
      <div className="flex items-center justify-between mb-1 md:mb-2">
        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider opacity-70">{title}</span>
        <div className="opacity-70" aria-hidden="true">{icon}</div>
      </div>
      <p className="text-sm md:text-2xl font-black break-words">{value}</p>
    </div>
  );
};

export default AdminFinancialDistribution;
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import FinancialService from '../../services/FinancialService';
import DonationService from '../../services/DonationService';
import { DollarSign, Users, RefreshCw, Send, AlertCircle, Banknote } from 'lucide-react';

const AdminFinancialDistribution = () => {
  const { isDarkMode } = useTheme();
  const [verifiedContributions, setVerifiedContributions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [distributionModal, setDistributionModal] = useState({ isOpen: false, amount: '', note: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const contributionsRes = await FinancialService.getAllContributions();
      const requestsRes = await DonationService.getApprovedFinancialRequests();

      console.log('Verified Contributions:', contributionsRes);
      console.log('Approved Financial Requests:', requestsRes);

      if (contributionsRes.success) {
        const verified = contributionsRes.contributions?.filter(c => c.status === 'Verified') || [];
        setVerifiedContributions(verified);
      }

      if (requestsRes.success) {
        setPendingRequests(requestsRes.requests || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDistribute = async () => {
    if (!selectedContribution || !selectedRequest) return;
    setActionLoading(true);
    try {
      const amount = Math.min(selectedContribution.amount, selectedRequest.quantity || selectedRequest.financialAmount || 0);
      const res = await FinancialService.distributeToRecipient(
        selectedContribution.id,
        selectedRequest.id,
        amount,
        distributionModal.note
      );
      if (res.success) {
        alert('Distribution successful!');
        await fetchData();
        setSelectedContribution(null);
        setSelectedRequest(null);
        setDistributionModal({ isOpen: false, amount: '', note: '' });
      }
    } catch (error) {
      alert(error.response?.data?.message || "Distribution failed");
    } finally {
      setActionLoading(false);
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

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              Financial Distribution
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
              Match verified contributions with approved patient requests
            </p>
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl bg-white dark:bg-white/5 shadow-lg">
            <RefreshCw size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Verified Contributions */}
          <div className={`p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="text-green-500" size={24} />
              <h2 className="text-xl font-black">Verified Contributions</h2>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black">
                {verifiedContributions.length} available
              </span>
            </div>
            {verifiedContributions.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No verified contributions. Go to Financial Contributions page to verify donor receipts.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {verifiedContributions.map(cont => (
                  <div
                    key={cont.id}
                    onClick={() => setSelectedContribution(cont)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedContribution?.id === cont.id
                        ? 'border-medical-red bg-medical-red/5'
                        : 'border-gray-100 hover:border-medical-red/50'
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-black">{cont.donor?.FirstName} {cont.donor?.LastName}</p>
                        <p className="text-[10px] text-gray-500">Donor</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-green-600">{cont.amount} Birr</p>
                        <p className="text-[9px] text-gray-400">Verified</p>
                      </div>
                    </div>
                    {cont.purpose && <p className="text-xs text-gray-500 mt-2 line-clamp-1">{cont.purpose}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved Financial Requests */}
          <div className={`p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-6">
              <Users className="text-medical-red" size={24} />
              <h2 className="text-xl font-black">Approved Patient Requests</h2>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-[10px] font-black">
                {pendingRequests.length} pending distribution
              </span>
            </div>
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No approved financial requests. Go to Request Queue to approve financial aid requests.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedRequest?.id === req.id
                        ? 'border-medical-red bg-medical-red/5'
                        : 'border-gray-100 hover:border-medical-red/50'
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-black">{req.user?.FirstName} {req.user?.LastName}</p>
                        <p className="text-[10px] text-gray-500">{req.hospitalName || 'General'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-medical-red">{req.quantity || req.financialAmount || 'N/A'} Birr</p>
                        <p className="text-[9px] text-gray-400">{req.urgencyLevel} Urgency</p>
                      </div>
                    </div>
                    {req.notes && <p className="text-xs text-gray-500 mt-2 line-clamp-1">{req.notes}</p>}

                    {/* NEW: Bank Account Display */}
                    {req.bankAccount && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-1">
                          <Banknote size={12} className="text-blue-500" />
                          <p className="text-[8px] font-black text-blue-600 dark:text-blue-400">Transfer Details:</p>
                        </div>
                        {/* NOW IT SHOWS BANK NAME AND ACCOUNT! */}
                        <p className="text-[10px] font-black break-all">{req.bankName} - {req.bankAccount}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Distribution Section */}
        {selectedContribution && selectedRequest && (
          <div className="mt-8 p-6 bg-gradient-to-r from-medical-red to-red-700 rounded-2xl text-white">
            <h3 className="text-lg font-black mb-2">Ready to Distribute</h3>
            <p className="text-sm opacity-90 mb-4">
              Distribute from <span className="font-bold">{selectedContribution.donor?.FirstName} {selectedContribution.donor?.LastName}</span>
              {' '}to <span className="font-bold">{selectedRequest.user?.FirstName} {selectedRequest.user?.LastName}</span>
            </p>

            {/* Bank Account Info */}
            {selectedRequest.bankAccount && (
              <div className="mb-4 p-3 bg-white/20 rounded-lg">
                <p className="text-[9px] font-black uppercase opacity-80">Recipient Bank Account</p>
                <p className="text-sm font-black">{selectedRequest.bankAccount}</p>
              </div>
            )}

            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-black uppercase opacity-80">Amount (Birr)</label>
                <input
                  type="number"
                  value={distributionModal.amount || Math.min(selectedContribution.amount, selectedRequest.quantity || selectedRequest.financialAmount || 0)}
                  onChange={(e) => setDistributionModal(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-white text-black font-bold"
                  placeholder="Amount"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black uppercase opacity-80">Note / Reference</label>
                <input
                  value={distributionModal.note}
                  onChange={(e) => setDistributionModal(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-white text-black font-bold"
                  placeholder="Distribution note"
                />
              </div>
              <button
                onClick={() => setDistributionModal(prev => ({ ...prev, isOpen: true }))}
                className="px-6 py-3 bg-white text-medical-red rounded-xl font-black text-[10px] uppercase hover:bg-gray-100"
              >
                <Send size={16} className="inline mr-2" /> Distribute
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Distribution Confirmation Modal */}
      {distributionModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black text-[#1B2559] mb-4">Confirm Distribution</h3>
            <p className="text-gray-600 mb-4">
              Distribute <span className="font-bold text-medical-red">{distributionModal.amount || Math.min(selectedContribution.amount, selectedRequest.quantity || 0)} Birr</span>
              {' '}from <span className="font-bold">{selectedContribution.donor?.FirstName} {selectedContribution.donor?.LastName}</span>
              {' '}to <span className="font-bold">{selectedRequest.user?.FirstName} {selectedRequest.user?.LastName}</span>
            </p>

            {/* Bank Account Info in Modal */}
            {selectedRequest?.bankAccount && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-[9px] font-black text-blue-600">Bank Account for Transfer</p>
                <p className="text-sm font-black break-all">{selectedRequest.bankAccount}</p>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-6">Note: {distributionModal.note || 'No note provided'}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDistributionModal({ isOpen: false, amount: '', note: '' })}
                className="flex-1 py-3 rounded-xl bg-gray-100 font-black text-[10px] uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleDistribute}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-medical-red text-white font-black text-[10px] uppercase hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Distribution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinancialDistribution;
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import FinancialService from '../../services/FinancialService';
import { Eye, CheckCircle, XCircle, RefreshCw, DollarSign, Clock, Filter } from 'lucide-react';

const AdminFinancialContributions = () => {
  const { isDarkMode } = useTheme();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, verified, allocated
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, approved: false, rejectionReason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const res = await FinancialService.getAllContributions();
      if (res.success) {
        setContributions(res.contributions);
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
              Financial Contributions
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
              Manage donor contributions
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="allocated">Allocated</option>
            </select>
            <button onClick={fetchContributions} className="p-2 rounded-xl bg-white dark:bg-white/5 shadow-lg">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredContributions.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#111C44] rounded-[40px] shadow-xl">
              <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No contributions found</p>
            </div>
          ) : (
            filteredContributions.map((contribution) => (
              <div key={contribution.id} className={`p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-[#111C44] border-white/5' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                        {contribution.donor?.FirstName} {contribution.donor?.LastName}
                      </h3>
                      <span className={getStatusBadge(contribution.status)}>{contribution.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <p className="text-sm text-gray-500">{contribution.donor?.EmailAddress}</p>
                      <p className="text-sm font-black text-green-600">{contribution.amount} Birr</p>
                      <p className="text-xs text-gray-400">{new Date(contribution.createdAt).toLocaleString()}</p>
                    </div>
                    {contribution.purpose && (
                      <p className="text-sm text-gray-500 mt-2 italic">"{contribution.purpose}"</p>
                    )}
                    {contribution.rejectionReason && (
                      <p className="text-xs text-red-500 mt-2">Rejected: {contribution.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(contribution.documentUrl, '_blank')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase"
                    >
                      View Receipt
                    </button>
                    {contribution.status === 'Pending' && (
                      <button
                        onClick={() => {
                          setSelectedContribution(contribution);
                          setReviewModal({ isOpen: true, approved: true, rejectionReason: '' });
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase"
                      >
                        Verify
                      </button>
                    )}
                    {contribution.status === 'Pending' && (
                      <button
                        onClick={() => {
                          setSelectedContribution(contribution);
                          setReviewModal({ isOpen: true, approved: false, rejectionReason: '' });
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Review Modal */}
      {reviewModal.isOpen && selectedContribution && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black text-[#1B2559] mb-4">
              {reviewModal.approved ? 'Verify Contribution' : 'Reject Contribution'}
            </h3>
            <p className="text-gray-600 mb-4">
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
                className="w-full p-3 rounded-xl border border-gray-200 mt-2 text-sm"
                rows="3"
              />
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setReviewModal({ isOpen: false, approved: false, rejectionReason: '' })}
                className="flex-1 py-3 rounded-xl bg-gray-100 font-black text-[10px] uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={actionLoading || (!reviewModal.approved && !reviewModal.rejectionReason.trim())}
                className="flex-1 py-3 rounded-xl bg-medical-red text-white font-black text-[10px] uppercase hover:bg-red-700 disabled:opacity-50"
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
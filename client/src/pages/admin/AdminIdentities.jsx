import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import AdminService from '../../services/AdminService';
import NotificationHub from '../../components/notifications/NotificationHub';
import { useTheme } from '../../context/ThemeContext';
import {
  ShieldCheck, ShieldAlert, Sun, Moon, ExternalLink,
  CheckCircle, XCircle, BellRing, X, Menu
} from 'lucide-react';

const AdminIdentities = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    userId: null,
    name: '',
    approved: null,
    rejectionReason: '',
  });

  const fetchIdentities = async () => {
    try {
      const res = await AdminService.getPendingIdentities();
      if (res.success) setIdentities(res.data);
    } catch {
      console.error("Failed to fetch pending identities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIdentities(); }, []);

  // Close sidebar when switching to desktop
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

  const handleReview = async () => {
    try {
      const res = await AdminService.reviewIdentity(
        reviewModal.userId,
        reviewModal.approved,
        reviewModal.rejectionReason
      );
      if (res.success) {
        setReviewModal({ isOpen: false, userId: null, name: '', approved: null, rejectionReason: '' });
        await fetchIdentities();
        showToast(
          reviewModal.approved
            ? `${reviewModal.name}'s identity verified successfully.`
            : `${reviewModal.name}'s identity rejected.`,
          reviewModal.approved ? 'success' : 'error'
        );
      }
    } catch {
      showToast("Review action failed.", "error");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white font-black animate-pulse uppercase tracking-widest">
      Loading Identity Queue...
    </div>
  );

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
          <div className={`px-6 md:px-8 py-3 md:py-4 rounded-3xl shadow-2xl flex items-center gap-3 md:gap-4 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-medical-red text-white'
          }`}>
            <BellRing size={16} className="md:size-[20px] animate-bounce" />
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">{toast.message}</p>
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
        <div className="p-4 md:p-8">
          {/* Mobile Title */}
          <div className="md:hidden mb-6">
            <h1 className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              Identity Queue
            </h1>
            <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mt-1 italic">
              {identities.length} pending verification{identities.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center mb-10">
            <div>
              <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                Identity Queue
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                {identities.length} pending verification{identities.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationHub isDarkMode={isDarkMode} />
              <button
                onClick={toggleTheme}
                className={`p-3.5 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Empty State */}
          {identities.length === 0 ? (
            <div className={`p-12 md:p-20 rounded-[35px] md:rounded-[45px] border text-center ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
              <ShieldCheck size={40} className="md:size-[48px] mx-auto text-green-500 mb-4" />
              <p className={`font-black uppercase tracking-widest text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                All identities verified
              </p>
              <p className="text-gray-400 text-[10px] md:text-xs mt-2">No pending documents in queue</p>
            </div>
          ) : (
            /* Identities Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {identities.map((u) => (
                <div
                  key={u.id}
                  className={`p-5 md:p-8 rounded-[35px] md:rounded-[45px] border shadow-lg ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-[20px] bg-medical-red flex items-center justify-center text-white font-black text-xl md:text-2xl">
                      {u.FirstName ? u.FirstName[0] : '?'}
                    </div>
                    <div>
                      <h3 className={`font-black text-base md:text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                        {u.FirstName} {u.LastName}
                      </h3>
                      <p className="text-[9px] md:text-[10px] text-gray-400 font-bold">{u.Role}</p>
                    </div>
                  </div>

                  <div className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-white/10 mb-6 shadow-inner">
                    <img
                      src={u.identityDocumentUrl}
                      alt="ID Document"
                      className="w-full h-28 md:h-36 object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a
                        href={u.identityDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 md:p-2 bg-white rounded-full text-black shadow-lg"
                      >
                        <ExternalLink size={14} className="md:size-[16px]" />
                      </a>
                    </div>
                  </div>

                  <p className="text-[8px] md:text-[9px] text-gray-400 font-black uppercase mb-4">
                    Submitted: {new Date(u.createdAt).toLocaleDateString()}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setReviewModal({
                        isOpen: true,
                        userId: u.id,
                        name: u.FirstName,
                        approved: true,
                        rejectionReason: '',
                      })}
                      className="py-2.5 md:py-3 rounded-2xl bg-green-500 text-white font-black text-[8px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
                    >
                      <CheckCircle size={12} className="md:size-[14px]" /> Verify
                    </button>
                    <button
                      onClick={() => setReviewModal({
                        isOpen: true,
                        userId: u.id,
                        name: u.FirstName,
                        approved: false,
                        rejectionReason: '',
                      })}
                      className="py-2.5 md:py-3 rounded-2xl bg-red-50 text-medical-red font-black text-[8px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                    >
                      <XCircle size={12} className="md:size-[14px]" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* REVIEW MODAL */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-[30px] md:rounded-[40px] p-6 md:p-12 max-w-sm w-full shadow-2xl relative mx-4">
            <button
              onClick={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 md:top-8 right-4 md:right-8 text-gray-300 hover:text-medical-red"
            >
              <X size={18} className="md:size-[20px]" />
            </button>

            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 ${
              reviewModal.approved ? 'bg-green-50 text-green-500' : 'bg-red-50 text-medical-red'
            }`}>
              {reviewModal.approved ? <ShieldCheck size={24} className="md:size-[32px]" /> : <ShieldAlert size={24} className="md:size-[32px]" />}
            </div>

            <h3 className="text-xl md:text-2xl font-black text-[#1B2559] tracking-tighter text-center">
              {reviewModal.approved ? 'Verify Identity?' : 'Reject Identity?'}
            </h3>

            <p className="text-gray-500 text-xs md:text-sm mt-3 text-center leading-relaxed">
              {reviewModal.approved
                ? `Confirm that ${reviewModal.name}'s identity document is valid.`
                : `Reject ${reviewModal.name}'s identity document. Reason required.`
              }
            </p>

            {!reviewModal.approved && (
              <textarea
                value={reviewModal.rejectionReason}
                onChange={(e) => setReviewModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                placeholder="Reason for rejection..."
                className="w-full mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-xs md:text-sm text-gray-700 resize-none h-20 md:h-24"
              />
            )}

            <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-8">
              <button
                onClick={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
                className="py-2.5 md:py-4 rounded-2xl bg-gray-50 text-gray-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={!reviewModal.approved && !reviewModal.rejectionReason.trim()}
                className={`py-2.5 md:py-4 rounded-2xl font-black text-[9px] md:text-[10px] uppercase shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  reviewModal.approved
                    ? 'bg-green-500 text-white shadow-green-200'
                    : 'bg-medical-red text-white shadow-red-200'
                }`}
              >
                {reviewModal.approved ? 'Verify' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIdentities;
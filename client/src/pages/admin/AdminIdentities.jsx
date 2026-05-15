import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import AdminService from '../../services/AdminService';
import { useTheme } from '../../context/ThemeContext';
import {
  ShieldCheck, ShieldAlert, Sun, Moon, ExternalLink,
  CheckCircle, XCircle, BellRing, X
} from 'lucide-react';

const AdminIdentities = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
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
    <div className={`flex min-h-screen transition-all ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>

      {toast.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-full duration-300">
          <div className={`px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-medical-red text-white'
          }`}>
            <BellRing size={20} className="animate-bounce" />
            <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
          </div>
        </div>
      )}

      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10 overflow-y-auto h-screen custom-scrollbar">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              Identity Queue
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
              {identities.length} pending verification{identities.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-3.5 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {identities.length === 0 ? (
          <div className={`p-20 rounded-[45px] border text-center ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
            <ShieldCheck size={48} className="mx-auto text-green-500 mb-4" />
            <p className={`font-black uppercase tracking-widest text-sm ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              All identities verified
            </p>
            <p className="text-gray-400 text-xs mt-2">No pending documents in queue</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {identities.map((u) => (
              <div
                key={u.id}
                className={`p-8 rounded-[45px] border shadow-lg ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-[20px] bg-medical-red flex items-center justify-center text-white font-black text-2xl">
                    {u.FirstName ? u.FirstName[0] : '?'}
                  </div>
                  <div>
                    <h3 className={`font-black text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                      {u.FirstName} {u.LastName}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold">{u.Role}</p>
                  </div>
                </div>

                <div className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-white/10 mb-6 shadow-inner">
                  <img
                    src={u.identityDocumentUrl}
                    alt="ID Document"
                    className="w-full h-36 object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={u.identityDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-white rounded-full text-black shadow-lg"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <p className="text-[9px] text-gray-400 font-black uppercase mb-4">
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
                    className="py-3 rounded-2xl bg-green-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
                  >
                    <CheckCircle size={14} /> Verify
                  </button>
                  <button
                    onClick={() => setReviewModal({
                      isOpen: true,
                      userId: u.id,
                      name: u.FirstName,
                      approved: false,
                      rejectionReason: '',
                    })}
                    className="py-3 rounded-2xl bg-red-50 text-medical-red font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-12 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-8 right-8 text-gray-300 hover:text-medical-red"
            >
              <X size={20} />
            </button>

            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
              reviewModal.approved ? 'bg-green-50 text-green-500' : 'bg-red-50 text-medical-red'
            }`}>
              {reviewModal.approved ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
            </div>

            <h3 className="text-2xl font-black text-[#1B2559] tracking-tighter text-center">
              {reviewModal.approved ? 'Verify Identity?' : 'Reject Identity?'}
            </h3>

            <p className="text-gray-500 text-sm mt-3 text-center leading-relaxed">
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
                className="w-full mt-6 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-sm text-gray-700 resize-none h-24"
              />
            )}

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
                className="py-4 rounded-2xl bg-gray-50 text-gray-400 font-bold text-[10px] uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={!reviewModal.approved && !reviewModal.rejectionReason.trim()}
                className={`py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
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
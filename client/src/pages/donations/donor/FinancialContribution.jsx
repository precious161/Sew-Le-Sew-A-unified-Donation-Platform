import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import FinancialService from '../../../services/FinancialService';
import NotificationHub from '../../../components/notifications/NotificationHub';
import {
  ArrowLeft, Upload, AlertTriangle, CheckCircle, Banknote,
  ShieldCheck, Wallet, Menu, Sun, Moon, X
} from 'lucide-react';

const FinancialContribution = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    document: null
  });

  const [isVerified, setIsVerified] = useState(false);
  const [checking, setChecking] = useState(true);

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
    const checkVerification = async () => {
      try {
        const res = await FinancialService.checkEligibility();
        if (res.success && res.isVerified) {
          setIsVerified(true);
        } else {
          setIsVerified(false);
        }
      } catch (error) {
        setIsVerified(false);
      } finally {
        setChecking(false);
      }
    };
    checkVerification();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!formData.amount || parseFloat(formData.amount) < 5) {
      setMessage({ type: 'error', text: 'Minimum contribution amount is 5 Birr.' });
      setLoading(false);
      return;
    }

    if (!formData.document) {
      setMessage({ type: 'error', text: 'Proof of transfer is required. Please upload your bank or Telebirr receipt.' });
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('amount', formData.amount);
    data.append('currency', 'ETB');
    if (formData.purpose) data.append('purpose', formData.purpose);
    data.append('document', formData.document);

    try {
      const res = await FinancialService.submitContribution(data);
      if (res.success) setSuccess(true);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Submission failed.' });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (checking) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 md:ml-72 p-4 md:p-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
        </main>
      </div>
    );
  }

  // Not verified state
  if (!isVerified) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 md:ml-72 p-4 md:p-10 flex flex-col items-center justify-center">
          <div className="max-w-md text-center">
            <ShieldCheck size={48} className="mx-auto text-medical-red mb-4" />
            <h2 className="text-xl md:text-2xl font-black text-[#1B2559] dark:text-white mb-2">Verification Required</h2>
            <p className="text-gray-500 text-sm mb-6">You need a verified identity to make financial contributions.</p>
            <button
              onClick={() => navigate('/profile')}
              className="px-5 md:px-6 py-2.5 md:py-3 bg-medical-red text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase"
            >
              Verify Your Identity
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 md:ml-72 p-4 md:p-10 flex flex-col items-center justify-center">
          <div className="max-w-md text-center bg-white dark:bg-[#111C44] p-6 md:p-12 rounded-[35px] md:rounded-[50px] shadow-2xl mx-4">
            <CheckCircle size={48} className="md:size-[64px] mx-auto text-green-500 mb-4" />
            <h2 className="text-xl md:text-2xl font-black text-[#1B2559] dark:text-white mb-2">Contribution Submitted!</h2>
            <p className="text-gray-500 text-sm mb-6">Your financial contribution of {formData.amount} Birr has been submitted for verification.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 md:px-6 py-2.5 md:py-3 bg-medical-red text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase"
            >
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Main form
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
          {/* Mobile Back Button */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-medical-red transition-all"
            >
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
          </div>

          {/* Desktop Back Button */}
          <div className="hidden md:flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-medical-red transition-all"
            >
              <ArrowLeft size={20} /> Back to Dashboard
            </button>
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

          {/* Mobile Title */}
          <div className="md:hidden text-center mb-6">
            <div className="w-12 h-12 bg-medical-red/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Wallet size={24} className="text-medical-red" />
            </div>
            <h1 className="text-2xl font-black text-[#1B2559] dark:text-white">Financial Contribution</h1>
            <p className="text-gray-400 text-[10px] mt-1">Support the Red Cross with a monetary donation</p>
          </div>

          {/* Desktop Title */}
          <div className="hidden md:block text-center mb-8">
            <div className="w-16 h-16 bg-medical-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet size={32} className="text-medical-red" />
            </div>
            <h1 className="text-3xl font-black text-[#1B2559] dark:text-white">Financial Contribution</h1>
            <p className="text-gray-400 text-sm mt-2">Support the Red Cross with a monetary donation</p>
          </div>

          {/* Error/Success Message */}
          {message.text && (
            <div className={`mb-5 md:mb-6 p-3 md:p-4 rounded-2xl flex items-center gap-2 md:gap-3 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
              <AlertTriangle size={16} className="md:size-[18px]" />
              <p className="text-[11px] md:text-sm">{message.text}</p>
            </div>
          )}

          {/* Form Card */}
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111C44] rounded-[30px] md:rounded-[40px] shadow-2xl p-5 md:p-8">
              {/* Bank Account Info - Responsive */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 md:p-5 mb-6 md:mb-8 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Banknote size={16} className="md:size-[18px] text-blue-600" />
                  <h4 className="text-[9px] md:text-[10px] font-black uppercase text-blue-700 dark:text-blue-400">Transfer to Red Cross Account</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row md:justify-between gap-1 md:gap-0">
                    <span className="text-[8px] md:text-[9px] font-bold text-gray-600 dark:text-gray-400">Bank:</span>
                    <span className="text-[9px] md:text-[10px] font-black text-gray-800 dark:text-white">Commercial Bank of Ethiopia (CBE)</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:justify-between gap-1 md:gap-0">
                    <span className="text-[8px] md:text-[9px] font-bold text-gray-600 dark:text-gray-400">Account Name:</span>
                    <span className="text-[9px] md:text-[10px] font-black text-gray-800 dark:text-white">Ethiopian Red Cross Society</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:justify-between gap-1 md:gap-0">
                    <span className="text-[8px] md:text-[9px] font-bold text-gray-600 dark:text-gray-400">Account Number:</span>
                    <span className="text-[10px] md:text-[11px] font-black text-medical-red">1000 000 902 907</span>
                  </div>
                </div>
                <p className="text-[7px] md:text-[8px] text-gray-500 mt-3 italic">After transfer, please upload your payment receipt below.</p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 md:space-y-6">
                {/* Amount Field */}
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 ml-2">Amount (Birr)</label>
                  <input
                    type="number"
                    min="5"
                    step="1"
                    required
                    placeholder="e.g., 1000"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full mt-1 p-3 md:p-5 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none font-bold text-sm"
                  />
                  <p className="text-[7px] md:text-[8px] text-gray-400 ml-2 mt-1">Minimum amount: 5 Birr</p>
                </div>

                {/* Purpose Field */}
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 ml-2">Purpose (Optional)</label>
                  <input
                    placeholder="e.g., Medical supplies, Emergency fund, Surgery support"
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    className="w-full mt-1 p-3 md:p-5 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none font-bold text-sm"
                  />
                </div>

                {/* File Upload Field */}
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 ml-2">Proof of Transfer (Receipt)</label>
                  <div className="mt-1 p-4 md:p-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-center">
                    <Upload size={24} className="md:size-[32px] mx-auto text-gray-400 mb-2" />
                    <p className="text-[9px] md:text-[10px] text-gray-500 mb-3 md:mb-4">Upload bank or Telebirr receipt (JPG, PNG, PDF)</p>
                    <input
                      type="file"
                      required
                      accept="image/*,application/pdf"
                      onChange={(e) => setFormData({...formData, document: e.target.files[0]})}
                      className="text-[8px] md:text-[9px] text-gray-400 file:mr-2 md:file:mr-4 file:py-1 md:file:py-2 file:px-2 md:file:px-4 file:rounded-full file:border-0 file:bg-medical-red file:text-white file:font-black cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 md:mt-8 bg-medical-red text-white py-3 md:py-5 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Contribution'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancialContribution;
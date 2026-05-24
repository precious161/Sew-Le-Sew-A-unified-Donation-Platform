import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import FinancialService from '../../../services/FinancialService';
import { ArrowLeft, Upload, AlertTriangle, CheckCircle, Banknote, ShieldCheck, Wallet } from 'lucide-react';

const FinancialContribution = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    document: null
  });

  // Check if user is verified donor
  const [isVerified, setIsVerified] = useState(false);
  const [checking, setChecking] = useState(true);

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

  if (checking) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#0b1121]">
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 ml-72 p-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
        </main>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#0b1121]">
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 ml-72 p-10 flex flex-col items-center justify-center">
          <div className="max-w-md text-center">
            <ShieldCheck size={48} className="mx-auto text-medical-red mb-4" />
            <h2 className="text-2xl font-black text-[#1B2559] dark:text-white mb-2">Verification Required</h2>
            <p className="text-gray-500 mb-6">You need a verified identity to make financial contributions.</p>
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 bg-medical-red text-white rounded-2xl font-black text-[10px] uppercase"
            >
              Verify Your Identity
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#0b1121]">
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 ml-72 p-10 flex flex-col items-center justify-center">
          <div className="max-w-md text-center bg-white dark:bg-[#111C44] p-12 rounded-[50px] shadow-2xl">
            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-black text-[#1B2559] dark:text-white mb-2">Contribution Submitted!</h2>
            <p className="text-gray-500 mb-6">Your financial contribution of {formData.amount} Birr has been submitted for verification.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-medical-red text-white rounded-2xl font-black text-[10px] uppercase"
            >
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0b1121]">
      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-medical-red mb-6 transition-all"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-medical-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet size={32} className="text-medical-red" />
            </div>
            <h1 className="text-3xl font-black text-[#1B2559] dark:text-white">Financial Contribution</h1>
            <p className="text-gray-400 text-sm mt-2">Support the Red Cross with a monetary donation</p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
              <AlertTriangle size={18} />
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111C44] rounded-[40px] shadow-2xl p-8">
            {/* Bank Account Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 mb-8 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Banknote size={18} className="text-blue-600" />
                <h4 className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400">Transfer to Red Cross Account</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400">Bank:</span>
                  <span className="text-[10px] font-black text-gray-800 dark:text-white">Commercial Bank of Ethiopia (CBE)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400">Account Name:</span>
                  <span className="text-[10px] font-black text-gray-800 dark:text-white">Ethiopian Red Cross Society</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400">Account Number:</span>
                  <span className="text-[11px] font-black text-medical-red">1000 000 902 907</span>
                </div>
              </div>
              <p className="text-[8px] text-gray-500 mt-3 italic">After transfer, please upload your payment receipt below.</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Amount (Birr)</label>
                <input
                  type="number"
                  min="5"
                  step="1"
                  required
                  placeholder="e.g., 1000"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full mt-1 p-5 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none font-bold text-sm"
                />
                <p className="text-[8px] text-gray-400 ml-2 mt-1">Minimum amount: 5 Birr</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Purpose (Optional)</label>
                <input
                  placeholder="e.g., Medical supplies, Emergency fund, Surgery support"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className="w-full mt-1 p-5 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Proof of Transfer (Receipt)</label>
                <div className="mt-1 p-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-[10px] text-gray-500 mb-4">Upload bank or Telebirr receipt (JPG, PNG, PDF)</p>
                  <input
                    type="file"
                    required
                    accept="image/*,application/pdf"
                    onChange={(e) => setFormData({...formData, document: e.target.files[0]})}
                    className="text-[9px] text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-medical-red file:text-white file:font-black cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-medical-red text-white py-5 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Contribution'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default FinancialContribution;
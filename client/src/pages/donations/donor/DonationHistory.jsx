import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar';
import DonationService from '../../../services/DonationService';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import { ArrowLeft, History, CheckCircle, Calendar, MapPin, Droplets, AlertCircle, Menu, Sun, Moon } from 'lucide-react';
import NotificationHub from '../../../components/notifications/NotificationHub';

const DonationHistory = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    const fetchHistory = async () => {
      try {
        const res = await DonationService.getDonationHistory();
        if (res.success && res.data && res.data.length > 0) {
          setDonations(res.data);
        } else {
          setDonations([]);
        }
      } catch (err) {
        console.error("History fetch failed", err);
        setError("Failed to load donation history. Please try again later.");
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />
      <main className="flex-1 ml-72 p-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
      </main>
    </div>
  );

  if (user?.Role !== 'Donor') {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <Sidebar isDarkMode={isDarkMode} />
        <main className="flex-1 ml-72 p-10 flex flex-col items-center justify-center">
          <AlertCircle size={48} className="text-yellow-500 mb-4" />
          <h2 className="text-2xl font-black text-[#1B2559] dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500">Only donors can view this page.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-6 px-6 py-3 bg-medical-red text-white rounded-2xl font-black text-[10px] uppercase tracking-wider">
            Back to Dashboard
          </button>
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
              Donation History
            </h1>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center mb-8">
            <div>
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-medical-red transition-all group mb-4">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Dashboard</span>
              </button>
              <h1 className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                Donation History
              </h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Registry Record • Donor Node</p>
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

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-xs">{error}</span>
            </div>
          )}

          {donations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-70 mt-10 md:mt-20">
              <History size={60} className="md:size-[80px] mb-4 text-gray-400" />
              <p className="font-black uppercase tracking-widest text-[10px] md:text-xs text-gray-500">No entries found in your registry</p>
              <p className="text-gray-400 text-[8px] md:text-[10px] mt-2">Complete a donation to see your history here</p>
              <button
                onClick={() => navigate('/donations/donor/register-intent')}
                className="mt-6 px-5 md:px-6 py-2.5 md:py-3 bg-medical-red text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all"
              >
                Register Donation Intent
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {donations.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 md:p-8 rounded-[35px] md:rounded-[45px] shadow-xl border flex flex-col md:flex-row justify-between gap-4 transition-all hover:-translate-y-1 ${
                    isDarkMode ? 'bg-white/5 border-white/5 text-white shadow-black/40' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="p-3 md:p-4 bg-medical-red/10 rounded-2xl text-medical-red shadow-inner">
                      <Droplets size={24} className="md:size-[32px]" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-xl font-black uppercase italic tracking-tight">{item.donationType} Donation</h3>
                      <div className="flex flex-wrap gap-3 md:gap-6 mt-2">
                        <span className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <Calendar size={12} className="md:size-[14px] text-blue-500"/> {new Date(item.donationDate).toLocaleDateString('en-GB')}
                        </span>
                        <span className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <MapPin size={12} className="md:size-[14px] text-medical-red"/> {item.location || 'Red Cross Center'}
                        </span>
                      </div>
                      {item.remarks && (
                        <p className="text-[8px] md:text-[9px] text-gray-500 mt-2 italic">{item.remarks}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-2">
                    <div className="px-3 md:px-5 py-1.5 md:py-2 bg-green-500/10 text-green-500 rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 md:gap-2 border border-green-500/20">
                      <CheckCircle size={12} className="md:size-[14px]"/> {item.status}
                    </div>
                    {item.quantity && <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Units: {item.quantity}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DonationHistory;
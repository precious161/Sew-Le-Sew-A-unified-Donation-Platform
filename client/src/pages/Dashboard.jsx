import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/layout/Sidebar';
import NotificationHub from '../components/notifications/NotificationHub';
import DonationService from '../services/DonationService';
import ProfileService from '../services/ProfileService';
import { 
  Sun, Moon, ShieldCheck, ClipboardCheck, 
  ArrowRight, Activity, HeartPulse, Lock, CheckCircle2
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [donorData, setDonorData] = useState({
    identityStatus: 'Unverified',
    medicalStatus: 'NotChecked',
    activeIntents: 0
  });

  useEffect(() => {
    if (user?.Role === 'Red_Cross_Admin') navigate('/admin', { replace: true });

    const syncDashboard = async () => {
      try {
        const [profileRes, historyRes, intentsRes] = await Promise.all([
          ProfileService.getMe(),
          DonationService.getEligibilityHistory(),
          DonationService.getMyIntents()
        ]);

        if (profileRes.success) {
          const latestMed = historyRes.data?.[0];
          setDonorData({
            identityStatus: profileRes.data.identityStatus,
            medicalStatus: latestMed ? (latestMed.isEligible ? 'Eligible' : 'Ineligible') : 'NotChecked',
            activeIntents: intentsRes.count || 0
          });
        }
      } catch {
        console.error("Dashboard sync error");
      } finally {
        setLoading(false);
      }
    };

    if (user?.Role === 'Donor') syncDashboard();
    else setLoading(false);
  }, [user, navigate]);

  if (!user || user.Role === 'Red_Cross_Admin') return null;

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0b1121]">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
    </div>
  );

  const isIdVerified = donorData.identityStatus === 'Verified';
  const isMedEligible = donorData.medicalStatus === 'Eligible';
  
  // STRICT GATEKEEPER LOGIC
  const isFullyAuthorized = isIdVerified && isMedEligible;

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />
      
      <main className="flex-1 ml-72 p-10 flex flex-col text-left">
        <header className="flex justify-end items-center mb-12 gap-6">
          <NotificationHub isDarkMode={isDarkMode} />
          <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-lg">
            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
          </button>
        </header>

        <div className="flex-1 max-w-6xl w-full mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* WELCOME BANNER (Blue-Black) */}
              <div className={`rounded-[60px] p-16 shadow-2xl text-white relative overflow-hidden transition-all duration-1000 ${
                isFullyAuthorized ? 'bg-green-600 shadow-green-900/20' : 'bg-[#111C44] shadow-black/40'
              }`}>
                <div className="relative z-10">
                  <h2 className="text-7xl font-black italic tracking-tighter leading-none">
                    Welcome, <br /> {user?.FirstName}!
                  </h2>
                  <p className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] opacity-40 italic">
                    {isFullyAuthorized ? 'System Status: Active Donor' : 'System Status: Pending Requirements'}
                  </p>
                </div>
                <Activity size={300} className="absolute -right-20 -top-20 opacity-5 rotate-12" />
              </div>

              {/* DYNAMIC NAV CARDS */}
              <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. MEDICAL SCREENING */}
                <button 
                  onClick={() => navigate('/donations/donor/check')}
                  className={`p-10 rounded-[50px] text-left border transition-all group relative overflow-hidden shadow-xl ${
                    isDarkMode ? 'bg-[#111C44] border-white/5 text-white' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-8 text-left">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-medical-red text-white group-hover:scale-110 transition-transform">
                      <ClipboardCheck size={28}/>
                    </div>
                    <StatusBadge label={isMedEligible ? 'PASSED' : 'REQUIRED'} active={isMedEligible} />
                  </div>
                  <h3 className={`text-2xl font-black tracking-tighter mb-2 uppercase italic ${isDarkMode ? 'text-white' : 'text-[#111C44]'}`}>
                    1. Medical Screening
                  </h3>
                  <p className="text-xs font-medium text-gray-400 dark:text-white/30 italic">Validate your physical biometrics against health standards.</p>
                  <ArrowRight size={24} className="absolute bottom-10 right-10 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-medical-red" />
                </button>

                {/* 2. REGISTER PLEDGE (STRICTLY LOCKED) */}
                <button 
                  onClick={() => isFullyAuthorized && navigate('/donations/donor/register-intent')}
                  disabled={!isFullyAuthorized}
                  className={`p-10 rounded-[50px] text-left border transition-all group relative overflow-hidden shadow-xl ${
                    !isFullyAuthorized 
                    ? 'opacity-40 grayscale cursor-not-allowed border-dashed bg-gray-100 dark:bg-transparent' 
                    : (isDarkMode ? 'bg-[#111C44] border-white/5 text-white' : 'bg-white border-gray-100')
                  }`}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                      isFullyAuthorized ? 'bg-green-500' : 'bg-gray-400'
                    } text-white group-hover:scale-110 transition-transform`}>
                      {isFullyAuthorized ? <HeartPulse size={28}/> : <Lock size={24}/>}
                    </div>
                    <StatusBadge label={isFullyAuthorized ? 'UNLOCKED' : 'LOCKED'} active={isFullyAuthorized} />
                  </div>
                  <h3 className={`text-2xl font-black tracking-tighter mb-2 uppercase italic ${isDarkMode ? 'text-white' : 'text-[#111C44]'}`}>
                    2. Register Pledge
                  </h3>
                  <p className="text-xs font-medium text-gray-400 dark:text-white/30 italic">Submit your availability to coordinate with the Red Cross registry.</p>
                  {isFullyAuthorized && (
                    <ArrowRight size={24} className="absolute bottom-10 right-10 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-green-500" />
                  )}
                </button>
              </div>

              {/* FOOTER STATS */}
              <div className="mt-12 flex gap-10 items-center justify-center border-t border-white/5 pt-10">
                 <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIdVerified ? 'bg-green-500/10 text-green-500' : 'bg-medical-red/10 text-medical-red'}`}><ShieldCheck size={16}/></div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Identity: {donorData.identityStatus}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><CheckCircle2 size={16}/></div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Active Pledges: {donorData.activeIntents}</span>
                 </div>
              </div>

            </div>
        </div>
      </main>
    </div>
  );
};

const StatusBadge = ({ label, active }) => (
    <div className={`px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest border transition-colors ${
        active ? 'bg-green-500 text-white border-green-400/30' : 'bg-gray-400/10 text-gray-400 border-gray-400/20'
    }`}>
        {label}
    </div>
);

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/layout/Sidebar';
import DonationService from '../services/DonationService';
import ProfileService from '../services/ProfileService';
import { 
  Sun, Moon, ShieldCheck, Activity, Plus,
  Lock, AlertCircle, CheckCircle2, ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (user?.Role === 'Red_Cross_Admin') {
      navigate('/admin', { replace: true });
    }

    const syncRegistryData = async () => {
      try {
        // Parallel fetch for speed and synchronization
        const [hRes, pRes] = await Promise.all([
          DonationService.getHealthInfo(),
          ProfileService.getMe()
        ]);

        // Validate Health Data (Step 1)
        if (hRes.success && hRes.data) {
          setHealthData(hRes.data);
        } else {
          setHealthData(null);
        }

        // Validate Identity (Step 2)
        if (pRes.success && pRes.data.identityStatus === 'Verified') {
          setIsVerified(true);
        } else {
          setIsVerified(false);
        }

      } catch (err) {
        // Reset states on error or 404 (means profile is empty)
        setHealthData(null);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    if (user?.Role === 'Recipient') syncRegistryData();
    else setLoading(false);
  }, [user, navigate]);

  if (!user || user.Role === 'Red_Cross_Admin') return null;

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0b1121]">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  // LOGIC: Support Request is unlocked ONLY when Medical is Synced AND Identity is Verified
  const canSubmitRequest = healthData !== null && isVerified === true;

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />
      
      <main className="flex-1 ml-72 p-10 flex flex-col text-left text-left">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3 text-left">
             <div className={`w-2 h-2 rounded-full animate-pulse ${canSubmitRequest ? 'bg-green-500' : 'bg-blue-600'}`}></div>
             <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
               Recipient Coordination Node
             </h2>
          </div>
          <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-lg hover:scale-110 transition-all">
            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-[#111C44]" />}
          </button>
        </header>

        <div className="flex-1 max-w-6xl w-full mx-auto animate-in fade-in duration-1000">
           
           {/* BANNER SECTION */}
           <div className={`rounded-[60px] p-16 shadow-2xl text-white relative overflow-hidden transition-all duration-700 ${
             canSubmitRequest ? 'bg-blue-600 shadow-blue-900/30' : 'bg-[#111C44]'
           }`}>
                <div className="relative z-10 text-left">
                  <h2 className="text-7xl font-black italic tracking-tighter leading-none">
                    Welcome, <br /> {user?.FirstName}!
                  </h2>
                  <div className="flex gap-4 mt-8">
                     <StatusBadge active={isVerified} label={isVerified ? "ID Verified" : "ID Missing"} />
                     <StatusBadge active={!!healthData} label={healthData ? "Medical Synced" : "Medical Missing"} />
                  </div>
                </div>
                <ShieldCheck size={280} className="absolute -right-20 -bottom-20 opacity-5" />
           </div>

           {/* ACTION HUB SECTION */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 text-left">
                {/* 1. MEDICAL PROFILE CARD */}
                <button 
                    onClick={() => navigate('/donations/recipient/health-info')}
                    className={`p-10 rounded-[55px] text-left border transition-all group relative overflow-hidden ${
                      isDarkMode ? 'bg-white/5 border-white/5 text-white hover:bg-white/10' : 'bg-white border-gray-100 shadow-xl'
                    }`}
                >
                    <div className="flex justify-between items-start mb-8">
                      <div className={`p-4 rounded-2xl w-fit ${!!healthData ? 'bg-green-500' : 'bg-medical-red'} text-white shadow-lg`}>
                        <Activity size={28}/>
                      </div>
                      {!!healthData && <CheckCircle2 size={22} className="text-green-500" />}
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic mb-2">1. Medical Profile</h3>
                    <p className="text-xs text-gray-400 font-medium italic leading-relaxed">
                      {healthData ? "Your clinical parameters are verified." : "Register your vitals to enable matching."}
                    </p>
                </button>

                {/* 2. SUPPORT REQUEST CARD (GATED) */}
                <button 
                    onClick={() => canSubmitRequest && navigate('/donations/recipient/request')}
                    className={`p-10 rounded-[55px] text-left border transition-all relative overflow-hidden group ${
                        !canSubmitRequest ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : 'hover:-translate-y-1 shadow-2xl active:scale-95'
                    } ${isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100'}`}
                >
                    <div className={`p-4 rounded-2xl w-fit mb-8 ${canSubmitRequest ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-gray-100 text-gray-400'}`}>
                        {canSubmitRequest ? <Plus size={28}/> : <Lock size={28}/>}
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic mb-2">2. Support Request</h3>
                    <p className="text-xs text-gray-400 font-medium italic leading-relaxed">
                        {canSubmitRequest ? "Registry clearance active. You may now request assistance." : "Complete Step 1 and ID upload to unlock."}
                    </p>
                    {canSubmitRequest && <ArrowRight className="absolute bottom-10 right-10 text-blue-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" size={32} />}
                </button>
           </div>

           <p className="mt-16 text-center text-[8px] font-black text-gray-300 dark:text-white/10 uppercase tracking-[0.5em]">
             Sew le Sew • Authorized Recipient Dashboard
           </p>
        </div>
      </main>
    </div>
  );
};

// Internal Status Helper
const StatusBadge = ({ active, label }) => (
    <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
    }`}>
        {label}
    </div>
);

export default Dashboard;
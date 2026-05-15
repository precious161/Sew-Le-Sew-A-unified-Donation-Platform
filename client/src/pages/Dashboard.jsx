import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/layout/Sidebar';
import DonationService from '../services/DonationService';
import ProfileService from '../services/ProfileService';
import { 
  Sun, Moon, ShieldCheck, Activity, Plus,
  Lock, FilePlus, AlertCircle 
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (user?.Role === 'Red_Cross_Admin') navigate('/admin', { replace: true });

    const syncRegistryData = async () => {
      try {
        // Fetch both Identity and Health Info
        const [hRes, pRes] = await Promise.all([
          DonationService.getHealthInfo(),
          ProfileService.getMe()
        ]);

        if (hRes.success) setHealthData(hRes.data);
        if (pRes.success && pRes.data.identityStatus === 'Verified') setIsVerified(true);
      } catch (err) {
        console.log("Dashboard Sync: Awaiting full registration.");
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

  // LOGIC: Unlock Request ONLY IF Profile is filled AND Identity is verified
  const canSubmitRequest = healthData && isVerified;

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />
      
      <main className="flex-1 ml-72 p-10 flex flex-col text-left">
        <header className="flex justify-between items-center mb-12">
          <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
             Patient Portal • Registry Node
          </h2>
          <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-lg">
            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
          </button>
        </header>

        <div className="flex-1 max-w-6xl w-full mx-auto animate-in fade-in duration-1000">
           
           {/* WELCOME BANNER */}
           <div className="rounded-[60px] p-16 shadow-2xl text-white relative overflow-hidden bg-[#111C44] mb-12">
                <div className="relative z-10 text-left">
                  <h2 className="text-7xl font-black italic tracking-tighter leading-none">Welcome, <br /> {user?.FirstName}!</h2>
                  <div className="flex gap-4 mt-8">
                     <StatusBadge active={isVerified} label={isVerified ? "ID Verified" : "Identity Missing"} />
                     <StatusBadge active={!!healthData} label={healthData ? "Medical Synced" : "Medical Missing"} />
                  </div>
                </div>
                <ShieldCheck size={280} className="absolute -right-20 -bottom-20 opacity-5" />
           </div>

           {/* ACTION CARDS (Moved up, Vitals Grid removed) */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <button 
                    onClick={() => navigate('/donations/recipient/health-info')}
                    className={`p-10 rounded-[55px] text-left border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-white hover:bg-white/10' : 'bg-white border-gray-100 text-[#111C44] shadow-xl shadow-gray-200/50 hover:-translate-y-1'}`}
                >
                    <div className="p-4 bg-medical-red/10 rounded-2xl w-fit mb-6 text-medical-red"><Activity size={28}/></div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic mb-2">1. Medical Profile</h3>
                    <p className="text-xs text-gray-400 font-medium italic">Synchronize clinical vitals for biological matching.</p>
                </button>

                <button 
                    onClick={() => canSubmitRequest && navigate('/recipient/new-request')}
                    className={`p-10 rounded-[55px] text-left border transition-all relative overflow-hidden group ${
                        !canSubmitRequest ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : 'hover:-translate-y-1 shadow-2xl'
                    } ${isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100'}`}
                >
                    <div className={`p-4 rounded-2xl w-fit mb-6 ${canSubmitRequest ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
                        {canSubmitRequest ? <Plus size={28}/> : <Lock size={28}/>}
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic mb-2">2. Request Support</h3>
                    <p className="text-xs text-gray-400 font-medium italic leading-relaxed">
                        {canSubmitRequest ? "Submit clinical proof to start AI matching." : "Finish Steps 1 & 2 to unlock requests."}
                    </p>
                </button>
           </div>
        </div>
      </main>
    </div>
  );
};

const StatusBadge = ({ active, label }) => (
    <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
        active ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse'
    }`}>
        {label}
    </div>
);

export default Dashboard;
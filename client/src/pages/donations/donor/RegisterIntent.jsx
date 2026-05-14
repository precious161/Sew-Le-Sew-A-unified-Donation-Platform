import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HeartPulse, Calendar, MapPin, Package, 
  ArrowLeft, Send, CheckCircle, Info, 
  Droplets, Box, ShieldCheck, Sun, Moon, AlertTriangle, X, ArrowRight
} from 'lucide-react';
import DonationService from '../../../services/DonationService';
import ProfileService from '../../../services/ProfileService';
import { useTheme } from '../../../context/ThemeContext';

const RegisterIntent = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [category, setCategory] = useState('Blood');
  
  const [formData, setFormData] = useState({
    plannedDate: '',
    location: 'Red Cross Center, Addis Ababa',
    itemType: '',
    quantity: ''
  });

  // STEP 1: SECURITY GATEKEEPER
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          ProfileService.getMe(),
          DonationService.getEligibilityHistory()
        ]);

        const isVerified = profileRes.data.identityStatus === 'Verified';
        const isEligible = historyRes.data?.[0]?.isEligible;

        if (!isVerified) setAuthError("IDENTITY_MISSING");
        else if (!isEligible) setAuthError("MEDICAL_HOLD");
        
      } catch {
        setAuthError("SYNC_ERROR");
      } finally {
        setCheckingAuth(false);
      }
    };
    verifyAccess();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        category,
        plannedDate: new Date(formData.plannedDate).toISOString(),
        location: formData.location,
        itemType: category === 'In_Kind' ? formData.itemType : null,
        quantity: category === 'In_Kind' ? parseInt(formData.quantity) : null
      };

      const res = await DonationService.registerIntent(payload);
      if (res.success) setSuccess(true);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || "Registration failed." });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) return <div className="h-screen flex items-center justify-center bg-[#0b1121] text-white font-black animate-pulse uppercase tracking-[0.5em]">Authorizing Access...</div>;

  // --- ACCESS DENIED VIEW ---
  if (authError) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] flex items-center justify-center p-6 transition-all duration-500">
      <div className="max-w-md w-full bg-white dark:bg-[#111C44] p-12 rounded-[50px] shadow-2xl text-center animate-in zoom-in border border-gray-100 dark:border-white/5">
        <div className="w-20 h-20 bg-medical-red/10 text-medical-red rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle size={40} /></div>
        <h2 className="text-3xl font-black text-[#111C44] dark:text-white uppercase italic tracking-tighter">Access Locked</h2>
        <p className="text-gray-400 text-sm mt-4 leading-relaxed italic">
          {authError === "IDENTITY_MISSING" 
            ? "Registry policy requires a verified National ID before you can pledge." 
            : "You must pass the medical screening quiz to enter the active donor pool."}
        </p>
        <button onClick={() => navigate(authError === "IDENTITY_MISSING" ? '/profile' : '/donations/donor/check')} className="w-full mt-10 bg-medical-red text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
            {authError === "IDENTITY_MISSING" ? 'Go to Profile' : 'Start Screening'} <ArrowRight size={16}/>
        </button>
      </div>
    </div>
  );

  // --- SUCCESS VIEW ---
  if (success) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] flex items-center justify-center p-6 transition-all duration-500">
      <div className="max-w-md w-full bg-white dark:bg-[#111C44] p-12 rounded-[50px] shadow-2xl text-center animate-in zoom-in border border-gray-100 dark:border-white/5">
        <div className="w-24 h-24 bg-green-500 text-white rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-900/20"><CheckCircle size={48} /></div>
        <h2 className="text-3xl font-black text-[#111C44] dark:text-white uppercase italic tracking-tighter">Pledge Registered</h2>
        <p className="text-gray-400 text-sm mt-4 leading-relaxed font-medium italic">Your availability has been logged in the Addis Ababa registry.</p>
        <button onClick={() => navigate('/dashboard')} className="w-full mt-12 bg-medical-red text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Return to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] transition-colors duration-500 pb-20 text-left">
      <div className="max-w-4xl mx-auto py-12 px-6">
        
        <div className="mb-10 flex justify-between items-center">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-[#111C44] dark:text-white/50 hover:text-medical-red transition-all group">
            <div className="p-2 rounded-xl bg-white dark:bg-white/5 shadow-md border border-gray-100 dark:border-white/5 group-hover:-translate-x-1 transition-transform"><ArrowLeft size={18} /></div>
            <span className="text-[10px] font-black uppercase tracking-widest italic">Dashboard</span>
          </button>
          <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 text-[#111C44] dark:text-white border border-gray-200 dark:border-white/10 shadow-xl transition-all">
            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
          </button>
        </div>

        <div className="mb-12">
            <h1 className="text-4xl font-black text-[#111C44] dark:text-white tracking-tighter uppercase italic leading-none">Register Pledge</h1>
            <p className="text-gray-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 italic tracking-[0.5em]">System Node: Contribution Hub</p>
        </div>

        {message.text && message.type === 'error' && (
          <div className="mb-8 p-5 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-red-500 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3"><AlertTriangle size={18} /><p className="text-[10px] font-black uppercase tracking-widest">{message.text}</p></div>
            <button onClick={() => setMessage({type:'', text:''})}><X size={16}/></button>
          </div>
        )}

        <div className="flex gap-4 mb-10 overflow-x-auto no-scrollbar">
            <button type="button" onClick={() => setCategory('Blood')} className={`px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest border transition-all ${category === 'Blood' ? 'bg-medical-red text-white border-medical-red shadow-lg' : 'bg-white dark:bg-[#111C44] text-gray-400 border-gray-100 dark:border-white/5'}`}><Droplets size={14}/> Life Blood</button>
            <button type="button" onClick={() => setCategory('In_Kind')} className={`px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest border transition-all ${category === 'In_Kind' ? 'bg-medical-red text-white border-medical-red shadow-lg' : 'bg-white dark:bg-[#111C44] text-gray-400 border-gray-100 dark:border-white/5'}`}><Box size={14}/> Medical Supplies</button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111C44] p-10 rounded-[55px] shadow-2xl border border-gray-100 dark:border-white/5 transition-all">
          <div className="space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block">Planned Donation Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input type="date" required min={new Date().toISOString().split("T")[0]} value={formData.plannedDate} onChange={(e) => setFormData({...formData, plannedDate: e.target.value})} className="w-full p-5 pl-12 rounded-[22px] bg-gray-50 dark:bg-[#0b1121] border-none outline-none font-bold text-sm text-[#111C44] dark:text-white shadow-inner transition-all" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block">Collection Center</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input type="text" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full p-5 pl-12 rounded-[22px] bg-gray-50 dark:bg-[#0b1121] border-none outline-none font-bold text-sm text-[#111C44] dark:text-white shadow-inner" />
                  </div>
                </div>
             </div>

             {category === 'In_Kind' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-left duration-300">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block text-left uppercase">Supply Item Type</label>
                    <input placeholder="e.g. Oxygen Tank" required={category === 'In_Kind'} value={formData.itemType} onChange={(e) => setFormData({...formData, itemType: e.target.value})} className="w-full p-5 rounded-[22px] bg-gray-50 dark:bg-[#0b1121] border-none outline-none font-bold text-sm text-[#111C44] dark:text-white shadow-inner" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block text-left uppercase">Units Required</label>
                    <input type="number" min="1" required={category === 'In_Kind'} value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full p-5 rounded-[22px] bg-gray-50 dark:bg-[#0b1121] border-none outline-none font-bold text-sm text-[#111C44] dark:text-white shadow-inner" />
                  </div>
               </div>
             )}

             <div className="p-8 rounded-[35px] bg-blue-500/5 border border-blue-500/10 flex gap-6 items-center">
                <div className="w-12 h-12 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100 dark:border-white/5 transition-all"><ShieldCheck size={24} /></div>
                <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 leading-relaxed uppercase tracking-wider max-w-lg italic opacity-80 text-left">Coordination Notice: By confirming, your pledge enters the national matching engine. Red Cross staff will finalize the logistics with you via SMS/Email.</p>
             </div>
          </div>

          <button type="submit" disabled={loading} className="w-full mt-10 bg-[#111C44] dark:bg-medical-red text-white py-6 rounded-[25px] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-black dark:hover:bg-red-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-red-900/30">
            {loading ? 'SYNCHRONIZING PLEDGE...' : <><HeartPulse size={20}/> Confirm Registration</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterIntent;
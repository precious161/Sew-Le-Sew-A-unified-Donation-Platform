import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, CheckCircle, ArrowLeft, 
  ShieldCheck, Info, Activity, UserCheck, ShieldAlert,
  Droplets, Heart, Banknote, Box, Sun, Moon, ArrowRight
} from 'lucide-react';
import DonationService from '../../../services/DonationService';
import ProfileService from '../../../services/ProfileService';
import { useTheme } from '../../../context/ThemeContext';

const EligibilityQuiz = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [result, setResult] = useState(null);
  const [category, setCategory] = useState('Blood');
  
  // RuleKeys match Feyruza's MedicalStandard table exactly
  const [answers, setAnswers] = useState({
    MIN_AGE: '',
    MIN_WEIGHT: '',
    HEMOGLOBIN_MIN: '12.5',
    DONATION_GAP_DAYS: '90',
    COERCION_FREE: 'true',
    MIN_AMOUNT: '',
    MIN_EXPIRY_MONTHS: '6',
    QUALITY_CERTIFIED: 'true'
  });

  // PERSISTENCE LOGIC: Sync data from registry on mount and category change
  useEffect(() => {
    const syncWithRegistry = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          ProfileService.getMe(),
          DonationService.getEligibilityHistory()
        ]);

        if (profileRes.success) setUserProfile(profileRes.data);

        // Fill form with previous screening data if it exists
        if (historyRes.success && historyRes.data.length > 0) {
          const latestInCategory = historyRes.data.find(log => log.category === category);
          if (latestInCategory && latestInCategory.answers) {
            setAnswers(prev => ({ ...prev, ...latestInCategory.answers }));
          }
        }
      } catch {
        console.error("Registry sync failed.");
      } finally {
        setSyncing(false);
      }
    };
    syncWithRegistry();
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await DonationService.checkEligibility(category, answers);
      setResult(res.data);
    } catch {
      alert("Submission Error: Ensure all fields contain valid numbers.");
    } finally {
      setLoading(false);
    }
  };

  if (syncing) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0b1121]">
       <div className="animate-pulse font-black text-gray-400 uppercase text-[10px] tracking-widest italic">Syncing Medical Standards...</div>
    </div>
  );

  // --- RESULT VIEW ---
  if (result) {
    const isMedicallyEligible = result.isEligible;
    const isIdentityVerified = userProfile?.identityStatus === 'Verified';

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] flex items-center justify-center p-6 transition-all duration-500">
        <div className="max-w-md w-full bg-white dark:bg-[#111C44] p-12 rounded-[50px] shadow-2xl text-center border border-gray-100 dark:border-white/5 animate-in zoom-in">
          
          {isMedicallyEligible && isIdentityVerified ? (
            <>
              <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/20"><CheckCircle size={40} /></div>
              <h2 className="text-3xl font-black text-[#111C44] dark:text-white uppercase italic tracking-tighter leading-none">Fully Cleared</h2>
              <p className="text-gray-400 text-sm mt-4 leading-relaxed">Medical checks passed and identity verified. You are now active in the pool.</p>
              <button onClick={() => navigate('/donations/donor/register-intent')} className="w-full mt-10 bg-medical-red text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all">Proceed to Pledge</button>
            </>
          ) : isMedicallyEligible && !isIdentityVerified ? (
            <>
              <div className="w-20 h-20 bg-blue-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/20"><UserCheck size={40} /></div>
              <h2 className="text-3xl font-black text-[#111C44] dark:text-white uppercase italic tracking-tighter leading-none text-left">Medical Pass</h2>
              <div className="mt-6 p-6 rounded-3xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-left">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 italic underline">Identity Missing</p>
                  <p className="text-xs font-bold text-gray-500 dark:text-white/60 leading-relaxed">Health check passed, but policy requires a verified National ID. Status: <span className="text-blue-600 font-black">{userProfile?.identityStatus}</span></p>
              </div>
              <button onClick={() => navigate('/profile')} className="w-full mt-10 bg-[#111C44] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl">Complete ID Check <ArrowRight size={16}/></button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-900/20"><ShieldAlert size={40} /></div>
              <h2 className="text-3xl font-black text-[#111C44] dark:text-white uppercase italic tracking-tighter leading-none">Hold State</h2>
              <p className="text-gray-400 text-sm mt-4 italic uppercase tracking-widest text-[10px]">Standard Violation: {result.reasonCode?.replace(/_/g, ' ')}</p>
              {result.ineligibleUntil && (
                <p className="mt-4 text-[10px] font-black text-medical-red uppercase bg-red-50 dark:bg-red-500/10 py-3 rounded-xl tracking-widest">Retry Available: {new Date(result.ineligibleUntil).toDateString()}</p>
              )}
              <button onClick={() => setResult(null)} className="mt-10 text-[10px] font-black uppercase text-gray-400 border-b border-gray-200 dark:border-white/10 pb-1 hover:text-medical-red transition-all">Retake Screening</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] transition-colors duration-500 pb-20 text-left">
      <div className="max-w-4xl mx-auto py-12 px-6">
        
        {/* TOP BAR */}
        <div className="mb-10 flex justify-between items-start">
          <div className="text-left">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-[#111C44] dark:text-white/50 hover:text-medical-red transition-all group mb-6">
                <div className="p-2 rounded-xl bg-white dark:bg-white/5 shadow-md border border-gray-100 dark:border-white/5 group-hover:-translate-x-1 transition-transform">
                    <ArrowLeft size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
            </button>
            <h1 className="text-4xl font-black text-[#111C44] dark:text-white tracking-tighter uppercase italic leading-none text-left">Medical Screening</h1>
            <p className="text-gray-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 italic text-left tracking-[0.4em]">Validation Protocol (ADDIS ABABA)</p>
          </div>
          <button onClick={toggleTheme} className="p-3.5 rounded-2xl bg-white dark:bg-white/5 text-[#111C44] dark:text-white border border-gray-200 dark:border-white/10 shadow-lg transition-all active:scale-95">
            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
          </button>
        </div>

        {/* CATEGORY SELECTOR */}
        <div className="flex flex-wrap gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
            <CategoryTab active={category === 'Blood'} label="Life Blood" icon={<Droplets size={14}/>} onClick={() => setCategory('Blood')} />
            <CategoryTab active={category === 'Organ'} label="Organ Intent" icon={<Heart size={14}/>} onClick={() => setCategory('Organ')} />
            <CategoryTab active={category === 'Financial'} label="Financial Aid" icon={<Banknote size={14}/>} onClick={() => setCategory('Financial')} />
            <CategoryTab active={category === 'In_Kind'} label="Medical Supplies" icon={<Box size={14}/>} onClick={() => setCategory('In_Kind')} />
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111C44] p-12 rounded-[50px] shadow-2xl border border-gray-100 dark:border-white/5 transition-all">
          <div className="space-y-12">
             
             {/* DYNAMIC QUESTIONS BASED ON CATEGORY */}
             {category === 'Blood' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-left duration-300">
                  <Question label="Biological Age" value={answers.MIN_AGE} onChange={(v) => setAnswers({...answers, MIN_AGE: v})} placeholder="Years (Min 18)" />
                  <Question label="Weight (kg)" value={answers.MIN_WEIGHT} onChange={(v) => setAnswers({...answers, MIN_WEIGHT: v})} placeholder="kg (Min 50)" />
                  <Question label="Hemoglobin (g/dL)" value={answers.HEMOGLOBIN_MIN} onChange={(v) => setAnswers({...answers, HEMOGLOBIN_MIN: v})} placeholder="Standard 12.5+" />
                  <Question label="Donation Gap (Days)" value={answers.DONATION_GAP_DAYS} onChange={(v) => setAnswers({...answers, DONATION_GAP_DAYS: v})} placeholder="Min 90 days" />
               </div>
             )}

             {category === 'Organ' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-left duration-300 items-end">
                  <Question label="Confirm Legal Age" value={answers.MIN_AGE} onChange={(v) => setAnswers({...answers, MIN_AGE: v})} placeholder="18+" />
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block text-left">Consent Status</label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-[#0b1121] p-2 rounded-2xl shadow-inner border dark:border-white/5">
                        <BooleanBtn active={answers.COERCION_FREE === 'true'} label="FREELY GIVEN" onClick={() => setAnswers({...answers, COERCION_FREE: 'true'})} />
                        <BooleanBtn active={answers.COERCION_FREE === 'false'} label="COERCED" onClick={() => setAnswers({...answers, COERCION_FREE: 'false'})} />
                    </div>
                  </div>
               </div>
             )}

             {category === 'Financial' && (
               <div className="animate-in slide-in-from-left duration-300 text-left">
                  <Question label="Estimated Contribution (ETB)" value={answers.MIN_AMOUNT} onChange={(v) => setAnswers({...answers, MIN_AMOUNT: v})} placeholder="Min 5 ETB" />
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-6 ml-2 italic">Note: High-value contributions over 10,000 ETB trigger extra registry verification.</p>
               </div>
             )}

             {category === 'In_Kind' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-left duration-300 items-end">
                  <Question label="Expiry Buffer (Months)" value={answers.MIN_EXPIRY_MONTHS} onChange={(v) => setAnswers({...answers, MIN_EXPIRY_MONTHS: v})} placeholder="Min 6 months" />
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block text-left uppercase">Quality Grade</label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-[#0b1121] p-2 rounded-2xl shadow-inner border dark:border-white/5">
                        <BooleanBtn active={answers.QUALITY_CERTIFIED === 'true'} label="CERTIFIED" onClick={() => setAnswers({...answers, QUALITY_CERTIFIED: 'true'})} />
                        <BooleanBtn active={answers.QUALITY_CERTIFIED === 'false'} label="UNVERIFIED" onClick={() => setAnswers({...answers, QUALITY_CERTIFIED: 'false'})} />
                    </div>
                  </div>
               </div>
             )}

             <div className="p-8 rounded-[35px] bg-blue-500/5 border border-blue-500/10 flex gap-6 items-center">
                <div className="w-12 h-12 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100 dark:border-white/5"><Info size={24} /></div>
                <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 leading-relaxed uppercase tracking-wider max-w-lg text-left italic">
                  Results are computed based on the Ethiopian Red Cross Society (ERCS) safety protocols. Passing this quiz is the mandatory medical step before active registry.
                </p>
             </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full mt-10 bg-[#111C44] dark:bg-medical-red text-white py-6 rounded-[25px] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-black dark:hover:bg-red-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-red-900/30"
          >
            {loading ? 'COMPUTING STANDARDS...' : <><Activity size={20}/> Validate Metrics</>}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- HELPER UI ---

const CategoryTab = ({ active, label, icon, onClick }) => (
    <button onClick={onClick} className={`px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all border shrink-0 ${
        active ? 'bg-medical-red text-white border-medical-red shadow-red-900/30' : 'bg-white dark:bg-[#111C44] text-gray-400 border-gray-100 dark:border-white/5'
    }`}>
        {icon} {label}
    </button>
);

const Question = ({ label, value, onChange, placeholder }) => (
    <div className="space-y-3 text-left">
        <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block text-left">{label}</label>
        <input 
            type="number" required placeholder={placeholder}
            value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full p-5 rounded-[22px] bg-gray-50 dark:bg-[#0b1121] border-none outline-none font-bold text-sm text-[#111C44] dark:text-white shadow-inner focus:ring-2 focus:ring-medical-red/20 transition-all"
        />
    </div>
);

const BooleanBtn = ({ active, label, onClick }) => (
    <button 
        type="button" onClick={onClick} 
        className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
            active ? 'bg-medical-red text-white shadow-lg' : 'text-gray-400 hover:text-[#111C44] dark:hover:text-white'
        }`}
    >
        {label}
    </button>
);

export default EligibilityQuiz;
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
  const [autoSaveStatus, setAutoSaveStatus] = useState(null);

  const [answers, setAnswers] = useState({
    MIN_AGE: '',
    MIN_WEIGHT: '',
    BLOOD_TYPE: '',
    HEMOGLOBIN_MIN: '',
    DONATION_GAP_DAYS: '',
    COERCION_FREE: 'true',
    MIN_AMOUNT: '',
    MIN_EXPIRY_MONTHS: '',
    QUALITY_CERTIFIED: 'true'
  });

  // Load user profile
  useEffect(() => {
    const syncWithRegistry = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          ProfileService.getMe(),
          DonationService.getEligibilityHistory()
        ]);
        if (profileRes.success) setUserProfile(profileRes.data);
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

  // Auto-save functionality
  useEffect(() => {
    const loadSavedProgress = () => {
      try {
        const saved = localStorage.getItem('eligibility_progress');
        if (saved) {
          const { category: savedCat, answers: savedAnswers, timestamp } = JSON.parse(saved);
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            setCategory(savedCat);
            setAnswers(prev => ({ ...prev, ...savedAnswers }));
            setAutoSaveStatus({ type: 'restored', message: 'Previous progress restored' });
            setTimeout(() => setAutoSaveStatus(null), 3000);
          } else {
            localStorage.removeItem('eligibility_progress');
          }
        }
      } catch (error) {
        console.error('Failed to load saved progress:', error);
      }
    };
    loadSavedProgress();
  }, []);

  // Auto-save on changes
  useEffect(() => {
    if (!category || Object.values(answers).every(v => !v)) return;

    const saveProgress = () => {
      const progress = {
        category,
        answers,
        timestamp: Date.now()
      };
      localStorage.setItem('eligibility_progress', JSON.stringify(progress));
      setAutoSaveStatus({ type: 'saved', message: 'Progress saved' });
      setTimeout(() => setAutoSaveStatus(null), 2000);
    };

    const debounceTimer = setTimeout(saveProgress, 3000);
    return () => clearTimeout(debounceTimer);
  }, [category, answers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanAnswers = Object.fromEntries(Object.entries(answers).filter(([_, v]) => v !== ''));

    try {
      const res = await DonationService.checkEligibility(category, cleanAnswers);
      setResult(res.data);
      // Clear saved progress on successful submission
      localStorage.removeItem('eligibility_progress');
    } catch {
      alert("Submission Error: Please answer all visible questions.");
    } finally {
      setLoading(false);
    }
  };

  if (syncing) return <div className="h-screen flex items-center justify-center bg-[#0b1121] text-white font-black animate-pulse uppercase tracking-[0.5em]">Syncing Standards...</div>;

  if (result) {
    const isMedicallyEligible = result.isEligible;
    const isIdentityVerified = userProfile?.identityStatus === 'Verified';

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-[#111C44] p-12 rounded-[50px] shadow-2xl text-center">
          {isMedicallyEligible && isIdentityVerified ? (
            <>
              <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"><CheckCircle size={40} /></div>
              <h2 className="text-3xl font-black dark:text-white uppercase italic tracking-tighter leading-none">Fully Cleared</h2>
              <p className="text-gray-400 text-sm mt-4">Medical checks passed and identity verified.</p>
              <button onClick={() => navigate('/donations/donor/register-intent')} className="w-full mt-10 bg-medical-red text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all">Proceed to Pledge</button>
            </>
          ) : isMedicallyEligible && !isIdentityVerified ? (
            <>
              <div className="w-20 h-20 bg-blue-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"><UserCheck size={40} /></div>
              <h2 className="text-3xl font-black dark:text-white uppercase italic tracking-tighter leading-none">Medical Pass</h2>
              <p className="text-gray-400 text-sm mt-4">Health check passed, but you need a verified National ID.</p>
              <button onClick={() => navigate('/profile')} className="w-full mt-10 bg-[#111C44] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex justify-center gap-3">Complete ID Check <ArrowRight size={16}/></button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"><ShieldAlert size={40} /></div>
              <h2 className="text-3xl font-black dark:text-white uppercase italic tracking-tighter leading-none">Hold State</h2>
              <p className="text-gray-400 text-sm mt-4 italic uppercase tracking-widest text-[10px]">Violation: {result.reasonCode?.replace(/_/g, ' ')}</p>
              {result.ineligibleUntil && <p className="mt-4 text-[10px] font-black text-medical-red uppercase py-3 rounded-xl tracking-widest">Retry Available: {new Date(result.ineligibleUntil).toDateString()}</p>}
              <button onClick={() => setResult(null)} className="mt-10 text-[10px] font-black uppercase text-gray-400 hover:text-medical-red transition-all">Retake Screening</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] transition-colors duration-500 pb-20 text-left">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="mb-10 flex justify-between items-start">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-medical-red"><ArrowLeft size={18} /> <span className="text-[10px] font-black uppercase">Dashboard</span></button>
          <button onClick={toggleTheme} className="p-3.5 rounded-2xl bg-white dark:bg-white/5 dark:text-white">{isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}</button>
        </div>

        {/* Auto-save status indicator */}
        {autoSaveStatus && (
          <div className={`mb-4 p-3 rounded-xl text-center text-[10px] font-black uppercase tracking-widest ${
            autoSaveStatus.type === 'saved'
              ? 'bg-green-500/10 text-green-500'
              : 'bg-blue-500/10 text-blue-500'
          }`}>
            {autoSaveStatus.message}
          </div>
        )}

        {/* Category Tabs - Blood, Organ, Supplies (No Financial) */}
        <div className="flex flex-wrap gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
            <CategoryTab active={category === 'Blood'} label="Blood" icon={<Droplets size={14}/>} onClick={() => setCategory('Blood')} />
            <CategoryTab active={category === 'Organ'} label="Organ" icon={<Heart size={14}/>} onClick={() => setCategory('Organ')} />
            <CategoryTab active={category === 'In_Kind'} label="Supplies" icon={<Box size={14}/>} onClick={() => setCategory('In_Kind')} />
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111C44] p-12 rounded-[50px] shadow-2xl">
          <div className="space-y-10">

             {/* EVERYONE NEEDS BLOOD TYPE AND WEIGHT FOR BIOMETRIC MATCHING */}
             {(category === 'Blood' || category === 'Organ') && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Blood Group</label>
                    <select required value={answers.BLOOD_TYPE} onChange={(e) => setAnswers({...answers, BLOOD_TYPE: e.target.value})} className="w-full p-5 rounded-[22px] bg-gray-50 dark:bg-[#0b1121] font-bold text-sm outline-none dark:text-white appearance-none">
                      <option value="">Select</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <Question label="Weight (kg)" value={answers.MIN_WEIGHT} onChange={(v) => setAnswers({...answers, MIN_WEIGHT: v})} placeholder="kg" />
               </div>
             )}

             {category === 'Blood' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <Question label="Age" value={answers.MIN_AGE} onChange={(v) => setAnswers({...answers, MIN_AGE: v})} placeholder="Years" />
                  <Question label="Hemoglobin (g/dL)" value={answers.HEMOGLOBIN_MIN} onChange={(v) => setAnswers({...answers, HEMOGLOBIN_MIN: v})} placeholder="e.g. 13.5" />
                  <Question label="Days since last donation" value={answers.DONATION_GAP_DAYS} onChange={(v) => setAnswers({...answers, DONATION_GAP_DAYS: v})} placeholder="Days" />
               </div>
             )}

             {category === 'Organ' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                  <Question label="Age" value={answers.MIN_AGE} onChange={(v) => setAnswers({...answers, MIN_AGE: v})} placeholder="Years" />
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Consent</label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-[#0b1121] p-2 rounded-2xl"><BooleanBtn active={answers.COERCION_FREE === 'true'} label="FREELY GIVEN" onClick={() => setAnswers({...answers, COERCION_FREE: 'true'})} /><BooleanBtn active={answers.COERCION_FREE === 'false'} label="COERCED" onClick={() => setAnswers({...answers, COERCION_FREE: 'false'})} /></div>
                  </div>
               </div>
             )}

             {category === 'In_Kind' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                  <Question label="Expiry Buffer (Months)" value={answers.MIN_EXPIRY_MONTHS} onChange={(v) => setAnswers({...answers, MIN_EXPIRY_MONTHS: v})} placeholder="Months" />
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Quality</label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-[#0b1121] p-2 rounded-2xl"><BooleanBtn active={answers.QUALITY_CERTIFIED === 'true'} label="CERTIFIED" onClick={() => setAnswers({...answers, QUALITY_CERTIFIED: 'true'})} /><BooleanBtn active={answers.QUALITY_CERTIFIED === 'false'} label="UNVERIFIED" onClick={() => setAnswers({...answers, QUALITY_CERTIFIED: 'false'})} /></div>
                  </div>
               </div>
             )}

             <div className="p-8 rounded-[35px] bg-blue-500/5 text-blue-500 text-[10px] font-bold uppercase flex gap-4 italic"><Info size={24} /> Results are computed based on Ethiopian Red Cross safety protocols.</div>
          </div>

          <button type="submit" disabled={loading} className="w-full mt-10 bg-[#111C44] dark:bg-medical-red text-white py-6 rounded-[25px] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-black dark:hover:bg-red-700 transition-all flex items-center justify-center gap-3">
            {loading ? 'COMPUTING...' : <><Activity size={20}/> Validate Metrics</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const CategoryTab = ({ active, label, icon, onClick }) => (
    <button onClick={onClick} type="button" className={`px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase border ${active ? 'bg-medical-red text-white border-medical-red shadow-lg' : 'bg-white dark:bg-[#111C44] text-gray-400 border-gray-100 dark:border-white/5'}`}>{icon} {label}</button>
);

const Question = ({ label, value, onChange, placeholder }) => (
    <div className="space-y-3 text-left">
        <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2">{label}</label>
        <input type="number" required placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-5 rounded-[22px] bg-gray-50 dark:bg-[#0b1121] outline-none font-bold text-sm dark:text-white" />
    </div>
);

const BooleanBtn = ({ active, label, onClick }) => (
    <button type="button" onClick={onClick} className={`py-3 rounded-xl font-black text-[9px] uppercase ${active ? 'bg-medical-red text-white' : 'text-gray-400'}`}>{label}</button>
);

export default EligibilityQuiz;
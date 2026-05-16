import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Send, CheckCircle, 
  AlertTriangle, Droplets, Box, Banknote, Info,
  Stethoscope, FileText, Activity, ShieldAlert, 
  CheckCircle2, ChevronRight, Sun, Moon, ShieldCheck // FIXED: Added missing icons here
} from 'lucide-react';
import DonationService from '../../../services/DonationService';
import ProfileService from '../../../services/ProfileService';
import { useTheme } from '../../../context/ThemeContext';

const CreateRequest = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [accessDenied, setAccessDenied] = useState(null); 
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    donationType: 'Blood',
    requiredBloodType: '',
    organType: '',
    itemType: '',
    itemQuantity: 1,
    urgencyLevel: 'Medium',
    hospitalName: '',
    attendingDoctor: '',
    notes: '',
    document: null 
  });

  useEffect(() => {
    const checkPrerequisites = async () => {
      try {
        const [pRes, hRes] = await Promise.all([
          ProfileService.getMe(),
          DonationService.getHealthInfo()
        ]);

        if (pRes.data.identityStatus !== 'Verified') {
          setAccessDenied('IDENTITY');
        } else if (!hRes.success || !hRes.data) {
          setAccessDenied('HEALTH');
        }
      } catch (err) {
        setAccessDenied('HEALTH'); 
      } finally {
        setVerifying(false);
      }
    };
    checkPrerequisites();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.document) {
      setMessage({ type: 'error', text: 'Official medical proof is required.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const data = new FormData();
    data.append('donationType', formData.donationType);
    data.append('urgencyLevel', formData.urgencyLevel);
    data.append('hospitalName', formData.hospitalName);
    data.append('attendingDoctor', formData.attendingDoctor);
    data.append('notes', formData.notes);
    data.append('document', formData.document); 

    if (formData.donationType === 'Blood') data.append('requiredBloodType', formData.requiredBloodType);
    if (formData.donationType === 'Organ') data.append('organType', formData.organType);
    if (formData.donationType === 'In_Kind') {
      data.append('itemType', formData.itemType);
      data.append('itemQuantity', formData.itemQuantity);
    }

    try {
      const res = await DonationService.createDonationRequest(data);
      if (res.success) setSuccess(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Submission failed. Please check your data.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) return <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0b1121]"><div className="animate-spin h-10 w-10 border-t-2 border-blue-600 rounded-full"></div></div>;

  if (accessDenied) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] flex items-center justify-center p-6 transition-all duration-500">
      <div className="max-w-md w-full bg-white dark:bg-[#111C44] p-12 rounded-[50px] shadow-2xl text-center border border-gray-100 dark:border-white/5 animate-in zoom-in">
        <div className="w-20 h-20 bg-medical-red/10 text-medical-red rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm"><ShieldAlert size={40} /></div>
        <h2 className="text-3xl font-black text-[#111C44] dark:text-white uppercase italic tracking-tighter leading-none">Registry Lock</h2>
        <p className="text-gray-400 text-sm mt-6 leading-relaxed italic border-l-2 border-medical-red/30 pl-4 text-left">
          {accessDenied === 'IDENTITY' 
            ? "Your identity verification is pending. Please upload your National ID in the Profile section." 
            : "You must synchronize your medical vitals (Blood Type, Weight) before submitting a request."}
        </p>
        <button 
          onClick={() => navigate(accessDenied === 'IDENTITY' ? '/profile' : '/donations/recipient/health-info')} 
          className="w-full mt-10 bg-medical-red text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
        >
            Resolve Block <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] flex items-center justify-center p-6 transition-all duration-500">
      <div className="max-w-md w-full bg-white dark:bg-[#111C44] p-12 rounded-[50px] shadow-2xl text-center animate-in zoom-in">
        <div className="w-24 h-24 bg-green-500 text-white rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-900/20"><CheckCircle size={48} /></div>
        <h2 className="text-3xl font-black text-[#111C44] dark:text-white uppercase italic tracking-tighter leading-none">Request Logged</h2>
        <p className="text-gray-400 text-sm mt-4 leading-relaxed font-medium italic">Submission successful. The Red Cross Authority is reviewing your clinical documentation.</p>
        <button onClick={() => navigate('/dashboard')} className="w-full mt-12 bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all">Portal Overview</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] transition-colors duration-500 pb-20 text-left">
      <div className="max-w-6xl mx-auto py-12 px-6">
        
        <div className="mb-10 flex justify-between items-center">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-[#111C44] dark:text-white/50 hover:text-blue-600 transition-all group">
            <div className="p-2 rounded-xl bg-white dark:bg-white/5 shadow-md border border-gray-100 dark:border-white/5 group-hover:-translate-x-1 transition-transform">
                <ArrowLeft size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest italic">Dashboard</span>
          </button>
          <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-lg text-[#111C44] dark:text-yellow-400">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="mb-12">
            <h1 className="text-4xl font-black text-[#111C44] dark:text-white tracking-tighter uppercase italic leading-none">Request Support</h1>
            <p className="text-gray-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 italic tracking-[0.5em]">Clinical Coordination Node</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8 text-left">
            <div className="bg-white dark:bg-[#111C44] p-10 rounded-[50px] shadow-2xl border border-gray-100 dark:border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-8 italic">1. Case Classification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block tracking-widest text-left">Support Category</label>
                  <select 
                    className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none outline-none font-bold text-sm text-[#111C44] dark:text-white appearance-none shadow-inner"
                    value={formData.donationType}
                    onChange={(e) => setFormData({...formData, donationType: e.target.value})}
                  >
                    <option value="Blood">Blood Donation</option>
                    <option value="In_Kind">Medical Supplies</option>
                    <option value="Financial">Financial Aid</option>
                    <option value="Organ">Organ Replacement</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block tracking-widest text-left">Triage Level</label>
                  <select 
                    className={`w-full p-5 rounded-2xl border-none outline-none font-black text-[10px] uppercase tracking-widest shadow-inner ${
                        formData.urgencyLevel === 'Critical' ? 'bg-red-500 text-white' : 'bg-gray-50 dark:bg-[#0b1121] text-blue-600 dark:text-blue-400'
                    }`}
                    value={formData.urgencyLevel}
                    onChange={(e) => setFormData({...formData, urgencyLevel: e.target.value})}
                  >
                    <option value="Low">Low (Stability)</option>
                    <option value="Medium">Medium (Urgent)</option>
                    <option value="High">High (Immediate)</option>
                    <option value="Critical">Critical (Emergency)</option>
                  </select>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-gray-50 dark:border-white/5 animate-in slide-in-from-left duration-300">
                {formData.donationType === 'Blood' && (
                    <div className="grid grid-cols-4 gap-3 text-left">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                        <button key={type} type="button" onClick={() => setFormData({...formData, requiredBloodType: type})}
                            className={`py-3 rounded-xl font-black text-xs transition-all border ${formData.requiredBloodType === type ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-[#0b1121] border-transparent text-gray-400'}`}>{type}</button>
                        ))}
                    </div>
                )}
                {formData.donationType === 'In_Kind' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input placeholder="Item (Oxygen, wheelchairs...)" required value={formData.itemType} onChange={(e) => setFormData({...formData, itemType: e.target.value})} className="p-5 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none font-bold text-sm dark:text-white shadow-inner" />
                        <input type="number" placeholder="Quantity" value={formData.itemQuantity} onChange={(e) => setFormData({...formData, itemQuantity: parseInt(e.target.value)})} className="p-5 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none font-bold text-sm dark:text-white shadow-inner" />
                    </div>
                )}
                {formData.donationType === 'Organ' && (
                    <input placeholder="Required Organ (e.g. Kidney)" required value={formData.organType} onChange={(e) => setFormData({...formData, organType: e.target.value})} className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none font-bold text-sm dark:text-white shadow-inner" />
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#111C44] p-10 rounded-[50px] shadow-2xl border border-gray-100 dark:border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-8 italic">2. Clinical Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-left">
                 <input placeholder="Hospital Center" required value={formData.hospitalName} onChange={(e) => setFormData({...formData, hospitalName: e.target.value})} className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none dark:text-white font-bold text-sm shadow-inner" />
                 <input placeholder="Attending Doctor" required value={formData.attendingDoctor} onChange={(e) => setFormData({...formData, attendingDoctor: e.target.value})} className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none dark:text-white font-bold text-sm shadow-inner" />
              </div>
              <textarea placeholder="Clinical summary..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full p-6 h-32 rounded-3xl bg-gray-50 dark:bg-[#0b1121] border-none dark:text-white text-sm resize-none shadow-inner" />
            </div>
          </div>

          <div className="space-y-8 text-left">
             <div className="bg-[#111C44] dark:bg-[#1e293b] p-10 rounded-[55px] shadow-2xl text-white h-fit">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-8">3. Verification</h3>
                <div className="p-8 border-2 border-dashed border-white/10 rounded-[35px] flex flex-col items-center text-center group hover:border-blue-500 transition-all cursor-pointer bg-white/5">
                   <Upload className="text-blue-500 mb-4 group-hover:animate-bounce" size={32} />
                   <p className="text-[10px] font-black uppercase tracking-widest mb-2">Medical Proof</p>
                   <p className="text-white/20 text-[9px] mb-8 lowercase leading-relaxed italic">Upload physician's request (PDF/JPG)</p>
                   <input type="file" required className="text-[9px] text-white/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white file:font-black"
                          onChange={(e) => setFormData({...formData, document: e.target.files[0]})} />
                </div>

                {message.text && (
                  <div className={`mt-8 p-4 rounded-2xl flex items-center gap-3 border ${message.type === 'error' ? 'bg-red-500/20 border-red-500/20 text-red-400' : 'bg-green-500/20 border-green-500/20 text-green-400'}`}>
                    <AlertTriangle size={16}/><p className="text-[10px] font-black uppercase leading-tight">{message.text}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full mt-10 bg-blue-600 text-white py-6 rounded-[25px] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-blue-900/30">
                  {loading ? 'SYNCHRONIZING...' : <><FileText size={18}/> Submit Case</>}
                </button>
                <p className="mt-8 flex items-center justify-center gap-2 text-[8px] font-black text-white/10 uppercase tracking-[0.2em] text-center italic opacity-30"><Activity size={12} /> Registry Active</p>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
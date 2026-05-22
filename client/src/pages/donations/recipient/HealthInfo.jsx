import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertCircle, CheckCircle, Droplets, Ruler, ArrowLeft, Sun, Moon, Scale } from 'lucide-react';
import DonationService from '../../../services/DonationService';
import { useTheme } from '../../../context/ThemeContext';

const HealthInfo = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    bloodType: '', weight: '', height: '', 
    medicalConditions: '', allergies: '', notes: ''
  });

  // UPDATED: PERSISTENCE LOGIC
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await DonationService.getHealthInfo();
        // Defensive check: ensure res.data exists and has a clinical key
        if (res.success && res.data && res.data.bloodType) {
          setFormData({
            bloodType: res.data.bloodType || '',
            weight: res.data.weight?.toString() || '', 
            height: res.data.height?.toString() || '',
            medicalConditions: res.data.medicalConditions || '',
            allergies: res.data.allergies || '',
            notes: res.data.notes || ''
          });
          setHasExistingData(true);
        }
      } catch (err) {
        console.log("No profile found. Starting initialization mode.");
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = { 
        ...formData, 
        weight: parseFloat(formData.weight), 
        height: parseFloat(formData.height) 
      };
      
      const res = await DonationService.submitHealthInfo(payload);
      
      if (res.success) {
        setMessage({ type: 'success', text: 'Medical record synchronized successfully.' });
        setHasExistingData(true);
        // Refresh dashboard states in 1.5 seconds
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0b1121]">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] transition-colors duration-500 pb-20 text-left">
      <div className="max-w-4xl mx-auto py-12 px-6">
        
        <div className="mb-10 flex justify-between items-center">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-[#111C44] dark:text-white/50 hover:text-blue-600 transition-all group">
            <div className="p-2 rounded-xl bg-white dark:bg-white/5 shadow-md border border-gray-100 dark:border-white/5 group-hover:-translate-x-1 transition-transform">
                <ArrowLeft size={20} className="text-[#111C44] dark:text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#111C44] dark:text-white">Back</span>
          </button>
          <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 text-[#111C44] dark:text-yellow-400 border border-gray-200 dark:border-white/10 shadow-xl transition-all">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="mb-10 text-left">
            <h1 className="text-4xl font-black text-[#111C44] dark:text-white tracking-tighter uppercase italic">Medical Profile</h1>
            <p className="text-gray-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Prerequisite for biological matching engine</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111C44] p-10 rounded-[50px] shadow-2xl border border-gray-100 dark:border-white/5 transition-all">
          {message.text && (
            <div className={`mb-10 p-5 rounded-3xl flex items-center gap-4 border animate-in zoom-in ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {message.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
              <p className="text-xs font-black uppercase tracking-widest">{message.text}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block">Blood Group</label>
              <div className="relative">
                <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-medical-red" size={18} />
                <select required value={formData.bloodType} onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                  className="w-full pl-12 p-4 rounded-[20px] bg-gray-50 dark:bg-[#0b1121] border-none outline-none font-bold text-sm text-[#111C44] dark:text-white appearance-none cursor-pointer shadow-inner">
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block text-left">Weight (kg)</label>
              <div className="relative text-left">
                <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                <input type="number" required step="0.1" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="w-full pl-12 p-4 rounded-[20px] bg-gray-50 dark:bg-[#0b1121] border-none font-bold text-sm text-[#111C44] dark:text-white shadow-inner" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block text-left">Height (cm)</label>
              <div className="relative text-left">
                <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                <input type="number" required value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})}
                  className="w-full pl-12 p-4 rounded-[20px] bg-gray-50 dark:bg-[#0b1121] border-none font-bold text-sm text-[#111C44] dark:text-white shadow-inner" />
              </div>
            </div>
          </div>

          <div className="space-y-8 mb-12 text-left">
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block">Medical Conditions</label>
                <textarea value={formData.medicalConditions} onChange={(e) => setFormData({...formData, medicalConditions: e.target.value})}
                    className="w-full p-6 h-32 rounded-[30px] bg-gray-50 dark:bg-[#0b1121] border-none font-medium text-sm text-[#111C44] dark:text-white resize-none shadow-inner" placeholder="History..."/>
            </div>
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 block">Known Allergies</label>
                <textarea value={formData.allergies} onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    className="w-full p-6 h-24 rounded-[30px] bg-gray-50 dark:bg-[#0b1121] border-none font-medium text-sm text-[#111C44] dark:text-white resize-none shadow-inner" placeholder="Allergies..."/>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#111C44] dark:bg-medical-red text-white py-6 rounded-[25px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 disabled:opacity-50">
            {loading ? 'SYNCHRONIZING...' : <><Save size={20}/> {hasExistingData ? 'Update Medical Information' : 'Initialize Medical Profile'}</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HealthInfo;
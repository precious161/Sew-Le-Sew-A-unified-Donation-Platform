import React, { useState, useEffect } from 'react';
import { Droplets, Ruler, AlertCircle, Save, CheckCircle, Info } from 'lucide-react'; // Removed 'scale'
import DonationService from '../../../services/DonationService';

const HealthInfo = () => {
  // Removed 'isDarkMode' assignment since we use Tailwind's 'dark:' classes
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    bloodType: '',
    weight: '',
    height: '',
    medicalConditions: '',
    allergies: '',
    notes: ''
  });

  useEffect(() => {
    const loadExistingInfo = async () => {
      try {
        // Future logic to fetch existing data
      } catch { 
        // Removed 'err' since it wasn't being used
        console.log("No existing health profile found.");
      } finally {
        setFetching(false);
      }
    };
    loadExistingInfo();
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
        setMessage({ type: 'success', text: 'Medical profile synchronized successfully.' });
      }
    } catch (err) {
      const errMsg = err.response?.data?.errors?.[0]?.message || 'Failed to update profile.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="h-96 flex items-center justify-center text-gray-400 font-black uppercase text-xs tracking-widest animate-pulse">
        Loading Medical Data...
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-10 text-left text-left">
        <h1 className="text-3xl font-black text-[#111C44] dark:text-white tracking-tighter uppercase italic">Medical Profile</h1>
        <p className="text-gray-400 text-sm mt-1 font-medium italic lowercase">REQUIRED FOR BIOLOGICAL MATCHING</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1e293b] p-10 rounded-[45px] shadow-2xl border border-gray-50 dark:border-white/5 transition-all">
        
        {message.text && (
          <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 border animate-in fade-in zoom-in ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-medical-red'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
            <p className="text-[10px] font-black uppercase tracking-widest">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 text-left">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Blood Group</label>
            <div className="relative">
              <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-medical-red" size={18} />
              <select 
                required
                value={formData.bloodType}
                onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                className="w-full pl-12 p-4 rounded-2xl bg-gray-50 dark:bg-black/20 border-none outline-none font-bold text-sm dark:text-white appearance-none cursor-pointer"
              >
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Weight (kg)</label>
            <div className="relative text-left">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-[10px]">KG</span>
              <input 
                type="number" required step="0.1" placeholder="70.5"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                className="w-full pl-12 p-4 rounded-2xl bg-gray-50 dark:bg-black/20 border-none outline-none font-bold text-sm dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Height (cm)</label>
            <div className="relative text-left">
              <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="number" required placeholder="175"
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
                className="w-full pl-12 p-4 rounded-2xl bg-gray-50 dark:bg-black/20 border-none outline-none font-bold text-sm dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-10 text-left">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Medical Conditions</label>
            <textarea 
              placeholder="e.g. Hypertension, Diabetes..."
              value={formData.medicalConditions}
              onChange={(e) => setFormData({...formData, medicalConditions: e.target.value})}
              className="w-full p-5 h-32 rounded-3xl bg-gray-50 dark:bg-black/20 border-none outline-none font-medium text-sm dark:text-white resize-none"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Allergies</label>
            <textarea 
              placeholder="e.g. Penicillin, Latex..."
              value={formData.allergies}
              onChange={(e) => setFormData({...formData, allergies: e.target.value})}
              className="w-full p-5 h-24 rounded-3xl bg-gray-50 dark:bg-black/20 border-none outline-none font-medium text-sm dark:text-white resize-none"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#111C44] dark:bg-medical-red text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? 'SYNCING DATA...' : <><Save size={18}/> Update Health Record</>}
        </button>

        <p className="mt-8 flex items-center justify-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">
          <Info size={12} /> Confidential and Encrypted Coordination System
        </p>
      </form>
    </div>
  );
};

export default HealthInfo;
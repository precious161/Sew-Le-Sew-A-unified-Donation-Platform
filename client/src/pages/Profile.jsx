import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileService from '../services/ProfileService'; // 1. IMPORT SERVICE
import authBackgroundImage from "../assets/auth-bg.jpg"; 
import { Save, ArrowLeft, Sun, Moon, RefreshCw, Heart, Stethoscope, ShieldCheck, Lock, ShieldAlert, Activity } from 'lucide-react';

const Profile = () => {
  const { user, login, theme, toggleTheme } = useContext(AuthContext);
  const navigate = useNavigate();
  const isNight = theme === 'night';
  const isAdmin = user?.Role === 'Admin';
  const [isSaving, setIsSaving] = useState(false); // 2. ADD LOADING STATE

  const [formData, setFormData] = useState({
    FirstName: user?.FirstName || '',
    LastName: user?.LastName || '',
    PhoneNumber: user?.PhoneNumber || '',
    Role: user?.Role || 'Donor', 
    BloodType: user?.HealthInfo?.BloodType || '',
    Weight: user?.HealthInfo?.Weight || '',
    Height: user?.HealthInfo?.Height || '',
    Urgency: user?.HealthInfo?.Urgency || 'Low',
  });

  // --- UPDATED LOGIC FOR INTEGRATION ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      const updatePayload = {
        FirstName: formData.FirstName,
        LastName: formData.LastName,
        PhoneNumber: formData.PhoneNumber,
        Role: formData.Role,
        HealthInfo: isAdmin ? user.HealthInfo : {
          BloodType: formData.BloodType,
          Weight: formData.Weight,
          Height: formData.Height,
          Urgency: formData.Urgency
        }
      };

      // 3. CALL THE BACKEND SERVICE
      const updatedUser = await ProfileService.updateProfile(user.UserId, updatePayload);
      
      // 4. Update the Context so the rest of the app sees the changes
      login(updatedUser); 
      
      alert("Profile successfully synchronized with the database.");
      navigate('/dashboard');
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };
  // --- END OF INTEGRATION LOGIC ---

  const cardStyle = isNight ? "bg-white/5 border-white/10 backdrop-blur-md" : "bg-white/40 border-white/30 backdrop-blur-md shadow-xl";
  const inputStyle = `w-full ${isNight ? 'bg-white/5 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-slate-900'} border p-3 rounded-xl text-sm outline-none focus:border-red-500 transition-all`;

  return (
    <div className={`min-h-screen w-full relative overflow-hidden transition-colors duration-500 ${isNight ? 'bg-slate-900 text-white' : 'bg-[#F9FAFB] text-slate-900'} p-4 md:p-8`}>
      <div className="absolute inset-0 z-0">
        <img src={authBackgroundImage} alt="BG" className={`w-full h-full object-cover transition-opacity duration-700 ${isNight ? 'opacity-20' : 'opacity-[0.12]'}`} />
        <div className={`absolute inset-0 ${isNight ? 'bg-slate-900/60' : 'bg-[#F9FAFB]/40'}`}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100">
            <ArrowLeft size={16} className="text-[#E31E24]" /> Back to {isAdmin ? 'Command' : 'Dashboard'}
          </button>
          <button onClick={toggleTheme} className={`p-2 rounded-xl border transition-all ${isNight ? "bg-white/5 border-white/10 text-yellow-400" : "bg-white border-slate-200 text-slate-700 shadow-sm"}`}>
            {isNight ? <Sun size={18}/> : <Moon size={18}/>}
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <header className="flex items-center gap-4 mb-4">
            {isAdmin ? <ShieldAlert className="text-blue-500" size={40} /> : <div className="w-10 h-1 bg-red-600"></div>}
            <h1 className="text-4xl font-black tracking-tight uppercase italic">
              {isAdmin ? "Security Profile" : "User Profile"}
            </h1>
          </header>

          {!isAdmin && (
            <div className={`${cardStyle} border p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center border-l-8 border-l-[#E31E24]`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#E31E24]/10 text-[#E31E24]">
                  {formData.Role === 'Donor' ? <Heart size={28} /> : <Stethoscope size={28} />}
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">{formData.Role} Mode</h2>
              </div>
              <button type="button" onClick={() => setFormData({...formData, Role: formData.Role === 'Donor' ? 'Recipient' : 'Donor'})} className="flex items-center gap-3 px-8 py-4 bg-[#E31E24] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-xl transition-all">
                <RefreshCw size={14} /> Switch Role
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${cardStyle} border p-7 rounded-[2.5rem] space-y-4`}>
              <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">General Identity</p>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="First Name" value={formData.FirstName} onChange={e=>setFormData({...formData, FirstName:e.target.value})} className={inputStyle} />
                <input placeholder="Last Name" value={formData.LastName} onChange={e=>setFormData({...formData, LastName:e.target.value})} className={inputStyle} />
              </div>
              <input placeholder="Phone Number" value={formData.PhoneNumber} onChange={e=>setFormData({...formData, PhoneNumber:e.target.value})} className={inputStyle} />
            </div>

            {isAdmin ? (
              <div className={`${cardStyle} border p-7 rounded-[2.5rem] border-l-8 border-l-blue-600 bg-blue-500/5 space-y-4`}>
                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Administrative Credentials</p>
                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-sm font-bold"><ShieldCheck className="text-blue-500" size={20}/> Privilege: Root System Access</div>
                   <div className="flex items-center gap-3 text-sm font-bold"><Lock className="text-blue-500" size={20}/> Session: Encrypted (RSA-4096)</div>
                   <div className="flex items-center gap-3 text-sm font-bold opacity-40"><Activity size={20}/> No Health Metrics Stored</div>
                </div>
              </div>
            ) : (
              <div className={`${cardStyle} border p-7 rounded-[2.5rem] space-y-4`}>
                <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Health Metrics</p>
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="Blood" value={formData.BloodType} onChange={e=>setFormData({...formData, BloodType:e.target.value})} className={inputStyle} />
                  <input placeholder="Weight" value={formData.Weight} onChange={e=>setFormData({...formData, Weight:e.target.value})} className={inputStyle} />
                  <input placeholder="Height" value={formData.Height} onChange={e=>setFormData({...formData, Height:e.target.value})} className={inputStyle} />
                </div>
                {formData.Role === 'Recipient' && (
                   <div className="flex gap-2 mt-2">
                     {['Low', 'Medium', 'High'].map((l) => (
                       <button key={l} type="button" onClick={() => setFormData({...formData, Urgency: l})} className={`flex-1 p-2 rounded-xl text-[9px] font-black uppercase border transition-all ${formData.Urgency === l ? 'bg-red-500 border-red-500 text-white' : 'opacity-30'}`}>{l}</button>
                     ))}
                   </div>
                )}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className={`w-full ${isAdmin ? 'bg-blue-600' : 'bg-[#E31E24]'} text-white py-5 rounded-[2rem] font-black tracking-[0.2em] shadow-2xl transition-all active:scale-95 uppercase text-xs disabled:opacity-50`}
          >
            {isSaving ? (
              <RefreshCw size={18} className="inline mr-2 animate-spin" />
            ) : (
              <Save size={18} className="inline mr-2" />
            )}
            {isSaving ? "Synchronizing..." : (isAdmin ? "Update Security Credentials" : "Update Profile")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
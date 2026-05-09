import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar'; 
import ProfileService from '../services/ProfileService'; 
import { useAuth } from '../hooks/useAuth'; 
import { Save, ArrowLeft, Phone, Mail, Sun, Moon, Lock } from 'lucide-react';

const Profile = () => {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({ FirstName: '', LastName: '', PhoneNumber: '', Role: '' });

  const isAdmin = user?.Role === 'Red_Cross_Admin';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await ProfileService.getMe();
        if (res.success) {
          setFormData({
            FirstName: res.data.FirstName || '',
            LastName: res.data.LastName || '',
            PhoneNumber: res.data.PhoneNumber || '',
            Role: res.data.Role || ''
          });
        }
      } catch { 
        setMessage({ type: 'error', text: 'Synchronization failure.' }); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // FIX: Remove 'Role' from the data sent to the backend.
      // This allows Admin to update name/phone without triggering role-security errors.
      const { Role, ...updatePayload } = formData;

      const res = await ProfileService.updateMe(updatePayload);
      if (res.success) {
        setMessage({ type: 'success', text: "Profile updated successfully." });
        setIsEditing(false);
        await checkAuth(); // Refreshes global user state
      }
    } catch (err) {
      // This will catch the "You cannot promote yourself" error if Role was still present
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white font-black italic tracking-widest animate-pulse uppercase">
      Syncing Secure Data...
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-all duration-700 relative overflow-hidden ${
      isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'
    }`}>
      
      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10 flex flex-col items-center justify-center relative z-10">
        <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-500">
          <header className="mb-10 flex justify-between items-center w-full px-2">
            <button 
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} 
              className={`p-2 rounded-full transition-all ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-400 hover:bg-black/5'}`}
            >
              <ArrowLeft size={28} />
            </button>
            <div className="flex items-center gap-4">
               <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-2xl transition-all shadow-lg ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               <button onClick={() => setIsEditing(!isEditing)} className="bg-medical-red text-white py-3 px-8 rounded-2xl font-bold shadow-xl hover:bg-red-700 active:scale-95 transition-all">
                  {isEditing ? 'Cancel' : 'Edit Profile'}
               </button>
            </div>
          </header>

          <div className={`p-10 rounded-[45px] shadow-2xl border transition-all ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
            <div className="flex flex-col items-center mb-10 text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-black mb-4 shadow-xl ${isAdmin ? 'bg-slate-700' : (formData.Role === 'Donor' ? 'bg-medical-red' : 'bg-blue-600')}`}>
                    {formData.FirstName[0] || 'U'}
                </div>
                <h2 className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                    {formData.FirstName} {formData.LastName}
                </h2>
                <span className={`mt-2 text-[10px] font-black uppercase tracking-[0.3em] ${isAdmin ? 'text-medical-red' : 'text-green-500'}`}>
                    {isAdmin ? 'System Authority' : `${formData.Role} Verified`}
                </span>
            </div>

            {message.text && (
              <div className={`p-4 rounded-2xl mb-8 text-center text-[10px] font-black uppercase border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className={`text-[9px] font-black ml-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Legal First Name</label>
                        <input 
                          name="FirstName" 
                          disabled={!isEditing} 
                          value={formData.FirstName} 
                          onChange={(e) => setFormData({...formData, FirstName: e.target.value})}
                          className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-[#111C44]'}`} 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className={`text-[9px] font-black ml-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Legal Last Name</label>
                        <input 
                          name="LastName" 
                          disabled={!isEditing} 
                          value={formData.LastName} 
                          onChange={(e) => setFormData({...formData, LastName: e.target.value})}
                          className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-[#111C44]'}`} 
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={`text-[9px] font-black ml-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Verified Email Address</label>
                    <div className={`w-full p-4 rounded-2xl border flex items-center gap-3 opacity-40 cursor-not-allowed ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-[#111C44]'}`}>
                        <Lock size={14} /> 
                        <span className="text-sm font-bold">{user?.EmailAddress}</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={`text-[9px] font-black ml-2 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Verified Contact Phone</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          name="PhoneNumber" 
                          disabled={!isEditing} 
                          value={formData.PhoneNumber} 
                          onChange={(e) => setFormData({...formData, PhoneNumber: e.target.value})}
                          className={`w-full p-4 pl-12 rounded-2xl border outline-none font-bold text-sm transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-[#111C44]'}`} 
                        />
                    </div>
                </div>

                {isEditing && (
                    <button type="submit" className="w-full bg-medical-red hover:bg-red-700 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-6">
                        <Save size={18} /> Sync Account Details
                    </button>
                )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
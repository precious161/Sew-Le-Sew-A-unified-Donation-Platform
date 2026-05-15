import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import ProfileService from '../services/ProfileService';
import { useAuth } from '../hooks/useAuth';
import {
  Save, ArrowLeft, Phone, Mail, Sun, Moon, Lock,
  ShieldCheck, FileText, AlertTriangle, Droplets, UserCog, ExternalLink
} from 'lucide-react';

const Profile = () => {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    FirstName: '',
    LastName: '',
    PhoneNumber: '',
    bloodType: '',
    Role: '',
    identityStatus: '',
    identityDocumentUrl: '',
  });

  const isAdmin = user?.Role === 'Red_Cross_Admin';

  const fetchProfile = async () => {
    try {
      const res = await ProfileService.getMe();
      if (res.success) {
        setFormData({
          FirstName: res.data.FirstName || '',
          LastName: res.data.LastName || '',
          PhoneNumber: res.data.PhoneNumber || '',
          bloodType: res.data.bloodType || '',
          Role: res.data.Role || '',
          identityStatus: res.data.identityStatus || 'Unverified',
          identityDocumentUrl: res.data.identityDocumentUrl || '',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profile.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // Auto-clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { identityStatus, identityDocumentUrl, ...updatePayload } = formData;
      if (isAdmin) delete updatePayload.Role;

      const res = await ProfileService.updateMe(updatePayload);
      if (res.success) {
        setMessage({ type: 'success', text: "Profile updated successfully." });
        setIsEditing(false);
        await checkAuth();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('document', file);
    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await ProfileService.verifyIdentity(data);
      if (res.success) {
        setFormData(prev => ({
          ...prev,
          identityStatus: 'Pending',
          identityDocumentUrl: res.data.identityDocumentUrl,
        }));
        setMessage({ type: 'success', text: "Identity document uploaded successfully. Pending admin review." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || "Upload failed. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const getUploadButtonLabel = () => {
    if (uploading) return 'Processing...';
    if (formData.identityStatus === 'Verified') return 'Update Identity Document';
    if (formData.identityStatus === 'Rejected') return 'Re-upload Identity Document';
    return 'Upload National ID';
  };

  const getUploadButtonColor = () => {
    if (uploading) return 'bg-gray-400 cursor-not-allowed';
    if (formData.identityStatus === 'Verified') return 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20';
    return 'bg-medical-red hover:bg-red-700 shadow-red-900/20';
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white font-black animate-pulse uppercase tracking-widest">
      Syncing Registry...
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-all duration-700 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>
      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10 flex flex-col items-center justify-center relative z-10 text-left">
        <div className="w-full max-w-4xl animate-in fade-in zoom-in duration-500">

          {/* HEADER */}
          <header className="mb-10 flex justify-between items-center w-full px-2">
            <button
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              className={`p-2 rounded-full transition-all ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-400 hover:bg-black/5'}`}
            >
              <ArrowLeft size={28} />
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-3 rounded-2xl transition-all shadow-lg ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setMessage({ type: '', text: '' });
                }}
                className="bg-medical-red text-white py-3 px-8 rounded-2xl font-bold shadow-xl hover:bg-red-700 active:scale-95 transition-all"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* LEFT COLUMN */}
            <div className="md:col-span-1 space-y-6">

              {/* Avatar Card */}
              <div className={`p-8 rounded-[40px] shadow-2xl border text-center ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
                <div className={`w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black mb-4 shadow-xl ${isAdmin ? 'bg-slate-700' : 'bg-medical-red'}`}>
                  {formData.FirstName?.[0] || '?'}
                </div>
                <h2 className={`text-xl font-black tracking-tighter uppercase ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                  {formData.FirstName} {formData.LastName}
                </h2>
                <p className="text-[10px] font-black uppercase text-medical-red tracking-[0.2em] mt-1">
                  {formData.Role}
                </p>
              </div>

              {/* Identity Card */}
              {!isAdmin && (
                <div className={`p-8 rounded-[40px] shadow-2xl border ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 italic">
                    Registry Identity
                  </h3>

                  {/* Document Preview */}
                  {formData.identityDocumentUrl && (
                    <div className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-white/10 shadow-inner mb-4">
                      <img
                        src={formData.identityDocumentUrl}
                        alt="ID Document"
                        className="w-full h-40 object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={formData.identityDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white rounded-full text-black shadow-lg"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="flex items-center gap-3 mb-4">
                    {formData.identityStatus === 'Verified' && (
                      <div className="flex items-center gap-2 text-green-500">
                        <ShieldCheck size={20} />
                        <span className="font-black text-[10px] uppercase tracking-widest">Verified</span>
                      </div>
                    )}
                    {formData.identityStatus === 'Pending' && (
                      <div className="flex items-center gap-2 text-blue-500 animate-pulse">
                        <FileText size={20} />
                        <span className="font-black text-[10px] uppercase tracking-widest italic">Under Review</span>
                      </div>
                    )}
                    {formData.identityStatus === 'Rejected' && (
                      <div className="flex items-center gap-2 text-medical-red">
                        <AlertTriangle size={20} />
                        <span className="font-black text-[10px] uppercase tracking-widest">Rejected — Re-upload Required</span>
                      </div>
                    )}
                    {formData.identityStatus === 'Unverified' && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <AlertTriangle size={20} />
                        <span className="font-black text-[10px] uppercase tracking-widest italic">Unverified</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Button — hidden only when Pending */}
                  {formData.identityStatus !== 'Pending' && (
                    <label className={`block w-full py-4 rounded-2xl text-white text-center text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all shadow-lg ${getUploadButtonColor()}`}>
                      {getUploadButtonLabel()}
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleIdUpload}
                        disabled={uploading}
                        accept="image/*,application/pdf"
                      />
                    </label>
                  )}

                  {/* Pending Message */}
                  {formData.identityStatus === 'Pending' && (
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 text-center italic mt-2">
                      Awaiting admin review — re-upload available after decision
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className={`md:col-span-2 p-10 rounded-[45px] shadow-2xl border transition-all ${isDarkMode ? 'bg-[#1e293b] border-white/5' : 'bg-white border-gray-100'}`}>

              {/* Message Banner */}
              {message.text && (
                <div className={`p-4 rounded-2xl mb-8 text-center text-[10px] font-black uppercase border animate-in slide-in-from-top-1 ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-500'
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-6">

                {/* First + Last Name */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 ml-2 uppercase">First Name</label>
                    <input
                      name="FirstName"
                      disabled={!isEditing}
                      value={formData.FirstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, FirstName: e.target.value }))}
                      className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all ${
                        isDarkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                      } ${!isEditing ? 'opacity-60' : ''}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 ml-2 uppercase">Last Name</label>
                    <input
                      name="LastName"
                      disabled={!isEditing}
                      value={formData.LastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, LastName: e.target.value }))}
                      className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all ${
                        isDarkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                      } ${!isEditing ? 'opacity-60' : ''}`}
                    />
                  </div>
                </div>

                {/* Account Type — hidden for admin */}
                {!isAdmin && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 ml-2 uppercase tracking-widest">Account Type</label>
                    <div className="relative">
                      <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 text-medical-red" size={18} />
                      <select
                        disabled={!isEditing}
                        value={formData.Role}
                        onChange={(e) => setFormData(prev => ({ ...prev, Role: e.target.value }))}
                        className={`w-full p-4 pl-12 rounded-2xl border outline-none font-bold text-sm appearance-none cursor-pointer transition-all ${
                          isDarkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                        } ${!isEditing ? 'opacity-60' : ''}`}
                      >
                        <option value="Donor">Donor Account</option>
                        <option value="Recipient">Recipient Account</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Blood Group — hidden for admin */}
                {!isAdmin && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 ml-2 uppercase tracking-widest">Blood Group</label>
                    <div className="relative">
                      <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-medical-red" size={18} />
                      <select
                        disabled={!isEditing}
                        value={formData.bloodType}
                        onChange={(e) => setFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                        className={`w-full p-4 pl-12 rounded-2xl border outline-none font-bold text-sm appearance-none cursor-pointer transition-all ${
                          isDarkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                        } ${!isEditing ? 'opacity-60' : ''}`}
                      >
                        <option value="">Not Specified</option>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 ml-2 uppercase">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      name="PhoneNumber"
                      disabled={!isEditing}
                      value={formData.PhoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, PhoneNumber: e.target.value }))}
                      className={`w-full p-4 pl-12 rounded-2xl border outline-none font-bold text-sm transition-all ${
                        isDarkMode ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                      } ${!isEditing ? 'opacity-60' : ''}`}
                    />
                  </div>
                </div>

                {/* Email — always locked */}
                <div className="space-y-1 opacity-40">
                  <label className="text-[9px] font-black text-gray-400 ml-2 uppercase block">
                    Authenticated Email
                  </label>
                  <div className={`w-full p-4 rounded-2xl border flex items-center gap-3 ${
                    isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-200 border-gray-200'
                  }`}>
                    <Mail size={16} />
                    <span className="text-sm font-bold">{user?.EmailAddress}</span>
                    <Lock size={14} className="ml-auto" />
                  </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <button
                    type="submit"
                    className="w-full bg-medical-red hover:bg-red-700 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-6"
                  >
                    <Save size={18} /> Update Registry Profile
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
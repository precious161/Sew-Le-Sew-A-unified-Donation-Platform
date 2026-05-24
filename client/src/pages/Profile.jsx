import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import ProfileService from '../services/ProfileService';
import AuthService from '../services/AuthService';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import {
  Save, ArrowLeft, Phone, Mail, Sun, Moon, Lock,
  ShieldCheck, FileText, AlertTriangle, Droplets, UserCog, ExternalLink,
  RefreshCw, CheckCircle, XCircle, BellRing
} from 'lucide-react';

const Profile = () => {
  const { user, checkAuth } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Role change modal state
  const [roleChangeModal, setRoleChangeModal] = useState({
    isOpen: false,
    requestedRole: '',
    loading: false
  });

  const [formData, setFormData] = useState({
    FirstName: '',
    LastName: '',
    PhoneNumber: '',
    bloodType: '',
    Role: '',
    identityStatus: '',
    identityDocumentUrl: ''
  });

  const isAdmin = user?.Role === 'Red_Cross_Admin';

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchProfile = async () => {
    try {
      const res = await ProfileService.getMe();
      if (res.success && res.data) {
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
      showToast('Registry synchronization failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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
        showToast('Account profile synchronized successfully!', 'success');
        setIsEditing(false);
        await checkAuth();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
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
        showToast('Identity document uploaded for review.', 'success');
      }
    } catch {
      showToast('Upload failed. Check format (JPG/PDF).', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Handle direct role change with toast notifications
  const handleDirectRoleChange = async () => {
    setRoleChangeModal(prev => ({ ...prev, loading: true }));
    try {
      const newRole = roleChangeModal.requestedRole;
      const res = await ProfileService.changeRole(newRole, 'User requested role change from profile');

      if (res.success) {
        if (res.data.warnings && res.data.warnings.length > 0) {
          showToast(`⚠️ ${res.data.warnings.join(', ')}`, 'warning');
        }

        showToast(`✅ Role changed from ${user.Role} to ${newRole} successfully! Please log in again.`, 'success');

        // Delay logout to show toast
        setTimeout(async () => {
          await AuthService.logout();
          navigate('/login');
        }, 2000);
      } else {
        showToast(res.message || 'Role change failed', 'error');
        setRoleChangeModal(prev => ({ ...prev, isOpen: false, loading: false }));
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Role change failed";
      showToast(errorMsg, 'error');
      setRoleChangeModal(prev => ({ ...prev, loading: false, isOpen: false }));
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
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0b1121]">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-colors duration-500 relative overflow-hidden ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-full duration-300">
          <div className={`px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'warning' ? 'bg-yellow-500 text-black' :
            'bg-medical-red text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={20} className="animate-bounce" /> :
             toast.type === 'warning' ? <AlertTriangle size={20} className="animate-bounce" /> :
             <BellRing size={20} className="animate-bounce" />}
            <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
          </div>
        </div>
      )}

      <main className="flex-1 ml-72 p-10 flex flex-col items-center justify-center relative z-10 text-left">
        <div className="w-full max-w-4xl animate-in fade-in zoom-in duration-500">

          {/* HEADER */}
          <header className="mb-10 flex justify-between items-center w-full px-2">
            <button
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              className="p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-medical-red shadow-sm transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-4">
               <button
                 onClick={toggleTheme}
                 className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-lg text-[#111C44] dark:text-yellow-400"
               >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               <button
                 onClick={() => {
                   setIsEditing(!isEditing);
                   setMessage({ type: '', text: '' });
                 }}
                 className="bg-medical-red text-white py-3 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all"
               >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
               </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* COLUMN 1: IDENTITY CARD */}
            <div className="md:col-span-1 space-y-6">
              <div className={`p-8 rounded-[40px] shadow-2xl border text-center ${isDarkMode ? 'bg-[#111C44] border-white/5 shadow-black/40' : 'bg-white border-gray-100'}`}>
                <div className={`w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black mb-4 shadow-xl ${isAdmin ? 'bg-slate-700' : 'bg-medical-red'}`}>
                  {formData.FirstName?.[0] || '?'}
                </div>
                <h2 className={`text-xl font-black tracking-tighter uppercase ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                  {formData.FirstName} {formData.LastName}
                </h2>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${isAdmin ? 'text-gray-400' : 'text-medical-red'}`}>
                  {formData.Role?.replace(/_/g, ' ')}
                </p>
              </div>

              {/* Identity Status Management Panel */}
              {!isAdmin && (
                <div className={`p-8 rounded-[40px] shadow-2xl border ${isDarkMode ? 'bg-[#111C44] border-white/5 shadow-black/40' : 'bg-white border-gray-100'}`}>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 italic">
                    Identity Status
                  </h3>

                  {formData.identityDocumentUrl && (
                    <div className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-gray-100 dark:border-white/10 shadow-inner mb-4">
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
                        <span className="font-black text-[10px] uppercase tracking-widest">Rejected — Action Required</span>
                      </div>
                    )}
                    {formData.identityStatus === 'Unverified' && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <AlertTriangle size={20} />
                        <span className="font-black text-[10px] uppercase tracking-widest italic">Unverified</span>
                      </div>
                    )}
                  </div>

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

                  {formData.identityStatus === 'Pending' && (
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 text-center italic mt-2">
                      Awaiting admin review — re-upload available after decision
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* COLUMN 2: DATA FORM SECTION */}
            <div className={`md:col-span-2 p-10 rounded-[45px] shadow-2xl border transition-all ${isDarkMode ? 'bg-[#111C44] border-white/5 shadow-black/40' : 'bg-white border-gray-100'}`}>
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
                <div className="grid grid-cols-2 gap-6 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 ml-2 uppercase">First Name</label>
                    <input
                      name="FirstName"
                      disabled={!isEditing}
                      value={formData.FirstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, FirstName: e.target.value }))}
                      className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all ${
                        isDarkMode ? 'bg-[#0b1121] border-white/5 text-white' : 'bg-gray-50 border-gray-200'
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
                        isDarkMode ? 'bg-[#0b1121] border-white/5 text-white' : 'bg-gray-50 border-gray-200'
                      } ${!isEditing ? 'opacity-60' : ''}`}
                    />
                  </div>
                </div>

                {/* ACCOUNT TYPE - WITH ROLE CHANGE BUTTON */}
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black text-gray-400 ml-2 uppercase tracking-widest">Account Type</label>
                  <div className="relative">
                    <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 text-medical-red" size={18} />
                    <div className={`w-full p-4 pl-12 rounded-2xl border ${isDarkMode ? 'bg-[#0b1121] border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-gray-600'} cursor-not-allowed flex items-center justify-between`}>
                      <span>{formData.Role === 'Donor' ? 'Donor Account' : 'Recipient Account'}</span>
                      {!isAdmin && (
                        <button
                          type="button"
                          onClick={() => setRoleChangeModal({
                            isOpen: true,
                            requestedRole: formData.Role === 'Donor' ? 'Recipient' : 'Donor',
                            loading: false
                          })}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase hover:bg-blue-600 transition-all"
                        >
                          Change Role
                        </button>
                      )}
                    </div>
                  </div>
                  {!isAdmin && (
                    <p className="text-[8px] text-gray-400 ml-2 mt-1">
                      Changing role will cancel any active donation intents or requests.
                    </p>
                  )}
                </div>

                {/* Blood Type - Only for non-admins */}
                {!isAdmin && (
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black text-gray-400 ml-2 uppercase tracking-widest">Vital: Blood Group</label>
                    <div className="relative">
                      <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-medical-red" size={18} />
                      <select
                        disabled={!isEditing}
                        value={formData.bloodType}
                        onChange={(e) => setFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                        className={`w-full p-4 pl-12 rounded-2xl border outline-none font-bold text-sm appearance-none cursor-pointer ${
                          isDarkMode ? 'bg-[#0b1121] border-white/5 text-white' : 'bg-gray-50 border-gray-200'
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

                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black text-gray-400 ml-2 uppercase">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      name="PhoneNumber"
                      disabled={!isEditing}
                      value={formData.PhoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, PhoneNumber: e.target.value }))}
                      className={`w-full p-4 pl-12 rounded-2xl border outline-none font-bold text-sm transition-all ${
                        isDarkMode ? 'bg-[#0b1121] border-white/5 text-white' : 'bg-gray-50 border-gray-200'
                      } ${!isEditing ? 'opacity-60' : ''}`}
                    />
                  </div>
                </div>

                <div className="space-y-1 opacity-40 text-left">
                  <label className="text-[9px] font-black text-gray-400 ml-2 uppercase">Authenticated Email</label>
                  <div className={`w-full p-4 rounded-2xl border flex items-center gap-3 ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-200 border-gray-200'}`}>
                    <Mail size={16} />
                    <span className="text-sm font-bold">{user?.EmailAddress}</span>
                    <Lock size={14} className="ml-auto" />
                  </div>
                </div>

                {isEditing && (
                  <button
                    type="submit"
                    className="w-full bg-medical-red hover:bg-red-700 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-6"
                  >
                    <Save size={18} /> Update Registry Account
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* ROLE CHANGE CONFIRMATION MODAL */}
      {roleChangeModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-yellow-500" />
              </div>
              <h3 className="text-2xl font-black text-[#1B2559]">Change Account Role?</h3>
            </div>

            <p className="text-gray-600 text-center mb-4">
              You are about to change from <span className="font-bold">{user?.Role}</span> to
              <span className="font-bold text-medical-red"> {roleChangeModal.requestedRole}</span>
            </p>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-xs font-medium">
                ⚠️ WARNING: This will cancel any active:
              </p>
              <ul className="text-red-700 text-xs mt-2 list-disc list-inside">
                {user?.Role === 'Donor' && <li>• Donation intents (pending/active/matched)</li>}
                {user?.Role === 'Donor' && <li>• Active matches waiting for your response</li>}
                {user?.Role === 'Recipient' && <li>• Donation requests (pending/active/matching)</li>}
                {user?.Role === 'Recipient' && <li>• Active matches waiting for donor</li>}
                <li>• Eligibility status will be reset</li>
              </ul>
            </div>

            <p className="text-gray-500 text-xs text-center mb-6">
              You will need to log in again after the role change.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setRoleChangeModal({ isOpen: false, requestedRole: '', loading: false })}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleDirectRoleChange}
                disabled={roleChangeModal.loading}
                className="flex-1 py-3 rounded-xl bg-medical-red text-white font-black text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {roleChangeModal.loading ? <><RefreshCw size={14} className="animate-spin" /> Processing...</> : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
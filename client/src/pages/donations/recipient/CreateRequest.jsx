import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Send, CheckCircle, 
  AlertTriangle, Droplets, Box, Banknote, Info 
} from 'lucide-react';
import DonationService from '../../../services/DonationService';
import { useTheme } from '../../../context/ThemeContext';

const CreateRequest = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    donationType: 'Blood',
    requiredBloodType: '',
    urgencyLevel: 'Medium',
    hospitalName: '',
    attendingDoctor: '',
    itemType: '',
    itemQuantity: '',
    notes: '',
    document: null // For the file upload
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Feyruza's backend uses Multer + Cloudinary, so we MUST use FormData
    const data = new FormData();
    data.append('donationType', formData.donationType);
    data.append('urgencyLevel', formData.urgencyLevel);
    data.append('hospitalName', formData.hospitalName);
    data.append('attendingDoctor', formData.attendingDoctor);
    data.append('notes', formData.notes);
    data.append('document', formData.document); // THE FILE

    if (formData.donationType === 'Blood') {
      data.append('requiredBloodType', formData.requiredBloodType);
    } else if (formData.donationType === 'In_Kind') {
      data.append('itemType', formData.itemType);
      data.append('itemQuantity', formData.itemQuantity);
    }

    try {
      const res = await DonationService.createDonationRequest(data);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit request.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] transition-colors duration-500 pb-20 text-left">
      <div className="max-w-5xl mx-auto py-12 px-6">
        
        {/* Navigation */}
        <button onClick={() => navigate('/dashboard')} className="mb-10 flex items-center gap-2 text-[#111C44] dark:text-white/50 hover:text-medical-red transition-all group">
            <div className="p-2 rounded-xl bg-white dark:bg-white/5 shadow-md border border-gray-100 dark:border-white/5 group-hover:-translate-x-1 transition-transform">
                <ArrowLeft size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Dashboard</span>
        </button>

        <div className="mb-12">
            <h1 className="text-4xl font-black text-[#111C44] dark:text-white tracking-tighter uppercase italic">Request Support</h1>
            <p className="text-gray-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Official Medical Assistance Form</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-[#111C44] p-10 rounded-[50px] shadow-2xl border border-gray-100 dark:border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-medical-red mb-8 italic">1. Request Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 tracking-widest">Donation Type</label>
                  <select 
                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none outline-none font-bold text-sm text-[#111C44] dark:text-white appearance-none cursor-pointer"
                    value={formData.donationType}
                    onChange={(e) => setFormData({...formData, donationType: e.target.value})}
                  >
                    <option value="Blood">Blood Donation</option>
                    <option value="In_Kind">Medical Supplies</option>
                    <option value="Financial">Financial Aid</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 tracking-widest">Urgency Level</label>
                  <select 
                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none outline-none font-bold text-sm text-[#111C44] dark:text-white appearance-none cursor-pointer"
                    value={formData.urgencyLevel}
                    onChange={(e) => setFormData({...formData, urgencyLevel: e.target.value})}
                  >
                    <option value="Low">Low (Routine)</option>
                    <option value="Medium">Medium (Urgent)</option>
                    <option value="High">High (Immediate)</option>
                    <option value="Critical">Critical (Life-Saving)</option>
                  </select>
                </div>
              </div>

              {/* Conditional: Blood Type Grid */}
              {formData.donationType === 'Blood' && (
                <div className="mt-10 animate-in slide-in-from-left duration-300">
                  <label className="text-[9px] font-black uppercase text-gray-400 dark:text-white/40 ml-2 tracking-widest">Required Blood Group</label>
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                      <button 
                        key={type} type="button"
                        onClick={() => setFormData({...formData, requiredBloodType: type})}
                        className={`py-3 rounded-xl font-black text-xs transition-all border ${
                          formData.requiredBloodType === type 
                          ? 'bg-medical-red border-medical-red text-white shadow-lg shadow-red-900/40' 
                          : 'bg-gray-50 dark:bg-[#0b1121] border-transparent text-gray-400 dark:text-white/20'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditional: In-Kind Inputs */}
              {formData.donationType === 'In_Kind' && (
                <div className="mt-10 grid grid-cols-2 gap-6 animate-in slide-in-from-left">
                  <input 
                    placeholder="Item needed (e.g. Wheelchair)" 
                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none outline-none dark:text-white font-bold text-sm"
                    onChange={(e) => setFormData({...formData, itemType: e.target.value})}
                  />
                  <input 
                    type="number" placeholder="Quantity" 
                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none outline-none dark:text-white font-bold text-sm"
                    onChange={(e) => setFormData({...formData, itemQuantity: parseInt(e.target.value)})}
                  />
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#111C44] p-10 rounded-[50px] shadow-2xl border border-gray-100 dark:border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-medical-red mb-8 italic">2. Clinical Authority</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <input 
                    placeholder="Hospital Name" required
                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none outline-none dark:text-white font-bold text-sm"
                    onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                 />
                 <input 
                    placeholder="Attending Physician" required
                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#0b1121] border-none outline-none dark:text-white font-bold text-sm"
                    onChange={(e) => setFormData({...formData, attendingDoctor: e.target.value})}
                 />
              </div>
              <textarea 
                placeholder="Additional clinical notes..."
                className="w-full mt-8 p-6 h-32 rounded-3xl bg-gray-50 dark:bg-[#0b1121] border-none outline-none dark:text-white text-sm resize-none shadow-inner"
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          {/* Right Column: Upload & Submit */}
          <div className="space-y-8">
             <div className={`p-10 rounded-[50px] shadow-2xl text-white transition-all ${isDarkMode ? 'bg-medical-red/10 border border-medical-red/20' : 'bg-[#111C44]'}`}>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-medical-red mb-8">3. Verification</h3>
                <div className="p-8 border-2 border-dashed border-white/10 rounded-[35px] flex flex-col items-center text-center">
                   <Upload className="text-medical-red mb-4" size={32} />
                   <p className="text-[10px] font-black uppercase tracking-widest mb-2">Medical Proof</p>
                   <p className="text-white/30 text-[9px] mb-8 lowercase">Doctor's request or Hospital referral (PDF/JPG)</p>
                   <input 
                      type="file" required 
                      className="text-[9px] text-white/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-medical-red file:text-white file:font-black cursor-pointer"
                      onChange={(e) => setFormData({...formData, document: e.target.files[0]})}
                   />
                </div>

                {message.text && (
                  <div className={`mt-8 p-4 rounded-2xl flex items-center gap-3 border ${
                    message.type === 'success' ? 'bg-green-500/20 border-green-500/20 text-green-400' : 'bg-red-500/20 border-red-500/20 text-red-400'
                  }`}>
                    {message.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                    <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{message.text}</p>
                  </div>
                )}

                <button 
                  type="submit" disabled={loading}
                  className="w-full mt-10 bg-medical-red text-white py-6 rounded-[25px] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? 'PROCESSING...' : <><Send size={18}/> Send Request</>}
                </button>

                <p className="mt-8 flex items-center justify-center gap-2 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] text-center">
                  <Info size={12} /> HIPAA Standard Coordination
                </p>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
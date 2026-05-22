import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import DonationService from '../../services/DonationService';
import { useTheme } from '../../context/ThemeContext';
import { 
  FileText, CheckCircle, XCircle, ExternalLink, 
  ShieldCheck, ArrowLeft, X, Heart, Activity, 
  Calendar, MapPin, User, AlertCircle
} from 'lucide-react';

const IntentVerification = () => {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  
  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchQueue = async () => {
    try {
      const res = await DonationService.getPendingIntents();
      if (res.success) setIntents(res.intents || []);
    } catch (err) {
      console.error("Registry Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleProcess = async (approved) => {
    if (!approved && !rejectionReason.trim()) {
      setMessage({ type: 'error', text: 'REJECTION REASON REQUIRED' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await DonationService.verifyDonorIntent(selectedIntent.id, {
        approved,
        rejectionReason: approved ? "Medically Cleared" : rejectionReason
      });

      if (res.success) {
        setMessage({ type: 'success', text: approved ? 'DONOR VERIFIED' : 'INTENT REJECTED' });
        setTimeout(() => {
          setIntents(prev => prev.filter(i => i.id !== selectedIntent.id));
          setSelectedIntent(null);
          setRejectionReason('');
          setMessage({ type: '', text: '' });
        }, 2000);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || "UPDATE FAILED";
      setMessage({ type: 'error', text: serverMsg.toUpperCase() });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0b1121]">
       <div className="animate-pulse font-black text-white/20 uppercase tracking-[0.5em]">Syncing Clinical Registry...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1121] flex transition-all">
      <Sidebar isDarkMode={true} />
      <main className="flex-1 ml-72 p-10 flex flex-col text-left">
        <header className="mb-12 flex justify-between items-start">
          <div>
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-white/40 hover:text-medical-red transition-all group mb-4">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Back to Portal</span>
            </button>
            <h1 className="text-4xl font-black text-white tracking-tighter">Donor Intent Verification</h1>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center gap-4 shadow-2xl">
              <ShieldCheck className="text-green-500" size={24} />
              <p className="text-[10px] font-bold uppercase text-white/60 tracking-widest">Secure Audit Active</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 max-w-5xl">
          {intents.length === 0 ? (
            <div className="p-20 text-center opacity-10 border-2 border-dashed border-white/10 rounded-[45px]">
               <ShieldCheck size={48} className="mx-auto mb-4 text-white" />
               <p className="font-black uppercase tracking-widest text-xs text-white">Queue Clear</p>
            </div>
          ) : (
            intents.map((intent) => (
              <div key={intent.id} className="p-8 rounded-[45px] bg-white/5 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 group hover:bg-white/[0.08] transition-all relative overflow-hidden shadow-xl">
                <div className="flex gap-8 items-center flex-1 text-left">
                    <div className="w-16 h-16 rounded-2xl bg-[#0b1121] shadow-inner flex items-center justify-center text-blue-500 border border-white/5">
                        <Heart size={28}/>
                    </div>
                    <div>
                        <h4 className="text-white font-black text-xl tracking-tight mb-1">{intent.user?.FirstName} {intent.user?.LastName}</h4>
                        <div className="flex flex-wrap gap-4 items-center">
                            <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">{intent.category}</span>
                            <span className="text-[9px] font-black uppercase px-3 py-1 rounded-lg border bg-yellow-500/10 text-yellow-500 border-yellow-500/20 italic">Pledge Review</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setSelectedIntent(intent)} className="px-10 py-4 rounded-2xl bg-white text-[#0b1121] font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl">Review Case</button>
              </div>
            ))
          )}
        </div>

        {selectedIntent && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-[#0b1121]/95 backdrop-blur-xl animate-in fade-in duration-300 text-left">
             <div className="bg-white rounded-[55px] p-12 max-w-4xl w-full shadow-2xl relative border border-white/10 overflow-y-auto max-h-[90vh]">
                
                {message.text && (
                  <div className={`absolute top-0 left-0 w-full p-6 text-center animate-in slide-in-from-top duration-300 z-50 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-medical-red text-white'}`}>
                    <div className="flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest">
                       {message.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
                       {message.text}
                    </div>
                  </div>
                )}

                <button onClick={() => setSelectedIntent(null)} className="absolute top-10 right-10 text-gray-300 hover:text-medical-red transition-all"><X size={28}/></button>
                <h3 className="text-3xl font-black text-[#111C44] uppercase italic tracking-tighter mb-2 leading-none">Registry Adjudication</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10 border-b border-gray-100 pb-6">Authorized Verification Loop</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                    <div>
                        <p className="text-[10px] font-black text-[#1B2559] uppercase mb-4 tracking-widest italic text-left block">Clearance Documentation</p>
                        <div className="group relative block rounded-[35px] overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 h-64 shadow-inner">
                            <img src={selectedIntent.documentUrl} alt="Proof" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center bg-[#111C44]/50 transition-opacity group-hover:opacity-0">
                                <div className="flex flex-col items-center gap-2 text-white font-black uppercase text-[9px]">
                                    <ExternalLink size={24}/> Open Original
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <DetailBlock label="Donor Identity" value={`${selectedIntent.user?.FirstName} ${selectedIntent.user?.LastName}`} icon={<User size={14}/>} />
                        <DetailBlock label="Collection Center" value={selectedIntent.location} icon={<MapPin size={14}/>} />
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Category</p>
                                <p className="text-xs font-black text-blue-600 uppercase">{selectedIntent.category}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Target Date</p>
                                <p className="text-xs font-black text-[#1B2559] uppercase">{new Date(selectedIntent.plannedDate).toDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mb-10 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 italic block">Clinical Rejection Reason</label>
                    <textarea 
                        className="w-full p-6 bg-gray-50 rounded-[30px] border border-gray-100 outline-none text-sm text-[#1B2559] font-medium resize-none h-32 shadow-inner"
                        placeholder="State reason if declining this donor pledge..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <button disabled={actionLoading} onClick={() => handleProcess(false)} className="py-6 rounded-3xl bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-medical-red hover:text-white transition-all shadow-lg border border-red-100 disabled:opacity-50">Reject Intent</button>
                    <button disabled={actionLoading} onClick={() => handleProcess(true)} className="py-6 rounded-3xl bg-[#22C55E] text-white font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-3 disabled:opacity-50">
                        {actionLoading ? "Processing..." : <><CheckCircle size={20}/> Approve Donor</>}
                    </button>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

const DetailBlock = ({ label, value, icon }) => (
    <div className="text-left">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{label}</p>
        <div className="flex items-center gap-2">
            <span className="text-blue-500">{icon}</span>
            <p className="text-sm font-black text-[#1B2559] uppercase tracking-tight">{value || 'N/A'}</p>
        </div>
    </div>
);

export default IntentVerification;
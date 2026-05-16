import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import DonationService from '../../services/DonationService';
import { useTheme } from '../../context/ThemeContext';
import { 
  FileText, CheckCircle, XCircle, ExternalLink, 
  AlertTriangle, Clock, ShieldCheck, ArrowLeft, 
  X, Send, Droplets, Stethoscope, Box 
} from 'lucide-react';

const RequestVerification = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // FIXED: Removed correctedUrgency from state since it's now Read-Only
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchQueue = async () => {
    try {
      const res = await DonationService.getPendingRequests();
      if (res.success) setRequests(res.requests);
    } catch (err) {
      console.error("Registry sync failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleProcess = async (approved) => {
    if (!approved && !rejectionReason.trim()) {
      alert("Please provide a clinical reason for rejection.");
      return;
    }

    try {
      // FIXED: Only sending approval status and reason. No urgency correction.
      const res = await DonationService.verifyRequest(selectedRequest.id, {
        approved,
        rejectionReason: approved ? null : rejectionReason
      });

      if (res.success) {
        setRequests(requests.filter(r => r.id !== selectedRequest.id));
        setSelectedRequest(null);
        setRejectionReason('');
      }
    } catch (err) {
      alert("Verification update failed.");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#0b1121]">
       <div className="animate-pulse font-black text-white/20 uppercase tracking-[0.5em]">Authorizing Adjudication...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1121] flex">
      <Sidebar isDarkMode={true} />
      
      <main className="flex-1 ml-72 p-10 flex flex-col text-left">
        <header className="mb-12 flex justify-between items-start">
          <div>
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-white/40 hover:text-medical-red transition-all group mb-4">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Back to Portal</span>
            </button>
            <h1 className="text-4xl font-black text-white tracking-tighter ">Donation Request Verification</h1>
            
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center gap-4 shadow-2xl">
            <ShieldCheck className="text-green-500" size={24} />
            <p className="text-[10px] font-bold uppercase text-white/60 tracking-widest">Secure Audit Active</p>
          </div>
        </header>

        {/* REQUESTS LIST */}
        <div className="grid grid-cols-1 gap-6 max-w-5xl">
          {requests.map((req) => (
            <div key={req.id} className="p-8 rounded-[45px] bg-white/5 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 group hover:bg-white/[0.08] transition-all relative overflow-hidden shadow-xl">
              <div className="flex gap-8 items-center flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-[#0b1121] shadow-inner flex items-center justify-center text-blue-500 border border-white/5">
                      {req.donationType === 'Blood' ? <Droplets size={28}/> : req.donationType === 'Organ' ? <Stethoscope size={28}/> : <Box size={28}/>}
                  </div>
                  <div>
                      <h4 className="text-white font-black text-xl tracking-tight  mb-1">{req.user?.FirstName} {req.user?.LastName}</h4>
                      <div className="flex flex-wrap gap-4 items-center">
                          <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">{req.donationType}</span>
                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${req.urgencyLevel === 'Critical' ? 'bg-red-500 text-white border-red-500/50 animate-pulse' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{req.urgencyLevel} Urgency</span>
                      </div>
                  </div>
              </div>
              <button onClick={() => setSelectedRequest(req)} className="px-10 py-4 rounded-2xl bg-white text-[#0b1121] font-black text-xs uppercase tracking-widest hover:bg-medical-red hover:text-white transition-all shadow-xl">Review Case</button>
              <FileText size={120} className="absolute -right-4 -bottom-4 opacity-[0.03] -rotate-12" />
            </div>
          ))}
        </div>

        {/* DECISION MODAL */}
        {selectedRequest && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-[#0b1121]/95 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="bg-white rounded-[55px] p-12 max-w-2xl w-full shadow-2xl relative border border-white/10 text-left overflow-y-auto max-h-[90vh]">
                <button onClick={() => setSelectedRequest(null)} className="absolute top-10 right-10 text-gray-300 hover:text-medical-red transition-all"><X size={28}/></button>
                
                <h3 className="text-3xl font-black text-[#111C44] uppercase italic tracking-tighter mb-2 leading-none">Registry Adjudication</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10 border-b border-gray-100 pb-6">Authorized Verification Loop</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                    {/* Document View */}
                    <div>
                        <p className="text-[10px] font-black text-[#1B2559] uppercase mb-4 tracking-widest">Medical Documentation</p>
                        <a href={selectedRequest.documentUrl} target="_blank" rel="noreferrer" className="group relative block rounded-[35px] overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 h-52 shadow-inner">
                            <img src={selectedRequest.documentUrl} alt="Proof" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center bg-[#111C44]/50 transition-opacity group-hover:opacity-0">
                                <div className="flex flex-col items-center gap-2 text-white">
                                    <ExternalLink size={24}/>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Open Original</span>
                                </div>
                            </div>
                        </a>
                    </div>

                    {/* READ-ONLY METADATA SECTION */}
                    <div className="space-y-8">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Hospital Authority</p>
                            <p className="text-sm font-black text-[#1B2559] uppercase tracking-tight">{selectedRequest.hospitalName || 'UNSPECIFIED'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Attending Physician</p>
                            <p className="text-sm font-black text-[#1B2559] uppercase tracking-tight">DR. {selectedRequest.attendingDoctor || 'UNSPECIFIED'}</p>
                        </div>
                        {/* FIXED: URGENCY IS NOW READ-ONLY WITH BADGE STYLE */}
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Urgency Assessment</p>
                            <div className={`w-fit px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm border ${
                                selectedRequest.urgencyLevel === 'Critical' ? 'bg-red-500 text-white border-red-400' : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                                {selectedRequest.urgencyLevel}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rejection Field */}
                <div className="space-y-3 mb-10 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Clinical Rejection Reason</label>
                    <textarea 
                        className="w-full p-6 bg-gray-50 rounded-[30px] border border-gray-100 outline-none text-sm text-[#1B2559] font-medium resize-none h-32 shadow-inner"
                        placeholder="State reason if declining this case..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <button onClick={() => handleProcess(false)} className="py-5 rounded-3xl bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg border border-red-100">Reject Request</button>
                    <button onClick={() => handleProcess(true)} className="py-5 rounded-3xl bg-green-500 text-white font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-3">
                        <CheckCircle size={20}/> Approve Case
                    </button>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RequestVerification;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, CheckCircle2, Activity, 
  AlertTriangle, MapPin, Calendar, Trash2, 
  Search, ExternalLink, Info, Filter 
} from 'lucide-react';
import DonationService from '../../../services/DonationService';
import { useTheme } from '../../../context/ThemeContext';

const MyRequests = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, Pending, Matching, Fulfilled

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await DonationService.getMyRequests();
        if (res.success) setRequests(res.data);
      } catch (err) {
        console.error("Dashboard sync: No active requests found.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleCancelRequest = async (id) => {
    if (!window.confirm("Are you sure you want to withdraw this support request?")) return;
    try {
      const res = await DonationService.cancelRequest(id);
      if (res.success) {
        // Update local state without re-fetching
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'Cancelled' } : r));
      }
    } catch (err) {
      alert("Cancellation failed. Request may already be in matching.");
    }
  };

  const filteredData = requests.filter(r => {
    if (filter === 'ALL') return r.status !== 'Cancelled';
    return r.status === filter;
  });

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0b1121]">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1121] transition-colors duration-500 pb-20 text-left">
      <div className="max-w-5xl mx-auto py-12 px-6">
        
        {/* NAV & HEADER */}
        <div className="mb-10 flex justify-between items-center">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-[#111C44] dark:text-white/50 hover:text-blue-600 transition-all group">
            <div className="p-2 rounded-xl bg-white dark:bg-white/5 shadow-md border border-gray-100 dark:border-white/5 group-hover:-translate-x-1 transition-transform">
                <ArrowLeft size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
          </button>
          
          <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
             <FilterBtn active={filter === 'ALL'} label="Active" onClick={() => setFilter('ALL')} />
             <FilterBtn active={filter === 'Matching'} label="Matching" onClick={() => setFilter('Matching')} />
             <FilterBtn active={filter === 'Fulfilled'} label="History" onClick={() => setFilter('Fulfilled')} />
          </div>
        </div>

        <div className="mb-12">
            <h1 className="text-4xl font-black text-[#111C44] dark:text-white tracking-tighter uppercase italic leading-none">Support Tracking</h1>
            <p className="text-gray-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 italic">Live Case Monitoring Registry</p>
        </div>

        {/* REQUESTS LIST */}
        {filteredData.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-[#111C44] rounded-[50px] shadow-xl border border-gray-100 dark:border-white/5">
             <Search className="mx-auto text-gray-200 dark:text-white/10 mb-6" size={64} />
             <h3 className="text-xl font-black text-[#1B2559] dark:text-white uppercase italic">No Requests Found</h3>
             <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">You currently have no cases in this category.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredData.map((req) => (
              <RequestCard 
                key={req.id} 
                req={req} 
                onCancel={() => handleCancelRequest(req.id)}
                dark={isDarkMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: REQUEST CARD ---
const RequestCard = ({ req, onCancel, dark }) => {
  const isCancellable = ['PendingVerification', 'Pending'].includes(req.status);

  return (
    <div className={`p-8 rounded-[45px] border transition-all shadow-xl ${
        dark ? 'bg-[#111C44] border-white/5 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'
    }`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
        <div className="flex gap-6 items-center">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${
                req.donationType === 'Blood' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
            }`}>
                {req.donationType === 'Blood' ? <Droplets size={28}/> : <Box size={28}/>}
            </div>
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h3 className={`text-xl font-black tracking-tight ${dark ? 'text-white' : 'text-[#1B2559]'}`}>
                        {req.donationType === 'Blood' ? `${req.requiredBloodType} Blood` : req.itemType || 'General Support'}
                    </h3>
                    <StatusBadge status={req.status} />
                </div>
                <div className="flex gap-4 mt-2">
                    <p className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest"><MapPin size={12}/> {req.hospitalName}</p>
                    <p className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest"><Calendar size={12}/> {new Date(req.requestDate).toLocaleDateString()}</p>
                </div>
            </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
            {isCancellable && (
                <button onClick={onCancel} className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                    Withdraw
                </button>
            )}
            <a href={req.documentUrl} target="_blank" rel="noreferrer" className={`flex-1 md:flex-none px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest border transition-all ${
                dark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-gray-400'
            }`}>
                Doc Proof <ExternalLink size={12}/>
            </a>
        </div>
      </div>

      {/* TRACKING TIMELINE */}
      <div className="relative pt-4 pb-2 px-4">
          <div className="absolute top-[8px] left-8 right-8 h-[2px] bg-gray-100 dark:bg-white/5"></div>
          <div className="relative flex justify-between">
              <TimelineDot active label="Submitted" />
              <TimelineDot active={['Pending', 'Matching', 'Fulfilled'].includes(req.status)} label="Verified" />
              <TimelineDot active={['Matching', 'Fulfilled'].includes(req.status)} label="Matching" />
              <TimelineDot active={req.status === 'Fulfilled'} label="Completed" />
          </div>
      </div>

      {/* REJECTION FEEDBACK */}
      {req.rejectionReason && (
          <div className="mt-8 p-5 rounded-3xl bg-red-500/5 border border-red-500/10 flex gap-4 animate-in shake">
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
              <div>
                  <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">Red Cross Decision Note</p>
                  <p className="text-xs text-gray-500 dark:text-red-200/60 font-medium italic">"{req.rejectionReason}"</p>
              </div>
          </div>
      )}
    </div>
  );
};

// --- SMALL UI HELPERS ---

const FilterBtn = ({ active, label, onClick }) => (
    <button onClick={onClick} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:text-[#1B2559]'
    }`}>
        {label}
    </button>
);

const TimelineDot = ({ active, label }) => (
    <div className="flex flex-col items-center flex-1">
        <div className={`w-3 h-3 rounded-full border-2 transition-all duration-700 ${
            active ? 'bg-blue-600 border-blue-600/30 scale-125 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-gray-100 dark:bg-white/5 border-transparent'
        }`}></div>
        <span className={`text-[8px] font-black uppercase tracking-tighter mt-4 ${active ? 'text-blue-600' : 'text-gray-300'}`}>{label}</span>
    </div>
);

const StatusBadge = ({ status }) => {
    const colors = {
        PendingVerification: 'bg-amber-500',
        Pending: 'bg-blue-500',
        Matching: 'bg-purple-500 animate-pulse',
        Fulfilled: 'bg-green-500',
        Cancelled: 'bg-gray-400'
    };
    return (
        <span className={`px-3 py-1 rounded-lg text-white text-[8px] font-black uppercase tracking-widest shadow-md ${colors[status]}`}>
            {status?.replace(/([A-Z])/g, ' $1').trim()}
        </span>
    );
};

export default MyRequests;
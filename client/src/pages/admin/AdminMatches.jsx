import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import MatchingService from '../../services/MatchingService';
import { useTheme } from '../../context/ThemeContext';
import { 
  Zap, ArrowLeft, ShieldCheck, Heart, Droplets, 
  Box, User, ArrowRight, CheckCircle, RefreshCw,
  Clock, XCircle, MoreHorizontal, AlertCircle
} from 'lucide-react';

const AdminMatches = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const [category, setCategory] = useState('blood'); 
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [engineRunning, setEngineRunning] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MatchingService.getMatches(category);
      if (res.success) {
        // Feyruza's service returns 'matches' array
        setMatches(res.matches || res.data || []);
      }
    } catch (err) {
      console.error("Registry load failed:", err.message);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunEngine = async () => {
    setEngineRunning(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await MatchingService.runMatchingEngine(category);
      if (res.success) {
        setMessage({ type: 'success', text: `ALGORITHM SUCCESS: ${res.message}` });
        loadData(); 
      }
    } catch (err) {
      console.error("Engine crash:", err.message);
      setMessage({ type: 'error', text: 'ENGINE ERROR: CHECK SYSTEM LOGS' });
    } finally {
      setEngineRunning(false);
    }
  };

  const handleComplete = async (matchId) => {
    try {
      const res = await MatchingService.completeDonation(category, matchId);
      if (res.success) {
        setMessage({ type: 'success', text: 'DONATION LOGGED • HISTORY CREATED' });
        loadData();
      }
    } catch (err) {
      console.error("Completion error:", err.message);
      setMessage({ type: 'error', text: 'UPDATE FAILED' });
    }
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />
      <main className="flex-1 ml-72 p-10 flex flex-col text-left relative">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-white/40 hover:text-medical-red mb-4 group transition-all">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Back to Portal</span>
            </button>
            <h1 className="text-4xl font-black text-[#111C44] dark:text-white uppercase italic tracking-tighter">Matching Control</h1>
          </div>
          <div className="flex gap-4">
            <button onClick={loadData} className="p-4 bg-white/5 rounded-2xl text-blue-500 hover:text-white transition-all">
               <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
                disabled={engineRunning}
                onClick={handleRunEngine}
                className="px-10 py-5 rounded-[22px] bg-blue-600 text-white font-black text-[11px] uppercase shadow-2xl"
            >
                <Zap size={18} className={engineRunning ? 'animate-pulse' : ''} />
                {engineRunning ? 'Processing...' : 'Execute Matching'}
            </button>
          </div>
        </header>

        <div className="flex gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
            <Tab active={category === 'blood'} label="Blood" icon={<Droplets size={14}/>} onClick={() => setCategory('blood')} />
            <Tab active={category === 'organ'} label="Organ" icon={<Heart size={14}/>} onClick={() => setCategory('organ')} />
            <Tab active={category === 'inkind'} label="Supplies" icon={<Box size={14}/>} onClick={() => setCategory('inkind')} />
        </div>

        {message.text && (
          <div className={`mb-10 p-6 rounded-[35px] border flex items-center gap-4 animate-in slide-in-from-top-4 ${
            message.type === 'success' ? 'bg-green-500 text-white shadow-xl' : 'bg-medical-red text-white'
          }`}>
            <CheckCircle size={20}/>
            <p className="text-[11px] font-black uppercase tracking-widest">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 max-w-6xl">
          {loading ? (
             <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase text-[10px] tracking-[0.5em]">Scanning Registry...</div>
          ) : matches.length === 0 ? (
            <div className="p-20 text-center rounded-[55px] border-2 border-dashed border-gray-200 dark:border-white/5 opacity-20">
              <MoreHorizontal size={60} className="mx-auto mb-4 text-gray-400"/>
              <p className="font-black uppercase tracking-widest text-xs text-white">No active pairs found</p>
            </div>
          ) : (
            matches.map(match => {
              const currentStatus = match.status?.toLowerCase() || 'pending';
              const styles = getStatusStyles(currentStatus);
              return (
                <div key={match.id} className="p-10 bg-[#111C44] rounded-[55px] shadow-2xl border border-white/5 flex items-center justify-between text-left">
                  <div className="flex-1 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400"><User size={24}/></div>
                    <div className="text-left">
                      <p className="text-[8px] font-black text-blue-400 uppercase mb-1">Recipient</p>
                      <h3 className="text-xl font-black text-white uppercase italic">{match.request?.user?.FirstName}</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{match.request?.urgencyLevel} Priority</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                     <div className={`p-3 rounded-full border-2 ${styles.border} ${styles.bg}`}>{styles.icon}</div>
                     <span className={`text-[8px] font-black uppercase ${styles.text}`}>{match.status}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-end gap-6 text-right">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-green-400 uppercase mb-1">Donor</p>
                      <h3 className="text-xl font-black text-white uppercase italic">{match.intent?.user?.FirstName}</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{match.intent?.location || 'Center Registry'}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400"><ShieldCheck size={24}/></div>
                  </div>
                  <div className="pl-8 border-l border-white/5 min-w-[180px]">
                    {currentStatus === 'accepted' ? (
                       <button onClick={() => handleComplete(match.id)} className="w-full py-4 bg-green-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl">Confirm Completion</button>
                    ) : currentStatus === 'completed' ? (
                       <div className="flex flex-col items-center text-green-500/40"><CheckCircle size={20} /><span className="text-[8px] font-black uppercase mt-1">Registry Logged</span></div>
                    ) : (
                       <div className="text-[9px] font-black text-gray-600 uppercase text-center italic tracking-widest">{currentStatus === 'pending' ? 'Awaiting Handshake' : 'Closed'}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

const Tab = ({ active, label, icon, onClick }) => (
    <button onClick={onClick} className={`px-10 py-4 rounded-[22px] flex items-center gap-3 font-black text-[10px] uppercase border transition-all ${
        active ? 'bg-medical-red text-white border-medical-red shadow-lg shadow-red-900/40' : 'bg-white dark:bg-[#111C44] text-gray-400 border-gray-100 dark:border-white/5'
    }`}>{icon} {label}</button>
);

const getStatusStyles = (status) => {
    const s = status?.toLowerCase();
    if (s === 'accepted') return { border: 'border-green-500/50', bg: 'bg-green-500/10', text: 'text-green-500', icon: <CheckCircle size={18}/> };
    if (s === 'declined' || s === 'cancelled') return { border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-500', icon: <XCircle size={18}/> };
    if (s === 'completed') return { border: 'border-blue-400/30', bg: 'bg-blue-400/5', text: 'text-blue-400', icon: <ShieldCheck size={18}/> };
    return { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-500', icon: <Clock size={18}/> };
};

export default AdminMatches;
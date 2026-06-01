import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import MatchingService from '../../services/MatchingService';
import { useTheme } from '../../context/ThemeContext';
import NotificationHub from '../../components/notifications/NotificationHub';
import {
  Zap, ArrowLeft, ShieldCheck, Heart, Droplets,
  Box, User, ArrowRight, CheckCircle, RefreshCw,
  Clock, XCircle, MoreHorizontal, AlertCircle, Menu, Sun, Moon
} from 'lucide-react';

const AdminMatches = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [category, setCategory] = useState('blood');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [engineRunning, setEngineRunning] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MatchingService.getMatches(category);
      if (res.success) {
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
    <div className={`flex min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isDarkMode={isDarkMode} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <Sidebar isDarkMode={isDarkMode} isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 md:ml-72 w-full">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#0b1121] border-b border-gray-100 dark:border-white/5 sticky top-0 z-50">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="bg-medical-red p-2.5 rounded-xl shadow-lg"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <NotificationHub isDarkMode={isDarkMode} />
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-10">
          {/* Mobile Title */}
          <div className="md:hidden mb-4">
            <h1 className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              Matching Control
            </h1>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-end mb-8">
            <div>
              <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-400 hover:text-medical-red mb-4 group transition-all">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Portal</span>
              </button>
              <h1 className="text-3xl md:text-4xl font-black text-[#111C44] dark:text-white uppercase italic tracking-tighter">Matching Control</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationHub isDarkMode={isDarkMode} />
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-2xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="md:hidden flex gap-3 mb-6">
            <button onClick={loadData} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-medical-red hover:text-white transition-all text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2">
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              disabled={engineRunning}
              onClick={handleRunEngine}
              className="flex-1 py-2.5 rounded-xl bg-medical-red text-white font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap size={14} /> {engineRunning ? 'Running...' : 'Match'}
            </button>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex gap-4 mb-8">
            <button onClick={loadData} className="p-4 bg-white/5 rounded-2xl text-blue-500 hover:text-white transition-all">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              disabled={engineRunning}
              onClick={handleRunEngine}
              className="px-10 py-4 rounded-[22px] bg-blue-600 text-white font-black text-[11px] uppercase shadow-2xl flex items-center gap-2 disabled:opacity-50"
            >
              <Zap size={18} className={engineRunning ? 'animate-pulse' : ''} />
              {engineRunning ? 'Processing...' : 'Execute Matching'}
            </button>
          </div>

          {/* Category Tabs - Responsive */}
          <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-10 overflow-x-auto pb-2">
            <Tab active={category === 'blood'} label="Blood" icon={<Droplets size={14}/>} onClick={() => setCategory('blood')} isDarkMode={isDarkMode} />
            <Tab active={category === 'organ'} label="Organ" icon={<Heart size={14}/>} onClick={() => setCategory('organ')} isDarkMode={isDarkMode} />
            <Tab active={category === 'inkind'} label="Supplies" icon={<Box size={14}/>} onClick={() => setCategory('inkind')} isDarkMode={isDarkMode} />
          </div>

          {/* Message Banner */}
          {message.text && (
            <div className={`mb-6 md:mb-10 p-4 md:p-6 rounded-[25px] md:rounded-[35px] border flex items-center gap-3 md:gap-4 animate-in slide-in-from-top-4 ${
              message.type === 'success' ? 'bg-green-500 text-white shadow-xl' : 'bg-medical-red text-white'
            }`}>
              <CheckCircle size={18} className="md:size-[20px]"/>
              <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{message.text}</p>
            </div>
          )}

          {/* Matches Grid */}
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {loading ? (
              <div className="p-12 md:p-20 text-center animate-pulse text-gray-400 font-black uppercase text-[9px] md:text-[10px] tracking-[0.5em]">Scanning Registry...</div>
            ) : matches.length === 0 ? (
              <div className="p-12 md:p-20 text-center rounded-[35px] md:rounded-[55px] border-2 border-dashed border-gray-200 dark:border-white/5 opacity-20">
                <MoreHorizontal size={40} className="md:size-[60px] mx-auto mb-4 text-gray-400"/>
                <p className="font-black uppercase tracking-widest text-[10px] md:text-xs text-white">No active pairs found</p>
              </div>
            ) : (
              matches.map(match => {
                const currentStatus = match.status?.toLowerCase() || 'pending';
                const styles = getStatusStyles(currentStatus);
                return (
                  <div key={match.id} className="p-5 md:p-8 lg:p-10 bg-[#111C44] rounded-[35px] md:rounded-[45px] lg:rounded-[55px] shadow-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                    {/* Recipient Side */}
                    <div className="flex-1 flex items-center gap-3 md:gap-6 w-full md:w-auto">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                        <User size={20} className="md:size-[24px]"/>
                      </div>
                      <div className="text-left">
                        <p className="text-[7px] md:text-[8px] font-black text-blue-400 uppercase mb-1">Recipient</p>
                        <h3 className="text-sm md:text-xl font-black text-white uppercase italic">{match.request?.user?.FirstName}</h3>
                        <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase">{match.request?.urgencyLevel} Priority</p>
                      </div>
                    </div>

                    {/* Center Icon */}
                    <div className="flex flex-col items-center gap-1 md:gap-2">
                      <div className={`p-2 md:p-3 rounded-full border-2 ${styles.border} ${styles.bg}`}>{styles.icon}</div>
                      <span className={`text-[7px] md:text-[8px] font-black uppercase ${styles.text}`}>{match.status}</span>
                    </div>

                    {/* Donor Side */}
                    <div className="flex-1 flex items-center justify-end gap-3 md:gap-6 w-full md:w-auto">
                      <div className="text-right">
                        <p className="text-[7px] md:text-[8px] font-black text-green-400 uppercase mb-1">Donor</p>
                        <h3 className="text-sm md:text-xl font-black text-white uppercase italic">{match.intent?.user?.FirstName}</h3>
                        <p className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase">{match.intent?.location || 'Center Registry'}</p>
                      </div>
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                        <ShieldCheck size={20} className="md:size-[24px]"/>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="w-full md:w-auto pl-0 md:pl-8 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0">
                      {currentStatus === 'accepted' ? (
                        <button onClick={() => handleComplete(match.id)} className="w-full md:w-auto px-4 md:px-6 py-2.5 md:py-4 bg-green-500 text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl hover:bg-green-600 transition-all">
                          Confirm Completion
                        </button>
                      ) : currentStatus === 'completed' ? (
                        <div className="flex flex-col items-center text-green-500/40">
                          <CheckCircle size={16} className="md:size-[20px]" />
                          <span className="text-[7px] md:text-[8px] font-black uppercase mt-1">Registry Logged</span>
                        </div>
                      ) : (
                        <div className="text-[8px] md:text-[9px] font-black text-gray-600 uppercase text-center italic tracking-widest">
                          {currentStatus === 'pending' ? 'Awaiting Handshake' : 'Closed'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const Tab = ({ active, label, icon, onClick, isDarkMode }) => (
  <button onClick={onClick} className={`px-4 md:px-8 py-2.5 md:py-4 rounded-[18px] md:rounded-[22px] flex items-center gap-2 md:gap-3 font-black text-[9px] md:text-[10px] uppercase border transition-all shrink-0 ${
    active
      ? 'bg-medical-red text-white border-medical-red shadow-lg shadow-red-900/40'
      : isDarkMode
        ? 'bg-white/5 text-gray-400 border-white/5'
        : 'bg-white text-gray-600 border-gray-200'
  }`}>
    {icon} {label}
  </button>
);

const getStatusStyles = (status) => {
  const s = status?.toLowerCase();
  if (s === 'accepted') return { border: 'border-green-500/50', bg: 'bg-green-500/10', text: 'text-green-500', icon: <CheckCircle size={16} className="md:size-[18px]"/> };
  if (s === 'declined' || s === 'cancelled') return { border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-500', icon: <XCircle size={16} className="md:size-[18px]"/> };
  if (s === 'completed') return { border: 'border-blue-400/30', bg: 'bg-blue-400/5', text: 'text-blue-400', icon: <ShieldCheck size={16} className="md:size-[18px]"/> };
  return { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-500', icon: <Clock size={16} className="md:size-[18px]"/> };
};

export default AdminMatches;
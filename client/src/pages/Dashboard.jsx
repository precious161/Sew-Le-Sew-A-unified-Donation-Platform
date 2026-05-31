import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/layout/Sidebar';
import NotificationHub from '../components/notifications/NotificationHub';
import MatchAlertCard from '../components/matching/MatchAlertCard';
import DonationService from '../services/DonationService';
import ProfileService from '../services/ProfileService';
import EventService from '../services/EventService';
import MatchingService from '../services/MatchingService';
import api from '../api/axios';
import ChatBot from '../components/ai/ChatBot';
import {
  Sun, Moon, ShieldCheck, Activity, Plus, Heart, Lock,
  CheckCircle, Clock, Search, HeartPulse, ArrowRight,
  MapPin, Users, Calendar, RefreshCw, Menu
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [status, setStatus] = useState({
    identity: 'Unverified',
    hasHealthData: false,
    passedQuiz: false,
    hasActivePledge: false
  });
  const [activeRequests, setActiveRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);

  const syncRegistryData = useCallback(async () => {
    try {
      const isRecipient = user?.Role === 'Recipient';
      const isDonor = user?.Role === 'Donor';

      const [pRes, hRes, reqRes, quizRes, eventsRes, matchRes, intentRes] = await Promise.all([
        ProfileService.getMe(),
        DonationService.getHealthInfo().catch(() => ({ success: false })),
        isRecipient ? DonationService.getMyRequests().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: [] }),
        isDonor ? DonationService.getEligibilityHistory().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: [] }),
        isDonor ? EventService.getPublicEvents().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: [] }),
        MatchingService.getMyActiveMatch().catch(() => ({ success: false, hasActiveMatch: false })),
        isDonor ? api.get('/donations/donor/my-intents').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      const identityStatus = pRes.data?.identityStatus || 'Unverified';
      const hasPassed = quizRes.data?.some(log => log.isEligible === true || log.status?.toLowerCase() === 'eligible');
      const intents = intentRes.data?.data || intentRes.data || [];
      const hasActive = intents.some(i => ['Active', 'Matched', 'PendingVerification'].includes(i.status));

      setStatus({
        identity: identityStatus,
        hasHealthData: hRes.success === true && hRes.data && hRes.data.bloodType,
        passedQuiz: hasPassed,
        hasActivePledge: hasActive
      });

      if (reqRes.success) setActiveRequests(reqRes.data || []);
      if (eventsRes.success) setEvents(eventsRes.data || []);

      if (matchRes.success && matchRes.hasActiveMatch) {
        setActiveMatch(matchRes.data);
      } else {
        setActiveMatch(null);
      }

    } catch (err) {
      console.error("Dashboard Sync Failed", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.Role === 'Red_Cross_Admin') {
      navigate('/admin', { replace: true });
    } else if (user) {
      syncRegistryData();
    }
  }, [user, navigate, syncRegistryData]);

  // Close sidebar when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRSVP = async (eventId) => {
    if (!user || user.Role !== 'Donor') return;
    try {
      await EventService.rsvpToEvent(eventId);
      syncRegistryData();
    } catch (error) {
      console.error("Failed to RSVP", error);
    }
  };

  const handleMatchResponse = async (matchId, accepted) => {
    if (!activeMatch) return;
    setActionLoading(true);
    try {
      const category = activeMatch.donationType;
      const res = await MatchingService.respondToMatch(category, matchId, accepted);

      if (res.success) {
        await syncRegistryData();
      }
    } catch (error) {
      console.error("Match Handshake Failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.Role === 'Red_Cross_Admin') return null;

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0b1121]">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
    </div>
  );

  const isVerified = status.identity.toLowerCase() === 'verified';
  const isPending = status.identity.toLowerCase() === 'pending';
  const isRecipient = user.Role === 'Recipient';
  const isDonor = user.Role === 'Donor';
  const canProceed = isVerified && (isRecipient ? status.hasHealthData : status.passedQuiz);

  const getProgressStep = (reqStatus) => {
    const map = { 'PendingVerification': 1, 'Pending': 2, 'Matching': 3, 'Fulfilled': 4 };
    return map[reqStatus] || 1;
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      {/* Desktop Sidebar */}
      <Sidebar isDarkMode={isDarkMode} />

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
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full animate-pulse ${canProceed ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-600'}`}></div>
              <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
                {isRecipient ? 'Recipient Coordination Node' : 'Donor Portal • Registry Node'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={syncRegistryData} className="p-2 text-gray-400 hover:text-white transition-colors"><RefreshCw size={16}/></button>
              <NotificationHub isDarkMode={isDarkMode} />
              <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-lg hover:scale-110 transition-all">
                {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-[#111C44]" />}
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-6xl w-full mx-auto animate-in fade-in duration-1000 pb-10 text-left">
            {/* Welcome Card */}
            <div className={`rounded-[30px] md:rounded-[60px] p-8 md:p-16 shadow-2xl text-white relative overflow-hidden transition-all duration-700 border ${
              canProceed ? 'bg-[#111C44]/40 backdrop-blur-2xl border-blue-500/20 shadow-blue-900/20' : 'bg-[#111C44] border-transparent'
            }`}>
              <div className="relative z-10 text-left">
                <h2 className="text-3xl md:text-7xl font-black italic tracking-tighter leading-none">Welcome, <br /> {user?.FirstName}!</h2>
                <div className="flex gap-2 md:gap-4 mt-6 md:mt-8 flex-wrap">
                  <StatusBadge active={isVerified} variant={isPending ? 'warning' : 'danger'} label={isVerified ? "ID Verified" : isPending ? "ID Under Review" : "Identity Missing"} />
                  {isRecipient && <StatusBadge active={status.hasHealthData} label={status.hasHealthData ? "Medical Profile Synced" : "Medical Missing"} />}
                  {isDonor && <StatusBadge active={status.passedQuiz} label={status.passedQuiz ? "Quiz Passed" : "Quiz Pending"} />}
                </div>
              </div>
              <ShieldCheck size={180} className="md:size-[280px] absolute -right-10 md:-right-20 -bottom-10 md:-bottom-20 transition-opacity duration-700 opacity-5" />
            </div>

            {/* MATCH ALERT CARD */}
            {isDonor && activeMatch && activeMatch.status === 'Pending' && (
              <MatchAlertCard
                match={activeMatch}
                onAccept={() => handleMatchResponse(activeMatch.matchId, true)}
                onDecline={() => handleMatchResponse(activeMatch.matchId, false)}
                loading={actionLoading}
              />
            )}

            {/* RECIPIENT: Live Request Tracking */}
            {isRecipient && activeRequests.length > 0 && (
              <div className="mb-12 space-y-6 mt-12 text-left">
                <h3 className="text-lg md:text-xl font-black tracking-tighter uppercase italic text-[#111C44] dark:text-white mb-4">Live Request Tracking</h3>
                {activeRequests.map((req, idx) => {
                  const step = getProgressStep(req.status);
                  return (
                    <div key={idx} className={`p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-xl border ${isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100 text-[#111C44]'}`}>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-6 md:mb-8 text-left">
                        <div>
                          <h4 className="font-black text-base md:text-lg uppercase italic text-left">Case #{req.id.substring(0,8)}</h4>
                          <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-left">{req.donationType} Request • {req.hospitalName || 'General Registry'}</p>
                        </div>
                        <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest w-fit ${req.urgencyLevel === 'Critical' ? 'bg-medical-red/10 text-medical-red' : 'bg-blue-500/10 text-blue-500'}`}>
                          {req.urgencyLevel} Urgency
                        </div>
                      </div>
                      <div className="relative flex justify-between items-center mt-8 md:mt-12 mb-4 px-2 md:px-4">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-white/10 -z-10 -translate-y-1/2 rounded-full"></div>
                        <div className="absolute top-1/2 left-0 h-1 bg-blue-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-1000" style={{ width: `${(step - 1) * 33.33}%` }}></div>
                        <ProgressNode active={step >= 1} icon={<Clock size={12}/>} label="Submitted" />
                        <ProgressNode active={step >= 2} icon={<ShieldCheck size={12}/>} label="Verified" />
                        <ProgressNode active={step >= 3} icon={<Search size={12}/>} label="Matching" />
                        <ProgressNode active={step >= 4} icon={<HeartPulse size={12}/>} label="Found" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-8 md:mt-12">
              <button onClick={() => navigate(isRecipient ? '/donations/recipient/health-info' : '/donations/donor/check')} className={`p-6 md:p-10 rounded-[35px] md:rounded-[55px] text-left border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-white hover:bg-white/10' : 'bg-white border-gray-100 shadow-xl hover:-translate-y-1'}`}>
                <div className="p-3 md:p-4 bg-blue-500/10 rounded-2xl w-fit mb-4 md:mb-6 text-blue-500"><Activity size={24} className="md:size-[28px]"/></div>
                <h3 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic mb-2">1. {isRecipient ? 'Medical Profile' : 'Eligibility Quiz'}</h3>
                <p className="text-[11px] md:text-xs text-gray-400 font-medium italic">{isRecipient ? (status.hasHealthData ? "Clinical data synced." : "Synchronize vitals for biological matching.") : (status.passedQuiz ? "Screening verified." : "Analyze health metrics against standards.")}</p>
              </button>

              <button onClick={() => canProceed && !status.hasActivePledge && navigate(isRecipient ? '/donations/recipient/request' : '/donations/donor/register-intent')} className={`p-6 md:p-10 rounded-[35px] md:rounded-[55px] text-left border transition-all relative overflow-hidden group ${!canProceed ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : status.hasActivePledge && isDonor ? 'border-blue-500/50 bg-blue-500/5' : 'hover:-translate-y-1 shadow-2xl active:scale-95'} ${isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100'}`}>
                <div className={`p-3 md:p-4 rounded-2xl w-fit mb-4 md:mb-6 ${canProceed ? (status.hasActivePledge && isDonor ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/40') : 'bg-gray-100 text-gray-400'}`}>
                  {canProceed ? (isRecipient ? <Plus size={24} className="md:size-[28px]"/> : <Heart size={24} className="md:size-[28px]"/>) : <Lock size={24} className="md:size-[28px]"/>}
                </div>
                <h3 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic mb-2 text-left">
                  2. {isRecipient ? 'Support Request' : (status.hasActivePledge ? 'Active Donor Pool' : 'Register Intent')}
                </h3>
                <p className="text-[11px] md:text-xs text-gray-400 font-medium italic text-left">{canProceed ? (status.hasActivePledge && isDonor ? "Pledge is active. Matching engine is scanning." : "Authorized access. Submit your entry to the registry.") : "Finish Step 1 and verify Identity to unlock."}</p>
                {canProceed && !status.hasActivePledge && <ArrowRight className="absolute bottom-6 md:bottom-10 right-6 md:right-10 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" size={24} />}
              </button>
            </div>

            {/* EVENTS SECTION - ONLY FOR DONORS */}
            {isDonor && events.length > 0 && (
              <div className="mt-12 md:mt-16 animate-in fade-in slide-in-from-bottom-10 duration-1000 text-left">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-600 p-2 rounded-xl text-white"><Calendar size={18} className="md:size-[20px]" /></div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic text-[#111C44] dark:text-white">Active Donation Drives</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {events.map((event) => {
                    const isAttending = event.attendees?.some(a => a.id === user.id);
                    const dateObj = new Date(event.eventDate);
                    return (
                      <div key={event.id} className={`p-5 md:p-6 rounded-[25px] md:rounded-[35px] border shadow-xl flex flex-col justify-between transition-all ${isAttending ? 'bg-blue-500/5 border-blue-500/30 dark:bg-blue-500/10' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-blue-500'}`}>
                        <div>
                          <div className="flex justify-between items-start mb-4 text-left">
                            <h4 className="font-black text-base md:text-lg text-[#1B2559] dark:text-white uppercase italic pr-4">{event.eventName}</h4>
                            <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl flex flex-col items-center justify-center font-black shadow-md ${isAttending ? 'bg-blue-600 text-white' : 'bg-[#111C44] text-white'}`}>
                              <span className="text-[7px] md:text-[9px] uppercase text-white/60 -mb-1">{dateObj.toLocaleString('en-US', { month: 'short' })}</span>
                              <span className="text-base md:text-xl">{dateObj.getDate()}</span>
                            </div>
                          </div>
                          <div className="space-y-2 mb-4 md:mb-6 text-left">
                            <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2 tracking-widest"><MapPin size={10} className="md:size-[12px] text-blue-500" /> {event.location}</p>
                            <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2 tracking-widest"><Clock size={10} className="md:size-[12px] text-blue-500" /> {event.startTime} - {event.endTime}</p>
                            <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2 tracking-widest"><Users size={10} className="md:size-[12px] text-green-500" /> {event._count?.attendees || 0} Responded</p>
                          </div>
                        </div>
                        <button onClick={() => handleRSVP(event.id)} className={`w-full py-3 md:py-4 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isAttending ? 'bg-white dark:bg-[#111C44] text-blue-600 border border-blue-500/20 shadow-sm hover:bg-blue-600 hover:text-white' : 'bg-blue-600 text-white shadow-xl shadow-blue-900/20 hover:bg-blue-700'}`}>
                          {isAttending ? <><CheckCircle size={12} className="md:size-[14px]" /> Cancel RSVP</> : <><Plus size={12} className="md:size-[14px]" /> RSVP Now</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ChatBot />
    </div>
  );
};

const StatusBadge = ({ active, label, variant }) => (
  <div className={`px-3 md:px-4 py-1 rounded-full border text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-green-500/20 border-green-500/30 text-green-400' : variant === 'warning' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 animate-pulse' : 'bg-red-500/10 border-red-500/30 text-red-400'
  }`}>{label}</div>
);

const ProgressNode = ({ active, icon, label }) => (
  <div className="flex flex-col items-center gap-2 md:gap-3">
    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 md:border-4 transition-all duration-500 ${active ? 'bg-blue-600 border-white text-white shadow-lg shadow-blue-500/40' : 'bg-gray-100 dark:bg-[#0b1121] border-gray-200 dark:border-white/10 text-gray-400'}`}>{active ? <CheckCircle size={12} className="md:size-[16px]" /> : icon}</div>
    <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest text-center w-16 md:w-24 ${active ? 'text-blue-600' : 'text-gray-400 dark:text-gray-600'}`}>{label}</span>
  </div>
);

export default Dashboard;
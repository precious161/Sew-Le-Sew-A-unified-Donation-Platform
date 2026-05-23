import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/layout/Sidebar';
import DonationService from '../services/DonationService';
import ProfileService from '../services/ProfileService';
import EventService from '../services/EventService';
import ChatBot from '../components/ai/ChatBot'; // NEW: ChatBot Component
import {
  Sun, Moon, ShieldCheck, Activity, Plus, Heart, Lock,
  CheckCircle, Clock, Search, HeartPulse, ArrowRight,
  MapPin, Users, Calendar
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    identity: 'Unverified',
    hasHealthData: false,
    passedQuiz: false
  });
  const [activeRequests, setActiveRequests] = useState([]);
  const [events, setEvents] = useState([]);

  const fetchEventsData = async () => {
    try {
      const res = await EventService.getPublicEvents();
      if (res.success) setEvents(res.data);
    } catch (err) {
      console.error("Failed to refresh events", err);
    }
  };

  useEffect(() => {
    if (user?.Role === 'Red_Cross_Admin') {
      navigate('/admin', { replace: true });
    }

    const syncRegistryData = async () => {
      try {
        const isRecipient = user?.Role === 'Recipient';
        const isDonor = user?.Role === 'Donor';

        const [pRes, hRes, reqRes, quizRes, eventsRes] = await Promise.all([
          ProfileService.getMe(),
          DonationService.getHealthInfo().catch(() => ({ success: false })),
          isRecipient ? DonationService.getMyRequests().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: [] }),
          isDonor ? DonationService.getEligibilityHistory().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: [] }),
          isDonor ? EventService.getPublicEvents().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: [] })
        ]);

        setStatus({
          identity: pRes.data?.identityStatus || 'Unverified',
          hasHealthData: hRes.success === true && hRes.data !== null,
          passedQuiz: quizRes.data?.length > 0 && quizRes.data[0]?.isEligible === true
        });

        if (reqRes.success && reqRes.data) setActiveRequests(reqRes.data);
        if (eventsRes.success && eventsRes.data) setEvents(eventsRes.data);

      } catch (err) {
        console.error("Dashboard Sync Failed", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) syncRegistryData();
  }, [user, navigate]);

  const handleRSVP = async (eventId) => {
    try {
      await EventService.rsvpToEvent(eventId);
      fetchEventsData();
    } catch (error) {
      console.error("Failed to RSVP", error);
    }
  };

  if (!user || user.Role === 'Red_Cross_Admin') return null;

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0b1121]">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
    </div>
  );

  const isVerified = status.identity === 'Verified';
  const isRecipient = user.Role === 'Recipient';
  const isDonor = user.Role === 'Donor';

  const canProceed = isVerified && (isRecipient ? status.hasHealthData : status.passedQuiz);

  const getProgressStep = (reqStatus) => {
    if (reqStatus === 'PendingVerification') return 1;
    if (reqStatus === 'Pending') return 2;
    if (reqStatus === 'Matching') return 3;
    if (reqStatus === 'Fulfilled') return 4;
    return 1;
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10 flex flex-col text-left">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full animate-pulse ${canProceed ? 'bg-green-500' : 'bg-blue-600'}`}></div>
             <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
                {isRecipient ? 'Recipient Coordination Node' : 'Donor Portal • Registry Node'}
             </h2>
          </div>
          <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-lg hover:scale-110 transition-all">
            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-[#111C44]" />}
          </button>
        </header>

        <div className="flex-1 max-w-6xl w-full mx-auto animate-in fade-in duration-1000 pb-10">

           {/* BANNER SECTION */}
           <div className={`rounded-[60px] p-16 shadow-2xl text-white relative overflow-hidden transition-all duration-700 ${
             canProceed ? 'bg-blue-600 shadow-blue-900/30' : 'bg-[#111C44]'
           }`}>
                <div className="relative z-10">
                  <h2 className="text-7xl font-black italic tracking-tighter leading-none">
                    Welcome, <br /> {user?.FirstName}!
                  </h2>
                  <div className="flex gap-4 mt-8 flex-wrap">
                     <StatusBadge active={isVerified} label={isVerified ? "ID Verified" : "Identity Missing"} />
                     {isRecipient && <StatusBadge active={status.hasHealthData} label={status.hasHealthData ? "Medical Profile Synced" : "Medical Missing"} />}
                     {isDonor && <StatusBadge active={status.passedQuiz} label={status.passedQuiz ? "Quiz Passed" : "Quiz Pending"} />}
                  </div>
                </div>
                <ShieldCheck size={280} className="absolute -right-20 -bottom-20 opacity-5" />
           </div>

           {/* ACTIVE REQUESTS TIMELINE (For Patients) */}
           {isRecipient && activeRequests.length > 0 && (
             <div className="mb-12 space-y-6 mt-12">
                <h3 className="text-xl font-black tracking-tighter uppercase italic text-[#111C44] dark:text-white mb-4">Live Request Tracking</h3>
                {activeRequests.map((req, idx) => {
                  const step = getProgressStep(req.status);
                  return (
                    <div key={idx} className={`p-8 rounded-[40px] shadow-xl border ${isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100 text-[#111C44]'}`}>
                      <div className="flex justify-between items-start mb-8">
                         <div>
                           <h4 className="font-black text-lg uppercase italic">Case #{req.id?.substring(0,8) || idx}</h4>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{req.donationType} Request • {req.hospitalName || 'General Registry'}</p>
                         </div>
                         <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${req.urgencyLevel === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                           {req.urgencyLevel} Urgency
                         </div>
                      </div>

                      <div className="relative flex justify-between items-center mt-12 mb-4 px-4">
                         <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-white/10 -z-10 -translate-y-1/2 rounded-full"></div>
                         <div className="absolute top-1/2 left-0 h-1 bg-blue-600 -z-10 -translate-y-1/2 rounded-full transition-all duration-1000" style={{ width: `${(step - 1) * 33.33}%` }}></div>

                         <ProgressNode active={step >= 1} icon={<Clock size={14}/>} label="Submitted" />
                         <ProgressNode active={step >= 2} icon={<ShieldCheck size={14}/>} label="Verified" />
                         <ProgressNode active={step >= 3} icon={<Search size={14}/>} label="Matching" />
                         <ProgressNode active={step >= 4} icon={<HeartPulse size={14}/>} label="Found" />
                      </div>
                    </div>
                  );
                })}
             </div>
           )}

           {/* ACTION HUB SECTION */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <button
                    onClick={() => navigate(isRecipient ? '/donations/recipient/health-info' : '/donations/donor/check')}
                    className={`p-10 rounded-[55px] text-left border transition-all ${isDarkMode ? 'bg-white/5 border-white/5 text-white hover:bg-white/10' : 'bg-white border-gray-100 text-[#111C44] shadow-xl shadow-gray-200/50 hover:-translate-y-1'}`}
                >
                    <div className="p-4 bg-medical-red/10 rounded-2xl w-fit mb-6 text-medical-red">
                      <Activity size={28}/>
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic mb-2">
                      1. {isRecipient ? 'Medical Profile' : 'Eligibility Quiz'}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium italic leading-relaxed">
                      {isRecipient
                        ? (status.hasHealthData ? "Medical records are synced." : "Synchronize vitals for biological matching.")
                        : (status.passedQuiz ? "Health screening completed." : "Analyze health metrics against standards.")}
                    </p>
                </button>

                <button
                    onClick={() => canProceed && navigate(isRecipient ? '/donations/recipient/request' : '/donations/donor/register-intent')}
                    className={`p-10 rounded-[55px] text-left border transition-all relative overflow-hidden group ${
                        !canProceed ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : 'hover:-translate-y-1 shadow-2xl active:scale-95'
                    } ${isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100'}`}
                >
                    <div className={`p-4 rounded-2xl w-fit mb-6 ${canProceed ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-gray-100 text-gray-400'}`}>
                        {canProceed ? (isRecipient ? <Plus size={28}/> : <Heart size={28}/>) : <Lock size={28}/>}
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic mb-2">
                      2. {isRecipient ? 'Support Request' : 'Register Intent'}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium italic leading-relaxed">
                        {canProceed
                          ? "Authorized access. Submit your entry to the registry."
                          : "Finish Step 1 and verify Identity to unlock."}
                    </p>
                    {canProceed && <ArrowRight className="absolute bottom-10 right-10 text-blue-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" size={32} />}
                </button>
           </div>

           {/* DONOR: UPCOMING EVENTS SECTION */}
           {isDonor && events.length > 0 && (
             <div className="mt-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="flex items-center gap-3 mb-6">
                   <div className="bg-medical-red p-2 rounded-xl text-white">
                      <Calendar size={20} />
                   </div>
                   <h3 className="text-2xl font-black tracking-tighter uppercase italic text-[#111C44] dark:text-white">
                     Active Donation Drives
                   </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {events.map((event) => {
                    const isAttending = event.attendees?.some(a => a.id === user.id) || false;
                    const dateObj = new Date(event.eventDate);

                    return (
                      <div key={event.id} className={`p-6 rounded-[35px] border shadow-xl flex flex-col justify-between transition-all ${
                        isAttending
                          ? 'bg-medical-red/5 border-medical-red/30 dark:bg-medical-red/10'
                          : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-medical-red'
                      }`}>
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-black text-lg text-[#1B2559] dark:text-white uppercase italic pr-4">
                              {event.eventName}
                            </h4>
                            <div className={`w-14 h-14 shrink-0 rounded-2xl flex flex-col items-center justify-center font-black shadow-md ${isAttending ? 'bg-medical-red text-white' : 'bg-[#111C44] text-white'}`}>
                              <span className="text-[9px] uppercase text-white/60 -mb-1">{dateObj.toLocaleString('en-US', { month: 'short' })}</span>
                              <span className="text-xl">{dateObj.getDate()}</span>
                            </div>
                          </div>

                          <div className="space-y-2 mb-6">
                            <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2 tracking-widest">
                              <MapPin size={12} className="text-medical-red" /> {event.location}
                            </p>
                            <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2 tracking-widest">
                              <Clock size={12} className="text-blue-500" /> {event.startTime} - {event.endTime}
                            </p>
                            <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2 tracking-widest">
                              <Users size={12} className="text-green-500" /> {event._count?.attendees || 0} Responded
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRSVP(event.id)}
                          className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            isAttending
                              ? 'bg-white dark:bg-[#111C44] text-medical-red border border-medical-red/20 shadow-sm hover:bg-medical-red hover:text-white'
                              : 'bg-medical-red text-white shadow-xl shadow-red-900/20 hover:bg-red-700'
                          }`}
                        >
                          {isAttending ? <><CheckCircle size={14} /> Cancel RSVP</> : <><Plus size={14} /> RSVP Now</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
             </div>
           )}

           <p className="mt-16 text-center text-[8px] font-black text-gray-300 dark:text-white/10 uppercase tracking-[0.5em]">
             Sew le Sew • Authorized Core Coordination Node
           </p>
        </div>
      </main>

      {/* CHATBOT - Added at the bottom of the component */}
      <ChatBot />
    </div>
  );
};

// Helper Components
const StatusBadge = ({ active, label }) => (
    <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
    }`}>
        {label}
    </div>
);

const ProgressNode = ({ active, icon, label }) => (
  <div className="flex flex-col items-center gap-3">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${active ? 'bg-blue-600 border-white text-white shadow-lg shadow-blue-500/40' : 'bg-gray-100 dark:bg-[#0b1121] border-gray-200 dark:border-white/10 text-gray-400'}`}>
      {active ? <CheckCircle size={16} /> : icon}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-widest text-center w-24 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}>{label}</span>
  </div>
);

export default Dashboard;
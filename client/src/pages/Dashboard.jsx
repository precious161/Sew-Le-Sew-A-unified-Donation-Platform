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
  MapPin, Users, Calendar, RefreshCw, Menu, ChevronDown,
  ChevronUp, Filter, FileText, UserCheck, ClipboardList, XCircle,
  Droplets, Box, History, ClipboardCheck
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Collapsible sections for Recipient
  const [recipientSections, setRecipientSections] = useState({
    medicalProfile: true,
    supportRequest: true,
    liveTracking: true
  });

  // Collapsible sections for Donor
  const [donorSections, setDonorSections] = useState({
    eligibilityQuiz: true,
    donationIntent: true
  });

  // Filter states
  const [requestFilter, setRequestFilter] = useState('all');
  const [intentFilter, setIntentFilter] = useState('all');

  const [status, setStatus] = useState({
    identity: 'Unverified',
    hasHealthData: false,
    passedQuiz: false,
    hasActivePledge: false
  });
  const [activeRequests, setActiveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [activeIntents, setActiveIntents] = useState([]);
  const [filteredIntents, setFilteredIntents] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);

  const toggleRecipientSection = (section) => {
    setRecipientSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleDonorSection = (section) => {
    setDonorSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper functions
  const getProgressStep = (reqStatus) => {
    const map = {
      'PendingVerification': 1,
      'Pending': 2,
      'Matching': 3,
      'Fulfilled': 4
    };
    return map[reqStatus] || 1;
  };

  const getRequestStatusBadge = (status) => {
    const config = {
      PendingVerification: { color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30', icon: <Clock size={10} />, label: 'Under Review' },
      Pending: { color: 'bg-blue-500/20 text-blue-600 border-blue-500/30', icon: <Clock size={10} />, label: 'Pending Match' },
      Matching: { color: 'bg-purple-500/20 text-purple-600 border-purple-500/30', icon: <HeartPulse size={10} />, label: 'Matching' },
      Fulfilled: { color: 'bg-green-500/20 text-green-600 border-green-500/30', icon: <CheckCircle size={10} />, label: 'Fulfilled' },
      Cancelled: { color: 'bg-red-500/20 text-red-600 border-red-500/30', icon: <XCircle size={10} />, label: 'Cancelled' },
    };
    return config[status] || config.PendingVerification;
  };

  const getIntentStatusBadge = (status) => {
    const config = {
      Active: { color: 'bg-green-500/20 text-green-600 border-green-500/30', icon: <CheckCircle size={10} />, label: 'Active' },
      PendingVerification: { color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30', icon: <Clock size={10} />, label: 'Under Review' },
      Matched: { color: 'bg-purple-500/20 text-purple-600 border-purple-500/30', icon: <HeartPulse size={10} />, label: 'Matched' },
      Completed: { color: 'bg-blue-500/20 text-blue-600 border-blue-500/30', icon: <CheckCircle size={10} />, label: 'Completed' },
      Cancelled: { color: 'bg-red-500/20 text-red-600 border-red-500/30', icon: <XCircle size={10} />, label: 'Cancelled' },
    };
    return config[status] || config.Active;
  };

  // Apply filters
  useEffect(() => {
    if (requestFilter === 'all') {
      setFilteredRequests(activeRequests);
    } else {
      setFilteredRequests(activeRequests.filter(req => req.status === requestFilter));
    }
  }, [requestFilter, activeRequests]);

  useEffect(() => {
    if (intentFilter === 'all') {
      setFilteredIntents(activeIntents);
    } else {
      setFilteredIntents(activeIntents.filter(intent => intent.status === intentFilter));
    }
  }, [intentFilter, activeIntents]);

  const syncRegistryData = useCallback(async () => {
    try {
      const isRecipient = user?.Role === 'Recipient';
      const isDonor = user?.Role === 'Donor';

      const [pRes, hRes, reqRes, quizRes, eventsRes, matchRes, intentRes, historyRes] = await Promise.all([
        ProfileService.getMe(),
        DonationService.getHealthInfo().catch(() => ({ success: false })),
        isRecipient ? DonationService.getMyRequests().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: [] }),
        isDonor ? DonationService.getEligibilityHistory().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: [] }),
        isDonor ? EventService.getPublicEvents().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: [] }),
        MatchingService.getMyActiveMatch().catch(() => ({ success: false, hasActiveMatch: false })),
        isDonor ? DonationService.getMyIntents().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: [] }),
        isDonor ? DonationService.getDonationHistory().catch(() => ({ success: false, data: [] })) : Promise.resolve({ data: [] })
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

      if (reqRes.success && reqRes.data) {
        setActiveRequests(reqRes.data);
        setFilteredRequests(reqRes.data);
      }

      if (intentRes.success && intentRes.data) {
        setActiveIntents(intentRes.data);
        setFilteredIntents(intentRes.data);
      }

      if (historyRes.success && historyRes.data) {
        setDonationHistory(historyRes.data);
      }

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

  const getIntentFilterCount = (filterStatus) => {
    if (filterStatus === 'all') return activeIntents.length;
    return activeIntents.filter(intent => intent.status === filterStatus).length;
  };

  const getRequestFilterCount = (filterStatus) => {
    if (filterStatus === 'all') return activeRequests.length;
    return activeRequests.filter(req => req.status === filterStatus).length;
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
          <button onClick={() => setIsMobileSidebarOpen(true)} className="bg-medical-red p-2.5 rounded-xl shadow-lg">
            <Menu size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <NotificationHub isDarkMode={isDarkMode} />
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}>
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
                  {isDonor && status.hasActivePledge && <StatusBadge active={true} label="Active Pledge" variant="success" />}
                </div>
              </div>
              <ShieldCheck size={180} className="md:size-[280px] absolute -right-10 md:-right-20 -bottom-10 md:-bottom-20 transition-opacity duration-700 opacity-5" />
            </div>

            {/* MATCH ALERT CARD - Only for Donors with active match */}
            {isDonor && activeMatch && activeMatch.status === 'Pending' && (
              <MatchAlertCard
                match={activeMatch}
                onAccept={() => handleMatchResponse(activeMatch.matchId, true)}
                onDecline={() => handleMatchResponse(activeMatch.matchId, false)}
                loading={actionLoading}
              />
            )}

            {/* ==================== RECIPIENT SECTIONS (FULL) ==================== */}
            {isRecipient && (
              <>
                {/* Medical Profile Section */}
                <div className="mt-8 md:mt-12">
                  <button
                    onClick={() => toggleRecipientSection('medicalProfile')}
                    className={`w-full flex items-center justify-between p-4 md:p-5 rounded-2xl transition-all ${
                      recipientSections.medicalProfile
                        ? 'bg-medical-red/10 border border-medical-red/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-medical-red" />
                      <h3 className="text-base md:text-lg font-black">Medical Profile</h3>
                      {!status.hasHealthData && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[8px] font-black animate-pulse">Required</span>
                      )}
                    </div>
                    {recipientSections.medicalProfile ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {recipientSections.medicalProfile && (
                    <div className="mt-4 p-5 md:p-8 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-xl">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h4 className="font-black text-lg">Clinical Information</h4>
                          <p className="text-sm text-gray-500 mt-1">Your medical data is required for donor matching</p>
                        </div>
                        <button
                          onClick={() => navigate('/donations/recipient/health-info')}
                          className="px-5 md:px-6 py-2.5 md:py-3 bg-medical-red text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all"
                        >
                          {status.hasHealthData ? 'Update Profile' : 'Complete Profile'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Support Request Section */}
                <div className="mt-6">
                  <button
                    onClick={() => toggleRecipientSection('supportRequest')}
                    className={`w-full flex items-center justify-between p-4 md:p-5 rounded-2xl transition-all ${
                      recipientSections.supportRequest
                        ? 'bg-medical-red/10 border border-medical-red/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardList size={20} className="text-medical-red" />
                      <h3 className="text-base md:text-lg font-black">Support Request</h3>
                    </div>
                    {recipientSections.supportRequest ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {recipientSections.supportRequest && (
                    <div className="mt-4 p-5 md:p-8 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-xl">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h4 className="font-black text-lg">Request Medical Support</h4>
                          <p className="text-sm text-gray-500 mt-1">Submit a new donation request for blood, organ, supplies, or financial aid</p>
                        </div>
                        <button
                          onClick={() => navigate('/donations/recipient/request')}
                          className="px-5 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                          <Plus size={14} /> New Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Request Tracking Section */}
                <div className="mt-6">
                  <button
                    onClick={() => toggleRecipientSection('liveTracking')}
                    className={`w-full flex items-center justify-between p-4 md:p-5 rounded-2xl transition-all ${
                      recipientSections.liveTracking
                        ? 'bg-medical-red/10 border border-medical-red/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Activity size={20} className="text-medical-red" />
                      <h3 className="text-base md:text-lg font-black">Live Request Tracking</h3>
                      {activeRequests.length > 0 && (
                        <span className="px-2 py-0.5 bg-medical-red text-white rounded-full text-[8px] font-black">
                          {activeRequests.length}
                        </span>
                      )}
                    </div>
                    {recipientSections.liveTracking ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {recipientSections.liveTracking && (
                    <div className="mt-4 p-5 md:p-8 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-xl">
                      {/* Filter Bar */}
                      <div className="mb-6 flex flex-wrap items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Filter:</span>

                        <button
                          onClick={() => setRequestFilter('all')}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                            requestFilter === 'all'
                              ? 'bg-medical-red text-white shadow-md'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-600'
                          }`}
                        >
                          All ({getRequestFilterCount('all')})
                        </button>
                        <button
                          onClick={() => setRequestFilter('PendingVerification')}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                            requestFilter === 'PendingVerification'
                              ? 'bg-yellow-500 text-white shadow-md'
                              : 'bg-yellow-500/10 text-yellow-600'
                          }`}
                        >
                          Under Review ({getRequestFilterCount('PendingVerification')})
                        </button>
                        <button
                          onClick={() => setRequestFilter('Pending')}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                            requestFilter === 'Pending'
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-blue-500/10 text-blue-600'
                          }`}
                        >
                          Pending Match ({getRequestFilterCount('Pending')})
                        </button>
                        <button
                          onClick={() => setRequestFilter('Matching')}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                            requestFilter === 'Matching'
                              ? 'bg-purple-500 text-white shadow-md'
                              : 'bg-purple-500/10 text-purple-600'
                          }`}
                        >
                          Matching ({getRequestFilterCount('Matching')})
                        </button>
                        <button
                          onClick={() => setRequestFilter('Fulfilled')}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                            requestFilter === 'Fulfilled'
                              ? 'bg-green-500 text-white shadow-md'
                              : 'bg-green-500/10 text-green-600'
                          }`}
                        >
                          Completed ({getRequestFilterCount('Fulfilled')})
                        </button>

                        {requestFilter !== 'all' && (
                          <button onClick={() => setRequestFilter('all')} className="text-[8px] text-gray-400 hover:text-medical-red">
                            ✕ Clear
                          </button>
                        )}
                      </div>

                      {filteredRequests.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
                          <p className="text-gray-500 font-black text-sm">
                            {activeRequests.length === 0 ? 'No donation requests yet' : `No ${requestFilter} requests found`}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredRequests.map((req) => {
                            const step = getProgressStep(req.status);
                            const badge = getRequestStatusBadge(req.status);
                            return (
                              <div key={req.id} className="p-5 rounded-xl border bg-white dark:bg-white/5">
                                <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-black text-sm">Case #{req.id.substring(0,8)}</h4>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-black ${badge.color}`}>
                                        {badge.icon} {badge.label}
                                      </span>
                                    </div>
                                    <p className="text-[8px] text-gray-500 mt-1">{req.donationType} • {req.hospitalName || 'General Registry'}</p>
                                  </div>
                                  <div className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase ${req.urgencyLevel === 'Critical' ? 'bg-medical-red/20 text-medical-red' : 'bg-blue-500/20 text-blue-500'}`}>
                                    {req.urgencyLevel}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                  <ProgressStep active={step >= 1} label="Submitted" />
                                  <ProgressStep active={step >= 2} label="Verified" />
                                  <ProgressStep active={step >= 3} label="Matching" />
                                  <ProgressStep active={step >= 4} label="Found" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ==================== DONOR SECTIONS (Simplified) ==================== */}
            {isDonor && (
              <>
                {/* 1. Eligibility Quiz Section - Collapsible */}
                <div className="mt-8 md:mt-12">
                  <button
                    onClick={() => toggleDonorSection('eligibilityQuiz')}
                    className={`w-full flex items-center justify-between p-4 md:p-5 rounded-2xl transition-all ${
                      donorSections.eligibilityQuiz
                        ? 'bg-medical-red/10 border border-medical-red/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardCheck size={20} className="text-medical-red" />
                      <h3 className="text-base md:text-lg font-black">Eligibility Quiz</h3>
                      {!status.passedQuiz && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[8px] font-black animate-pulse">Required</span>
                      )}
                      {status.passedQuiz && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[8px] font-black">✓ Completed</span>
                      )}
                    </div>
                    {donorSections.eligibilityQuiz ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {donorSections.eligibilityQuiz && (
                    <div className="mt-4 p-5 md:p-8 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-xl">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h4 className="font-black text-lg">Medical Screening</h4>
                          <p className="text-sm text-gray-500 mt-1">Complete health assessment to become an eligible donor</p>
                        </div>
                        <button
                          onClick={() => navigate('/donations/donor/check')}
                          className="px-5 md:px-6 py-2.5 md:py-3 bg-medical-red text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all"
                        >
                          {status.passedQuiz ? 'Retake Quiz' : 'Start Quiz'}
                        </button>
                      </div>

                      {status.passedQuiz && (
                        <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                          <div className="flex items-center gap-3">
                            <CheckCircle size={20} className="text-green-500" />
                            <div>
                              <p className="font-black text-green-600">You are eligible to donate!</p>
                              <p className="text-[10px] text-gray-500">Your medical screening has been verified.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Donation Intent Section - Collapsible */}
                <div className="mt-6">
                  <button
                    onClick={() => toggleDonorSection('donationIntent')}
                    className={`w-full flex items-center justify-between p-4 md:p-5 rounded-2xl transition-all ${
                      donorSections.donationIntent
                        ? 'bg-medical-red/10 border border-medical-red/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <HeartPulse size={20} className="text-medical-red" />
                      <h3 className="text-base md:text-lg font-black">Donation Intent</h3>
                      {activeIntents.length > 0 && (
                        <span className="px-2 py-0.5 bg-medical-red text-white rounded-full text-[8px] font-black">
                          {activeIntents.length} active
                        </span>
                      )}
                    </div>
                    {donorSections.donationIntent ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {donorSections.donationIntent && (
                    <div className="mt-4 p-5 md:p-8 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-xl">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                          <h4 className="font-black text-lg">Register Your Intent</h4>
                          <p className="text-sm text-gray-500 mt-1">Submit your donation pledge to enter the matching pool</p>
                        </div>
                        <button
                          onClick={() => navigate('/donations/donor/register-intent')}
                          className="px-5 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-2"
                          disabled={!canProceed}
                        >
                          <Plus size={14} /> New Intent
                        </button>
                      </div>

                      {/* Intent Filter Bar */}
                      {activeIntents.length > 0 && (
                        <div className="mb-6">
                          <div className="flex flex-wrap items-center gap-2">
                            <Filter size={14} className="text-gray-400" />
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Filter:</span>

                            <button
                              onClick={() => setIntentFilter('all')}
                              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                                intentFilter === 'all'
                                  ? 'bg-medical-red text-white shadow-md'
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-600'
                              }`}
                            >
                              All ({getIntentFilterCount('all')})
                            </button>
                            <button
                              onClick={() => setIntentFilter('Active')}
                              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                                intentFilter === 'Active'
                                  ? 'bg-green-500 text-white shadow-md'
                                  : 'bg-green-500/10 text-green-600'
                              }`}
                            >
                              Active ({getIntentFilterCount('Active')})
                            </button>
                            <button
                              onClick={() => setIntentFilter('PendingVerification')}
                              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                                intentFilter === 'PendingVerification'
                                  ? 'bg-yellow-500 text-white shadow-md'
                                  : 'bg-yellow-500/10 text-yellow-600'
                              }`}
                            >
                              Review ({getIntentFilterCount('PendingVerification')})
                            </button>
                            {intentFilter !== 'all' && (
                              <button onClick={() => setIntentFilter('all')} className="text-[8px] text-gray-400 hover:text-medical-red">
                                ✕ Clear
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {filteredIntents.length === 0 ? (
                        <div className="text-center py-8">
                          <HeartPulse size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
                          <p className="text-gray-500 font-black text-sm">
                            {activeIntents.length === 0 ? 'No donation intents yet' : `No ${intentFilter} intents found`}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredIntents.map((intent) => {
                            const badge = getIntentStatusBadge(intent.status);
                            return (
                              <div key={intent.id} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                <div className="flex justify-between items-start flex-wrap gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-medical-red/10 flex items-center justify-center">
                                      {intent.category === 'Blood' ? <Droplets size={20} className="text-medical-red" /> :
                                       intent.category === 'Organ' ? <Heart size={20} className="text-pink-500" /> :
                                       <Box size={20} className="text-orange-500" />}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-black text-base">{intent.category} Donation</h4>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${badge.color}`}>
                                          {badge.icon} {badge.label}
                                        </span>
                                      </div>
                                      <p className="text-[9px] text-gray-500 mt-1">
                                        {new Date(intent.plannedDate).toLocaleDateString()} • {intent.location}
                                      </p>
                                    </div>
                                  </div>
                                  {(intent.status === 'Active' || intent.status === 'PendingVerification') && (
                                    <button
                                      onClick={async () => {
                                        if (window.confirm('Cancel this donation intent?')) {
                                          try {
                                            await DonationService.cancelIntent(intent.id);
                                            syncRegistryData();
                                          } catch (error) {
                                            alert('Failed to cancel intent');
                                          }
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-[7px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Upcoming Events Section */}
                {events.length > 0 && (
                  <div className="mt-8 md:mt-12">
                    <h3 className="text-lg font-black mb-4 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Calendar size={18} /> Upcoming Donation Drives
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {events.map((event) => {
                        const isAttending = event.attendees?.some(a => a.id === user.id);
                        const dateObj = new Date(event.eventDate);
                        return (
                          <div key={event.id} className={`p-5 rounded-xl border shadow-lg ${isAttending ? 'bg-medical-red/5 border-medical-red/30' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5'}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-black text-lg">{event.eventName}</h4>
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                                  <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                                  <span className="flex items-center gap-1"><Clock size={12} /> {event.startTime} - {event.endTime}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="w-12 h-12 rounded-xl bg-[#111C44] text-white flex flex-col items-center justify-center">
                                  <span className="text-[9px] uppercase">{dateObj.toLocaleString('en-US', { month: 'short' })}</span>
                                  <span className="text-xl font-black">{dateObj.getDate()}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRSVP(event.id)}
                              className={`w-full mt-4 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${isAttending ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-medical-red text-white'}`}
                            >
                              {isAttending ? 'Cancel RSVP' : 'RSVP Now'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Donation History Button */}
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/donations/donor/history')}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-black text-[10px] uppercase tracking-wider hover:bg-medical-red hover:text-white transition-all"
                  >
                    <History size={16} /> View Full Donation History
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <ChatBot />
    </div>
  );
};

// StatusBadge Component
const StatusBadge = ({ active, label, variant }) => (
  <div className={`px-3 md:px-4 py-1 rounded-full border text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-green-500/20 border-green-500/30 text-green-400' :
    variant === 'warning' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 animate-pulse' :
    'bg-red-500/10 border-red-500/30 text-red-400'
  }`}>{label}</div>
);

// ProgressStep Component
const ProgressStep = ({ active, label }) => (
  <div className="flex flex-col items-center">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black ${
      active ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-400'
    }`}>
      {active ? <CheckCircle size={12} /> : <Clock size={10} />}
    </div>
    <span className="text-[6px] md:text-[7px] font-black mt-1">{label}</span>
  </div>
);

export default Dashboard;
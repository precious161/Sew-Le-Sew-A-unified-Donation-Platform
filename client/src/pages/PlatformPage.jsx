import React, { useState, useEffect } from 'react';
import Navbar from './landing/components/Navbar';
import Footer from './landing/components/Footer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Layout, TrendingUp, Droplets, MapPin, Brain, Activity, Calendar,
  Heart, Users, CheckCircle, ArrowRight, Clock, AlertTriangle,
  Gift, Wallet, Stethoscope, Award, Shield, Zap
} from 'lucide-react';
import AnalyticsService from '../services/AnalyticsService';

const PlatformPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Unified Top Needs State
  const [topNeeds, setTopNeeds] = useState({
    blood: 'O+',
    organ: 'Kidney',
    inKind: 'Medical Supplies',
    financialPendingCount: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const statsRes = await AnalyticsService.getPublicStats();

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
          // Set unified top needs from backend
          if (statsRes.data.topNeeds) {
             setTopNeeds(statsRes.data.topNeeds);
          }
        }

        if (user?.Role === 'Red_Cross_Admin') {
          const predRes = await AnalyticsService.getPredictions();
          if (predRes.success) setPredictions(predRes.data);
        }
      } catch (error) {
        console.error("Error loading platform data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const impactStats = [
    { icon: <Heart className="text-medical-red" />, value: stats?.stats?.completedMatches || 0, label: "Lives Impacted", description: "Donors matched with recipients" },
    { icon: <Users className="text-blue-500" />, value: stats?.stats?.totalDonors || 0, label: "Active Donors", description: "Ready to save lives" },
    { icon: <Activity className="text-green-500" />, value: stats?.stats?.activeRequests || 0, label: "Urgent Needs", description: "Patients waiting for help" },
    { icon: <Calendar className="text-purple-500" />, value: stats?.stats?.upcomingEvents || 0, label: "Donation Drives", description: "Coming to Addis Ababa" },
  ];

  // ALL FOUR CARDS NOW HAVE DYNAMIC "MOST NEEDED" DATA
  const donationTypes = [
    { icon: <Droplets size={32} />, title: "Blood Donation", description: "Donate blood and save up to 3 lives.", color: "bg-red-500", link: "/signup", mostNeeded: topNeeds.blood },
    { icon: <Heart size={32} />, title: "Organ Donation", description: "Register as an organ donor.", color: "bg-pink-500", link: "/signup", mostNeeded: topNeeds.organ },
    { icon: <Gift size={32} />, title: "In-Kind Donations", description: "Donate medical supplies or equipment.", color: "bg-orange-500", link: "/signup", mostNeeded: topNeeds.inKind },
    { icon: <Wallet size={32} />, title: "Financial Support", description: "Fund medical supplies and operations.", color: "bg-green-500", link: "/signup", mostNeeded: topNeeds.financialPendingCount > 0 ? `${topNeeds.financialPendingCount} patients pending aid` : 'Funds Always Needed' },
  ];

  // Check if we should show the critical alert (if there are critical requests OR high AI demand)
  const hasCriticalShortage = (stats?.stats?.criticalRequests > 0) || (predictions?.demandIncrease > 15);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0f172a] transition-colors duration-500 pb-32">
      <Navbar />

      <main className="flex-1 pt-32 pb-20">
        {/* Hero Section */}
        <div className="text-center px-6 max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 bg-medical-red/10 px-4 py-2 rounded-full mb-6">
            <Brain size={16} className="text-medical-red" />
            <span className="text-[10px] font-black uppercase text-medical-red tracking-wider">AI-Powered Platform</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-[#111C44] dark:text-white tracking-tighter mb-6">
            Turn Generosity Into
            <span className="text-medical-red italic block">Life-Saving Action</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-10">
            Ethiopia's first unified donation platform connecting donors with those in need through
            intelligent matching and real-time coordination.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => navigate('/signup')} className="px-8 py-4 bg-medical-red text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-red-700 transition-all shadow-xl flex items-center gap-2">
              Become a Donor <Heart size={18} />
            </button>
            <button onClick={() => navigate('/events')} className="px-8 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[#111C44] dark:text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:border-medical-red transition-all">
              Find Events Near You
            </button>
          </div>
        </div>

        {/* Impact Stats Banner */}
        <div className="bg-gradient-to-r from-[#111C44] to-[#1a2a5a] py-16 mb-20">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-center text-white/50 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Our Impact So Far</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {impactStats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">{stat.icon}</div>
                  <p className="text-4xl font-black text-white">{stat.value}</p>
                  <p className="text-white font-black text-sm mt-2">{stat.label}</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mt-1">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Critical Alert Banner */}
        {hasCriticalShortage && (
          <div className="max-w-4xl mx-auto px-6 mb-16">
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-[30px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center shrink-0"><AlertTriangle className="text-white" size={28} /></div>
                <div>
                  <p className="font-black text-red-500 text-lg uppercase">Critical System Alert</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    We currently have <span className="font-bold">{stats?.stats?.criticalRequests || 1} critical requests</span> pending across the network.
                    Urgent needs include <span className="font-bold">{topNeeds.blood} Blood</span> and <span className="font-bold">{topNeeds.organ} transplants</span>.
                  </p>
                </div>
              </div>
              <button onClick={() => navigate('/signup')} className="px-6 py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-red-600 transition-all whitespace-nowrap">
                Donate Now
              </button>
            </div>
          </div>
        )}

        {/* Donation Types Section */}
        <div className="max-w-6xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#111C44] dark:text-white uppercase italic mb-4">How You Can Help</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Choose the donation type that works best for you. Every contribution saves lives.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {donationTypes.map((type, idx) => (
              <div key={idx} className="bg-white dark:bg-[#111C44] rounded-[30px] p-6 shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group" onClick={() => navigate(type.link)}>
                <div className={`w-16 h-16 ${type.color} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>{type.icon}</div>
                <h3 className="text-xl font-black text-[#111C44] dark:text-white mb-2">{type.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{type.description}</p>
                {type.mostNeeded && (
                  <div className="inline-flex items-center gap-1 bg-red-500/10 px-3 py-1 rounded-full">
                    <AlertTriangle size={10} className="text-red-500" />
                    <span className="text-[8px] font-black text-red-500 uppercase">Top Need: {type.mostNeeded}</span>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2 text-medical-red opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black uppercase">Get Started</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-[#0b1121] py-20 mb-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-[#111C44] dark:text-white uppercase italic mb-4">
                How Sew Le Sew Works
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                Simple, transparent, and efficient - from registration to life-saving donation.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StepCard
                number="01"
                title="Register"
                description="Create your account as a donor or recipient. Upload your ID for verification."
                icon={<Shield size={28} className="text-medical-red" />}
              />
              <StepCard
                number="02"
                title="Get Matched"
                description="Our AI engine finds the best match based on blood type, location, and urgency."
                icon={<Zap size={28} className="text-medical-red" />}
              />
              <StepCard
                number="03"
                title="Save Lives"
                description="Visit our Red Cross center or donation event to complete your donation."
                icon={<Award size={28} className="text-medical-red" />}
              />
            </div>
          </div>
        </div>

        {/* Testimonials / Success Stories */}
        <div className="max-w-6xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#111C44] dark:text-white uppercase italic mb-4">
              Real Stories, Real Impact
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Hear from donors and recipients who've been part of the Sew Le Sew community.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TestimonialCard
              quote="I registered as a blood donor on Sew Le Sew and within days, I was matched with a patient at Black Lion Hospital. Knowing I helped save a life is an incredible feeling."
              author="Meron T."
              role="Blood Donor"
            />
            <TestimonialCard
              quote="When my father needed an urgent blood transfusion, Sew Le Sew found a match in hours. The platform gave us hope when we needed it most."
              author="Dawit A."
              role="Recipient's Family"
            />
          </div>
        </div>

        {/* CTA Banner */}
        <div className="max-w-4xl mx-auto px-6 mb-20">
          <div className="bg-gradient-to-r from-medical-red to-red-700 rounded-[40px] p-12 text-center text-white shadow-2xl">
            <Heart size={48} fill="white" className="mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl font-black mb-4">Ready to Make a Difference?</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Join thousands of Ethiopians who are already saving lives through Sew Le Sew.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={() => navigate('/signup')} className="px-8 py-4 bg-white text-medical-red rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-gray-100 transition-all">
                Join as Donor
              </button>
              <button onClick={() => navigate('/signup?role=recipient')} className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-white/10 transition-all">
                Request Support
              </button>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

const StepCard = ({ number, title, description, icon }) => (
  <div className="text-center">
    <div className="relative mb-6">
      <div className="w-20 h-20 bg-medical-red/10 rounded-2xl flex items-center justify-center mx-auto">
        {icon}
      </div>
      <div className="absolute -top-3 -right-3 w-8 h-8 bg-medical-red text-white rounded-full flex items-center justify-center text-sm font-black">
        {number}
      </div>
    </div>
    <h3 className="text-xl font-black text-[#111C44] dark:text-white mb-2">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>
  </div>
);

const TestimonialCard = ({ quote, author, role }) => (
  <div className="bg-white dark:bg-[#111C44] p-8 rounded-[30px] shadow-xl">
    <div className="text-medical-red text-4xl mb-4">"</div>
    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 italic">{quote}</p>
    <div>
      <p className="font-black text-[#111C44] dark:text-white">{author}</p>
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{role}</p>
    </div>
  </div>
);

export default PlatformPage;
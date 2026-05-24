import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Layout, ArrowUpRight } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import ChatBot from '../../components/ai/ChatBot'; // ADD THIS

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f172a] transition-colors duration-500">
      <Navbar />
      <Hero />

      <section className="py-24 px-6 md:px-20 bg-white dark:bg-[#0f172a] transition-colors">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          <TeaserCard
            title="Upcoming Events"
            desc="Explore active donation drives in Addis Ababa."
            icon={<Calendar />}
            onClick={() => navigate('/events')}
            theme="light"
          />
          <TeaserCard
            title="Our Platform"
            desc="Deep dive into the Sew le Sew digital ecosystem."
            icon={<Layout />}
            onClick={() => navigate('/platform')}
            theme="dark"
          />
        </div>
      </section>

      <Footer />

      {/* ADD CHATBOT HERE - Available to everyone on landing page */}
      <ChatBot />
    </div>
  );
};

const TeaserCard = ({ title, desc, icon, onClick, theme }) => (
    <div onClick={onClick} className={`group p-12 rounded-[45px] shadow-2xl transition-all cursor-pointer relative overflow-hidden border ${
        theme === 'light'
        ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-medical-red'
        : 'bg-[#111C44] dark:bg-medical-red/10 border-white/5 hover:border-blue-500'
    }`}>
        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 group-hover:text-medical-red transition-all"><ArrowUpRight size={40}/></div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-lg ${theme === 'light' ? 'bg-white text-medical-red' : 'bg-white/10 text-blue-400'}`}>{icon}</div>
        <h3 className={`text-2xl font-black mb-2 uppercase italic ${theme === 'light' ? 'text-[#111C44] dark:text-white' : 'text-white'}`}>{title}</h3>
        <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>{desc}</p>
    </div>
);

export default LandingPage;
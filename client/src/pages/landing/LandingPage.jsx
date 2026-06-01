import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Layout, ArrowUpRight } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import ChatBot from '../../components/ai/ChatBot';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleKeyDown = (e, path) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(path);
    }
  };

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
            onKeyDown={(e) => handleKeyDown(e, '/events')}
          />
          <TeaserCard
            title="Our Platform"
            desc="Deep dive into the Sew le Sew digital ecosystem."
            icon={<Layout />}
            onClick={() => navigate('/platform')}
            theme="dark"
            onKeyDown={(e) => handleKeyDown(e, '/platform')}
          />
        </div>
      </section>

      <Footer />
      <ChatBot />
    </div>
  );
};

const TeaserCard = ({ title, desc, icon, onClick, theme, onKeyDown }) => (
    <div
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Navigate to ${title}`}
      className={`group p-8 md:p-12 rounded-[45px] shadow-2xl transition-all cursor-pointer relative overflow-hidden border focus:ring-4 focus:ring-medical-red focus:outline-none ${
        theme === 'light'
        ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-medical-red'
        : 'bg-[#111C44] dark:bg-medical-red/10 border-white/5 hover:border-blue-500'
      }`}
    >
        <div className="absolute top-0 right-0 p-6 md:p-8 opacity-20 group-hover:opacity-100 group-hover:text-medical-red transition-all" aria-hidden="true">
          <ArrowUpRight size={32} className="md:size-40" />
        </div>
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-lg ${theme === 'light' ? 'bg-white text-medical-red' : 'bg-white/10 text-blue-400'}`} aria-hidden="true">
          {icon}
        </div>
        <h3 className={`text-xl md:text-2xl font-black mb-2 uppercase italic ${theme === 'light' ? 'text-[#111C44] dark:text-white' : 'text-white'}`}>
          {title}
        </h3>
        <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest leading-relaxed ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>
          {desc}
        </p>
    </div>
);

export default LandingPage;
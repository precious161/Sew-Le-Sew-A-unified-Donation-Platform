import React from 'react';
import Navbar from './landing/components/Navbar';
import Footer from './landing/components/Footer';
import { MapPin } from 'lucide-react';

const EventsPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0f172a] transition-colors duration-500">
      <Navbar />
      <main className="flex-1 pt-44 pb-32 px-6 md:px-20 max-w-5xl mx-auto w-full">
        <p className="text-gray-400 dark:text-white/20 font-medium text-lg italic mb-16">"Connecting generosity with necessity across Addis Ababa."</p>
        <div className="grid gap-8">
          <EventCard name="Black Lion Hospital Drive" area="Lideta" date="May 12" />
          <EventCard name="AAU 4 Kilo Campaign" area="Arada" date="May 24" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

const EventCard = ({ name, area, date }) => (
  <div className="p-8 bg-white dark:bg-white/5 rounded-[40px] shadow-xl border border-gray-100 dark:border-white/5 flex justify-between items-center group hover:border-medical-red transition-all">
    <div className="flex items-center gap-8">
      <div className="w-16 h-16 rounded-2xl bg-[#111C44] text-white flex items-center justify-center font-black text-xl shadow-lg">{date.split(' ')[1]}</div>
      <div className="text-left">
        <h3 className="font-black text-xl text-[#1B2559] dark:text-white tracking-tight uppercase italic">{name}</h3>
        <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2 mt-1"><MapPin size={12} className="text-medical-red" /> {area}, Addis Ababa</p>
      </div>
    </div>
    <span className="px-5 py-2 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 text-[9px] font-black uppercase">Active</span>
  </div>
);

export default EventsPage;
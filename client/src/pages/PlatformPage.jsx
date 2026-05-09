import React from 'react';
import Navbar from './landing/components/Navbar';
import Footer from './landing/components/Footer';
import { Layout } from 'lucide-react';

const PlatformPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0f172a] transition-colors duration-500">
      <Navbar />
      <main className="flex-1 pt-44 pb-32 px-6 md:px-20 max-w-5xl mx-auto w-full text-center">
        <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-10 text-medical-red border dark:border-white/5"><Layout /></div>
        <h1 className="text-5xl font-black text-[#111C44] dark:text-white tracking-tighter mb-6 uppercase italic">Our Platform</h1>
        <p className="text-gray-400 dark:text-white/40 text-lg font-medium max-w-2xl mx-auto italic">"A specialized healthcare coordination system driven by intelligence and community impact."</p>
      </main>
      <Footer />
    </div>
  );
};

export default PlatformPage;
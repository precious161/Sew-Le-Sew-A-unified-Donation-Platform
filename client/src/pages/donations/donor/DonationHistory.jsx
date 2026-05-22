import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar';
import DonationService from '../../../services/DonationService';
import { useTheme } from '../../../context/ThemeContext';
import { ArrowLeft, History, CheckCircle, Calendar, MapPin, Droplets } from 'lucide-react';

const DonationHistory = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await DonationService.getDonationHistory();
        if (res.success) setDonations(res.data);
      } catch (err) {
        console.error("History fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10 flex flex-col text-left">
        <header className="mb-12 flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-lg text-gray-400 hover:text-medical-red transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-black text-[#111C44] dark:text-white tracking-tighter uppercase italic leading-none">Donation History</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Registry Record • Donor Node</p>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse text-gray-300 font-black uppercase tracking-[0.5em]">Synchronizing Records...</div>
          </div>
        ) : donations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <History size={80} className="mb-4 text-gray-400" />
            <p className="font-black uppercase tracking-widest text-xs">No entries found in your registry</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-w-5xl">
            {donations.map((item) => (
              <div 
                key={item.id} 
                className={`p-8 rounded-[45px] shadow-xl border flex items-center justify-between transition-all hover:-translate-y-1 ${
                  isDarkMode ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-medical-red/10 rounded-2xl text-medical-red">
                    <Droplets size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tight">{item.donationType} Donation</h3>
                    <div className="flex gap-6 mt-2">
                       <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         <Calendar size={14}/> {new Date(item.donationDate).toLocaleDateString()}
                       </span>
                       <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         <MapPin size={14}/> {item.location || 'Red Cross Center'}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                   <div className="px-5 py-2 bg-green-500/10 text-green-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle size={14}/> {item.status}
                   </div>
                   {item.quantity && <p className="text-[10px] font-bold text-gray-400 uppercase mr-2">Qty: {item.quantity}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DonationHistory;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/layout/Sidebar';
import DonationService from '../../../services/DonationService';
import { useTheme } from '../../../context/ThemeContext';
import { ArrowLeft, History, CheckCircle, Calendar, MapPin, Droplets, AlertCircle } from 'lucide-react';

const DonationHistory = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await DonationService.getDonationHistory();
        console.log('Donation history response:', res);

        if (res.success && res.data && res.data.length > 0) {
          setDonations(res.data);
        } else {
          // DEMO DATA - Shows sample history for demonstration
          // Remove this in production when real data exists
          setDonations([
            {
              id: 'demo1',
              donationType: 'Blood',
              donationDate: new Date().toISOString(),
              quantity: 1,
              location: 'Bole Medhanialem Red Cross Center',
              status: 'Completed',
              remarks: 'Successfully donated blood - O+'
            },
            {
              id: 'demo2',
              donationType: 'Blood',
              donationDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
              quantity: 1,
              location: 'Piassa Red Cross Center',
              status: 'Completed',
              remarks: 'Successfully donated blood'
            },
            {
              id: 'demo3',
              donationType: 'In_Kind',
              donationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
              quantity: 2,
              location: 'Megenagna Collection Center',
              status: 'Completed',
              remarks: 'Donated first aid kits and bandages'
            }
          ]);
        }
      } catch (err) {
        console.error("History fetch failed", err);
        setError("Failed to load donation history. Please try again later.");
        // Show demo data on error for demonstration
        setDonations([
          {
            id: 'demo1',
            donationType: 'Blood',
            donationDate: new Date().toISOString(),
            quantity: 1,
            location: 'Bole Medhanialem Red Cross Center',
            status: 'Completed',
            remarks: 'Demo: Complete a donation to see real history'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />
      <main className="flex-1 ml-72 p-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
      </main>
    </div>
  );

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
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1 italic">Registry Record • Donor Node</p>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {donations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-70 mt-20">
            <History size={80} className="mb-4 text-gray-400" />
            <p className="font-black uppercase tracking-widest text-xs text-gray-500">No entries found in your registry</p>
            <p className="text-gray-400 text-[10px] mt-2">Complete a donation to see your history here</p>
            <button
              onClick={() => navigate('/donations/donor/register-intent')}
              className="mt-6 px-6 py-3 bg-medical-red text-white rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-red-700 transition-all"
            >
              Register Donation Intent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-w-5xl">
            {donations.map((item) => (
              <div
                key={item.id}
                className={`p-8 rounded-[45px] shadow-xl border flex items-center justify-between transition-all hover:-translate-y-1 ${
                  isDarkMode ? 'bg-white/5 border-white/5 text-white shadow-black/40' : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-medical-red/10 rounded-2xl text-medical-red shadow-inner">
                    <Droplets size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tight">{item.donationType} Donation</h3>
                    <div className="flex gap-6 mt-2">
                       <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         <Calendar size={14} className="text-blue-500"/> {new Date(item.donationDate).toLocaleDateString('en-GB')}
                       </span>
                       <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         <MapPin size={14} className="text-medical-red"/> {item.location || 'Red Cross Center'}
                       </span>
                    </div>
                    {item.remarks && (
                      <p className="text-[9px] text-gray-500 mt-2 italic">{item.remarks}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                   <div className="px-5 py-2 bg-green-500/10 text-green-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-green-500/20">
                      <CheckCircle size={14}/> {item.status}
                   </div>
                   {item.quantity && <p className="text-[10px] font-bold text-gray-500 uppercase mr-2 tracking-tighter">Units: {item.quantity}</p>}
                </div>
              </div>
            ))}
            {donations.some(d => d.id?.startsWith('demo')) && (
              <div className="text-center text-[9px] text-gray-400 italic mt-4">
                * Demo data shown. Complete a real donation to see your actual history.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DonationHistory;
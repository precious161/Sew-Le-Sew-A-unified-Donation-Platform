import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/layout/Sidebar';
import NotificationHub from '../components/notifications/NotificationHub';
import { Sun, Moon, ShieldCheck, UserCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  
  useEffect(() => {
    if (user?.Role === 'Red_Cross_Admin') {
      console.log("Admin detected. Redirecting to System Administration...");
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  
  if (!user || user.Role === 'Red_Cross_Admin') return null;

  const isDonor = user?.Role === 'Donor';

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
      
      <Sidebar isDarkMode={isDarkMode} />
      
      <main className="flex-1 ml-72 p-10 flex flex-col">
        
        <header className="flex justify-end items-center mb-12 gap-4">
          
          
          <NotificationHub isDarkMode={isDarkMode} />

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-2xl transition-all shadow-sm border ${
              isDarkMode 
              ? 'bg-white/10 border-white/30 text-yellow-400 hover:bg-white/20' 
              : 'bg-white border-gray-400 text-slate-800 hover:bg-gray-50'
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        
        <div className="flex-1 flex flex-col items-start">
          
          {isDonor ? (
            /* --- DONOR VIEW --- */
            <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className={`rounded-[40px] p-12 shadow-2xl text-white relative overflow-hidden transition-all duration-500 ${
                isDarkMode ? 'bg-medical-red/90 shadow-red-900/20' : 'bg-medical-red shadow-red-200'
              }`}>
                <h2 className="text-6xl font-black italic tracking-tighter">
                  Hello, {user?.FirstName}! 👋
                </h2>
                <p className="mt-4 font-bold tracking-[0.3em] text-[10px] opacity-70">
                  Verified Donor  Account
                </p>
                
                <ShieldCheck size={180} className="absolute -right-10 -bottom-10 opacity-10" />
              </div>
              
            </div>
          ) : (
            /* --- RECIPIENT VIEW --- */
            <div className="w-full max-w-4xl animate-in fade-in duration-700">
               <h1 className={`text-6xl font-black tracking-tighter  transition-colors duration-500 ${
                 isDarkMode ? 'text-white' : 'text-[#111C44]'
               }`}>
                 Patient Overview
               </h1>
               <div className="h-2 w-32 bg-medical-red mt-4 rounded-full"></div>
               
               <p className={`mt-8 font-bold tracking-[0.5em] text-xs transition-colors duration-500 ${
                 isDarkMode ? 'text-white/40' : 'text-gray-800'
               }`}>
                 ACCOUNT TYPE: <span className="text-medical-red">RECIPIENT</span>
               </p>

               <div className={`mt-12 p-10 rounded-[40px] border border-dashed transition-all duration-500 ${
                 isDarkMode 
                 ? 'border-white/10 bg-white/5 text-white/30' 
                 : 'border-gray-200 bg-gray-50 text-gray-500'
               }`}>
                  <p className="font-medium text-sm leading-relaxed">
                    Welcome back, {user?.FirstName} {user?.LastName}. Your identity has been verified in the system. 
                    
                  </p>
               </div>
            </div>
          )}

        </div>

        
      </main>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext'; // Correct deep path
import EventService from '../../../services/EventService'; // <-- NEW IMPORT

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

  // NEW STATE: Tracks if there are new events
  const [hasNewEvents, setHasNewEvents] = useState(false);

  const isEventsPage = location.pathname === '/events';
  const isPlatformPage = location.pathname === '/platform';
  const isSubPage = isEventsPage || isPlatformPage;

  // NEW EFFECT: Silently check for recently created/updated events
  useEffect(() => {
    const checkNewEvents = async () => {
      try {
        const res = await EventService.getPublicEvents();
        if (res.success && res.data.length > 0) {
          // Check if any event was created or updated in the last 48 hours
          const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

          const isFresh = res.data.some(event => {
            const created = new Date(event.createdAt);
            const updated = new Date(event.updatedAt);
            return created > fortyEightHoursAgo || updated > fortyEightHoursAgo;
          });

          setHasNewEvents(isFresh);
        }
      } catch (error) {
        // Fail silently so it doesn't break the public navbar
        console.error("Could not fetch events for navbar indicator");
      }
    };

    checkNewEvents();
  }, []);

  return (
    <nav className="fixed w-full z-[100] bg-white dark:bg-[#0b1121] border-b border-gray-100 dark:border-white/5 px-6 md:px-20 py-5 flex justify-between items-center shadow-2xl transition-colors duration-500">
      <div className="flex items-center gap-4">
        {isSubPage ? (
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 dark:text-white/50 hover:text-medical-red transition-all group">
            <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="bg-medical-red p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <Heart size={20} fill="white" className="text-white" />
            </div>
            <span className="text-xl tracking-tighter text-[#111C44] dark:text-white font-black uppercase transition-colors">
              Sew<span className="font-light italic px-1 text-medical-red">le</span>Sew
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 md:gap-8">
          <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-[#111C44] dark:text-white border border-transparent dark:border-white/5 transition-all">
            {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          </button>

          {!isSubPage && (
            <>
              {/* UPDATED EVENTS BUTTON WITH NOTIFICATION DOT */}
              <button onClick={() => navigate('/events')} className="hidden md:inline-flex relative items-center text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 hover:text-medical-red transition-colors">
                Events
                {hasNewEvents && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical-red opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-medical-red"></span>
                  </span>
                )}
              </button>

              <button onClick={() => navigate('/platform')} className="hidden md:block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 hover:text-medical-red transition-colors">
                Platform
              </button>
            </>
          )}

          <button onClick={() => navigate('/login')} className="text-[#111C44] dark:text-white text-[10px] font-black uppercase tracking-widest hover:opacity-70 px-4 transition-opacity">
            Sign In
          </button>
          <button onClick={() => navigate('/signup')} className="bg-medical-red text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition-all">
            Join Network
          </button>
      </div>
    </nav>
  );
};

export default Navbar;
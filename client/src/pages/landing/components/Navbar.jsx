import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, ArrowLeft, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import EventService from '../../../services/EventService';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasNewEvents, setHasNewEvents] = useState(false);

  const isEventsPage = location.pathname === '/events';
  const isPlatformPage = location.pathname === '/platform';
  const isSubPage = isEventsPage || isPlatformPage;

  useEffect(() => {
    const abortController = new AbortController();

    const checkNewEvents = async () => {
      try {
        const res = await EventService.getPublicEvents({ signal: abortController.signal });
        if (res.success && res.data && res.data.length > 0) {
          const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
          const isFresh = res.data.some(event => {
            const created = new Date(event.createdAt);
            const updated = new Date(event.updatedAt);
            return created > fortyEightHoursAgo || updated > fortyEightHoursAgo;
          });
          setHasNewEvents(isFresh);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Could not fetch events for navbar indicator", error);
        }
      }
    };

    checkNewEvents();
    return () => abortController.abort();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Events', path: '/events', hasNotification: hasNewEvents },
    { name: 'Platform', path: '/platform', hasNotification: false },
  ];

  return (
    <>
      <nav className="fixed w-full z-[100] bg-white dark:bg-[#0b1121] border-b border-gray-100 dark:border-white/5 px-6 md:px-20 py-5 flex justify-between items-center shadow-2xl transition-colors duration-500">
        <div className="flex items-center gap-4">
          {isSubPage ? (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-500 dark:text-white/50 hover:text-medical-red transition-all group focus:ring-2 focus:ring-medical-red focus:outline-none rounded-lg px-2 py-1"
              aria-label="Go back to home"
            >
              <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Back</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
              role="button"
              tabIndex={0}
              aria-label="Go to home page"
            >
              <div className="bg-medical-red p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Heart size={20} fill="white" className="text-white" />
              </div>
              <span className="text-xl tracking-tighter text-[#111C44] dark:text-white font-black uppercase transition-colors">
                Sew<span className="font-light italic px-1 text-medical-red">le</span>Sew
              </span>
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-[#111C44] dark:text-white border border-transparent dark:border-white/5 transition-all focus:ring-2 focus:ring-medical-red focus:outline-none"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          </button>

          {!isSubPage && (
            <>
              <button
                onClick={() => navigate('/events')}
                className="relative text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 hover:text-medical-red transition-colors focus:ring-2 focus:ring-medical-red focus:outline-none rounded-lg px-2 py-1"
                aria-label="View donation events"
              >
                Events
                {hasNewEvents && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical-red opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-medical-red"></span>
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate('/platform')}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40 hover:text-medical-red transition-colors focus:ring-2 focus:ring-medical-red focus:outline-none rounded-lg px-2 py-1"
                aria-label="View platform information"
              >
                Platform
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/login')}
            className="text-[#111C44] dark:text-white text-[10px] font-black uppercase tracking-widest hover:opacity-70 px-4 transition-opacity focus:ring-2 focus:ring-medical-red focus:outline-none rounded-lg py-2"
            aria-label="Sign in to your account"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="bg-medical-red text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg hover:bg-red-700 transition-all focus:ring-2 focus:ring-medical-red focus:ring-offset-2 focus:outline-none"
            aria-label="Create a new account"
          >
            Join Network
          </button>
        </div>

        {/* Mobile Navigation Controls */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-[#111C44] dark:text-white focus:ring-2 focus:ring-medical-red focus:outline-none"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-[#111C44] dark:text-white focus:ring-2 focus:ring-medical-red focus:outline-none"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && !isSubPage && (
        <div className="fixed top-[73px] left-0 right-0 z-[99] bg-white dark:bg-[#0b1121] border-b border-gray-100 dark:border-white/5 shadow-xl py-4 px-6 flex flex-col gap-3 md:hidden">
          <button
            onClick={() => navigate('/events')}
            className="relative flex items-center justify-between w-full py-3 text-sm font-black uppercase tracking-widest text-gray-600 dark:text-white/60 hover:text-medical-red transition-colors focus:ring-2 focus:ring-medical-red focus:outline-none rounded-lg px-3"
            aria-label="View donation events"
          >
            Events
            {hasNewEvents && (
              <span className="flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-medical-red"></span>
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/platform')}
            className="w-full py-3 text-left text-sm font-black uppercase tracking-widest text-gray-600 dark:text-white/60 hover:text-medical-red transition-colors focus:ring-2 focus:ring-medical-red focus:outline-none rounded-lg px-3"
            aria-label="View platform information"
          >
            Platform
          </button>
          <div className="h-px bg-gray-100 dark:bg-white/10 my-2"></div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 text-left text-sm font-black uppercase tracking-widest text-gray-600 dark:text-white/60 hover:text-medical-red transition-colors focus:ring-2 focus:ring-medical-red focus:outline-none rounded-lg px-3"
            aria-label="Sign in to your account"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="w-full py-3 bg-medical-red text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all text-center focus:ring-2 focus:ring-medical-red focus:ring-offset-2 focus:outline-none"
            aria-label="Create a new account"
          >
            Join Network
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;
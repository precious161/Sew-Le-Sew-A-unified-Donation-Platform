import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Clock, Info, X } from 'lucide-react';
import AlertService from '../../services/AlertService';

const NotificationHub = ({ isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // 1. Fetching logic defined inside useEffect to satisfy the linter
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await AlertService.fetchMyNotifications();
        if (res.success) {
          setNotifications(res.data);
        }
      } catch {
        console.error("Alert Load Error");
      }
    };

    fetchNotifications();
  }, []); // Runs once on mount

  // 2. Click outside handler
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 3. Separate function for manual refreshes (like marking read)
  const refreshList = async () => {
    const res = await AlertService.fetchMyNotifications();
    if (res.success) setNotifications(res.data);
  };

  const handleMarkRead = async (id) => {
    const res = await AlertService.markAsRead(id);
    if (res.success) {
      refreshList();
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-2xl transition-all relative ${
          isDarkMode ? 'bg-white/5 text-white/60 hover:text-white' : 'bg-white shadow-sm text-gray-400 hover:text-medical-red border border-gray-100'
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-medical-red text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-[#f4f7fe] animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown UI */}
      {isOpen && (
        <div className={`absolute right-0 mt-4 w-80 rounded-[30px] shadow-2xl border transition-all animate-in fade-in slide-in-from-top-2 z-[100] ${
          isDarkMode ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-100'
        }`}>
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className={`font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>Updates</h3>
            <button onClick={() => setIsOpen(false)}><X size={16} className="text-gray-400" /></button>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                 <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-300"><Bell size={18}/></div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No active alerts</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-5 border-b border-white/5 flex gap-4 transition-all ${!n.isRead ? 'bg-medical-red/5' : 'opacity-40'}`}>
                  <div className={`mt-1 p-2 h-fit rounded-lg ${!n.isRead ? 'bg-medical-red text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Info size={14} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold leading-relaxed ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>{n.message}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-[9px] text-gray-400 font-black uppercase flex items-center gap-1">
                        <Clock size={10}/> {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                      {!n.isRead && (
                        <button 
                          onClick={() => handleMarkRead(n.id)} 
                          className="text-medical-red hover:text-red-700 font-bold text-[9px] uppercase tracking-widest flex items-center gap-1"
                        >
                          <CheckCheck size={14} /> Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationHub;
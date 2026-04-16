import React, { useState, useEffect } from 'react';
import { Bell, Info, X, BellOff, ShieldAlert } from 'lucide-react';
import { AlertService } from '../../services/AlertService';

const NotificationHub = ({ user, isNight }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- FIXED ASYNC EFFECT ---
  useEffect(() => {
    let isMounted = true; // Prevents memory leaks if component unmounts

    const fetchNotifications = async () => {
      if (user) {
        try {
          setIsLoading(true);
          // We MUST await the service call
          const data = await AlertService.receiveNotifications(user);
          
          if (isMounted) {
            setNotifications(data || []);
          }
        } catch (error) {
          console.error("NotificationHub: Fetch failed", error);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    };

    fetchNotifications();

    return () => { isMounted = false; }; 
  }, [user]);
  // --- END FIXED EFFECT ---

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const textColor = isNight ? "text-white" : "text-slate-900";
  const panelBg = isNight ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-slate-200";

  return (
    <div className="relative inline-block">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl border transition-all relative ${
          isNight ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-700 shadow-sm"
        }`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C70417] text-white text-[9px] font-black flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className={`absolute right-0 mt-4 w-80 md:w-96 ${panelBg} rounded-[2rem] shadow-2xl border z-50 overflow-hidden backdrop-blur-xl`}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h3 className={`font-black text-[10px] uppercase tracking-widest ${isNight ? 'text-white/40' : 'text-slate-400'}`}>
                System Notifications {isLoading && "..."}
              </h3>
              <button onClick={() => setIsOpen(false)}><X size={16} className="opacity-40" /></button>
            </div>

            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <div key={item.id || Math.random()} className={`p-5 border-b border-white/5 hover:bg-white/5 transition-colors ${!item.isRead ? 'bg-red-500/5' : ''}`}>
                    <div className="flex gap-4">
                      <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
                        item.type === 'REMINDER' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {item.type === 'REMINDER' ? <ShieldAlert size={20} /> : <Info size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className={`text-sm font-black tracking-tight ${textColor}`}>{item.title}</h4>
                          {item.date && <span className="text-[8px] opacity-40 uppercase font-bold">{item.date}</span>}
                        </div>
                        <p className={`text-[11px] font-medium leading-relaxed mt-1 opacity-60 ${textColor}`}>
                          {item.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center opacity-30">
                  <BellOff className="mx-auto mb-2" size={24} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Inbox is empty</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationHub;
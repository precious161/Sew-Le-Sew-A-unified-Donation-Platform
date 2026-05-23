import React from 'react';
import { HeartPulse, MapPin, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

const MatchAlertCard = ({ match, onAccept, onDecline, loading }) => {
  if (!match) return null;

  return (
    <div className="mb-10 w-full max-w-5xl animate-in slide-in-from-top-4 duration-700">
      {/* Container with Blue-Black Glassmorphism */}
      <div className="relative overflow-hidden rounded-[40px] border border-blue-500/20 bg-[#111C44]/60 p-8 backdrop-blur-2xl shadow-2xl shadow-blue-900/20">
        
        {/* Top Decorative Line */}
        <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Content Left: Icon + Info */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 shadow-inner">
                <HeartPulse size={32} className="animate-pulse text-blue-400" />
              </div>
              {/* Pulsing indicator */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
              </span>
            </div>

            <div className="text-left">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 border border-blue-500/20">
                  <Zap size={10} className="text-blue-400 fill-blue-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-blue-400">Live Match</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                  <Clock size={12} /> Response Required
                </span>
              </div>
              
              <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
                Clinical Match Identified
              </h3>
              
              <p className="mt-2 text-xs font-medium leading-relaxed text-blue-100/60 max-w-md">
                Paired with <span className="text-blue-400 font-bold">Case #{match.matchId.substring(0,6)}</span>. 
                Report to <span className="text-white font-bold underline underline-offset-4">{match.location}</span>.
              </p>
            </div>
          </div>

          {/* Actions Right: Compact Buttons */}
          <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto">
            <button
              disabled={loading}
              onClick={() => onDecline(match.matchId)}
              className="group flex flex-1 lg:flex-none items-center justify-center gap-2 rounded-2xl bg-white/5 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 active:scale-95 disabled:opacity-50"
            >
              <XCircle size={16} />
              Decline
            </button>
            
            <button
              disabled={loading}
              onClick={() => onAccept(match.matchId)}
              className="flex flex-1 lg:flex-none items-center justify-center gap-3 rounded-2xl bg-blue-600 px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-900/40 transition-all hover:bg-blue-500 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle size={16} />
              Confirm Availability
            </button>
          </div>
        </div>

        {/* Subtle Background Pattern */}
        <div className="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none rotate-12">
            <HeartPulse size={240} className="text-blue-400" />
        </div>
      </div>
    </div>
  );
};

export default MatchAlertCard;
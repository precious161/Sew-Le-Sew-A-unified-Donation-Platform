import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/layout/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import EventService from '../../../services/EventService';
import { Sun, Moon, MapPin, Users, CheckCircle, Plus, Clock, Calendar } from 'lucide-react';

// --- LEAFLET MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow,
});

const DonorEvents = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await EventService.getPublicEvents();
      if (res.success) setEvents(res.data);
    } catch (error) { console.error("Failed to fetch events", error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleRSVP = async (eventId) => {
    try {
      await EventService.rsvpToEvent(eventId);
      fetchEvents();
    } catch (error) { console.error("Failed to RSVP", error); }
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />

      <main className="flex-1 ml-72 p-10 flex flex-col text-left h-screen overflow-hidden">
        <header className="flex justify-between items-center mb-8 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-medical-red animate-pulse"></div>
             <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Donor Portal • Active Campaigns</h2>
          </div>
          <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-lg">
            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-[#111C44]" />}
          </button>
        </header>

        {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div></div>
        ) : events.length === 0 ? (
             <div className="p-16 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[40px]"><p className="text-gray-400 font-black uppercase tracking-widest">No active events scheduled right now.</p></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-0 pb-10">

            {/* LEFT SIDE: SCROLLING LIST */}
            <div className="overflow-y-auto custom-scrollbar pr-4 space-y-6">
               <div className="mb-6 flex items-center gap-4">
                 <div className="bg-medical-red p-4 rounded-2xl"><Calendar size={24} className="text-white" /></div>
                 <div><h1 className={`text-3xl font-black italic uppercase ${isDarkMode ? 'text-white' : 'text-[#111C44]'}`}>Donation Drives</h1></div>
               </div>

               {events.map((event) => {
                 const isAttending = event.attendees.some(a => a.id === user.id);
                 const dateObj = new Date(event.eventDate);

                 return (
                   <div key={event.id} className={`p-8 rounded-[35px] shadow-lg border flex flex-col justify-between transition-all duration-300 ${isAttending ? 'bg-medical-red/5 border-medical-red/30' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5'}`}>
                       <div className="flex justify-between items-start mb-6">
                         <h3 className={`font-black text-xl uppercase italic tracking-tight pr-4 ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>{event.eventName}</h3>
                         <div className={`w-14 h-14 shrink-0 rounded-2xl flex flex-col items-center justify-center font-black shadow-md ${isAttending ? 'bg-medical-red text-white' : 'bg-[#111C44] text-white'}`}>
                           <span className="text-[9px] uppercase tracking-widest text-white/60 -mb-1">{dateObj.toLocaleString('en-US', { month: 'short' })}</span>
                           <span className="text-xl">{dateObj.getDate()}</span>
                         </div>
                       </div>

                       <div className="space-y-2 mb-6">
                         <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2"><MapPin size={12} className="text-medical-red" /> {event.location}</p>
                         <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2"><Clock size={12} className="text-blue-500" /> {event.startTime} - {event.endTime}</p>
                         <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2"><Users size={12} className="text-green-500" /> {event._count.attendees} Responded</p>
                       </div>

                       <button onClick={() => handleRSVP(event.id)} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isAttending ? 'bg-white dark:bg-[#111C44] text-medical-red border border-medical-red/20' : 'bg-medical-red text-white'}`}>
                         {isAttending ? <><CheckCircle size={14} /> Cancel RSVP</> : <><Plus size={14} /> RSVP Now</>}
                       </button>
                   </div>
                 );
               })}
            </div>

            {/* RIGHT SIDE: THE LEAFLET MAP */}
            <div className="h-full rounded-[45px] overflow-hidden shadow-2xl border-4 border-white dark:border-[#1e293b] relative z-0">
               <MapContainer center={[9.03, 38.74]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                  {events.map(event => (
                    <Marker key={event.id} position={[event.latitude || 9.03, event.longitude || 38.74]}>
                      <Popup className="font-sans">
                        <div className="text-center">
                          <h3 className="font-black text-sm uppercase text-[#111C44] m-0">{event.eventName}</h3>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 mb-2">{event.location}</p>
                          <div className="bg-medical-red/10 text-medical-red px-3 py-1 rounded-full text-[9px] font-black uppercase inline-block">
                            {new Date(event.eventDate).toLocaleDateString()} @ {event.startTime}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
               </MapContainer>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default DonorEvents;
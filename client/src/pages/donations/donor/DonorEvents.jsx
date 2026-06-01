import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/layout/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import EventService from '../../../services/EventService';
import { Sun, Moon, MapPin, Users, CheckCircle, Plus, Clock, Calendar, Menu } from 'lucide-react';

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  if (loading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
        <div className="hidden md:block"><Sidebar isDarkMode={isDarkMode} /></div>
        <main className="flex-1 md:ml-72 p-4 md:p-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block"><Sidebar isDarkMode={isDarkMode} /></div>

      {/* Mobile Sidebar Overlay */}
      <Sidebar isDarkMode={isDarkMode} isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      <main className="flex-1 md:ml-72 w-full flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#0b1121] border-b border-gray-100 dark:border-white/5 sticky top-0 z-50">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="bg-medical-red p-2.5 rounded-xl shadow-lg"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5">
              {isDarkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-[#111C44]" />}
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center p-10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-medical-red animate-pulse"></div>
            <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
              Donor Portal • Active Campaigns
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-lg">
              {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-[#111C44]" />}
            </button>
          </div>
        </div>

        {/* Content - Responsive layout: column on mobile, row on desktop */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10">
          {/* Mobile Title */}
          <div className="md:hidden mb-4">
            <h1 className={`text-2xl font-black italic uppercase ${isDarkMode ? 'text-white' : 'text-[#111C44]'}`}>
              Donation Drives
            </h1>
            <p className="text-[10px] text-gray-500">Upcoming events near you</p>
          </div>

          {events.length === 0 ? (
            <div className="p-8 md:p-16 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[30px] md:rounded-[40px]">
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs md:text-sm">No active events scheduled right now.</p>
              <p className="text-gray-400 text-xs mt-2">Check back soon for upcoming donation drives.</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

              {/* LEFT SIDE: EVENT LIST - Takes 1/2 on desktop, full on mobile */}
              <div className="flex-1 lg:w-1/2">
                <div className="hidden md:block mb-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-medical-red p-4 rounded-2xl">
                      <Calendar size={24} className="text-white" />
                    </div>
                    <div>
                      <h1 className={`text-3xl font-black italic uppercase ${isDarkMode ? 'text-white' : 'text-[#111C44]'}`}>
                        Donation Drives
                      </h1>
                      <p className="text-[10px] text-gray-500">Upcoming events near you</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-2">
                  {events.map((event) => {
                    const isAttending = event.attendees?.some(a => a.id === user.id) || false;
                    const dateObj = new Date(event.eventDate);

                    return (
                      <div
                        key={event.id}
                        className={`p-4 md:p-6 rounded-[25px] md:rounded-[35px] shadow-lg border transition-all duration-300 cursor-pointer ${
                          isAttending ? 'bg-medical-red/5 border-medical-red/30' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-medical-red'
                        } ${selectedEvent?.id === event.id ? 'ring-2 ring-medical-red' : ''}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex justify-between items-start mb-3 md:mb-4">
                          <h3 className={`font-black text-base md:text-xl uppercase italic tracking-tight pr-2 md:pr-4 ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                            {event.eventName}
                          </h3>
                          <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl flex flex-col items-center justify-center font-black shadow-md ${isAttending ? 'bg-medical-red text-white' : 'bg-[#111C44] text-white'}`}>
                            <span className="text-[7px] md:text-[9px] uppercase tracking-widest text-white/60 -mb-1">
                              {dateObj.toLocaleString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-base md:text-xl">{dateObj.getDate()}</span>
                          </div>
                        </div>

                        <div className="space-y-1 md:space-y-2 mb-3 md:mb-4">
                          <p className="text-[8px] md:text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1 md:gap-2">
                            <MapPin size={10} className="md:size-[12px] text-medical-red" /> {event.location}
                          </p>
                          <p className="text-[8px] md:text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1 md:gap-2">
                            <Clock size={10} className="md:size-[12px] text-blue-500" /> {event.startTime} - {event.endTime}
                          </p>
                          <p className="text-[8px] md:text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1 md:gap-2">
                            <Users size={10} className="md:size-[12px] text-green-500" /> {event._count?.attendees || 0} Responded
                          </p>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRSVP(event.id);
                          }}
                          className={`w-full py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 md:gap-2 ${
                            isAttending
                              ? 'bg-white dark:bg-[#111C44] text-medical-red border border-medical-red/20'
                              : 'bg-medical-red text-white'
                          }`}
                        >
                          {isAttending ? <><CheckCircle size={12} className="md:size-[14px]" /> Cancel RSVP</> : <><Plus size={12} className="md:size-[14px]" /> RSVP Now</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT SIDE: MAP - Always visible, full width on mobile, half on desktop */}
              <div className="lg:w-1/2 mt-6 lg:mt-0">
                <div className="mb-3 md:mb-4">
                  <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-medical-red flex items-center gap-2">
                    <MapPin size={14} className="md:size-[16px]" /> Event Locations Map
                  </h3>
                  <p className="text-[8px] md:text-[10px] text-gray-500">Click on markers for event details</p>
                </div>

                <div className="h-64 sm:h-80 md:h-[calc(100vh-200px)] rounded-[20px] md:rounded-[30px] overflow-hidden shadow-xl border-2 border-white dark:border-[#1e293b] relative z-0">
                  <MapContainer
                    center={[9.03, 38.74]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {events.map(event => (
                      <Marker
                        key={event.id}
                        position={[event.latitude || 9.03, event.longitude || 38.74]}
                        eventHandlers={{
                          click: () => setSelectedEvent(event)
                        }}
                      >
                        <Popup>
                          <div className="text-center min-w-[150px]">
                            <h3 className="font-black text-sm uppercase text-[#111C44]">{event.eventName}</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{event.location}</p>
                            <div className="bg-medical-red/10 text-medical-red px-3 py-1 rounded-full text-[9px] font-black uppercase inline-block mt-2">
                              {new Date(event.eventDate).toLocaleDateString()} @ {event.startTime}
                            </div>
                            <button
                              onClick={() => handleRSVP(event.id)}
                              className="mt-3 w-full px-3 py-1.5 bg-medical-red text-white rounded-lg text-[9px] font-black uppercase"
                            >
                              RSVP Now
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

                {/* Selected Event Info (Mobile friendly) */}
                {selectedEvent && (
                  <div className="mt-4 p-4 bg-white dark:bg-[#111C44] rounded-xl shadow-lg border border-gray-100 dark:border-white/10 lg:hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-medical-red uppercase text-sm">{selectedEvent.eventName}</h4>
                        <p className="text-[10px] text-gray-500 mt-1">{selectedEvent.location}</p>
                        <p className="text-[9px] text-gray-400 mt-1">
                          {new Date(selectedEvent.eventDate).toLocaleDateString()} • {selectedEvent.startTime} - {selectedEvent.endTime}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const isAttending = selectedEvent.attendees?.some(a => a.id === user.id);
                          handleRSVP(selectedEvent.id);
                        }}
                        className="px-4 py-2 bg-medical-red text-white rounded-xl text-[9px] font-black uppercase"
                      >
                        RSVP
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DonorEvents;
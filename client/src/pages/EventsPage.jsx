import React, { useState, useEffect } from 'react';
import Navbar from './landing/components/Navbar';
import Footer from './landing/components/Footer';
import { MapPin, Users, CheckCircle, Plus, Clock, LogIn } from 'lucide-react';
import EventService from '../services/EventService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const res = await EventService.getPublicEvents();
      if (res.success) {
        setEvents(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRSVP = async (eventId) => {
    if (!user) {
      // Redirect to login if not logged in
      navigate('/login', { state: { from: '/events', message: 'Please login to RSVP for events' } });
      return;
    }

    if (user.Role !== 'Donor') {
      alert('Only donors can RSVP for events. Please register as a donor.');
      return;
    }

    try {
      await EventService.rsvpToEvent(eventId);
      fetchEvents(); // Refresh data
    } catch (error) {
      console.error("Failed to RSVP", error);
      alert('Failed to RSVP. Please try again.');
    }
  };

  // Format Date (e.g., "May 12")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return { month, day };
  };

  // Check if event was updated recently
  const isUpdated = (event) => {
    if (!event.updatedAt || !event.createdAt) return false;
    return new Date(event.updatedAt).getTime() - new Date(event.createdAt).getTime() > 5000;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0f172a] transition-colors duration-500">
      <Navbar />
      <main className="flex-1 pt-44 pb-32 px-6 md:px-20 max-w-5xl mx-auto w-full">

        <div className="mb-16">
          <h1 className="text-5xl font-black italic tracking-tighter text-[#1B2559] dark:text-white uppercase mb-4">
            Donation Drives
          </h1>
          <p className="text-gray-400 dark:text-white/40 font-bold text-sm tracking-widest uppercase">
            Connecting generosity with necessity across Addis Ababa.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[40px]">
            <p className="text-gray-400 font-black uppercase tracking-widest">No active events scheduled right now.</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for upcoming donation drives.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {events.map((event) => {
              const date = formatDate(event.eventDate);
              const attending = event.attendees?.length || 0;
              const updated = isUpdated(event);
              const isAttending = user && event.attendees?.some(a => a.id === user.id);
              const isLoggedIn = !!user;
              const isDonor = user?.Role === 'Donor';

              return (
                <div
                  key={event.id}
                  className={`p-8 rounded-[40px] shadow-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group transition-all duration-300 ${
                    isAttending
                      ? 'bg-medical-red/5 border-medical-red/30 dark:bg-medical-red/10 dark:border-medical-red/30'
                      : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-medical-red'
                  }`}
                >
                  <div className="flex items-center gap-8">
                    {/* Date Cube */}
                    <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-black shadow-lg ${
                      isAttending ? 'bg-medical-red text-white' : 'bg-[#111C44] text-white'
                    }`}>
                      <span className="text-xs uppercase tracking-widest text-white/60 mb-[-4px]">{date.month}</span>
                      <span className="text-3xl tracking-tighter">{date.day}</span>
                    </div>

                    {/* Event Details */}
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-black text-2xl text-[#1B2559] dark:text-white tracking-tight uppercase italic">
                          {event.eventName}
                        </h3>
                        {updated && (
                          <span className="px-3 py-1 bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-yellow-400/30">
                            Recently Updated
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                        <span className="flex items-center gap-1"><MapPin size={12} className="text-medical-red" /> {event.location}</span>
                        <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500" /> {event.startTime} - {event.endTime}</span>
                        <span className="flex items-center gap-1"><Users size={12} className="text-green-500" /> {attending} Attending</span>
                      </div>

                      {event.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 max-w-lg leading-relaxed font-medium">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button - FIXED: Now clickable for unregistered users */}
                  <div className="w-full md:w-auto flex justify-end mt-6 md:mt-0">
                    {!isLoggedIn ? (
                      <button
                        onClick={() => handleRSVP(event.id)}
                        className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <LogIn size={16} /> Login to RSVP
                      </button>
                    ) : isDonor ? (
                      <button
                        onClick={() => handleRSVP(event.id)}
                        className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl ${
                          isAttending
                            ? 'bg-white dark:bg-[#111C44] text-medical-red border border-medical-red/20 hover:bg-medical-red hover:text-white'
                            : 'bg-medical-red text-white hover:bg-red-700'
                        }`}
                      >
                        {isAttending ? (
                          <><CheckCircle size={16} /> RSVP Confirmed</>
                        ) : (
                          <><Plus size={16} /> RSVP Now</>
                        )}
                      </button>
                    ) : (
                      <div className="px-8 py-4 rounded-2xl bg-gray-200 dark:bg-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                        Only Donors Can RSVP
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EventsPage;
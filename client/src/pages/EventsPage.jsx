import React, { useState, useEffect } from 'react';
import Navbar from './landing/components/Navbar';
import Footer from './landing/components/Footer';
import { MapPin, Users, CheckCircle, Plus, Clock } from 'lucide-react';
import EventService from '../services/EventService';
import { useAuth } from '../hooks/useAuth';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // To check if logged in and if user is a Donor

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
    try {
      await EventService.rsvpToEvent(eventId);
      fetchEvents(); // Refresh data to update attendee count and RSVP status
    } catch (error) {
      console.error("Failed to RSVP", error);
    }
  };

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

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[40px]">
            <p className="text-gray-400 font-black uppercase tracking-widest">No active events scheduled right now.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                user={user}
                onRSVP={handleRSVP}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const EventCard = ({ event, user, onRSVP }) => {
  // Check if current user is already in the attendees list
  const isAttending = event.attendees.some(attendee => attendee.id === user?.id);
  const isDonor = user?.Role === 'Donor';

  // Format Date (e.g., "May 12")
  const dateObj = new Date(event.eventDate);
  const month = dateObj.toLocaleString('en-US', { month: 'short' });
  const day = dateObj.getDate();

  // THE MAGIC: Check if it was updated recently (more than 5 seconds after creation)
  const isUpdated = new Date(event.updatedAt).getTime() - new Date(event.createdAt).getTime() > 5000;

  return (
    <div className={`p-8 rounded-[40px] shadow-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group transition-all duration-300 ${
      isAttending
        ? 'bg-medical-red/5 border-medical-red/30 dark:bg-medical-red/10 dark:border-medical-red/30'
        : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-medical-red'
    }`}>

      <div className="flex items-center gap-8">
        {/* Date Cube */}
        <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-black shadow-lg ${
          isAttending ? 'bg-medical-red text-white' : 'bg-[#111C44] text-white'
        }`}>
          <span className="text-xs uppercase tracking-widest text-white/60 mb-[-4px]">{month}</span>
          <span className="text-3xl tracking-tighter">{day}</span>
        </div>

        {/* Event Details */}
        <div className="text-left flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-black text-2xl text-[#1B2559] dark:text-white tracking-tight uppercase italic">
              {event.eventName}
            </h3>

            {/* THE NEW UPDATED BADGE */}
            {isUpdated && (
              <span className="px-3 py-1 bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-yellow-400/30 animate-pulse">
                Recently Updated
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">
            <span className="flex items-center gap-1"><MapPin size={12} className="text-medical-red" /> {event.location}</span>
            <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500" /> {event.startTime} - {event.endTime}</span>
            <span className="flex items-center gap-1"><Users size={12} className="text-green-500" /> {event._count.attendees} Attending</span>
          </div>

          {event.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 max-w-lg leading-relaxed font-medium">
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div className="w-full md:w-auto flex justify-end mt-6 md:mt-0">
        {isDonor ? (
          <button
            onClick={() => onRSVP(event.id)}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl ${
              isAttending
                ? 'bg-white dark:bg-[#111C44] text-medical-red border border-medical-red/20 hover:bg-medical-red hover:text-white'
                : 'bg-medical-red text-white hover:bg-red-700 hover:scale-105'
            }`}
          >
            {isAttending ? (
              <><CheckCircle size={16} /> RSVP Confirmed</>
            ) : (
              <><Plus size={16} /> RSVP Now</>
            )}
          </button>
        ) : !user ? (
          <span className="px-5 py-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-300 dark:border-white/10">
            Log in to RSVP
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default EventsPage;
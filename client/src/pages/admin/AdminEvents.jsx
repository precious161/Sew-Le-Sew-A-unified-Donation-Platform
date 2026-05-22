import React, { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import EventService from '../../services/EventService';
import {
  Sun, Moon, Plus, Calendar as CalendarIcon, MapPin,
  Clock, Users, CheckCircle, XCircle, Activity, X, Edit3
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const AdminEvents = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null); // <-- NEW STATE

  const [formData, setFormData] = useState({
    eventName: '', description: '', location: '', eventDate: '', startTime: '', endTime: '',
    latitude: 9.03, longitude: 38.74
  });

  const fetchEvents = async () => {
    try {
      const res = await EventService.getAdminEvents(1, 50);
      if (res.success) setEvents(res.events);
    } catch (error) { console.error("Failed to fetch events", error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  // Open modal for NEW event
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ eventName: '', description: '', location: '', eventDate: '', startTime: '', endTime: '', latitude: 9.03, longitude: 38.74 });
    setIsModalOpen(true);
  };

  // Open modal for EDITING event
  const openEditModal = (event) => {
    setEditingId(event.id);
    setFormData({
      eventName: event.eventName,
      description: event.description || '',
      location: event.location,
      eventDate: event.eventDate.split('T')[0], // format for HTML date input
      startTime: event.startTime,
      endTime: event.endTime,
      latitude: event.latitude || 9.03,
      longitude: event.longitude || 38.74
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await EventService.updateEvent(editingId, formData);
      } else {
        await EventService.createEvent(formData);
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) { console.error("Failed to save event", error); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await EventService.updateEventStatus(id, status);
      fetchEvents();
    } catch (error) { console.error("Failed to update status", error); }
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />
      <main className="flex-1 ml-72 p-10 flex flex-col text-left h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse"></div>
             <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>System Hub • Event Coordination</h2>
          </div>
          <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-lg">
            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-[#111C44]" />}
          </button>
        </header>

        <div className="flex-1 max-w-6xl mx-auto w-full animate-in fade-in duration-700">
          <div className="flex justify-between items-end mb-10">
            <div className="flex items-center gap-4">
              <div className="bg-[#111C44] p-4 rounded-2xl shadow-lg"><CalendarIcon size={32} className="text-[#FFB800]" /></div>
              <div>
                <h1 className={`text-4xl font-black italic tracking-tighter uppercase ${isDarkMode ? 'text-white' : 'text-[#111C44]'}`}>Event Registry</h1>
              </div>
            </div>
            <button onClick={openCreateModal} className="bg-medical-red hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
              <Plus size={16} /> Deploy Campaign
            </button>
          </div>

          {loading ? ( <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div></div> )
          : events.length === 0 ? ( <div className="p-16 text-center border-2 border-dashed border-gray-200 rounded-[40px]"><p className="text-gray-400 font-black uppercase">No events deployed.</p></div> )
          : (
             <div className="grid gap-6">
               {events.map((event) => (
                 <div key={event.id} className={`p-8 rounded-[40px] shadow-xl border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'}`}>
                   <div className="flex-1">
                     <div className="flex items-center gap-4 mb-3">
                       <h3 className={`font-black text-2xl uppercase italic tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>{event.eventName}</h3>
                       <span className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${event.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>{event.status}</span>
                     </div>
                     <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-4">
                       <span className="flex items-center gap-1"><CalendarIcon size={12}/> {new Date(event.eventDate).toLocaleDateString()}</span>
                       <span className="flex items-center gap-1"><Clock size={12}/> {event.startTime} - {event.endTime}</span>
                       <span className="flex items-center gap-1"><MapPin size={12}/> {event.location}</span>
                     </div>
                   </div>
                   {event.status === 'Active' && (
                     <div className="flex items-center gap-3 w-full lg:w-auto">
                       {/* THE NEW EDIT BUTTON */}
                       <button onClick={() => openEditModal(event)} className="px-6 py-3 rounded-2xl bg-gray-500/10 text-gray-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-600 hover:text-white transition-all"><Edit3 size={14} /> Edit</button>
                       <button onClick={() => handleStatusChange(event.id, 'Completed')} className="px-6 py-3 rounded-2xl bg-blue-500/10 text-blue-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all"><CheckCircle size={14} /> Complete</button>
                       <button onClick={() => handleStatusChange(event.id, 'Cancelled')} className="px-6 py-3 rounded-2xl bg-red-500/10 text-red-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-medical-red hover:text-white transition-all"><XCircle size={14} /> Cancel</button>
                     </div>
                   )}
                 </div>
               ))}
             </div>
          )}
        </div>
      </main>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-2xl p-10 rounded-[45px] shadow-2xl relative border my-10 ${isDarkMode ? 'bg-[#0b1121] border-white/10' : 'bg-white border-gray-100'}`}>
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-400"><X size={24} /></button>
            <h2 className={`text-3xl font-black italic tracking-tighter uppercase mb-6 ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              {editingId ? "Update Campaign" : "Create Campaign"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 ml-2 uppercase">Event Name</label>
                <input required type="text" value={formData.eventName} onChange={(e) => setFormData({...formData, eventName: e.target.value})} className={`w-full p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none outline-none font-bold text-sm dark:text-white`} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[9px] font-black text-gray-400 ml-2 uppercase">Event Date</label>
                  <input required type="date" value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})} className={`w-full p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none outline-none font-bold text-sm dark:text-white`} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 ml-2 uppercase">Address Name</label>
                  <input required type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className={`w-full p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none outline-none font-bold text-sm dark:text-white`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[9px] font-black text-gray-400 ml-2 uppercase">Start Time</label>
                  <input required type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className={`w-full p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none outline-none font-bold text-sm dark:text-white`} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 ml-2 uppercase">End Time</label>
                  <input required type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} className={`w-full p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none outline-none font-bold text-sm dark:text-white`} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-medical-red ml-2 uppercase flex items-center gap-1"><MapPin size={10}/> Exact Location</label>
                <div className="h-56 w-full rounded-[25px] overflow-hidden shadow-inner border border-gray-200 dark:border-white/10">
                  <LocationPicker
                    defaultPosition={[formData.latitude, formData.longitude]}
                    onLocationSelect={(lat, lng) => setFormData({...formData, latitude: lat, longitude: lng})}
                  />
                </div>
              </div>

              <button disabled={submitting} type="submit" className="w-full bg-[#111C44] dark:bg-white text-white dark:text-[#111C44] py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl mt-4">
                {submitting ? 'Saving...' : (editingId ? 'Update Network' : 'Deploy to Network')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const LocationPicker = ({ defaultPosition, onLocationSelect }) => {
  const [position, setPosition] = useState(defaultPosition);
  const markerRef = useRef(null);

  // Update map pin if defaultPosition changes (like when clicking Edit)
  useEffect(() => { setPosition(defaultPosition); }, [defaultPosition]);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const eventHandlers = useMemo(() => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          setPosition([latLng.lat, latLng.lng]);
          onLocationSelect(latLng.lat, latLng.lng);
        }
      },
    }), [onLocationSelect]);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents />
        <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef} />
      </MapContainer>
    </div>
  );
};

export default AdminEvents;
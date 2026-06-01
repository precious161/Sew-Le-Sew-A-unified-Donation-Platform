import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import NotificationHub from '../../components/notifications/NotificationHub';
import { useTheme } from '../../context/ThemeContext';
import EventService from '../../services/EventService';
import {
  Sun, Moon, Plus, Calendar as CalendarIcon, MapPin,
  Clock, Users, CheckCircle, XCircle, Activity, X, Edit3, AlertTriangle, Menu,
  Filter, Eye
} from 'lucide-react';

// --- LEAFLET MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const AdminEvents = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // NEW: Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    eventName: '', description: '', location: '', eventDate: '', startTime: '', endTime: '',
    latitude: 9.03, longitude: 38.74
  });

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
      const res = await EventService.getAdminEvents(1, 100);
      if (res.success) {
        setEvents(res.events);
        setFilteredEvents(res.events);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  // Apply filters whenever events, statusFilter, or searchTerm changes
  useEffect(() => {
    let filtered = [...events];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    // Filter by search term (event name or location)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.eventName.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term)
      );
    }

    setFilteredEvents(filtered);
  }, [events, statusFilter, searchTerm]);

  const openCreateModal = () => {
    setEditingId(null);
    setErrorMsg("");
    setFormData({ eventName: '', description: '', location: '', eventDate: '', startTime: '', endTime: '', latitude: 9.03, longitude: 38.74 });
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    setEditingId(event.id);
    setErrorMsg("");
    setFormData({
      eventName: event.eventName,
      description: event.description || '',
      location: event.location,
      eventDate: event.eventDate.split('T')[0],
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
    setErrorMsg("");
    try {
      if (editingId) {
        await EventService.updateEvent(editingId, formData);
      } else {
        await EventService.createEvent(formData);
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      const apiError = error.response?.data;
      if (apiError?.errors && apiError.errors.length > 0) {
        setErrorMsg(apiError.errors[0].message);
      } else {
        setErrorMsg(apiError?.message || "An error occurred while saving the event.");
      }
    }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await EventService.updateEventStatus(id, status);
      fetchEvents();
    } catch (error) { console.error("Failed to update status", error); }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Active':
        return { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: <Activity size={12} className="mr-1" /> };
      case 'Completed':
        return { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: <CheckCircle size={12} className="mr-1" /> };
      case 'Cancelled':
        return { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: <XCircle size={12} className="mr-1" /> };
      default:
        return { color: 'bg-gray-500/10 text-gray-500', icon: null };
    }
  };

  // Get filter count
  const getFilterCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (searchTerm) count++;
    return count;
  };

  if (loading) return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#0b1121]' : 'bg-gray-50'}`}>
      <Sidebar isDarkMode={isDarkMode} />
      <main className="flex-1 md:ml-72 p-4 md:p-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-medical-red"></div>
      </main>
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isDarkMode={isDarkMode} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <Sidebar isDarkMode={isDarkMode} isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 md:ml-72 w-full">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#0b1121] border-b border-gray-100 dark:border-white/5 sticky top-0 z-50">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="bg-medical-red p-2.5 rounded-xl shadow-lg"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <NotificationHub isDarkMode={isDarkMode} />
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl shadow-lg transition-all ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-[#111C44] text-white'}`}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-10">
          {/* Mobile Title */}
          <div className="md:hidden mb-6">
            <h1 className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              Event Registry
            </h1>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse"></div>
              <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
                System Hub • Event Coordination
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-lg hover:scale-110 transition-all">
                {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-[#111C44]" />}
              </button>
            </div>
          </div>

          {/* Action Bar - Responsive */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-[#111C44] p-3 md:p-4 rounded-2xl shadow-lg">
                <CalendarIcon size={24} className="md:size-[32px] text-[#FFB800]" />
              </div>
              <div>
                <h1 className={`text-2xl md:text-4xl font-black italic tracking-tighter uppercase ${isDarkMode ? 'text-white' : 'text-[#111C44]'}`}>
                  Event Registry
                </h1>
                <p className="text-[9px] md:text-[10px] text-gray-500 mt-1">Manage donation drives</p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-medical-red hover:bg-red-700 text-white px-5 md:px-8 py-2.5 md:py-4 rounded-2xl font-black text-[9px] md:text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all"
            >
              <Plus size={14} className="md:size-[16px]" /> Deploy Campaign
            </button>
          </div>

          {/* FILTER SECTION - NEW */}
          <div className="mb-6 p-4 md:p-5 rounded-2xl bg-white dark:bg-[#111C44] shadow-lg border border-gray-100 dark:border-white/5">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              {/* Status Filter Buttons */}
              <div className="flex-1">
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-2">Status Filter</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                      statusFilter === 'all'
                        ? 'bg-medical-red text-white shadow-md'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-medical-red/20'
                    }`}
                  >
                    All ({events.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('Active')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                      statusFilter === 'Active'
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-green-500/20'
                    }`}
                  >
                    <Activity size={12} /> Active ({events.filter(e => e.status === 'Active').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('Completed')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                      statusFilter === 'Completed'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-blue-500/20'
                    }`}
                  >
                    <CheckCircle size={12} /> Completed ({events.filter(e => e.status === 'Completed').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('Cancelled')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                      statusFilter === 'Cancelled'
                        ? 'bg-red-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-red-500/20'
                    }`}
                  >
                    <XCircle size={12} /> Cancelled ({events.filter(e => e.status === 'Cancelled').length})
                  </button>
                </div>
              </div>

              {/* Search Input */}
              <div className="md:w-64">
                <label className="text-[9px] font-black uppercase text-gray-400 block mb-2">Search Events</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border-none outline-none text-sm dark:text-white focus:ring-2 focus:ring-medical-red"
                  />
                  <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-medical-red"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {getFilterCount() > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-2 flex-wrap">
                <span className="text-[8px] font-black text-gray-400 uppercase">Active Filters:</span>
                {statusFilter !== 'all' && (
                  <span className="px-2 py-1 bg-medical-red/10 text-medical-red rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('all')} className="hover:text-medical-red"><X size={10} /></button>
                  </span>
                )}
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
                    Search: {searchTerm}
                    <button onClick={() => setSearchTerm('')} className="hover:text-blue-500"><X size={10} /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Events Grid */}
          <div className="grid gap-4 md:gap-6">
            {filteredEvents.length === 0 ? (
              <div className="p-12 md:p-16 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[30px] md:rounded-[40px]">
                <Eye size={40} className="mx-auto text-gray-400 mb-3 opacity-50" />
                <p className="text-gray-400 font-black uppercase text-[10px] md:text-xs">No events found</p>
                <p className="text-gray-400 text-[9px] mt-2">
                  {statusFilter !== 'all' || searchTerm
                    ? "Try changing your filters"
                    : "Click 'Deploy Campaign' to create your first event"}
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const statusStyle = getStatusBadge(event.status);
                return (
                  <div key={event.id} className={`p-5 md:p-8 rounded-[30px] md:rounded-[40px] shadow-xl border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} hover:shadow-2xl transition-shadow`}>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2 md:mb-3">
                        <h3 className={`font-black text-lg md:text-2xl uppercase italic tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
                          {event.eventName}
                        </h3>
                        <span className={`px-2 md:px-4 py-1 md:py-1.5 rounded-full border text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center ${statusStyle.color}`}>
                          {statusStyle.icon} {event.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[8px] md:text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                        <span className="flex items-center gap-1"><CalendarIcon size={10} className="md:size-[12px]"/> {new Date(event.eventDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={10} className="md:size-[12px]"/> {event.startTime} - {event.endTime}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} className="md:size-[12px]"/> {event.location}</span>
                        <span className="flex items-center gap-1"><Users size={10} className="md:size-[12px]"/> {event._count?.attendees || 0} RSVP'd</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
                      <button onClick={() => openEditModal(event)} className="flex-1 lg:flex-none px-4 md:px-6 py-2 md:py-3 rounded-2xl bg-gray-500/10 text-gray-500 font-black text-[8px] md:text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 md:gap-2 hover:bg-gray-600 hover:text-white transition-all">
                        <Edit3 size={12} className="md:size-[14px]" /> Edit
                      </button>
                      {event.status === 'Active' && (
                        <>
                          <button onClick={() => handleStatusChange(event.id, 'Completed')} className="flex-1 lg:flex-none px-4 md:px-6 py-2 md:py-3 rounded-2xl bg-blue-500/10 text-blue-500 font-black text-[8px] md:text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 md:gap-2 hover:bg-blue-600 hover:text-white transition-all">
                            <CheckCircle size={12} className="md:size-[14px]" /> Complete
                          </button>
                          <button onClick={() => handleStatusChange(event.id, 'Cancelled')} className="flex-1 lg:flex-none px-4 md:px-6 py-2 md:py-3 rounded-2xl bg-red-500/10 text-red-500 font-black text-[8px] md:text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 md:gap-2 hover:bg-medical-red hover:text-white transition-all">
                            <XCircle size={12} className="md:size-[14px]" /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* CREATE/EDIT MODAL - Responsive */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-2xl p-6 md:p-10 rounded-[35px] md:rounded-[45px] shadow-2xl relative border my-10 ${isDarkMode ? 'bg-[#0b1121] border-white/10' : 'bg-white border-gray-100'}`}>
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 md:top-8 right-4 md:right-8 text-gray-400 hover:text-medical-red transition-colors">
              <X size={20} className="md:size-[24px]" />
            </button>
            <h2 className={`text-2xl md:text-3xl font-black italic tracking-tighter uppercase mb-4 md:mb-6 ${isDarkMode ? 'text-white' : 'text-[#1B2559]'}`}>
              {editingId ? "Update Campaign" : "Create Campaign"}
            </h2>

            {errorMsg && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2 md:gap-3 text-red-500">
                <AlertTriangle size={14} className="md:size-[18px]" />
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div>
                <label className="text-[8px] md:text-[9px] font-black text-gray-400 ml-2 uppercase">Event Name</label>
                <input required type="text" value={formData.eventName} onChange={(e) => setFormData({...formData, eventName: e.target.value})} className={`w-full p-3 md:p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none outline-none font-bold text-sm dark:text-white`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
                <div>
                  <label className="text-[8px] md:text-[9px] font-black text-gray-400 ml-2 uppercase">Event Date</label>
                  <input required type="date" value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})} className={`w-full p-3 md:p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none outline-none font-bold text-sm dark:text-white`} />
                </div>
                <div>
                  <label className="text-[8px] md:text-[9px] font-black text-gray-400 ml-2 uppercase">Address Name</label>
                  <input required type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className={`w-full p-3 md:p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none outline-none font-bold text-sm dark:text-white`} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
                <div>
                  <label className="text-[8px] md:text-[9px] font-black text-gray-400 ml-2 uppercase">Start Time</label>
                  <input required type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className={`w-full p-3 md:p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none outline-none font-bold text-sm dark:text-white`} />
                </div>
                <div>
                  <label className="text-[8px] md:text-[9px] font-black text-gray-400 ml-2 uppercase">End Time</label>
                  <input required type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} className={`w-full p-3 md:p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none outline-none font-bold text-sm dark:text-white`} />
                </div>
              </div>

              {/* Map Section */}
              <div className="space-y-1">
                <label className="text-[8px] md:text-[9px] font-black text-medical-red ml-2 uppercase flex items-center gap-1">
                  <MapPin size={10} className="md:size-[12px]"/> Exact Location
                </label>
                <div className="h-48 md:h-56 w-full rounded-[20px] md:rounded-[25px] overflow-hidden shadow-inner border border-gray-200 dark:border-white/10 relative">
                  <MapWrapper
                    defaultPosition={[formData.latitude, formData.longitude]}
                    onLocationSelect={(lat, lng) => setFormData({...formData, latitude: lat, longitude: lng})}
                  />
                </div>
              </div>

              <button disabled={submitting} type="submit" className="w-full bg-[#111C44] dark:bg-white text-white dark:text-[#111C44] py-3 md:py-5 rounded-3xl font-black text-[9px] md:text-xs uppercase tracking-[0.3em] shadow-xl mt-4 hover:scale-[1.02] transition-transform">
                {submitting ? 'Saving...' : (editingId ? 'Update Network' : 'Deploy to Network')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CORE MAP LOGIC ---
const LocationPicker = ({ defaultPosition, onLocationSelect }) => {
  const [position, setPosition] = useState(defaultPosition);
  const markerRef = useRef(null);
  const map = useMap();

  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 100);
  }, [map]);

  useEffect(() => {
    setPosition(defaultPosition);
    map.setView(defaultPosition);
  }, [defaultPosition, map]);

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
    <>
      <div className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 z-[400] bg-[#111C44]/90 backdrop-blur-md text-white text-[7px] md:text-[9px] font-black uppercase tracking-widest px-3 md:px-6 py-1.5 md:py-2 rounded-full shadow-lg pointer-events-none text-center whitespace-nowrap">
        Click map or drag pin
      </div>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapEvents />
      <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef} />
    </>
  );
};

const MapWrapper = (props) => {
  return (
    <MapContainer center={props.defaultPosition} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <LocationPicker {...props} />
    </MapContainer>
  );
};

export default AdminEvents;
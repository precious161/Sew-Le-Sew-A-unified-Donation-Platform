import api from '../api/axios';

const EventService = {
  // ── PUBLIC & DONOR ROUTES ──
  getPublicEvents: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  rsvpToEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/rsvp`);
    return response.data;
  },

  // ── ADMIN ROUTES ──
  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  getAdminEvents: async (page = 1, limit = 20) => {
    const response = await api.get(`/events/admin?page=${page}&limit=${limit}`);
    return response.data;
  },

  updateEventStatus: async (eventId, status) => {
    const response = await api.patch(`/events/${eventId}/status`, { status });
    return response.data;
  }
};

updateEvent: async (eventId, eventData) => {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  };

export default EventService;
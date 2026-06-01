import api from '../api/axios';

const AnalyticsService = {
  /**
   * Get public statistics for landing page (no auth required)
   * @returns {Promise<{success: boolean, data: object}>}
   */
  getPublicStats: async () => {
    try {
      const response = await api.get('/ai/analytics/public-stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch public stats:', error);
      return { success: false, data: null };
    }
  },

  /**
   * Get real-time statistics for admin dashboard (Admin only)
   * @returns {Promise<{success: boolean, data: object}>}
   */
  getStats: async () => {
    try {
      const response = await api.get('/ai/analytics/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return { success: false, data: null };
    }
  },

  /**
   * Get AI-powered predictions (Admin only)
   * @returns {Promise<{success: boolean, data: object}>}
   */
  getPredictions: async () => {
    try {
      const response = await api.get('/ai/analytics/predictions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
      return { success: false, data: null };
    }
  },

  /**
   * Export analytics as PDF (Admin Only)
   */
  exportPDFReport: async () => {
    try {
      const response = await api.get('/ai/analytics/export/pdf', {
        responseType: 'blob', // Required to handle file downloads properly
      });

      // Safely create a download link for the PDF blob
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `sew_lesew_analytics_${date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('PDF Export failed:', error);
      return { success: false };
    }
  },

  /**
   * Export analytics as CSV file (Admin only)
   */
  exportReport: async () => {
    try {
      // FIXED: Route updated to match backend (/export/csv)
      const response = await api.get('/ai/analytics/export/csv', {
        responseType: 'blob', // Required to handle file downloads properly
      });

      // Safely create a download link for the CSV blob
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `sew_lesew_analytics_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('CSV Export failed:', error);
      return { success: false };
    }
  },
};

export default AnalyticsService;
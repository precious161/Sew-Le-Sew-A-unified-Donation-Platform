import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Ensure this matches your friend's backend port
        changeOrigin: true,
        secure: false,
        // Uncomment the line below if the backend routes do NOT start with /api
        // rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
});
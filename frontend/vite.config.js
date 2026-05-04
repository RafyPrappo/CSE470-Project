import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Render backend URL – fallback if VITE_API_URL env var is missing
const BACKEND_URL = process.env.VITE_API_URL || 'https://techaesthetics.onrender.com'

export default defineConfig({
  plugins: [react()],
  define: {
    // Inject the backend URL as a compile-time constant
    __API_URL__: JSON.stringify(BACKEND_URL),
  },
})
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Define global constants replacement to make process.env work in browser
    define: {
      'process.env': {
        // Map VITE_API_KEY (from Vercel) to API_KEY (used in code)
        API_KEY: env.VITE_API_KEY || env.API_KEY,
        // Map Supabase keys
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
        VITE_SUPABASE_KEY: env.VITE_SUPABASE_KEY,
        // Standard Node env
        NODE_ENV: mode,
      }
    },
    build: {
      outDir: 'dist',
    },
  };
});
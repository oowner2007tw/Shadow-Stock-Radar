import { createClient } from '@supabase/supabase-js';

// Try to get from Env vars (Best Practice for Vercel), fallback to hardcoded (for immediate demo)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ntlmothsjvhdvcykcvex.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bG1vdGhzanZoZHZjeWtjdmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NzEwMzIsImV4cCI6MjA4MTE0NzAzMn0.Fk2zZB7myLQnwx4Hiw678ggQYZ8ZaZDAW7UHH8eobO0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
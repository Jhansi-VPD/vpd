import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yxkrdhrcunxqhwkgqhex.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4a3JkaHJjdW54cWh3a2dxaGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzUzMTksImV4cCI6MjEwNjg1MTMxOX0.8hqLgKRciO9LR3V9iktIlna839pe0yUzMJtbGiPl5F8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    detectSessionInUrl: true,
  },
});


import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// createClient throws on empty url/key, so creation is deferred to first use —
// a missing env var must fail loudly here, not brick the bundle at import time.
let client = null;

export const supabase = {
  // AuthContext consumes only .auth; keeping the export narrow makes any other
  // use a loud error rather than a silent no-op.
  get auth() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error(
        'Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    if (!client) {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    }
    return client.auth;
  },
};


import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wcxtekmihkypevjdfffs.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeHRla21paGt5cGV2amRmZmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODA4MTcsImV4cCI6MjA4MTM0MDgxN30.7TYMgH5Gj4rPHl8XgR_VDYN8A4z44JRdh2ew4eXdvho';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Resolves once a valid JWT exists (anonymous or real).
// MUST be awaited before any realtime subscription is created —
// subscriptions without a JWT lag 35-45 s on Supabase (postgres_changes filtered).
export const authReady: Promise<void> = (async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) console.error('[Auth] signInAnonymously failed:', error);
  }
})();

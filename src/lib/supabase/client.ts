import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujxqffdfybsxalvkevqc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeHFmZmRmeWJzeGFsdmtldnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTUxMzQsImV4cCI6MjEwNDYzMTEzNH0.3WbQoxT4uRI98nKDND_BbQe9CM5aWwi7PVyWl0wDD18';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

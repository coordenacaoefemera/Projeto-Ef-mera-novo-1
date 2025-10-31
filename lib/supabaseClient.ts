import { createClient } from '@supabase/supabase-js';

const supabaseUrl = localStorage.getItem('supabaseUrl');
const supabaseKey = localStorage.getItem('supabaseKey');

export const supabaseClient = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = !!supabaseClient;

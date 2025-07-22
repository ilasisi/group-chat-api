import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.SUPABASE_URL as string;
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;
export const supabaseServiceKey = process.env
  .SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

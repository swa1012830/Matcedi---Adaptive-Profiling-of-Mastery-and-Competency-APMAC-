import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trdynylvmpvywtsgzccv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZHlueWx2bXB2eXd0c2d6Y2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODM1OTYsImV4cCI6MjA5NzQ1OTU5Nn0.ZO5N47ZBgQ02mnX0Rzlf3Tl5fyxx4IyKuJbbPlfq_8E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

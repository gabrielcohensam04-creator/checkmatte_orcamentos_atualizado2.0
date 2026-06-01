import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qinjlrgvxmplvsotxyth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbmpscmd2eG1wbHZzb3R4eXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDI5OTYsImV4cCI6MjA5MzgxODk5Nn0.Q9J60g0LsOwVAQiE6dywCrkk2Ey64N1byHu-L6uR8IM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

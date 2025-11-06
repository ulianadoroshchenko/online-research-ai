import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supabaseClient = createClient(
  'https://kyewynzyetmjrhxcuvrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5ZXd5bnp5ZXRtanJoeGN1dnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjEzNjMsImV4cCI6MjA3NzgzNzM2M30.6rkx_snJPvvzCmDw0LsCLtRzQmlNLPp66damJsB283o'
);

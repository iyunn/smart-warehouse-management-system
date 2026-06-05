import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  "https://gcknnlapkmsazfrzcxkw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdja25ubGFwa21zYXpmcnpjeGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMDY3MzgsImV4cCI6MjA5MzU4MjczOH0.zb8zqQfiOpmeC8XQJEhyhzoEohuuIsd44y4vT5w0csQ" // paste full key
)
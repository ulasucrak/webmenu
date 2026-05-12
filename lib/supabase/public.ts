import { createClient } from '@supabase/supabase-js'

// Module-level singleton — reused across requests, works with unstable_cache
export const publicDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

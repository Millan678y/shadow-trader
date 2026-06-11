import { createClient } from '@supabase/supabase-js'

// Lazy-initialized client — never throws at build time
let _client: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (_client) return _client

  try {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        // Skip realtime for SSR builds
        realtime: { params: { eventsPerSecond: 10 } },
      }
    )
    return _client
  } catch {
    // Return a no-op client if env vars aren't set
    const noop = {
      from: () => ({ select: () => ({ data: null, error: new Error('Supabase not configured') }) }),
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    } as unknown as ReturnType<typeof createClient>
    return noop
  }
}

export const supabase = getSupabase()
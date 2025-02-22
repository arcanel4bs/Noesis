import { createClient } from '@supabase/supabase-js'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export async function createClerkSupabaseClient(req: NextRequest) {
  const { getToken } = getAuth(req)
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const clerkToken = await getToken({ template: 'supabase' })
        const headers = new Headers(options?.headers)
        if (clerkToken) {
          headers.set('Authorization', `Bearer ${clerkToken}`)
        }
        return fetch(url, { ...options, headers })
      },
    },
  })
}

// Export default client for non-authenticated operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseKey = supabasePublishableKey || supabaseAnonKey


export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = createClient(
  supabaseUrl || 'https://mock.supabase.co',
  supabaseKey || 'mock-key'
)

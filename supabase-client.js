import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://wrblwwxtucocqibunxla.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYmx3d3h0dWNvY3FpYnVueGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzA1NTUsImV4cCI6MjA5NTkwNjU1NX0.919L8G5IDyvyvcrum0HN9RnlF-Gmwc7VsOtkVGEV4JM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        storageKey: 'soyuco_session'
    }
})

// Helper to get current session
export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
}

// Helper to get current user
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}
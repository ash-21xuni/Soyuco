// auth.js
import { supabase } from './supabase-client.js'

// Current user state
let currentUser = null
let authListeners = []

// Notify listeners when auth changes
function notifyAuthChange(user) {
    authListeners.forEach(cb => cb(user))
}

// Sign Up
export async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { display_name: displayName }
        }
    })
    
    if (error) throw error
    
    if (data.user) {
        currentUser = data.user
        notifyAuthChange(currentUser)
    }
    
    return data
}

// Sign In
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    
    if (error) throw error
    
    if (data.user) {
        currentUser = data.user
        notifyAuthChange(currentUser)
    }
    
    return data
}

// Sign Out
export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (!error) {
        currentUser = null
        notifyAuthChange(null)
    }
    return { error }
}

// Get current user
export async function getCurrentUser() {
    if (currentUser) return currentUser
    
    const { data: { user } } = await supabase.auth.getUser()
    currentUser = user
    return user
}

// Check if user is logged in
export function isAuthenticated() {
    return !!currentUser
}

// Listen to auth changes
export function onAuthChange(callback) {
    authListeners.push(callback)
    return () => {
        authListeners = authListeners.filter(cb => cb !== callback)
    }
}

// Initialize auth (call this when your app starts)
export async function initAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    currentUser = session?.user || null
    
    // Listen for changes
    supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null
        notifyAuthChange(currentUser)
    })
    
    return currentUser
}
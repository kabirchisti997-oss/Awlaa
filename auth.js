// =====================================================================
// auth.js — Supabase Google OAuth Authentication
// =====================================================================
// NOTE: Replace these with your actual Supabase project credentials.
// Get them from: https://supabase.com → Project → Settings → API
const SUPABASE_URL = 'https://qbmmfoxinnlzmcabluxu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_008XUACLXM7SUF4JpGuLWw_Ol_VtuiP';

let supabaseClient = null;
let currentUser = null;

// ─── Initialize Supabase ─────────────────────────────────────────────
export async function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.warn('Supabase SDK not loaded. Auth features will be disabled.');
        return null;
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Check if there's an ongoing OAuth redirect
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        notifyAuthChange(currentUser);
    }

    // Listen for auth state changes (login, logout, token refresh)
    supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user ?? null;
        notifyAuthChange(currentUser);
    });

    return supabaseClient;
}

// ─── Sign In with Google ──────────────────────────────────────────────
export async function signInWithGoogle() {
    if (!supabaseClient) {
        showDemoAuth();
        return;
    }
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.href
        }
    });
    if (error) {
        console.error('OAuth error:', error);
        showAuthError(error.message);
    }
}

// ─── Sign Out ─────────────────────────────────────────────────────────
export async function signOut() {
    if (!supabaseClient) {
        currentUser = null;
        notifyAuthChange(null);
        return;
    }
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error('Sign out error:', error);
}

// ─── Get Current User ─────────────────────────────────────────────────
export function getCurrentUser() {
    return currentUser;
}

// ─── Auth Change Callback Registry ───────────────────────────────────
const authListeners = [];
export function onAuthChange(callback) {
    authListeners.push(callback);
}

function notifyAuthChange(user) {
    authListeners.forEach(cb => cb(user));
}

// ─── Demo Mode (when Supabase is not configured) ──────────────────────
function showDemoAuth() {
    // Show a beautiful auth modal for demo/preview
    const overlay = document.getElementById('auth-modal-overlay');
    if (overlay) overlay.classList.add('active');
}

function showAuthError(message) {
    console.error('Auth error:', message);
}

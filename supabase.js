// REAL SUPABASE CLIENT CONFIGURATION
const supabaseUrl = 'https://ktuznerjkqwqbsrssugy.supabase.co';
const supabaseKey = 'sb_publishable_W7GLRDnGKhdWi34VonMtig_YAejvGhH';

let client;

try {
    if (!window.supabase) {
        throw new Error("Supabase library not loaded");
    }
    const { createClient } = window.supabase;
    client = createClient(supabaseUrl, supabaseKey);
} catch (e) {
    console.error("Supabase Init Error:", e);
    // Fallback mock
    client = {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithOAuth: async () => { alert("Connection Error: Check Console"); return { error: { message: "Mock client: Cannot sign in." } }; }
        }
    };
    console.warn("Supabase client initialized with MOCK client. Check CDN loading or window.supabase availability.");
}

export const supabase = client;
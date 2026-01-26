import { supabase } from './supabase.js';
import { initUI } from './ui.js';

let isAppInitialized = false;

/**
 * This function is the main entry point for the app's authentication flow.
 * It checks the user's session and renders either the login screen or the main app.
 */
export async function initializeAuthentication() {
    const { data: { session } } = await supabase.auth.getSession();
    handleAuthSession(session);

    supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthSession(session);
    });
}

function handleAuthSession(session) {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    if (!session) {
        // If no user is logged in, show the login screen.
        isAppInitialized = false; // Reset app state
        if (sidebar) sidebar.style.display = 'none';
        renderLoginScreen(mainContent);
    } else if (!isAppInitialized) {
        // If a user is logged in AND the app hasn't been initialized yet,
        // show the main UI. This prevents re-initializing on token refreshes.
        if (sidebar) sidebar.style.display = '';
        initUI();
        isAppInitialized = true;
    }
}

function renderLoginScreen(container) {
    container.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; animation: fadeIn 0.5s ease-in-out;">
            <h1 style="color: #0ff; margin-bottom: 10px; font-size: 3rem; text-shadow: 0 0 15px rgba(0, 255, 255, 0.5);">Awlaa Social</h1>
            <p style="color: #aaa; margin-bottom: 40px; font-size: 1.1rem;">Connect. Share. Inspire.</p>
            
            <div class="card" style="width: 100%; max-width: 380px; padding: 30px; border: 1px solid #333; background: rgba(20, 20, 20, 0.8); backdrop-filter: blur(10px); text-align: center;">
                <div style="margin-bottom: 30px;">
                    <i class="fas fa-user-astronaut" style="font-size: 50px; color: #0ff; margin-bottom: 15px;"></i>
                    <h3 style="color: #fff; margin: 0;">Welcome Back</h3>
                </div>
                
                <button id="google-login-btn" class="btn" style="width: 100%; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 12px; background: #fff; color: #333; border: none; font-weight: 600; cursor: pointer; transition: transform 0.2s;">
                    <i class="fab fa-google" style="font-size: 18px;"></i>
                    <span>Sign in with Google</span>
                </button>
                
                <p style="color: #666; font-size: 0.8rem; margin-top: 20px;">
                    By continuing, you agree to our Terms of Service.
                </p>
            </div>

            <div style="position: absolute; bottom: 20px; text-align: center; width: 100%;">
                <p style="color: #666; font-size: 0.8rem;">
                    Coded with Gemini ✨
                </p>
            </div>
        </div>
    `;

    const loginBtn = document.getElementById('google-login-btn');

    loginBtn.addEventListener('click', async () => {
        loginBtn.style.opacity = '0.7';
        loginBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Connecting...';
        
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            alert('Login Error: ' + error.message);
            loginBtn.style.opacity = '1';
            loginBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
        }
    });
    
    // Simple hover effect
    loginBtn.addEventListener('mouseenter', () => loginBtn.style.transform = 'scale(1.02)');
    loginBtn.addEventListener('mouseleave', () => loginBtn.style.transform = 'scale(1)');
}
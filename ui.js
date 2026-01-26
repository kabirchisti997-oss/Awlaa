import { renderHome } from './home.js';
import { renderChat } from './chat.js';
import { renderProfile } from './profile.js';

const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('main-content');

const views = {
    home: renderHome,
    chat: renderChat,
    profile: renderProfile
};

export function initUI() {
    // Render Sidebar Icons
    sidebar.innerHTML = `
        <div class="nav-icon active" data-view="home" title="Home">
            <i class="fas fa-home"></i>
        </div>
        <div class="nav-icon" data-view="chat" title="Chat">
            <i class="fas fa-comments"></i>
        </div>
        <div class="nav-icon" data-view="profile" title="Profile">
            <i class="fas fa-user"></i>
        </div>
    `;

    // Add Event Listeners
    const icons = sidebar.querySelectorAll('.nav-icon');
    icons.forEach(icon => {
        icon.addEventListener('click', () => {
            // Remove active class from all
            icons.forEach(i => i.classList.remove('active'));
            // Add active class to clicked
            icon.classList.add('active');
            
            const viewName = icon.getAttribute('data-view');
            loadView(viewName);
        });
    });

    // Load default view
    loadView('home');
}

function loadView(viewName) {
    mainContent.innerHTML = ''; // Clear current content
    if (views[viewName]) {
        views[viewName](mainContent);
    }
}
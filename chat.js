import { supabase } from './supabase.js';

export function renderChat(container) {
    container.innerHTML = `
        <style>
            .chat-container {
                display: flex;
                height: 100%;
                width: 100%;
                overflow: hidden;
            }
            .chat-sidebar {
                width: 300px;
                background: #1a1a1a;
                border-right: 1px solid #333;
                display: flex;
                flex-direction: column;
                padding: 15px;
            }
            .chat-main {
                flex: 1;
                background: #000;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            .search-bar {
                width: 100%;
                padding: 12px;
                background: #2a2a2a;
                border: 1px solid #333;
                color: #fff;
                border-radius: 8px;
                margin-bottom: 15px;
                outline: none;
            }
            .search-bar:focus {
                border-color: #0ff;
            }
            .user-result {
                display: flex;
                align-items: center;
                padding: 10px;
                cursor: pointer;
                border-radius: 8px;
                transition: background 0.2s;
                margin-bottom: 5px;
            }
            .user-result:hover {
                background: #333;
            }
            .user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #555;
                margin-right: 12px;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .request-modal {
                background: #1a1a1a;
                padding: 30px;
                border-radius: 12px;
                border: 1px solid #333;
                width: 400px;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            }
        </style>
        <div class="chat-container">
            <div class="chat-sidebar">
                <h2 style="color: #fff; margin-bottom: 20px; font-size: 1.5rem;">Chats</h2>
                <input type="text" id="user-search" class="search-bar" placeholder="Search users...">
                <div id="search-results" style="flex: 1; overflow-y: auto;">
                    <p style="color: #666; font-size: 0.9rem; text-align: center; margin-top: 20px;">Search for friends to start chatting</p>
                </div>
            </div>
            <div class="chat-main" id="chat-main-area">
                <div style="text-align: center; color: #444;">
                    <i class="far fa-paper-plane" style="font-size: 60px; margin-bottom: 20px;"></i>
                    <p style="font-size: 1.2rem;">Your messages</p>
                    <p style="font-size: 0.9rem;">Send private photos and messages to a friend.</p>
                </div>
            </div>
        </div>
    `;

    const searchInput = document.getElementById('user-search');
    const resultsDiv = document.getElementById('search-results');
    const mainArea = document.getElementById('chat-main-area');

    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        
        if (!query) {
            resultsDiv.innerHTML = '<p style="color: #666; font-size: 0.9rem; text-align: center; margin-top: 20px;">Search for friends to start chatting</p>';
            return;
        }

        debounceTimer = setTimeout(async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            // Search profiles (excluding self)
            const { data: users, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('username', `%${query}%`)
                .neq('id', currentUser.id)
                .limit(10);

            if (error) {
                console.error(error);
                return;
            }

            renderSearchResults(users, resultsDiv, mainArea, currentUser);
        }, 300);
    });
}

function renderSearchResults(users, container, mainArea, currentUser) {
    container.innerHTML = '';
    if (!users || users.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No users found</p>';
        return;
    }

    users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'user-result';
        
        const avatarHtml = user.avatar_url 
            ? `<img src="${user.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">` 
            : `<i class="fas fa-user" style="color: #ccc;"></i>`;

        div.innerHTML = `
            <div class="user-avatar">${avatarHtml}</div>
            <div style="color: #fff; font-weight: 500;">${user.username || 'Unknown'}</div>
        `;

        div.addEventListener('click', () => {
            openRequestUI(user, mainArea, currentUser);
        });

        container.appendChild(div);
    });
}

function openRequestUI(targetUser, container, currentUser) {
    const avatarHtml = targetUser.avatar_url 
        ? `<img src="${targetUser.avatar_url}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 2px solid #0ff;">` 
        : `<i class="fas fa-user" style="font-size: 60px; color: #666; margin-bottom: 15px;"></i>`;

    container.innerHTML = `
        <div class="request-modal">
            ${avatarHtml}
            <h3 style="color: #fff; margin-bottom: 10px;">Message ${targetUser.username || 'User'}</h3>
            <p style="color: #aaa; font-size: 0.9rem; margin-bottom: 20px;">Send a message request to start chatting.</p>
            
            <textarea id="request-message" placeholder="Type your message..." style="width: 100%; height: 100px; background: #111; border: 1px solid #333; color: #fff; padding: 10px; border-radius: 4px; margin-bottom: 20px; resize: none;"></textarea>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="cancel-req" class="btn" style="background: #333; border: 1px solid #444;">Cancel</button>
                <button id="send-req" class="btn">Send Request</button>
            </div>
        </div>
    `;

    document.getElementById('cancel-req').addEventListener('click', () => {
        container.innerHTML = `
            <div style="text-align: center; color: #444;">
                <i class="far fa-paper-plane" style="font-size: 60px; margin-bottom: 20px;"></i>
                <p style="font-size: 1.2rem;">Your messages</p>
                <p style="font-size: 0.9rem;">Send private photos and messages to a friend.</p>
            </div>
        `;
    });

    document.getElementById('send-req').addEventListener('click', async () => {
        const message = document.getElementById('request-message').value;
        if (!message.trim()) {
            alert("Please type a message");
            return;
        }

        const btn = document.getElementById('send-req');
        btn.textContent = "Sending...";
        btn.disabled = true;

        // Insert into chat_requests table
        const { error } = await supabase
            .from('chat_requests')
            .insert({
                sender_id: currentUser.id,
                receiver_id: targetUser.id,
                message: message,
                status: 'pending'
            });

        if (error) {
            alert("Error sending request: " + error.message);
            btn.textContent = "Send Request";
            btn.disabled = false;
        } else {
            container.innerHTML = `
                <div style="text-align: center;">
                    <i class="fas fa-check-circle" style="font-size: 60px; color: #0ff; margin-bottom: 20px;"></i>
                    <h3 style="color: #fff;">Request Sent!</h3>
                    <p style="color: #aaa;">Wait for ${targetUser.username} to accept.</p>
                </div>
            `;
        }
    });
}
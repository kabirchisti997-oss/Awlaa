import { supabase } from './supabase.js';

export async function renderChat(container) {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    container.innerHTML = `
        <style>
            .chat-container { display: flex; height: 100%; width: 100%; overflow: hidden; position: relative; }
            .chat-sidebar { width: 300px; background: #1a1a1a; border-right: 1px solid #333; display: flex; flex-direction: column; padding: 15px; }
            .chat-main { flex: 1; background: #000; display: flex; align-items: center; justify-content: center; position: relative; flex-direction: column; transition: transform 0.3s ease-in-out; }
            .search-bar { width: 100%; padding: 12px; background: #2a2a2a; border: 1px solid #333; color: #fff; border-radius: 8px; margin-bottom: 15px; outline: none; }
            .search-bar:focus { border-color: #0ff; }
            
            .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            
            .list-item { display: flex; align-items: center; padding: 10px; cursor: pointer; border-radius: 8px; margin-bottom: 5px; transition: background 0.2s; }
            .list-item:hover { background: #333; }
            .user-avatar { width: 40px; height: 40px; border-radius: 50%; background: #555; margin-right: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            
            /* Chat Messages Styles */
            .messages-area { flex: 1; width: 100%; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
            .message-input-area { width: 100%; padding: 20px; background: #1a1a1a; border-top: 1px solid #333; display: flex; gap: 10px; }
            .msg-bubble { max-width: 70%; padding: 10px 15px; border-radius: 15px; font-size: 0.95rem; line-height: 1.4; word-wrap: break-word; }
            .msg-sent { align-self: flex-end; background: #007bff; color: white; border-bottom-right-radius: 2px; }
            .msg-received { align-self: flex-start; background: #333; color: white; border-bottom-left-radius: 2px; }

            .chat-back-btn { display: none; background: transparent; border: none; color: #fff; font-size: 24px; cursor: pointer; margin-right: 15px; line-height: 1; padding: 0 5px; }

            /* Mobile Responsive Styles */
            @media (max-width: 768px) {
                .chat-container { display: block; }
                .chat-sidebar { width: 100%; height: 100%; border-right: none; }
                .chat-main { display: none; width: 100%; height: 100%; }

                .chat-container.chat-active .chat-sidebar {
                    display: none;
                }
                .chat-container.chat-active .chat-main {
                    display: flex;
                }

                .chat-back-btn { display: block; }
            }
        </style>
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="sidebar-header">
                    <h2 style="color: #fff; font-size: 1.5rem; margin: 0;">Chats</h2>
                </div>
                <input type="text" id="user-search" class="search-bar" placeholder="Search users...">
                <div id="sidebar-list" style="flex: 1; overflow-y: auto;"></div>
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
    const sidebarList = document.getElementById('sidebar-list');
    const mainArea = document.getElementById('chat-main-area');

    let debounceTimer;

    // Initial Load
    loadChatsList();

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        if (!query) {
            loadChatsList();
            return;
        }
        debounceTimer = setTimeout(() => performSearch(query), 300);
    });

    async function performSearch(query) {
        const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', `%${query}%`)
            .neq('id', currentUser.id)
            .limit(10);
        
        renderUserList(users || [], 'search');
    }

    async function loadChatsList() {
        // Get all users the current user has messaged or received messages from
        const { data: sentTo, error: sentError } = await supabase.from('messages').select('receiver_id').eq('sender_id', currentUser.id);
        const { data: receivedFrom, error: receivedError } = await supabase.from('messages').select('sender_id').eq('receiver_id', currentUser.id);

        if (sentError || receivedError) {
            console.error("Error fetching chat partners:", sentError || receivedError);
            return;
        }

        const sentToIds = sentTo.map(m => m.receiver_id);
        const receivedFromIds = receivedFrom.map(m => m.sender_id);
        const allPartnerIds = [...new Set([...sentToIds, ...receivedFromIds])];

        if (allPartnerIds.length === 0) {
            sidebarList.innerHTML = '<p style="color: #666; text-align: center; margin-top: 20px;">No active chats. Search for a user to start one.</p>';
            return;
        }

        // Fetch profiles for these partners
        const { data: partners } = await supabase.from('profiles').select('*').in('id', allPartnerIds);

        renderUserList(partners || [], 'chat');
    }

    function renderUserList(items, type) {
        sidebarList.innerHTML = '';
        if (items.length === 0) {
            sidebarList.innerHTML = '<p style="color: #666; text-align: center; margin-top: 20px;">Nothing found</p>';
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'list-item';
            const avatarHtml = item.avatar_url 
                ? `<img src="${item.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">` 
                : `<i class="fas fa-user" style="color: #ccc;"></i>`;
            
            let subText = '';
            if (type === 'chat' || type === 'search') {
                subText = item.username;
            }

            div.innerHTML = `
                <div class="user-avatar">${avatarHtml}</div>
                <div>
                    <div style="color: #fff; font-weight: 500;">${item.username || 'Unknown'}</div>
                    <div style="color: #888; font-size: 0.8rem;">${subText}</div>
                </div>
            `;

            div.addEventListener('click', () => {
                openChatUI(item, mainArea, currentUser);
            });

            sidebarList.appendChild(div);
        });
    }
}

async function openChatUI(targetUser, container, currentUser) {
    // On mobile, slide the main view in
    document.querySelector('.chat-container').classList.add('chat-active');

    container.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
            <div style="padding: 15px; border-bottom: 1px solid #333; display: flex; align-items: center; background: #1a1a1a;">
                <button id="chat-back-btn" class="chat-back-btn">&lt;</button>
                <div class="user-avatar" style="width: 30px; height: 30px; margin-right: 10px;">
                     ${targetUser.avatar_url ? `<img src="${targetUser.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user"></i>`}
                </div>
                <strong style="color: #fff;">${targetUser.username}</strong>
            </div>
            <div id="messages-area" class="messages-area"></div>
            <div class="message-input-area">
                <input type="text" id="msg-input" placeholder="Message..." style="flex: 1; background: transparent; border: none; color: #fff; outline: none;">
                <button id="send-msg-btn" style="background: transparent; border: none; color: #0ff; cursor: pointer; font-weight: 600;">Send</button>
            </div>
        </div>
    `;
    
    const msgsArea = document.getElementById('messages-area');
    const input = document.getElementById('msg-input');
    const sendBtn = document.getElementById('send-msg-btn');
    const backBtn = document.getElementById('chat-back-btn');

    backBtn.addEventListener('click', () => {
        document.querySelector('.chat-container').classList.remove('chat-active');
    });

    // Load history
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

    if (messages) {
        messages.forEach(m => appendMessage(m, msgsArea, currentUser.id));
    }

    // Subscribe
    const channel = supabase.channel(`chat:${currentUser.id}-${targetUser.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            if ((payload.new.sender_id === currentUser.id && payload.new.receiver_id === targetUser.id) ||
                (payload.new.sender_id === targetUser.id && payload.new.receiver_id === currentUser.id)) {
                appendMessage(payload.new, msgsArea, currentUser.id);
            }
        })
        .subscribe();

    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        // Don't optimistically add here, let the realtime subscription handle it
        // to avoid duplicate messages if the user has two tabs open.
        input.value = '';

        // When a message is sent, refresh the chat list to include the new partner if they weren't there before
        loadChatsList();
        
        await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: targetUser.id, content: text });
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
}

function appendMessage(msg, container, currentUserId) {
    const div = document.createElement('div');
    const isMe = msg.sender_id === currentUserId;
    div.className = `msg-bubble ${isMe ? 'msg-sent' : 'msg-received'}`;
    div.textContent = msg.content;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}
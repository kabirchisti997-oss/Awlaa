import { supabase } from './supabase.js';

export async function renderChat(container) {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // Fetch pending requests count
    const { count: requestCount } = await supabase
        .from('chat_requests')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUser.id)
        .eq('status', 'pending');

    container.innerHTML = `
        <style>
            .chat-container { display: flex; height: 100%; width: 100%; overflow: hidden; position: relative; }
            .chat-sidebar { width: 300px; background: #1a1a1a; border-right: 1px solid #333; display: flex; flex-direction: column; padding: 15px; }
            .chat-main { flex: 1; background: #000; display: flex; align-items: center; justify-content: center; position: relative; flex-direction: column; transition: transform 0.3s ease-in-out; }
            .search-bar { width: 100%; padding: 12px; background: #2a2a2a; border: 1px solid #333; color: #fff; border-radius: 8px; margin-bottom: 15px; outline: none; }
            .search-bar:focus { border-color: #0ff; }
            
            .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .requests-btn { background: transparent; border: 1px solid #333; color: #aaa; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; }
            .requests-btn.has-new { color: #0ff; border-color: #0ff; }
            
            .list-item { display: flex; align-items: center; padding: 10px; cursor: pointer; border-radius: 8px; margin-bottom: 5px; transition: background 0.2s; }
            .list-item:hover { background: #333; }
            .user-avatar { width: 40px; height: 40px; border-radius: 50%; background: #555; margin-right: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            
            .request-modal { background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #333; width: 400px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
            
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
                    <button id="requests-btn" class="requests-btn ${requestCount > 0 ? 'has-new' : ''}">
                        ${requestCount || 0} Requests
                    </button>
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
    const requestsBtn = document.getElementById('requests-btn');

    let debounceTimer;
    let viewState = 'chats'; // 'chats' or 'requests'

    // Initial Load
    loadChatsList();

    requestsBtn.addEventListener('click', () => {
        if (viewState === 'chats') {
            viewState = 'requests';
            requestsBtn.textContent = 'Back to Chats';
            requestsBtn.style.color = '#fff';
            loadRequestsList();
        } else {
            viewState = 'chats';
            requestsBtn.textContent = `${requestCount || 0} Requests`;
            requestsBtn.style.color = requestCount > 0 ? '#0ff' : '#aaa';
            loadChatsList();
        }
    });

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        if (!query) {
            if (viewState === 'chats') loadChatsList();
            else loadRequestsList();
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
        // Fetch accepted requests where user is sender OR receiver
        const { data: requests } = await supabase
            .from('chat_requests')
            .select(`
                id,
                sender:sender_id(username, avatar_url, id),
                receiver:receiver_id(username, avatar_url, id)
            `)
            .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
            .eq('status', 'accepted');

        const chats = requests.map(req => {
            const isSender = req.sender.id === currentUser.id;
            const otherUser = isSender ? req.receiver : req.sender;
            return { ...otherUser, requestId: req.id };
        });

        renderUserList(chats, 'chat');
    }

    async function loadRequestsList() {
        const { data: requests } = await supabase
            .from('chat_requests')
            .select(`
                id,
                sender:sender_id(username, avatar_url, id),
                message
            `)
            .eq('receiver_id', currentUser.id)
            .eq('status', 'pending');
        
        renderUserList(requests.map(r => ({ ...r.sender, requestId: r.id, message: r.message })), 'request');
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
            
            let subText = type === 'request' ? 'Sent you a request' : 'Click to chat';
            if (type === 'search') subText = item.username;

            div.innerHTML = `
                <div class="user-avatar">${avatarHtml}</div>
                <div>
                    <div style="color: #fff; font-weight: 500;">${item.username || 'Unknown'}</div>
                    <div style="color: #888; font-size: 0.8rem;">${subText}</div>
                </div>
            `;

            div.addEventListener('click', () => {
                if (type === 'search') openRequestUI(item, mainArea, currentUser);
                else if (type === 'request') openAcceptUI(item, mainArea, currentUser);
                else if (type === 'chat') openChatUI(item, mainArea, currentUser);
            });

            sidebarList.appendChild(div);
        });
    }
}

function openRequestUI(targetUser, container, currentUser) {
    // On mobile, slide the main view in
    document.querySelector('.chat-container').classList.add('chat-active');

    // ... (Same UI as before for sending requests)
    container.innerHTML = `
        <div class="request-modal">
            ${targetUser.avatar_url ? `<img src="${targetUser.avatar_url}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 2px solid #0ff;">` : `<i class="fas fa-user" style="font-size: 60px; color: #666; margin-bottom: 15px;"></i>`}
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
        // On mobile, slide the main view out
        document.querySelector('.chat-container').classList.remove('chat-active');
        container.innerHTML = ''; 
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

function openAcceptUI(targetUser, container, currentUser) {
    // On mobile, slide the main view in
    document.querySelector('.chat-container').classList.add('chat-active');

    container.innerHTML = `
        <div class="request-modal">
            ${targetUser.avatar_url ? `<img src="${targetUser.avatar_url}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;">` : `<i class="fas fa-user" style="font-size: 60px; color: #666; margin-bottom: 15px;"></i>`}
            <h3 style="color: #fff; margin-bottom: 10px;">${targetUser.username}</h3>
            <p style="color: #aaa; font-size: 0.9rem; margin-bottom: 20px;">Sent you a request</p>
            <div style="background: #222; padding: 15px; border-radius: 8px; margin-bottom: 20px; color: #eee; font-style: italic;">"${targetUser.message}"</div>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="decline-btn" class="btn" style="background: #333; border: 1px solid #444;">Decline</button>
                <button id="accept-btn" class="btn">Accept</button>
            </div>
        </div>
    `;

    document.getElementById('accept-btn').addEventListener('click', async () => {
        await supabase.from('chat_requests').update({ status: 'accepted' }).eq('id', targetUser.requestId);
        alert("Request Accepted!");
        openChatUI(targetUser, container, currentUser);
    });

    document.getElementById('decline-btn').addEventListener('click', async () => {
        await supabase.from('chat_requests').delete().eq('id', targetUser.requestId);
        // On mobile, slide the main view out
        document.querySelector('.chat-container').classList.remove('chat-active');
        container.innerHTML = '';
    });
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
        input.value = '';
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
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
            .requests-btn { background:none; border:none; color:#aaa; font-size: 20px; cursor:pointer; position:relative; transition: color 0.2s; }
            .requests-btn:hover { color: #fff; }
            .requests-badge { display:none; position:absolute; top:-5px; right:-8px; background:red; color:white; font-size:10px; width:16px; height:16px; border-radius:50%; text-align:center; line-height:16px; font-weight: bold; }

            .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: none; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.3s; }
            .modal-content { background: #1a1a1a; padding: 20px; border-radius: 12px; width: 90%; max-width: 450px; border: 1px solid #333; max-height: 80vh; display: flex; flex-direction: column; }
            .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #333; }
            .modal-header h3 { margin: 0; color: #fff; }
            .close-modal-btn { background: none; border: none; color: #aaa; font-size: 24px; cursor: pointer; line-height: 1; }
            .request-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #2a2a2a; }
            .request-item:last-child { border-bottom: none; }
            .request-info { flex-grow: 1; margin-left: 12px; }
            .request-info p { margin: 2px 0; color: #aaa; font-size: 0.9rem; }
            .request-actions button { margin-left: 8px; font-size: 0.8rem; padding: 6px 12px; }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .modal-content {
                animation: fadeIn 0.3s, slideUp 0.3s;
            }
            @keyframes slideUp { from { transform: translateY(20px); } to { transform: translateY(0); } }
            
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
                    <button id="open-requests-btn" class="requests-btn" title="Chat Requests">
                        <i class="fas fa-user-plus"></i>
                        <span id="requests-badge" class="requests-badge"></span>
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
        <div id="modal-overlay" class="modal-overlay"></div>
    `;

    const searchInput = document.getElementById('user-search');
    const sidebarList = document.getElementById('sidebar-list');
    const mainArea = document.getElementById('chat-main-area');
    const openRequestsBtn = document.getElementById('open-requests-btn');
    const requestsBadge = document.getElementById('requests-badge');
    const modalOverlay = document.getElementById('modal-overlay');

    let debounceTimer;

    // Initial Load
    loadChatsList();
    checkPendingRequests();

    // Listen for request changes to update badge
    supabase.channel('public:chat_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_requests', filter: `receiver_id=eq.${currentUser.id}` }, payload => {
        checkPendingRequests();
      })
      .subscribe();

    openRequestsBtn.addEventListener('click', openRequestsModal);

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

    async function checkPendingRequests() {
        const { count } = await supabase
            .from('chat_requests')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', currentUser.id)
            .eq('status', 'pending');
        
        if (count > 0) {
            requestsBadge.textContent = count;
            requestsBadge.style.display = 'block';
        } else {
            requestsBadge.style.display = 'none';
        }
    }

    async function loadChatsList() {
        // Fetch accepted requests where user is sender OR receiver
        const { data: requests, error } = await supabase
            .from('chat_requests')
            .select(`
                id,
                sender:sender_id(id, username, avatar_url),
                receiver:receiver_id(id, username, avatar_url)
            `)
            .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
            .eq('status', 'accepted');

        if (error) {
            console.error("Error fetching chats:", error);
            sidebarList.innerHTML = '<p style="color: red;">Error loading chats.</p>';
            return;
        }

        if (!requests || requests.length === 0) {
            sidebarList.innerHTML = '<p style="color: #666; text-align: center; margin-top: 20px;">No active chats. Search for a user to start one.</p>';
            return;
        }

        const chats = requests.map(req => {
            const otherUser = req.sender.id === currentUser.id ? req.receiver : req.sender;
            return otherUser;
        });

        renderUserList(chats, 'chat');
    }
    
    async function openRequestsModal() {
        const { data: requests, error } = await supabase
            .from('chat_requests')
            .select(`*, sender:sender_id(username, avatar_url)`)
            .eq('receiver_id', currentUser.id)
            .eq('status', 'pending');

        let requestsHtml = '<p style="color:#888; text-align:center;">No new requests.</p>';
        if (requests && requests.length > 0) {
            requestsHtml = requests.map(req => `
                <div class="request-item" data-request-id="${req.id}">
                    <div class="user-avatar">
                        ${req.sender.avatar_url ? `<img src="${req.sender.avatar_url}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-user"></i>'}
                    </div>
                    <div class="request-info">
                        <strong>${req.sender.username}</strong>
                        <p><em>"${req.message}"</em></p>
                    </div>
                    <div class="request-actions">
                        <button class="btn accept-btn" style="background-color: #28a745;">Accept</button>
                        <button class="btn block-btn" style="background-color: #dc3545;">Block</button>
                    </div>
                </div>
            `).join('');
        }

        modalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Chat Requests</h3>
                    <button class="close-modal-btn">&times;</button>
                </div>
                <div style="overflow-y: auto;">${requestsHtml}</div>
            </div>
        `;
        modalOverlay.style.display = 'flex';

        modalOverlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-modal-btn')) {
                modalOverlay.style.display = 'none';
            }
            if (e.target.classList.contains('accept-btn')) {
                const item = e.target.closest('.request-item');
                handleRequest(item.dataset.requestId, 'accepted');
            }
            if (e.target.classList.contains('block-btn')) {
                const item = e.target.closest('.request-item');
                handleRequest(item.dataset.requestId, 'blocked', item);
            }
        });
    }

    async function handleRequest(requestId, status, elementToRemove = null) {
        if (status === 'accepted') {
            const { error } = await supabase.from('chat_requests').update({ status: 'accepted' }).eq('id', requestId);
            if (!error) {
                alert('Request accepted!');
                loadChatsList();
                modalOverlay.style.display = 'none';
            }
        } else if (status === 'blocked') {
            const { error } = await supabase.from('chat_requests').delete().eq('id', requestId);
            if (!error && elementToRemove) {
                elementToRemove.remove();
            }
        }
        checkPendingRequests();
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
                if (type === 'search') {
                    openSendRequestUI(item);
                } else { // 'chat'
                    openChatUI(item, mainArea, currentUser);
                }
            });

            sidebarList.appendChild(div);
        });
    }
}

function openSendRequestUI(targetUser) {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Message ${targetUser.username}</h3>
                <button class="close-modal-btn">&times;</button>
            </div>
            <p style="color:#aaa; font-size:0.9rem;">Send a message to request a chat.</p>
            <textarea id="request-message-input" placeholder="Your message..." style="width: 100%; min-height: 80px; margin-bottom: 15px; background-color: #111; border: 1px solid #444; color: #fff; border-radius: 4px; padding: 10px; resize: vertical;"></textarea>
            <button id="send-request-btn" class="btn">Send Request</button>
        </div>
    `;
    modalOverlay.style.display = 'flex';

    modalOverlay.addEventListener('click', async (e) => {
        if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-modal-btn')) {
            modalOverlay.style.display = 'none';
        }
        if (e.target.id === 'send-request-btn') {
            const message = document.getElementById('request-message-input').value.trim();
            if (!message) {
                alert('Please enter a message.');
                return;
            }
            
            e.target.disabled = true;
            e.target.textContent = 'Sending...';

            const { data: { user } } = await supabase.auth.getUser();

            // Check if a request or chat already exists between these two users
            const { data: existingRequest, error: checkError } = await supabase
                .from('chat_requests')
                .select('id')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${user.id})`)
                .maybeSingle();

            if (checkError) {
                alert('Error checking for existing chat: ' + checkError.message);
                e.target.disabled = false;
                e.target.textContent = 'Send Request';
                return;
            }

            if (existingRequest) {
                alert("You already have a pending request or an active chat with this user.");
                modalOverlay.style.display = 'none';
                return;
            }

            const { error } = await supabase.from('chat_requests').insert({
                sender_id: user.id,
                receiver_id: targetUser.id,
                message: message,
                status: 'pending'
            });

            if (error) {
                alert('Error sending request: ' + error.message);
                e.target.disabled = false;
                e.target.textContent = 'Send Request';
            } else {
                alert('Request sent!');
                modalOverlay.style.display = 'none';
            }
        }
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
        
        // Don't optimistically add here, let the realtime subscription handle it
        // to avoid duplicate messages if the user has two tabs open.
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
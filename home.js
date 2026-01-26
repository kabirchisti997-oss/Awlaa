import { supabase } from './supabase.js';

function addHomeStyles(container) {
    const style = document.createElement('style');
    style.textContent = `
        #feed-container {
            max-width: 600px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .post-card {
            background-color: #1a1a1a; /* Darker than default card */
            border: 1px solid #333;
            border-radius: 8px;
            overflow: hidden;
        }
        .post-header {
            display: flex;
            align-items: center;
            padding: 10px 15px;
            gap: 10px;
        }
        .post-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #555;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .post-avatar i {
            color: #ccc;
        }
        .post-author strong {
            color: #eee;
            font-weight: 600;
        }
        .post-image {
            width: 100%;
            height: auto;
            display: block;
            background-color: #000;
        }
        .post-actions {
            padding: 10px 15px;
            display: flex;
            gap: 15px;
            font-size: 22px;
            color: #eee;
        }
        .post-actions i {
            cursor: pointer;
        }
        .post-caption {
            padding: 0 15px 10px 15px;
        }
        .post-caption p {
            margin: 0;
            color: #eee;
        }
        .post-caption strong {
            font-weight: 600;
            margin-right: 5px;
        }
        .post-date {
            padding: 0 15px 10px 15px;
            font-size: 0.7rem;
            color: #888;
            text-transform: uppercase;
        }
    `;
    container.appendChild(style);
}

export async function renderHome(container) {
    addHomeStyles(container);

    const header = document.createElement('h2');
    header.textContent = "Feed";
    header.style.marginBottom = "20px";
    header.style.color = "#0ff";
    container.appendChild(header);

    const feedContainer = document.createElement('div');
    feedContainer.id = 'feed-container';
    container.appendChild(feedContainer);

    // Fetch posts from Supabase
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        feedContainer.innerHTML = `<p style="color: red">Error loading feed: ${error.message}</p>`;
        return;
    }

    if (posts && posts.length > 0) {
        posts.forEach(post => renderPost(feedContainer, post));
    } else {
        feedContainer.innerHTML = `<p>No posts yet. Be the first!</p>`;
    }
}

function renderPost(container, post) {
    const card = document.createElement('div');
    card.className = 'post-card';

    // NOTE: This is mock user data. To make this real, you would need to fetch
    // the post author's profile information along with the post.
    const username = "awlaa_user";

    const postDate = new Date(post.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    let imageHtml = '';
    if (post.image_url) {
        imageHtml = `<img src="${post.image_url}" class="post-image" alt="Post image">`;
    }

    card.innerHTML = `
        <div class="post-header">
            <div class="post-avatar"><i class="fas fa-user"></i></div>
            <div class="post-author"><strong>${username}</strong></div>
        </div>
        ${imageHtml}
        <div class="post-actions">
            <i class="far fa-heart"></i>
            <i class="far fa-comment"></i>
            <i class="far fa-paper-plane"></i>
        </div>
        <div class="post-caption">
            <p><strong>${username}</strong> ${post.content || ''}</p>
        </div>
        <div class="post-date">
            <small>${postDate}</small>
        </div>
    `;
    container.appendChild(card);
}
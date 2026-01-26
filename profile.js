import { supabase } from './supabase.js';

function obfuscateEmail(email) {
    if (!email || email === 'Guest' || !email.includes('@')) return 'Guest';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 4) {
        return `${localPart.charAt(0)}****@${domain}`;
    }
    const start = localPart.substring(0, 2);
    const end = localPart.substring(localPart.length - 2);
    const middle = '*'.repeat(localPart.length - 4);
    return `${start}${middle}${end}@${domain}`;
}

export async function renderProfile(container) {
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user's profile from the 'profiles' table
    let profile = null;
    if (user) {
        const { data, error } = await supabase.from('profiles').select('username, avatar_url, bio').eq('id', user.id).single();
        if (error && error.code !== 'PGRST116') { // Ignore "row not found" error
            console.error("Error fetching profile:", error);
        }
        profile = data;
    }

    const avatarContent = profile?.avatar_url
        ? `<img src="${profile.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">`
        : `<i class="fas fa-user" style="font-size: 40px; color: #666;"></i>`;
    const fullEmail = user?.email || 'Guest';
    const obfuscatedEmail = obfuscateEmail(fullEmail);

    container.innerHTML = `
        <h2 style="color: #0ff; margin-bottom: 20px;">Your Profile</h2>
        <div class="card" style="position: relative;">
            <i id="logout-icon-btn" title="Logout" class="fas fa-sign-out-alt" style="position: absolute; top: 15px; right: 15px; font-size: 22px; color: #aaa; cursor: pointer; z-index: 10; transition: color 0.2s ease;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#aaa'"></i>
            <div style="text-align: center; margin-bottom: 20px;">
                <label for="photo-input" style="cursor: pointer; display: inline-block;" title="Change profile photo">
                    <div id="avatar-container" style="width: 100px; height: 100px; border-radius: 50%; background: #333; margin: 0 auto; border: 2px solid #0ff; overflow: hidden; display: flex; align-items: center; justify-content: center;">${avatarContent}</div>
                </label>
                <input type="file" id="photo-input" accept="image/*" style="display: none;">
            </div>
            
            <label>Email</label>
            <div style="position: relative; display: flex; align-items: center; margin-bottom: 15px;">
                <input type="text" id="email-input" value="${obfuscatedEmail}" disabled style="width: 100%; padding-right: 35px; margin-bottom: 0;">
                <i id="toggle-email-visibility" class="fas fa-eye" style="position: absolute; right: 12px; cursor: pointer; color: #aaa;"></i>
            </div>
            
            <label>Username</label>
            <input type="text" id="username-input" placeholder="Enter username" value="${profile?.username || ''}">
            
            <label>Bio</label>
            <textarea id="bio-input" placeholder="Tell us about yourself..." style="width: 100%; min-height: 80px; margin-bottom: 15px; background-color: #111; border: 1px solid #444; color: #fff; border-radius: 4px; padding: 10px; resize: vertical;">${profile?.bio || ''}</textarea>
            
            <button id="save-profile" class="btn" style="width: 100%; margin-top: 10px;">Save Profile</button>
        </div>
    `;

    const saveBtn = document.getElementById('save-profile');
    const photoInput = document.getElementById('photo-input');
    const emailInput = document.getElementById('email-input');
    const toggleEmailBtn = document.getElementById('toggle-email-visibility');
    const avatarContainer = document.getElementById('avatar-container');
    const logoutIconBtn = document.getElementById('logout-icon-btn');

    let isEmailVisible = false;

    toggleEmailBtn.addEventListener('click', () => {
        isEmailVisible = !isEmailVisible;
        if (isEmailVisible) {
            emailInput.value = fullEmail;
            toggleEmailBtn.classList.remove('fa-eye');
            toggleEmailBtn.classList.add('fa-eye-slash');
        } else {
            emailInput.value = obfuscatedEmail;
            toggleEmailBtn.classList.remove('fa-eye-slash');
            toggleEmailBtn.classList.add('fa-eye');
        }
    });

    photoInput.addEventListener('change', () => {
        const file = photoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarContainer.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
            };
            reader.readAsDataURL(file);
        }
    });

    saveBtn.addEventListener('click', async () => {
        const username = document.getElementById('username-input').value;
        const bio = document.getElementById('bio-input').value;
        const file = photoInput.files[0];
        let avatar_url = profile?.avatar_url; // Keep old avatar if no new one is uploaded

        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to 'Awlaa' bucket
            const { error: uploadError } = await supabase.storage
                .from('Awlaa')
                .upload(filePath, file);
            
            if (uploadError) {
                alert('Error uploading image: ' + uploadError.message);
                saveBtn.disabled = false;
                saveBtn.textContent = "Save Profile";
                return;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('Awlaa')
                .getPublicUrl(filePath);
            avatar_url = publicUrl;
        }

        const updates = {
            id: user.id,
            username,
            bio,
            avatar_url,
            updated_at: new Date(),
        };

        const { error } = await supabase.from('profiles').upsert(updates);

        if (error) {
            alert('Error updating profile: ' + error.message);
        } else {
            alert("Profile saved successfully!");
            // Update avatar in UI if it was changed
            if (file && avatar_url) {
                document.getElementById('avatar-container').innerHTML = `<img src="${avatar_url}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        }

        saveBtn.disabled = false;
        saveBtn.textContent = "Save Profile";
    });

    logoutIconBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) alert('Error signing out: ' + error.message);
    });
}
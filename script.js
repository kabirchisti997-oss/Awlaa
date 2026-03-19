import { productsData } from './products.js';
import { contactHTML } from './contact.js';
import { aiHTML } from './ai.js';
import { leftSideIcons } from './icons.js';
import { fetchAIResponse, generateAIImage, speakAISonic, toggleAiVoice, getAiVoiceState } from './ai_brain.js';
import { speakWeb } from './web_voice.js';
import { initSupabase, signInWithGoogle, signOut, onAuthChange, getCurrentUser } from './auth.js';
import { playSound } from './sounds.js';
import {
    TIERS, getUserTier, setUserTier,
    canSendMessage, recordMessage, getRemainingMessages,
    getISTTimePeriod, getTimeUntilReset
} from './tiers.js';
import { initAwlaaCore } from './AwlaaCore.js';
import './services.js';

// ── ATTACH AI FUNCTIONS TO WINDOW ──────────────────────────────────
window.fetchAIResponse = fetchAIResponse;
window.generateAIImage = generateAIImage;

document.addEventListener('DOMContentLoaded', async () => {

    // ── CURRENT USER ID ───────────────────────────────────────────────
    // 'guest' until confirmed logged in
    let currentUID = 'guest';

    // ── SOUND FX INITIALIZATION ──────────────────────────────────────
    function initGlobalSounds() {
        const selector = 'a, button, .nav-link, .service-row, .tech-category, .sidebar-icon-link, .gemini-tool-btn, .prod-cat-header, .popup-item, .tech-work-header, .prod-work-link, .chat-plus-btn';
        
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest(selector);
            if (target && !target.dataset.hoverSoundPlayed) {
                playSound('hover');
                target.dataset.hoverSoundPlayed = 'true';
                setTimeout(() => { if (target) target.removeAttribute('data-hover-sound-played'); }, 500);
            }
        });

        document.addEventListener('click', (e) => {
            const target = e.target.closest(selector);
            if (target) {
                playSound('click');
            }
        });
    }
    initGlobalSounds();

    // SEGREGATED VOICE ROUTES
    // Unified Global Voice Access
    window.speakAI = (text, onEnd) => speakAISonic(text, onEnd);
    // window.speakItem & window.speakMasterContent are now handled directly by web_voice.js

    // ── SUPABASE AUTH INIT ────────────────────────────────────────────
    const supabase = await initSupabase();

    // Auth UI Elements
    const navTierBtn = document.getElementById('nav-tier-btn');
    const navTierIcon = document.getElementById('nav-tier-icon');
    const navTierLabel = document.getElementById('nav-tier-label');
    const navGoogleSigninBtn = document.getElementById('nav-google-signin-btn');
    if (navGoogleSigninBtn) navGoogleSigninBtn.addEventListener('click', signInWithGoogle);

    const unifiedOverlay = document.getElementById('unified-auth-overlay');
    const unifiedCloseBtn = document.getElementById('unified-modal-close');

    const uniAvatarImg = document.getElementById('unified-avatar-img');
    const uniAvatarPlaceholder = document.getElementById('unified-avatar-placeholder');
    const uniUserName = document.getElementById('unified-user-name');
    const uniUserEmail = document.getElementById('unified-user-email');
    const uniSignoutBtn = document.getElementById('unified-signout-btn');
    const uniGoogleBtn = document.getElementById('unified-google-btn');
    const demoGoogleBtn = document.getElementById('demo-google-btn'); // Fallback if still somewhere

    if (navTierBtn) navTierBtn.addEventListener('click', () => { 
        playSound('open'); 
        unifiedOverlay.classList.add('active'); 
        refreshUnifiedModal(); 
    });
    if (unifiedCloseBtn) unifiedCloseBtn.addEventListener('click', () => {
        playSound('close');
        unifiedOverlay.classList.remove('active');
    });
    if (unifiedOverlay) unifiedOverlay.addEventListener('click', e => { if (e.target === unifiedOverlay) { playSound('close'); unifiedOverlay.classList.remove('active'); }});

    if (uniGoogleBtn) uniGoogleBtn.addEventListener('click', signInWithGoogle);
    if (demoGoogleBtn) demoGoogleBtn.addEventListener('click', signInWithGoogle);

    if (uniSignoutBtn) {
        uniSignoutBtn.addEventListener('click', async () => { await signOut(); unifiedOverlay.classList.remove('active'); });
    }

    onAuthChange(user => {
        const sidebarProfileBtn = document.getElementById('sidebar-profile-btn');
        const mobileProfileBtn = document.getElementById('mobile-profile-btn');

        if (user) {
            currentUID = user.id || user.email || 'user';

            // Nav: show tier badge, hide google signin btn
            if (navTierBtn) navTierBtn.style.display = 'flex';
            if (navGoogleSigninBtn) navGoogleSigninBtn.style.display = 'none';

            if (uniGoogleBtn) uniGoogleBtn.style.display = 'none';
            if (uniSignoutBtn) uniSignoutBtn.style.display = 'flex';

            const name = user.user_metadata?.full_name || user.email || 'User';
            const email = user.email || '';
            const photo = user.user_metadata?.avatar_url || '';

            if (uniUserName) uniUserName.textContent = name;
            if (uniUserEmail) uniUserEmail.textContent = email;

            if (photo && uniAvatarImg) {
                uniAvatarImg.src = photo; uniAvatarImg.style.display = 'block';
                if (uniAvatarPlaceholder) uniAvatarPlaceholder.style.display = 'none';
            } else if (uniAvatarPlaceholder) {
                if (uniAvatarImg) uniAvatarImg.style.display = 'none';
                uniAvatarPlaceholder.style.display = 'flex';
                uniAvatarPlaceholder.textContent = name.charAt(0).toUpperCase();
            }

            // Sidebar & Mobile Profile Sync
            if (sidebarProfileBtn) {
                const avatarCode = photo ? `<img src="${photo}" style="width:22px;height:22px;border-radius:50%;border:1px solid rgba(212,175,55,0.4);">` : `<i class="fas fa-user-circle" style="color:#d4af37;"></i>`;
                sidebarProfileBtn.innerHTML = avatarCode;
                sidebarProfileBtn.title = name;
            }
            if (mobileProfileBtn) {
                const avatarCode = photo ? `<img src="${photo}" style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(212,175,55,0.3);">` : `<i class="fas fa-user-circle"></i>`;
                mobileProfileBtn.innerHTML = `${avatarCode}<span>Account</span>`;
            }

            // AI Hub Popup Sync
            const aiPopupName = document.getElementById('ai-popup-name');
            const aiPopupAvatar = document.getElementById('ai-popup-avatar');
            if (aiPopupName) aiPopupName.textContent = name;
            if (aiPopupAvatar) {
                aiPopupAvatar.innerHTML = photo ? `<img src="${photo}" alt="User">` : `👤`;
            }
        } else {
            currentUID = 'guest';

            // Nav: hide tier badge, show google signin btn
            if (navTierBtn) navTierBtn.style.display = 'none';
            if (navGoogleSigninBtn) navGoogleSigninBtn.style.display = 'flex';

            if (uniGoogleBtn) uniGoogleBtn.style.display = 'flex';
            if (uniSignoutBtn) uniSignoutBtn.style.display = 'none';
            if (uniUserName) uniUserName.textContent = 'Guest User';
            if (uniUserEmail) uniUserEmail.textContent = 'Sign in to unlock tiers';
            if (uniAvatarImg) uniAvatarImg.style.display = 'none';
            if (uniAvatarPlaceholder) {
                uniAvatarPlaceholder.style.display = 'flex';
                uniAvatarPlaceholder.textContent = '👤';
            }

            // Sidebar & Mobile Profile Reset
            if (sidebarProfileBtn) {
                sidebarProfileBtn.innerHTML = `<i class="fas fa-user"></i>`;
                sidebarProfileBtn.title = 'Sign In';
            }
            if (mobileProfileBtn) {
                mobileProfileBtn.innerHTML = `<i class="fas fa-user"></i><span>Profile</span>`;
            }

            // AI Hub Popup Reset
            const aiPopupName = document.getElementById('ai-popup-name');
            const aiPopupAvatar = document.getElementById('ai-popup-avatar');
            if (aiPopupName) aiPopupName.textContent = 'Guest User';
            if (aiPopupAvatar) aiPopupAvatar.innerHTML = '👤';
        }
        updateTierUI();
    });

    // ── PLAN SELECTION in Unified Modal ────────────────────────────────
    document.querySelectorAll('.uni-plan-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tierId = btn.dataset.tier;
            if (currentUID === 'guest') {
                signInWithGoogle();
                return;
            }
            setUserTier(currentUID, tierId);
            updateTierUI();
            refreshUnifiedModal();
            showToast(`✦ Switched to ${TIERS[tierId].name}! Payment integration coming soon.`, 'info');
            playSound('success');
        });
    });

    function refreshUnifiedModal() {
        const tier = getUserTier(currentUID);
        // Hide all current plan labels
        document.querySelectorAll('.uni-plan-status').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.unified-plan-card').forEach(c => c.classList.remove('active-current'));

        const currentCard = document.getElementById(`uni-plan-${tier.id}`);
        const currentStatus = document.getElementById(`uni-status-${tier.id}`);

        if (currentCard) currentCard.classList.add('active-current');
        if (currentStatus) currentStatus.style.display = 'block';

        // Hide select button for current plan
        document.querySelectorAll('.uni-plan-btn').forEach(btn => btn.style.display = 'block');
        const currBtn = currentCard ? currentCard.querySelector('.uni-plan-btn') : null;
        if (currBtn) currBtn.style.display = 'none';
    }

    // ── LIMIT REACHED MODAL (Simplified linking) ─────────────────────
    const limitModalOverlay = document.getElementById('limit-modal-overlay');
    const limitModalClose = document.getElementById('limit-modal-close');
    const limitModalTitle = document.getElementById('limit-modal-title');
    const limitModalText = document.getElementById('limit-modal-text');
    const limitModalIcon = document.getElementById('limit-modal-icon');
    const limitCountdown = document.getElementById('limit-countdown');
    const limitGuestSection = document.getElementById('limit-guest-section');
    const limitUpgradeSection = document.getElementById('limit-upgrade-section');
    const limitGoogleBtn = document.getElementById('limit-google-btn');
    const limitUpgradeCta = document.getElementById('limit-upgrade-cta');

    if (limitModalClose) limitModalClose.addEventListener('click', () => limitModalOverlay.classList.remove('active'));
    if (limitModalOverlay) limitModalOverlay.addEventListener('click', e => { if (e.target === limitModalOverlay) limitModalOverlay.classList.remove('active'); });
    if (limitGoogleBtn) limitGoogleBtn.addEventListener('click', () => { limitModalOverlay.classList.remove('active'); signInWithGoogle(); });
    if (limitUpgradeCta) limitUpgradeCta.addEventListener('click', () => { limitModalOverlay.classList.remove('active'); unifiedOverlay.classList.add('active'); refreshUnifiedModal(); });

    function showLimitModal() {
        const tier = getUserTier(currentUID);
        const isGuest = currentUID === 'guest';

        if (limitModalIcon) limitModalIcon.textContent = '⚡';
        if (limitModalTitle) limitModalTitle.textContent = 'POWER EXHAUSTED';
        if (limitModalText) limitModalText.textContent =
            isGuest
                ? `AWLAA CORE requires authentication to replenish energy. Securely sign in with Google to continue chatting.`
                : `NEURAL CORE DEPLETED. AWLAA CORE REQUIRES PREMIUM ENERGY FOR UNLIMITED PROCESSING.`;

        if (limitGuestSection) limitGuestSection.style.display = isGuest ? 'block' : 'none';
        if (limitUpgradeSection) limitUpgradeSection.style.display = isGuest ? 'none' : 'block';
        playSound('error'); // Alert sound
        limitModalOverlay.classList.add('active');

        // Start countdown for the modal
        updateLimitCountdown();
    }

    function updateLimitCountdown() {
        if (!limitCountdown || !limitModalOverlay.classList.contains('active')) return;
        limitCountdown.textContent = getTimeUntilReset();
        setTimeout(updateLimitCountdown, 1000);
    }

    // Interval for internal state check – no visible countdown
    setInterval(() => {
        updateTierUI();
    }, 5000);

    // ── FUTURISTIC SCROLL REVEAL (SPARKS & LIGHTS) ────────────────
    const setupScrollRevels = () => {
        const revealElements = document.querySelectorAll('.section-pad, .product-card, .director-card, .cyber-search-bar');
        
        // Add base classes
        revealElements.forEach(el => el.classList.add('scroll-reveal'));

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Stop observing once revealed to retain performance
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,    // 10% visible
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    };
    setupScrollRevels();


    // ── TOAST ─────────────────────────────────────────────────────────
    function showToast(message, type = 'info') {
        const existing = document.querySelector('.tier-toast');
        if (existing) existing.remove();
        const t = document.createElement('div');
        t.className = `tier-toast ${type}`;
        t.textContent = message;
        document.body.appendChild(t);
        playSound(type === 'success' ? 'success' : 'notification');
        requestAnimationFrame(() => { requestAnimationFrame(() => t.classList.add('show')); });
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3500);
    }

    // ── TIER UI UPDATE ────────────────────────────────────────────────
    function updateTierUI() {
        const tier = getUserTier(currentUID);
        const rem = getRemainingMessages(currentUID);
        const period = getISTTimePeriod();
        const isUnlim = tier.limit === Infinity;

        // AI panel badge (in popup)
        const aiBadge = document.getElementById('ai-tier-badge');
        const aiIcon = document.getElementById('ai-tier-icon');
        const aiName = document.getElementById('ai-tier-name');
        const usageTxt = document.getElementById('ai-usage-text');
        const fillEl = document.getElementById('ai-usage-fill');
        const resetTxt = document.getElementById('ai-usage-reset-text');
        const tierRing = document.getElementById('ai-tier-ring');

        if (aiBadge) {
            aiBadge.style.borderColor = tier.color + '55';
            aiBadge.style.color = tier.color;
        }
        if (aiIcon) aiIcon.textContent = tier.icon;
        if (aiName) aiName.textContent = tier.label;
        if (tierRing) tierRing.style.borderColor = tier.color;

        // Main Navbar button badge
        if (navTierIcon) navTierIcon.textContent = tier.icon;
        if (navTierLabel) {
            navTierLabel.textContent = currentUID === 'guest' ? 'Guest' : tier.label;
            navTierLabel.style.color = tier.color;
        }

        // Inside the unified modal Usage Stats
        const uniUsageCount = document.getElementById('unified-usage-count');
        const uniUsageTier = document.getElementById('unified-usage-tier');
        const uniUsageFill = document.getElementById('unified-usage-fill');
        const uniResetBadge = document.getElementById('unified-reset-badge');

        if (uniUsageTier) {
            uniUsageTier.textContent = tier.label;
            uniUsageTier.style.background = `rgba(255,255,255,0.1)`;
            uniUsageTier.style.color = tier.color;
        }

        const resetStr = 'Resets in ' + getTimeUntilReset();
        if (uniResetBadge) uniResetBadge.textContent = resetStr;
        if (resetTxt) resetTxt.textContent = resetStr;

        if (isUnlim) {
            if (usageTxt) usageTxt.textContent = 'UNLIMITED POWER';
            if (fillEl) { fillEl.style.width = '100%'; fillEl.className = 'ai-usage-fill unlimited'; }
            if (uniUsageCount) uniUsageCount.textContent = 'Unlimited';
            if (uniUsageFill) { uniUsageFill.style.width = '100%'; uniUsageFill.className = 'unified-usage-fill'; }
        } else {
            const used = tier.limit - rem;
            const pct = Math.min((used / tier.limit) * 100, 100);

            if (usageTxt) {
                usageTxt.textContent = rem === 0
                    ? 'LIMIT REACHED — UPGRADE NOW'
                    : `${rem} / ${tier.limit} Chats Remaining`;
            }

            if (fillEl) {
                fillEl.style.width = `${pct}%`;
                fillEl.className = 'ai-usage-fill' + (pct >= 100 ? ' full' : pct >= 80 ? ' danger' : '');
            }

            if (uniUsageCount) uniUsageCount.textContent = `${used} / ${tier.limit} Used`;
            if (uniUsageFill) {
                uniUsageFill.style.width = `${pct}%`;
                uniUsageFill.className = 'unified-usage-fill' + (pct >= 100 ? ' full' : pct >= 80 ? ' danger' : '');
            }
        }
    }

    // Also remove the old interval at bottom

    // INTRO SEQUENCE IS NOW HANDLED AT THE VERY TOP OF THE FILE.
    // Cleaned up old intro-overlay block out of file to prevent conflict.


    // ── NAVBAR ────────────────────────────────────────────────────────
    const nav = document.querySelector('.navbar');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    if (hamburgerBtn && mobileNavOverlay) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('open');
            mobileNavOverlay.classList.toggle('open');
            document.body.classList.toggle('nav-open');
        });

        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('open');
                mobileNavOverlay.classList.remove('open');
                document.body.classList.remove('nav-open');
            });
        });
    }

    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const sy = window.scrollY;
                if (nav) {
                    if (sy > 50) nav.classList.add('scrolled');
                    else nav.classList.remove('scrolled');
                }
                const hc = document.querySelector('.hero-content');
                if (hc && sy < window.innerHeight) {
                    hc.style.transform = `translateY(${sy * 0.12}px)`;
                }
                if (typeof handleScrollAnimations === 'function') handleScrollAnimations();
                isScrolling = false;
            });
            isScrolling = true;
        }
    }, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function (e) {
            const t = document.querySelector(this.getAttribute('href'));
            if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
        });
    });

    // ── FADE-IN ───────────────────────────────────────────────────────
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => e.isIntersecting ? e.target.classList.add('visible') : e.target.classList.remove('visible'));
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // ── PARALLAX ─────────────────────────────────────────────────────
    // Handled in unified scroll listener


    // ── COUNTER ANIMATION ─────────────────────────────────────────────
    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        let current = 0;
        const step = target / (1800 / 16);
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = Math.floor(current);
            if (current >= target) clearInterval(timer);
        }, 16);
    }
    const statObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.querySelectorAll('.stat-num').forEach(animateCounter); statObs.unobserve(e.target); } });
    }, { threshold: 0.5 });
    const statsBar = document.querySelector('.stats-bar');
    if (statsBar) statObs.observe(statsBar);

    // ── ACTIVE NAV ────────────────────────────────────────────────────
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const linkObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                navLinks.forEach(l => l.classList.remove('active'));
                const a = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
                if (a) a.classList.add('active');
            }
        });
    }, { threshold: 0.4 });
    sections.forEach(s => linkObs.observe(s));

    // ── SCROLL ANIMATIONS ─────────────────────────────────────────────
    function handleScrollAnimations() {
        const trig = window.innerHeight * 0.88;
        const sRows = document.querySelectorAll('.service-row');
        for (let i = 0; i < sRows.length; i++) {
            if (sRows[i].getBoundingClientRect().top < trig) sRows[i].classList.add('is-visible');
            else sRows[i].classList.remove('is-visible');
        }
        const tCats = document.querySelectorAll('.tech-category');
        for (let i = 0; i < tCats.length; i++) {
            if (tCats[i].getBoundingClientRect().top < trig) tCats[i].classList.add('is-visible');
            else tCats[i].classList.remove('is-visible');
        }
    }
    handleScrollAnimations(); // Initial check

    // ── MASTER POP-UP (Legal Network) ──────────────────────────────
    const masterOverlay = document.createElement('div');
    masterOverlay.className = 'master-popup-overlay';
    masterOverlay.innerHTML = `
        <div class="master-popup-content">
            <div class="master-header">
                <div class="nav-brand">
                    <img src="Awlaa Global Main Logo.png" alt="Awlaa" style="height:40px;">
                </div>
                <div style="display: flex; align-items: center;">
                    <button class="master-speaker-btn" title="Listen to Explanation">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <button class="master-close-btn">&times;</button>
                </div>
            </div>
            <div class="master-body">
                <div class="master-lang-switcher">
                    <button class="master-lang-btn active" data-lang="hi">Hindi</button>
                    <button class="master-lang-btn" data-lang="en">English</button>
                </div>
                <div class="master-text-content">
                    <div id="master-hi" class="lang-block active"></div>
                    <div id="master-en" class="lang-block"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(masterOverlay);

    const masterClose = masterOverlay.querySelector('.master-close-btn');
    const masterHi = masterOverlay.querySelector('#master-hi');
    const masterEn = masterOverlay.querySelector('#master-en');
    const masterLangBtns = masterOverlay.querySelectorAll('.master-lang-btn');
    const masterSpeakerBtn = masterOverlay.querySelector('.master-speaker-btn');

    let isMasterSpeaking = false;

    masterClose.addEventListener('click', () => {
        playSound('close');
        window.speechSynthesis.cancel();
        masterSpeakerBtn.classList.remove('speaking');
        isMasterSpeaking = false;
        masterOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    masterSpeakerBtn.addEventListener('click', () => {
        if (isMasterSpeaking) {
            window.speechSynthesis.cancel();
            masterSpeakerBtn.classList.remove('speaking');
            isMasterSpeaking = false;
        } else {
            const activeBlock = masterOverlay.querySelector('.lang-block.active');
            const lang = activeBlock.id.split('-')[1]; // 'hi' or 'en'
            
            // Clean HTML tags for speech
            const textToSpeak = activeBlock.innerText || activeBlock.textContent;
            
            masterSpeakerBtn.classList.add('speaking');
            isMasterSpeaking = true;
            
            // Custom natural speech call using unified system
            window.speakMasterContent(textToSpeak, lang, () => {
                masterSpeakerBtn.classList.remove('speaking');
                isMasterSpeaking = false;
            });
        }
    });

    masterLangBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            playSound('click');
            masterLangBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (lang === 'hi') { masterHi.classList.add('active'); masterEn.classList.remove('active'); }
            else { masterEn.classList.add('active'); masterHi.classList.remove('active'); }
        });
    });

    function openMasterPopup(work) {
        masterHi.innerHTML = work.desc.hi;
        masterEn.innerHTML = work.desc.en;
        
        // Reset to Hindi by default
        masterLangBtns.forEach(b => b.classList.remove('active'));
        masterLangBtns[0].classList.add('active');
        masterHi.classList.add('active');
        masterEn.classList.remove('active');

        masterOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        playSound('open');
        speakWeb(work.name);
    }

    // ── TECH SERVICES ─────────────────────────────────────────────────
    const techWrapper = document.getElementById('tech-services-wrapper');
    const modal = document.getElementById('project-modal');
    const modalClose = document.querySelector('.modal-close');
    const mImg = document.getElementById('modal-img');
    const mImgWrapper = mImg ? mImg.parentElement : null;
    const mTitle = document.getElementById('modal-title');
    const mDesc = document.getElementById('modal-desc');
    let slideshowInterval;

    if (techWrapper && productsData.length > 0) {
        techWrapper.innerHTML = '';
        techWrapper.classList.add('split-layout');

        // Left Column: Accordion of ALL Categories
        const leftColumn = document.createElement('div');
        leftColumn.className = 'tech-accordion-column';
        leftColumn.style.flex = '1.2';
        leftColumn.style.display = 'flex';
        leftColumn.style.flexDirection = 'column';
        leftColumn.style.gap = '1rem';

        // Right Column: Just the Image Slider
        const rightColumn = document.createElement('div');
        rightColumn.className = 'tech-slider-container';
        rightColumn.style.flex = '1';

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'tech-slider-column';
        sliderContainer.style.position = 'sticky';
        sliderContainer.style.top = '100px';

        const sliderImg = document.createElement('img');
        sliderImg.className = 'tech-slider-img fade-in-up';
        sliderImg.src = productsData[0].works[0]?.image || 'images/default-service.jpg';
        
        sliderContainer.appendChild(sliderImg);
        rightColumn.appendChild(sliderContainer);
        
        let slideshowInterval;

        function setSliderImage(work) {
            if (slideshowInterval) clearInterval(slideshowInterval);
            if (work.slideshow && work.slideshow.length > 0) {
                let i = 0;
                sliderImg.src = work.slideshow[i];
                slideshowInterval = setInterval(() => {
                    i = (i + 1) % work.slideshow.length;
                    sliderImg.src = work.slideshow[i];
                }, 2500);
            } else if (work.image) {
                sliderImg.src = work.image;
            }
        }

        productsData.forEach((category, catIdx) => {
            const catBlock = document.createElement('div');
            catBlock.className = 'modern-acc-category';
            catBlock.style.background = 'rgba(255, 255, 255, 0.02)';
            catBlock.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            catBlock.style.borderRadius = '12px';
            catBlock.style.overflow = 'hidden';
            catBlock.style.transition = 'all 0.3s ease';

            const catHeader = document.createElement('div');
            catHeader.style.padding = '1.2rem 1.5rem';
            catHeader.style.cursor = 'pointer';
            catHeader.style.display = 'flex';
            catHeader.style.alignItems = 'center';
            catHeader.style.justifyContent = 'space-between';
            catHeader.className = 'cat-header-bg';
            catHeader.style.transition = 'background 0.3s ease';
            
            catHeader.innerHTML = `
                <div style="display:flex; align-items:center; gap:1rem;">
                    <span class="tech-icon" style="font-size:1.4rem; color:var(--gold);">${category.icon}</span>
                    <span class="tech-title" style="font-family:var(--font-h); font-size:1.35rem; color:var(--text);">${category.title}</span>
                </div>
                <i class="fas fa-chevron-down acc-arrow" style="color:var(--gold); transition: transform 0.4s ease;"></i>
            `;

            const catWorksWrapper = document.createElement('div');
            catWorksWrapper.style.maxHeight = '0';
            catWorksWrapper.style.overflow = 'hidden';
            catWorksWrapper.style.transition = 'max-height 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            catWorksWrapper.style.background = 'rgba(0, 0, 0, 0.2)';

            const worksList = document.createElement('ul');
            worksList.style.listStyle = 'none';
            worksList.style.padding = '1rem 1.5rem 1rem 3rem'; // indent works
            worksList.style.display = 'flex';
            worksList.style.flexDirection = 'column';
            worksList.style.gap = '0.8rem';
            worksList.style.margin = '0';

            category.works.forEach((work, workIdx) => {
                const li = document.createElement('li');
                li.style.cursor = 'pointer';
                li.className = 'tech-work-modern-item';
                li.style.padding = '1rem';
                li.style.background = 'rgba(0,0,0,0.3)';
                li.style.borderRadius = '8px';
                li.style.borderLeft = '3px solid transparent';
                li.style.transition = 'all 0.3s ease';
                
                const headerRow = document.createElement('div');
                headerRow.style.display = 'flex';
                headerRow.style.justifyContent = 'space-between';
                headerRow.style.alignItems = 'center';
                headerRow.style.fontSize = '1.05rem';
                headerRow.style.color = 'var(--text)';
                headerRow.innerHTML = `
                    <div style="display:flex; align-items:center; gap:0.5rem; transition: color 0.3s;" class="work-title">
                        <i class="fas fa-check-circle" style="color:var(--gold); font-size:0.9rem;"></i>
                        <span>${work.name}</span>
                    </div>
                    <i class="fas fa-chevron-down work-arrow" style="color:var(--gold); font-size:0.8rem; transition: transform 0.3s; opacity:0.7;"></i>
                `;

                const descPanel = document.createElement('div');
                descPanel.style.maxHeight = '0';
                descPanel.style.overflow = 'hidden';
                descPanel.style.transition = 'max-height 0.4s ease';
                descPanel.style.fontSize = '0.9rem';
                descPanel.style.color = 'var(--text2)';
                
                let descText = "";
                if (typeof work.desc === 'object' && work.desc.en) descText = work.desc.en; 
                else if (work.desc) descText = work.desc;
                
                descPanel.innerHTML = `<div style="padding:10px 0 5px 15px; margin-top:5px; border-left:2px solid rgba(201,164,56,0.3);">${descText}</div>`;

                li.appendChild(headerRow);
                if(descText) li.appendChild(descPanel);

                li.addEventListener('mouseenter', () => {
                    // Remove active classes
                    leftColumn.querySelectorAll('.tech-work-modern-item').forEach(el => {
                        el.style.background = 'rgba(0,0,0,0.3)';
                        const title = el.querySelector('.work-title');
                        if (title && !el.classList.contains('work-open')) title.style.color = 'var(--text)';
                    });
                    
                    li.style.background = 'rgba(255,255,255,0.05)';
                    headerRow.querySelector('.work-title').style.color = 'var(--gold)';
                    setSliderImage(work);
                    
                    if (!li.dataset.hoverSound) {
                        playSound('hover');
                        li.dataset.hoverSound = 'true';
                        setTimeout(() => li.dataset.hoverSound = '', 500);
                    }
                });

                li.addEventListener('mouseleave', () => {
                    if (!li.classList.contains('work-open')) {
                        li.style.background = 'rgba(0,0,0,0.3)';
                        headerRow.querySelector('.work-title').style.color = 'var(--text)';
                    }
                });

                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playSound('click');
                    
                    const isOpen = li.classList.contains('work-open');
                    
                    worksList.querySelectorAll('.tech-work-modern-item').forEach(sib => {
                        sib.classList.remove('work-open');
                        sib.style.borderLeft = '3px solid transparent';
                        const dp = sib.children[1];
                        if (dp) dp.style.maxHeight = '0';
                        const aw = sib.querySelector('.work-arrow');
                        if (aw) aw.style.transform = 'rotate(0deg)';
                    });

                    if (!isOpen) {
                        speakWeb(work.name);
                        li.classList.add('work-open');
                        li.style.borderLeft = '3px solid var(--gold)';
                        if (descText) descPanel.style.maxHeight = descPanel.scrollHeight + 50 + 'px';
                        const arr = li.querySelector('.work-arrow');
                        if (arr) arr.style.transform = 'rotate(180deg)';
                        
                        setTimeout(() => {
                            catWorksWrapper.style.maxHeight = 'none'; // allow it to grow fully
                        }, 400); 
                    }
                    
                    if (work.isMaster) openMasterPopup(work);
                });

                worksList.appendChild(li);
            });

            catWorksWrapper.appendChild(worksList);
            catBlock.appendChild(catHeader);
            catBlock.appendChild(catWorksWrapper);
            
            catHeader.addEventListener('click', () => {
                const isOpen = catBlock.classList.contains('cat-open');
                playSound(isOpen ? 'close' : 'open');

                if (!isOpen) {
                    speakWeb(category.title);
                    catBlock.classList.add('cat-open');
                    catWorksWrapper.style.maxHeight = catWorksWrapper.scrollHeight + 1500 + 'px';
                    catHeader.querySelector('.acc-arrow').style.transform = 'rotate(180deg)';
                    catHeader.style.background = 'rgba(255, 255, 255, 0.03)';
                    catBlock.style.borderColor = 'rgba(201, 164, 56, 0.3)';
                    
                    // set image to first work
                    setSliderImage(category.works[0]);
                    
                    // Allow dynamic height after animation
                    setTimeout(() => {
                        if(catBlock.classList.contains('cat-open')) {
                            catWorksWrapper.style.maxHeight = 'none';
                        }
                    }, 600);
                } else {
                    catBlock.classList.remove('cat-open');
                    catWorksWrapper.style.maxHeight = '0';
                    catHeader.querySelector('.acc-arrow').style.transform = 'rotate(0deg)';
                    catHeader.style.background = 'transparent';
                    catBlock.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }
            });

            leftColumn.appendChild(catBlock);
        });

        techWrapper.appendChild(leftColumn);
        techWrapper.appendChild(rightColumn);
    }

    function openModal(work) {
        if (slideshowInterval) clearInterval(slideshowInterval);
        if (mImg) mImg.style.display = 'none';
        if (mImgWrapper) {
            mImgWrapper.style.display = 'none';
            if (!mImgWrapper.querySelector('.watermark-logo')) {
                const wm = document.createElement('img'); wm.src = 'Awlaa Global Logo.png'; wm.className = 'watermark-logo'; mImgWrapper.appendChild(wm);
            }
            mImgWrapper.onmousemove = e => { const r = mImgWrapper.getBoundingClientRect(); if (mImg) mImg.style.transform = `perspective(1000px) rotateY(${((e.clientX - r.left) / r.width - .5) * 5}deg) rotateX(${-((e.clientY - r.top) / r.height - .5) * 5}deg) scale(1.02)`; };
            mImgWrapper.onmouseleave = () => { if (mImg) mImg.style.transform = ''; };
        }
        if (mImg) { mImg.src = ''; mImg.style.opacity = '1'; }
        mTitle.innerText = work.name; mDesc.innerText = work.desc;
        if (work.slideshow?.length > 0 && mImg && mImgWrapper) {
            mImgWrapper.style.display = 'block'; mImg.style.display = 'block';
            let i = 0; mImg.src = work.slideshow[i];
            slideshowInterval = setInterval(() => { i = (i + 1) % work.slideshow.length; mImg.src = work.slideshow[i]; }, 3000);
        } else if (work.image && mImg && mImgWrapper) {
            mImgWrapper.style.display = 'block'; mImg.style.display = 'block'; mImg.src = work.image;
        }
        modal.classList.add('active');
        playSound('open');
    }

    if (modalClose) modalClose.addEventListener('click', () => { playSound('close'); modal.classList.remove('active'); if (slideshowInterval) clearInterval(slideshowInterval); });
    window.addEventListener('click', e => { if (e.target === modal) { playSound('close'); modal.classList.remove('active'); if (slideshowInterval) clearInterval(slideshowInterval); } });

    // ── PANELS ────────────────────────────────────────────────────────
    const productsPanel = document.createElement('div'); productsPanel.id = 'products-panel';
    const closePanelBtn = document.createElement('button'); closePanelBtn.innerHTML = '&times;'; closePanelBtn.className = 'panel-close-btn';
    closePanelBtn.addEventListener('click', () => { playSound('close'); productsPanel.classList.remove('active'); });
    productsPanel.appendChild(closePanelBtn); document.body.appendChild(productsPanel);

    if (productsData) {
        productsData.forEach(category => {
            const item = document.createElement('div'); item.className = 'prod-category-item';
            const header = document.createElement('div'); header.className = 'prod-cat-header';
            header.innerHTML = `<div class="prod-cat-icon">${category.icon}</div><div class="prod-cat-title">${category.title}</div>`;
            const wl = document.createElement('div'); wl.className = 'prod-works-list';
            category.works.forEach(work => {
                const wCont = document.createElement('div');
                wCont.className = 'side-work-container';
                wCont.style.marginBottom = '0.5rem';
                wCont.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                wCont.style.paddingBottom = '0.5rem';

                const wHead = document.createElement('div');
                wHead.className = 'prod-work-link side-work-header';
                if (work.isMaster) wHead.classList.add('master-work-trigger');
                wHead.style.display = 'flex';
                wHead.style.justifyContent = 'space-between';
                wHead.style.alignItems = 'center';
                wHead.style.cursor = 'pointer';
                const iconClass = work.isMaster ? 'fas fa-expand-alt' : 'fas fa-chevron-down';
                wHead.innerHTML = `<span style="flex:1;">${work.name}</span><i class="work-icon ${iconClass}" style="font-size:0.8rem; color:var(--gold); transition:transform 0.4s ease;"></i>`;

                if (work.isMaster) {
                    wHead.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openMasterPopup(work);
                    });
                    wCont.appendChild(wHead);
                } else {
                    const wDet = document.createElement('div');
                    wDet.className = 'side-work-details';
                    wDet.style.maxHeight = '0';
                    wDet.style.overflow = 'hidden';
                    wDet.style.transition = 'max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    wDet.style.opacity = '0.8';

                    const descStr = work.desc || "Professional service solutions.";
                    let mediaHtml = '';

                    // Keep the logic of images same in side panel too
                    if (work.slideshow && work.slideshow.length > 0) {
                        mediaHtml = `<div class="work-media-wrapper" style="height:140px; border-radius:8px; margin-top:0.8rem;"><img src="${work.slideshow[0]}" alt="Work" style="width:100%; height:100%; object-fit:cover;"><img src="Awlaa Global Logo.png" style="position:absolute; bottom:5px; right:5px; width:30px; opacity:0.7;"></div>`;
                    } else if (work.image) {
                        mediaHtml = `<div class="work-media-wrapper" style="height:140px; border-radius:8px; margin-top:0.8rem;"><img src="${work.image}" alt="Work" style="width:100%; height:100%; object-fit:cover;"><img src="Awlaa Global Logo.png" style="position:absolute; bottom:5px; right:5px; width:30px; opacity:0.7;"></div>`;
                    }

                    wDet.innerHTML = `<p style="font-size:0.8rem; color:var(--text2); margin:0.8rem 0; line-height:1.5; padding-left:1rem; border-left:2px solid rgba(201,164,56,0.3);">${descStr}</p>${mediaHtml}`;

                    wHead.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const isOpen = wCont.classList.contains('active-side-work');

                        // Close siblings
                        wl.querySelectorAll('.side-work-container').forEach(sib => {
                            sib.classList.remove('active-side-work');
                            const det = sib.querySelector('.side-work-details');
                            if (det) det.style.maxHeight = null;
                            const icn = sib.querySelector('.work-icon');
                            if (icn) icn.style.transform = 'rotate(0deg)';
                        });

                        if (!isOpen) {
                            speakAI(work.name); // Announce Side Panel Work
                            wCont.classList.add('active-side-work');
                            wDet.style.maxHeight = wDet.scrollHeight + 200 + 'px';
                            wHead.querySelector('.work-icon').style.transform = 'rotate(180deg)';

                            setTimeout(() => {
                                if (item.classList.contains('active')) {
                                    wl.style.maxHeight = 'none'; // free up height to avoid cutting off
                                }
                            }, 50);
                        }
                    });
                    wCont.appendChild(wHead);
                    wCont.appendChild(wDet);
                }
                wl.appendChild(wCont);
            });
            item.appendChild(header); item.appendChild(wl); productsPanel.appendChild(item);
            header.addEventListener('click', () => { const isA = item.classList.contains('active'); document.querySelectorAll('.prod-category-item').forEach(el => el.classList.remove('active')); if (!isA) { speakAI(category.title); item.classList.add('active'); }});
        });
    }

    // PWA Service Worker Registration & App Install Logic
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log("PWA Install Prompt intercepted.");
    });
    
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then((reg) => {
                console.log('SW registered: ', reg);
            }).catch(err => console.error('SW registration failed: ', err));
        });
    }

    const downloadAppBtn = document.getElementById('download-app-btn');
    if (downloadAppBtn) {
        const checkInstallStatus = () => {
            const inner = downloadAppBtn.querySelector('.download-cta-inner');
            const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            if (isInstalled) {
                if (inner) inner.innerHTML = '<i class="fas fa-check"></i> APP READY';
                downloadAppBtn.style.opacity = '0.7';
                downloadAppBtn.style.pointerEvents = 'none';
            }
        };
        checkInstallStatus();

        downloadAppBtn.addEventListener('click', () => {
            playSound('click');
            const inner = downloadAppBtn.querySelector('.download-cta-inner');
            
            if (deferredPrompt) {
                if (inner) {
                    inner.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> PREPARING...';
                }
                showToast('Initiating AwlaaCore AI secure installation...', 'info');
                
                setTimeout(() => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            showToast('AwlaaCore AI Installed Successfully!', 'success');
                            playSound('success');
                            if (inner) inner.innerHTML = '<i class="fas fa-check"></i> APP INSTALLED';
                            localStorage.setItem('pwa-installed', 'true');
                        } else {
                            showToast('Installation cancelled.', 'error');
                            if (inner) inner.innerHTML = '<i class="fas fa-download"></i> INSTALL NOW';
                        }
                        deferredPrompt = null;
                    });
                }, 800);
            } else {
                const isPwa = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
                if (isPwa) {
                    showToast('AwlaaCore AI is already installed and running!', 'success');
                } else {
                    showToast('To install, use your browser menu or "Add to Home Screen".', 'info');
                }
            }
        });
        
        // Hover effects
        downloadAppBtn.addEventListener('mouseenter', () => {
            downloadAppBtn.style.transform = 'translateY(-5px)';
            downloadAppBtn.style.boxShadow = '0 15px 50px rgba(212,175,55,0.15), inset 0 0 30px rgba(212,175,55,0.1)';
        });
        downloadAppBtn.addEventListener('mouseleave', () => {
            downloadAppBtn.style.transform = 'translateY(0)';
            downloadAppBtn.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5), inset 0 0 30px rgba(212,175,55,0.05)';
        });
    }

    // Checking Standalone Mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || window.location.search.includes('source=pwa');
    if (isStandalone) {
        document.body.classList.add('pwa-mode');
        setTimeout(() => {
            const aiPanelEl = document.getElementById('ai-panel');
            if (aiPanelEl) {
                const caBtn = aiPanelEl.querySelector('.panel-close-btn');
                if (caBtn) caBtn.style.display = 'none'; // Hide back button
                aiPanelEl.classList.add('active');
            }
        }, 300);
    }

    const contactPanel = document.createElement('div'); contactPanel.id = 'contact-panel';
    const ccBtn = document.createElement('button'); ccBtn.innerHTML = '&times;'; ccBtn.className = 'panel-close-btn';
    ccBtn.addEventListener('click', () => { playSound('close'); contactPanel.classList.remove('active'); });
    contactPanel.innerHTML = contactHTML; contactPanel.appendChild(ccBtn); document.body.appendChild(contactPanel);

    const aiPanel = document.createElement('div'); aiPanel.id = 'ai-panel';
    aiPanel.innerHTML = aiHTML; document.body.appendChild(aiPanel);

    // AI Header Buttons & Popup Toggle
    const aiBackBtn = aiPanel.querySelector('#ai-back-btn');
    const aiMenuBtn = aiPanel.querySelector('#ai-header-menu-btn');
    const aiAccountPopup = aiPanel.querySelector('#ai-account-popup');

    if (aiBackBtn) {
        aiBackBtn.addEventListener('click', () => {
            playSound('close');
            aiPanel.classList.remove('active');
            aiAccountPopup.classList.remove('active'); // Close popup if open
            document.body.style.overflow = '';
        });
    }

    if (aiMenuBtn) {
        aiMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playSound('click');
            aiAccountPopup.classList.toggle('active');
        });
    }

    // Close AI Account Popup on outside click
    document.addEventListener('click', (e) => {
        if (aiAccountPopup && aiAccountPopup.classList.contains('active')) {
            if (!aiAccountPopup.contains(e.target) && !aiMenuBtn.contains(e.target)) {
                aiAccountPopup.classList.remove('active');
            }
        }
    });

    // Initial tier UI (after panel injected)
    updateTierUI();

    // ── INITIALIZE AWLAACORE LIVE MODE ───────────────────────────
    const liveMode = initAwlaaCore();


    // ── AI CHAT CORE ELEMENTS ──────────────────────────────────────────
    const chatInput = aiPanel.querySelector('#chat-input');
    const chatSend = aiPanel.querySelector('#chat-send-btn');
    // const chatLiveBtn = aiPanel.querySelector("#chat-live-btn");
    const chatHistory = aiPanel.querySelector('#chat-history');
    const typingDiv = document.createElement('div'); typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    if (chatHistory) chatHistory.appendChild(typingDiv);

    // ── ATTACHMENT MENU & IMAGE UPLOAD ───────────────────────────────

    // const chatAttachBtn = aiPanel.querySelector("#chat-attach-btn");
    const chatAttachMenu = aiPanel.querySelector('#chat-attach-menu');
    const chatImgInput = aiPanel.querySelector('#chat-img-input');
    const chatImgPreviewWrap = aiPanel.querySelector('#chat-img-preview-wrap');
    const chatImgPreview = aiPanel.querySelector('#chat-img-preview');
    const chatImgRemoveBtn = aiPanel.querySelector('#chat-img-remove-btn');
    const attachUploadImg = aiPanel.querySelector('#attach-upload-img');
    const attachGenImg = aiPanel.querySelector('#attach-gen-img');

    let attachedImageBase64 = null;
    let imageGenMode = false;
    let chatMsgHistory = []; // Local history for the current session

    // Toggle attachment popup + rotate the + button
    if (chatAttachBtn) {
        chatAttachBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = chatAttachMenu.classList.toggle('open');
            chatAttachBtn.classList.toggle('open', isOpen);
            if (isOpen) updateModelUI(); // refresh lock state on open
        });
    }
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (chatAttachMenu && !chatAttachMenu.contains(e.target) && !chatAttachBtn?.contains(e.target)) {
            chatAttachMenu.classList.remove('open');
            if (chatAttachBtn) chatAttachBtn.classList.remove('open');
        }
    });


    // Upload Image option
    if (attachUploadImg) {
        attachUploadImg.addEventListener('click', () => {
            chatAttachMenu.classList.remove('open');
            imageGenMode = false;
            chatImgInput.click();
        });
    }

    // Handle file input
    if (chatImgInput) {
        chatImgInput.addEventListener('change', () => {
            const file = chatImgInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                attachedImageBase64 = ev.target.result;
                chatImgPreview.src = attachedImageBase64;
                chatImgPreviewWrap.style.display = 'flex';
                chatImgPreviewWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            };
            reader.readAsDataURL(file);
            chatImgInput.value = '';
        });
    }

    // Remove attached image
    if (chatImgRemoveBtn) {
        chatImgRemoveBtn.addEventListener('click', () => {
            attachedImageBase64 = null;
            chatImgPreviewWrap.style.display = 'none';
            chatImgPreview.src = '';
        });
    }

    // Generate Image option
    if (attachGenImg) {
        attachGenImg.addEventListener('click', () => {
            chatAttachMenu.classList.remove('open');
            imageGenMode = true;
            chatInput.placeholder = 'Describe the image you want AI to create...';
            chatInput.focus();
            showToast('✦ Image Generation Mode — describe what you want!', 'info');
        });
    }


    // ── MEGA SCREEN EVENT PLANNER LOGIC ──────────────────────────────
    const attachPlanEvent = aiPanel.querySelector('#attach-plan-event');
    const eventPlanModal = aiPanel.querySelector('#event-plan-modal');
    const closeEventModal = aiPanel.querySelector('#close-event-modal');
    const plannerStep1 = aiPanel.querySelector('#planner-step-1');
    const plannerStep2 = aiPanel.querySelector('#planner-step-2');
    const backToStep1 = aiPanel.querySelector('#back-to-step-1');
    const megaForm = aiPanel.querySelector('#mega-plan-form');
    const megaCategoryInput = aiPanel.querySelector('#mega-category');
    const categoryTitle = aiPanel.querySelector('#selected-category-title');

    if (attachPlanEvent) {
        attachPlanEvent.addEventListener('click', () => {
            chatAttachMenu.classList.remove('open');
            chatAttachBtn.classList.remove('open');
            eventPlanModal.classList.add('active');
            plannerStep1.classList.add('active');
            plannerStep2.classList.remove('active');
            megaForm.reset();
            playSound('open');
        });
    }

    if (closeEventModal) {
        closeEventModal.addEventListener('click', () => {
            eventPlanModal.classList.remove('active');
            playSound('close');
        });
    }

    // Category Selection Logic (Step 1 -> Step 2)
    aiPanel.querySelectorAll('.selector-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            const label = btn.querySelector('.btn-label').textContent;
            const emoji = btn.querySelector('.btn-emoji').textContent;

            megaCategoryInput.value = category;
            categoryTitle.innerHTML = `${emoji} ${label}`;
            
            plannerStep1.classList.remove('active');
            setTimeout(() => {
                plannerStep2.classList.add('active');
                playSound('click');
            }, 50);
        });
    });

    if (backToStep1) {
        backToStep1.addEventListener('click', (e) => {
            e.preventDefault();
            plannerStep2.classList.remove('active');
            setTimeout(() => {
                plannerStep1.classList.add('active');
                playSound('click');
            }, 50);
        });
    }

    if (megaForm) {
        megaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = megaForm.querySelector('.mega-submit-btn');
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SECURING MASTER PLAN...';

            const user = getCurrentUser();
            
            // Build the "Kundali" (Detailed Report)
            const formData = {
                category: megaCategoryInput.value,
                client: aiPanel.querySelector('#mega-client-name').value,
                host: aiPanel.querySelector('#mega-host-name').value,
                date: aiPanel.querySelector('#mega-date').value,
                time: aiPanel.querySelector('#mega-time').value,
                guests: aiPanel.querySelector('#mega-guests').value,
                theme: aiPanel.querySelector('#mega-theme').value,
                venue: aiPanel.querySelector('#mega-venue').value,
                catering: aiPanel.querySelector('#mega-catering').value,
                budget: megaForm.querySelector('input[name="budget_tier"]:checked').value,
                reqs: aiPanel.querySelector('#mega-requirements').value
            };

            const kundali = `
💎 ELITE MASTER PLAN: ${formData.category.toUpperCase()}
👤 Client: ${formData.client}
🎉 Host/Event For: ${formData.host}
📅 Date: ${formData.date} (${formData.time})
👥 Guests: ${formData.guests}
🎨 Vision/Theme: ${formData.theme}
📍 Venue: ${formData.venue} 
🍽️ Catering: ${formData.catering}
💰 Budget Tier: ${formData.budget}
📝 Special Req: ${formData.reqs}
            `.trim();

            const dbData = {
                user_id: user?.id || 'guest',
                event_type: formData.category,
                event_date: formData.date,
                estimated_budget: 0, // Noted as placeholder in prompt
                number_of_guests: parseInt(formData.guests) || 0,
                details: kundali,
                created_at: new Date().toISOString()
            };

            try {
                if (!supabase) throw new Error('Supabase not initialized');
                const { error } = await supabase.from('event_plans').insert([dbData]);
                if (error) throw error;

                showToast("Awesome! Your master plan is securely locked. The Awlaa Global Elite Team will review this and contact you shortly.", "success");
                
                if (typeof speakWeb === 'function') {
                    speakWeb("Awesome. Your master plan is securely locked in our global servers. The Awlaa Global Elite Team will review this and contact you shortly.");
                }

                eventPlanModal.classList.remove('active');
                megaForm.reset();
            } catch (err) {
                console.error('Mega Save Error:', err);
                showToast('Security Breach: Error saving plan. ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        });
    }

    // ── AI MODEL SELECTION ────────────────────────────────────────────
    let activeModel = 'awlaaglobal-low'; // new default
    const modelAwlaacore = aiPanel.querySelector('#model-awlaacore');
    const modelAwlaaglobal = aiPanel.querySelector('#model-awlaaglobal');
    const modelAwlaaglobalLow = aiPanel.querySelector('#model-awlaaglobal-low');
    const modelCorelock = aiPanel.querySelector('#model-awlaacore-lock');
    const modelGlobalDot = aiPanel.querySelector('#model-awlaaglobal-dot');
    const modelGlobalLowDot = aiPanel.querySelector('#model-awlaaglobal-low-dot');
    const activeModelName = aiPanel.querySelector('#ai-active-model-name');
    const activeModelDot = aiPanel.querySelector('#ai-active-model-dot');

    function updateModelUI() {
        const tier = getUserTier(currentUID);
        const hasPremium = (tier.id === 'premium' || tier.id === 'unlimited');

        // Lock / unlock AwlaaCore based on tier
        if (modelCorelock) modelCorelock.style.display = hasPremium ? 'none' : 'inline-flex';
        if (modelAwlaacore) {
            modelAwlaacore.classList.toggle('model-locked', !hasPremium);
            modelAwlaacore.classList.toggle('model-selected', activeModel === 'awlaacore' && hasPremium);
        }
        if (modelAwlaaglobal) {
            modelAwlaaglobal.classList.toggle('model-selected', activeModel === 'awlaaglobal');
        }
        if (modelAwlaaglobalLow) {
            modelAwlaaglobalLow.classList.toggle('model-selected', activeModel === 'awlaaglobal-low');
        }

        // Update header active model bar
        if (activeModelDot && activeModelName) {
            if (activeModel === 'awlaacore' && hasPremium) {
                activeModelDot.style.background = '#c9a438';
                activeModelName.textContent = 'AwlaaCore PRO';
                activeModelName.style.color = '#c9a438';
            } else if (activeModel === 'awlaaglobal') {
                activeModelDot.style.background = '#4ade80';
                activeModelName.textContent = 'AwlaaGlobal Professional AI assistant';
                activeModelName.style.color = '#4ade80';
            } else {
                activeModelDot.style.background = '#38bdf8';
                activeModelName.textContent = 'AwlaaGlobal AI assistant';
                activeModelName.style.color = '#38bdf8';
            }
        }
        // Dots
        if (modelGlobalDot) modelGlobalDot.style.display = (activeModel === 'awlaaglobal') ? 'inline-flex' : 'none';
        if (modelGlobalLowDot) modelGlobalLowDot.style.display = (activeModel === 'awlaaglobal-low') ? 'inline-flex' : 'none';
    }
    updateModelUI();

    if (modelAwlaacore) {
        modelAwlaacore.addEventListener('click', () => {
            const tier = getUserTier(currentUID);
            const hasPremium = (tier.id === 'premium' || tier.id === 'unlimited');
            if (!hasPremium) {
                chatAttachMenu.classList.remove('open');
                showToast('✦ AwlaaCore requires a Premium or Unlimited plan.', 'info');
                unifiedOverlay.classList.add('active');
                refreshUnifiedModal();
                return;
            }
            activeModel = 'awlaacore';
            chatInput.placeholder = 'Ask AwlaaCore AI anything...';
            updateModelUI();
            chatAttachMenu.classList.remove('open');
            showToast('✦ Switched to AwlaaCore — Full power activated!', 'info');
            playSound('success');
        });
    }
    if (modelAwlaaglobal) {
        modelAwlaaglobal.addEventListener('click', () => {
            activeModel = 'awlaaglobal';
            chatInput.placeholder = 'Ask AwlaaGlobal Professional AI assistant...';
            updateModelUI();
            chatAttachMenu.classList.remove('open');
            showToast('⚡ Switched to AwlaaGlobal Professional AI assistant', 'info');
            playSound('click');
        });
    }
    if (modelAwlaaglobalLow) {
        modelAwlaaglobalLow.addEventListener('click', () => {
            activeModel = 'awlaaglobal-low';
            chatInput.placeholder = 'Ask AwlaaGlobal AI assistant [Unlimited Website Guide]...';
            updateModelUI();
            chatAttachMenu.classList.remove('open');
            showToast('🌐 Switched to AwlaaGlobal AI assistant — Unlimited!', 'info');
            playSound('click');
        });
    }

    // ── TYPE BAR TRANSITION LOGIC ──────────────────────────────────────
    if (chatInput && chatLiveBtn && chatSend) {
        chatInput.addEventListener('input', () => {
            const hasText = chatInput.value.trim().length > 0;
            if (hasText) {
                chatLiveBtn.classList.add('aside');
                chatSend.style.display = 'flex';
                setTimeout(() => chatSend.classList.add('visible'), 50);
            } else {
                chatSend.classList.remove('visible');
                setTimeout(() => {
                    if (chatInput.value.trim().length === 0) {
                        chatSend.style.display = 'none';
                        chatLiveBtn.classList.remove('aside');
                    }
                }, 300);
            }
        });
    }

    // ── MIC / LIVE MODE ──────────────────────────────────────────────
    if (chatLiveBtn) {
        chatLiveBtn.addEventListener('click', () => {
            playSound('open');
            liveMode.show();
        });
    }

    // ── LIVE MODE OVERLAY EVENTS & VOICE TOGGLE ────────────────────────
    const liveOverlay = document.getElementById('awlaa-live-overlay');
    const closeLiveBtn = document.getElementById('close-live-btn');
    const voiceToggleBtn = aiPanel.querySelector('#chat-voice-toggle');
    
    if (closeLiveBtn && liveOverlay) {
        closeLiveBtn.addEventListener('click', () => {
            playSound('close');
            liveOverlay.classList.remove('active');
            if (liveMode && liveMode.stop) liveMode.stop();
        });
    }

    if (voiceToggleBtn) {
        voiceToggleBtn.addEventListener('click', () => {
            const newState = toggleAiVoice();
            voiceToggleBtn.classList.toggle('active-voice', newState);
            voiceToggleBtn.style.color = newState ? 'var(--gold)' : 'rgba(255,255,255,0.3)';
            const ico = voiceToggleBtn.querySelector('i');
            ico.className = newState ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            playSound('click');
        });
    }

    // Note: SpeechRecognition is kept for background use if needed, but UI is removed from the bar.
    let isListening = false;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            chatInput.value = transcript;
        };
        recognition.onend = () => { isListening = false; };
        recognition.onerror = () => { isListening = false; };
    }

    // ── IMAGE GENERATION FUNCTION ────────────────────────────────────
    // Using unified brain logic
    async function generateImage(prompt) {
        return await generateAIImage(prompt);
    }

    // 🎨 AWLAA GLOBAL - AUTO WATERMARK ENGINE (Frontend)
    async function applyAwlaaWatermark(imageUrl) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = "anonymous"; // Server security bypass

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // VIP Gold Branding Styling
                ctx.font = "bold 24px 'Courier New', monospace";
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.textAlign = "right";
                
                // Shadow taaki har color pe dikhe
                ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;

                // Stamp it!
                ctx.fillText("✨ AWLAA GLOBAL", canvas.width - 20, canvas.height - 20);

                resolve(canvas.toDataURL("image/jpeg", 0.95));
            };
            img.onerror = (err) => reject(err);
            img.src = imageUrl;
        });
    }

    async function sendMsg() {
        const txt = chatInput.value.trim();

        // If in image gen mode and no text, do nothing
        if (!txt && !attachedImageBase64) return;
        if (!txt && attachedImageBase64) { showToast('Please type a question about the image.', 'info'); return; }
        
        playSound('message_sent'); // Sound on send

        // ── TIER LIMIT CHECK ─────────────────────────────────────────
        const isUnlimitedModel = activeModel === 'awlaaglobal-low';
        if (!isUnlimitedModel && !canSendMessage(currentUID)) {
            showLimitModal();
            return;
        }

        // ── IMAGE GENERATION MODE ────────────────────────────────────
        // ── IMAGE GENERATION MODE ────────────────────────────────────
        if (imageGenMode) {
            const userDiv = document.createElement('div'); userDiv.className = 'chat-msg user-msg';
            userDiv.innerHTML = `<div class="msg-content"><i class="fas fa-wand-magic-sparkles" style="color:var(--gold);margin-right:6px;"></i>${txt}</div>`;
            chatHistory.insertBefore(userDiv, typingDiv);
            chatInput.value = '';
            chatInput.placeholder = 'Ask anything...';

            if (!isUnlimitedModel) {
                recordMessage(currentUID);
                updateTierUI();
            }

            // Create professional AI message bubble for the image
            const aiDiv = document.createElement('div'); 
            aiDiv.className = 'chat-msg ai-msg gen-image-msg';
            aiDiv.innerHTML = `
                <div class="msg-content">
                    <div class="ai-gen-img-container">
                        <div class="ai-gen-img-shimmer">
                            <div class="gen-spinner-glow"></div>
                            <span>Awlaa Visual Engine Generating...</span>
                            <span class="ai-gen-sub-status" style="font-size:0.7rem; opacity:0.7; margin-top:5px; display:block;">Preparing Neural Stream...</span>
                        </div>
                        <img class="ai-gen-img-final" style="display:none;" alt="Generated Image" />
                        <div class="ai-gen-img-actions" style="display:none;">
                            <button class="img-action-btn download-btn" title="Download Image"><i class="fas fa-download"></i></button>
                            <button class="img-action-btn expand-btn" title="View Fullscreen"><i class="fas fa-expand"></i></button>
                        </div>
                    </div>
                </div>
            `;
            chatHistory.insertBefore(aiDiv, typingDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;

            try {
                // 1. Pehle Cloudflare se raw image laao
                const rawImgUrl = await generateImage(txt);
                
                // 2. ✨ WATERMARK MAGIC: Raw image ko Watermark engine mein daalo
                const subStatus = aiDiv.querySelector('.ai-gen-sub-status');
                if (subStatus) subStatus.textContent = "Applying VIP Branding...";

                const brandedImgUrl = await applyAwlaaWatermark(rawImgUrl);

                const finalImg = aiDiv.querySelector('.ai-gen-img-final');
                const shimmer = aiDiv.querySelector('.ai-gen-img-shimmer');
                const actions = aiDiv.querySelector('.ai-gen-img-actions');

                finalImg.onload = () => {
                    shimmer.style.display = 'none';
                    finalImg.style.display = 'block';
                    actions.style.display = 'flex';
                    chatHistory.scrollTop = chatHistory.scrollHeight;
                    
                    // Button Logic (Ab branded image download aur expand hogi!)
                    aiDiv.querySelector('.download-btn').onclick = () => {
                        const a = document.createElement('a'); a.href = brandedImgUrl; a.download = `Awlaa_AI_Branded_${Date.now()}.jpg`; a.click();
                    };
                    aiDiv.querySelector('.expand-btn').onclick = () => {
                        // Base64 ko naye tab mein kholne ka sabse safe tarika
                        const w = window.open("");
                        w.document.write(`<body style="margin:0; background:#111; display:flex; justify-content:center; align-items:center; height:100vh;"><img src="${brandedImgUrl}" style="max-width:100%; max-height:100vh; object-fit:contain;"></body>`);
                    };
                };
                // 3. UI mein Branding wali image dikhao
                finalImg.src = brandedImgUrl;
            } catch (err) {
                aiDiv.querySelector('.ai-gen-img-shimmer').innerHTML = `<span style="color:var(--err);">Visual Engine error. Please try again.</span>`;
            }
            
            imageGenMode = false;
            return;
        }

        // ── NORMAL / IMAGE ANALYSIS CHAT ────────────────────────────
        const userDiv = document.createElement('div'); userDiv.className = 'chat-msg user-msg';
        let userHTML = `<div class="msg-content">`;
        if (attachedImageBase64) {
            userHTML += `<img src="${attachedImageBase64}" style="max-width:200px;max-height:150px;border-radius:8px;display:block;margin-bottom:6px;" />`;
        }
        userHTML += `${txt}</div>`;
        userDiv.innerHTML = userHTML;
        chatHistory.insertBefore(userDiv, typingDiv);
        chatInput.value = '';
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Hide preview
        if (attachedImageBase64) {
            chatImgPreviewWrap.style.display = 'none';
            chatImgPreview.src = '';
        }

        // Show typing
        typingDiv.style.display = 'flex'; chatHistory.scrollTop = chatHistory.scrollHeight;

        if (!isUnlimitedModel) {
            recordMessage(currentUID);
            updateTierUI();
        }

        // Modify prompt if image attached
        let modelType = 'high';
        if (activeModel === 'awlaacore') modelType = 'pro';
        if (activeModel === 'awlaaglobal-low') modelType = 'low';

        // Prepare tiered context
        const currentTier = getUserTier(currentUID);
        const contextLimit = currentTier.contextLimit || 0;
        const historyContext = chatMsgHistory.slice(-(contextLimit * 2));

        // Send to AI
        const aiResponse = await fetchAIResponse(txt, modelType, historyContext);

        playSound('message_received'); // Sound on AI reply
        // Update history
        chatMsgHistory.push({ role: "user", content: txt });
        chatMsgHistory.push({ role: "assistant", content: aiResponse });
        if (chatMsgHistory.length > 50) chatMsgHistory.splice(0, 2);

        const cleanText = aiResponse.replace(/\*/g, '').replace(/_/g, '').replace(/#/g, '');
        
        const aiDiv = document.createElement('div'); aiDiv.className = 'chat-msg ai-msg';
        aiDiv.innerHTML = `
            <div class="msg-content">
                ${aiResponse.replace(/\n/g, '<br>')}
                <button class="ai-inline-speak-btn" title="Listen to response" style="background:transparent; border:none; color:var(--gold); margin-left:8px; cursor:pointer; font-size:1.1rem; padding:0; display:inline-flex; align-items:center; gap:5px;">
                    <i class="fas fa-volume-up"></i>
                    <span style="font-size:0.65rem; font-family:monospace; opacity:0.6; letter-spacing:1px;">SONIC</span>
                </button>
            </div>
        `;
        
        const speakBtn = aiDiv.querySelector('.ai-inline-speak-btn');
        speakBtn.addEventListener('click', () => {
            playSound('click');
            speakAI(cleanText);
        });

        chatHistory.insertBefore(aiDiv, typingDiv);
        typingDiv.style.display = 'none'; chatHistory.scrollTop = chatHistory.scrollHeight;

        // Auto-read logic removed per user request. Users will now manually click the speaker icon.

        attachedImageBase64 = null;

        const remCount = getRemainingMessages(currentUID);
        if (remCount > 0 && remCount <= 2 && currentTier.limit !== Infinity) {
            showToast(`⚠ Only ${remCount} chat${remCount === 1 ? '' : 's'} left in this period.`, 'info');
        }
        updateTierUI();
    }

    if (chatSend) chatSend.addEventListener('click', sendMsg);
    if (chatInput) chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMsg(); });


    // ── CLOSE ALL PANELS ──────────────────────────────────────────────
    function closeAllPanels() {
        document.querySelectorAll('#products-panel,#contact-panel,#ai-panel').forEach(p => p.classList.remove('active'));
        document.body.style.overflow = '';
    }
    document.addEventListener('click', e => {
        const sidebar = document.getElementById('left-sidebar');
        const bottomNav = document.getElementById('mobile-bottom-nav');
        
        if (sidebar?.contains(e.target) || bottomNav?.contains(e.target)) return;

        ['products-panel', 'contact-panel', 'ai-panel'].forEach(id => {
            const panel = document.getElementById(id);
            if (panel?.classList.contains('active') && !panel.contains(e.target)) {
                panel.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // ── LEFT SIDEBAR ──────────────────────────────────────────────────
    const sidebar = document.getElementById('left-sidebar');
    // Sidebar toggle button removed per user request


    if (sidebar && leftSideIcons) {
        leftSideIcons.forEach((item, index) => {
            const a = document.createElement('a'); a.href = item.link; a.className = 'sidebar-icon-link';
            a.innerHTML = item.icon; if (item.title) a.title = item.title;
            
            if (item.link === '#products') a.addEventListener('click', e => { 
                e.preventDefault(); closeAllPanels(); playSound('open'); document.getElementById('products-panel').classList.toggle('active'); 
            });
            if (item.link === '#contact') a.addEventListener('click', e => { 
                e.preventDefault(); closeAllPanels(); playSound('open'); document.getElementById('contact-panel').classList.toggle('active'); 
            });
            if (item.link === '#ai-chat') a.addEventListener('click', e => { 
                e.preventDefault(); closeAllPanels(); playSound('open'); document.getElementById('ai-panel').classList.toggle('active'); 
                if (document.getElementById('ai-panel').classList.contains('active')) document.body.style.overflow = 'hidden'; 
            });
            
            if (item.isProfile) {
                a.classList.add('profile-icon');
                a.id = 'sidebar-profile-btn'; // Assign ID for reactivity
                a.addEventListener('click', e => {
                    e.preventDefault();
                    if (currentUID === 'guest') {
                        signInWithGoogle();
                    } else {
                        // Open unified profile modal
                        const unifiedOverlay = document.getElementById('unified-auth-modal');
                        if (unifiedOverlay) unifiedOverlay.classList.add('active');
                    }
                });
            }
            const iconEl = a.querySelector('i');
            if (iconEl) { iconEl.style.animation = `iconFloat 3s ease-in-out infinite`; iconEl.style.animationDelay = `${index * 0.2}s`; }
            sidebar.appendChild(a);
        });
    }

    // ── MOBILE BOTTOM NAV (Clone of LEFT SIDEBAR logic) ────────────────
    const mobileBottomNav = document.getElementById('mobile-bottom-nav');
    if (mobileBottomNav && leftSideIcons) {
        leftSideIcons.forEach((item, index) => {
            const a = document.createElement('a'); a.href = item.link; a.className = 'mobile-bottom-link';

            // Reconstruct icon + span label for mobile bottom nav
            let innerContent = item.icon;
            if (item.title && !item.isProfile) {
                innerContent += `<span>${item.title.split(' ')[0]}</span>`; // e.g. "AI" from "AI Chat" or "Products"
            } else if (item.isProfile) {
                innerContent += `<span>Profile</span>`;
            }
            a.innerHTML = innerContent;

            if (item.link === '#products') a.addEventListener('click', e => { 
                e.preventDefault(); closeAllPanels(); playSound('open'); document.getElementById('products-panel').classList.toggle('active'); 
            });
            if (item.link === '#contact') a.addEventListener('click', e => { 
                e.preventDefault(); closeAllPanels(); playSound('open'); document.getElementById('contact-panel').classList.toggle('active'); 
            });
            if (item.link === '#ai-chat') a.addEventListener('click', e => { 
                e.preventDefault(); closeAllPanels(); playSound('open'); document.getElementById('ai-panel').classList.toggle('active'); 
                if (document.getElementById('ai-panel').classList.contains('active')) document.body.style.overflow = 'hidden'; 
            });
            
            if (item.isProfile) {
                a.id = 'mobile-profile-btn'; // Assign ID for reactivity
                a.addEventListener('click', e => {
                    e.preventDefault();
                    if (currentUID === 'guest') {
                        signInWithGoogle();
                    } else {
                        // Open unified profile modal
                        const unifiedOverlay = document.getElementById('unified-auth-modal');
                        if (unifiedOverlay) unifiedOverlay.classList.add('active');
                    }
                });
            }
            mobileBottomNav.appendChild(a);
        });
    }

    // ── GOLD PARTICLES ────────────────────────────────────────────────
    const canvas = document.getElementById('gold-particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        let parts = [];
        const N = window.innerWidth < 768 ? 50 : 100;
        class Particle {
            constructor() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.dx = (Math.random() * .4) - .2; this.dy = (Math.random() * .4) - .2; this.size = Math.random() * 1.8 + .3; this.opacity = Math.random() * .45 + .08; }
            update() { this.x += this.dx; this.y += this.dy; if (this.x > canvas.width) this.x = 0; if (this.x < 0) this.x = canvas.width; if (this.y > canvas.height) this.y = 0; if (this.y < 0) this.y = canvas.height; }
            draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.globalAlpha = this.opacity; ctx.fillStyle = '#c9a438'; ctx.fill(); ctx.globalAlpha = 1; }
        }
        for (let i = 0; i < N; i++) parts.push(new Particle());
        function animate() { 
            if (!document.hidden) {
                ctx.clearRect(0, 0, canvas.width, canvas.height); 
                parts.forEach(p => { p.update(); p.draw(); }); 
            }
            requestAnimationFrame(animate); 
        }
        animate();
        window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; parts = []; for (let i = 0; i < N; i++) parts.push(new Particle()); });
    }

    // ── EXPANDABLE CALL BUTTONS ────────────────────────────────────────
    const callWrappers = document.querySelectorAll('.expandable-call-wrapper');
    callWrappers.forEach(wrapper => {
        const toggleBtn = wrapper.querySelector('button');
        const callPopup = wrapper.querySelector('.call-options-popup');
        if (toggleBtn && callPopup) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                playSound('click');
                callPopup.classList.toggle('active');
                toggleBtn.classList.toggle('active');
            });
            document.addEventListener('click', (e) => {
                if (!toggleBtn.contains(e.target) && !callPopup.contains(e.target)) {
                    callPopup.classList.remove('active');
                    toggleBtn.classList.remove('active');
                }
            });
        }
    });

    // ── ADMIN GOD MODE LOGIC ──────────────────────────────────────────
    const CEO_GMAILS = ["kabirchisti997@gmail.com", "official@awlaaglobal.com"];
    const MASTER_PASSWORD = "AWLAA_GOD_MODE_997";

    const godModeTrigger = document.getElementById('god-mode-trigger');
    const adminPassModal = document.getElementById('admin-pass-modal');
    const adminMasterPassInput = document.getElementById('admin-master-pass');
    const gmSubmitBtn = document.getElementById('gm-submit-btn');
    const gmCancelBtn = document.getElementById('gm-cancel-btn');
    const gmStatusMsg = document.getElementById('gm-status-msg');
    const hackerDashboard = document.getElementById('hacker-dashboard');
    const exitGodModeBtn = document.getElementById('exit-god-mode');

    let adminAuthPending = false;

    if (godModeTrigger) {
        godModeTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            const user = getCurrentUser();
            if (user && CEO_GMAILS.includes(user.email)) {
                adminPassModal.classList.add('active');
                adminMasterPassInput.focus();
            } else {
                adminAuthPending = true;
                signInWithGoogle();
                showToast('✦ Admin Verification Required. Please sign in with a whitelisted account.', 'info');
            }
        });
    }

    // Auto-check on auth change if we were waiting for admin login
    onAuthChange(user => {
        if (adminAuthPending && user) {
            adminAuthPending = false;
            if (CEO_GMAILS.includes(user.email)) {
                adminPassModal.classList.add('active');
                adminMasterPassInput.focus();
            } else {
                signOut();
                showToast('Access Denied: Unauthorized Admin Account.', 'error');
            }
        }
    });

    if (gmCancelBtn) {
        gmCancelBtn.addEventListener('click', () => {
            adminPassModal.classList.remove('active');
            adminMasterPassInput.value = '';
            gmStatusMsg.textContent = '';
        });
    }

    if (gmSubmitBtn) {
        gmSubmitBtn.addEventListener('click', () => {
            if (adminMasterPassInput.value === MASTER_PASSWORD) {
                adminPassModal.classList.remove('active');
                showHackerDashboard();
                playSound('open');
            } else {
                gmStatusMsg.style.color = '#ff4444';
                gmStatusMsg.textContent = 'ERROR: INVALID_MASTER_CODE. LOCKOUT_IMMINENT.';
                playSound('error');
                setTimeout(() => {
                    adminPassModal.classList.remove('active');
                    signOut();
                    showToast('Security Violation: Master Password Incorrect.', 'error');
                }, 2000);
            }
        });
    }

    async function showHackerDashboard() {
        hackerDashboard.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Populate Dashboard Data
        const evList = document.getElementById('gm-event-plans-list');
        const uList = document.getElementById('gm-users-list');
        const cList = document.getElementById('gm-chats-list');

        if (!supabase) return;

        try {
            // Fetch Event Plans
            const { data: plans } = await supabase.from('event_plans').select('*').order('created_at', { ascending: false }).limit(10);
            if (plans && plans.length > 0) {
                evList.innerHTML = plans.map(p => `
                    <div class="gm-data-item">
                        <div class="terminal-text" style="color:#00ff41">> ENTRY: ${p.event_type} | ${new Date(p.created_at).toLocaleDateString()}</div>
                        <div class="terminal-text" style="opacity:0.9; white-space: pre-wrap; margin-top:10px; padding-left:15px; border-left:1px solid rgba(0,255,65,0.3)">${p.details || 'No detailed kundali available.'}</div>
                    </div>
                `).join('');
            } else {
                evList.innerHTML = '<p class="terminal-text">No active event plans found in database.</p>';
            }

            // Fetch Recent Users (from public profile table if exists, or just demo)
            uList.innerHTML = `
                <div class="gm-data-item"><div class="terminal-text">> SECURING_USER_REGISTRY...</div></div>
                <div class="gm-data-item"><div class="terminal-text" style="color:#2dd4bf">> ACTIVE_ADMIN: kabirchisti997@gmail.com</div></div>
                <div class="gm-data-item"><div class="terminal-text">> ROOT_ENTITY: official@awlaaglobal.com</div></div>
            `;

            // Comm Logs demo
            cList.innerHTML = `
                <div class="gm-data-item"><div class="terminal-text" style="color:#ffb800">> INTERCEPTING_NEURAL_LINK...</div></div>
                <div class="gm-data-item"><div class="terminal-text">> LOG: "Hello, tell me about legal services..."</div></div>
                <div class="gm-data-item"><div class="terminal-text">> LOG: "How do I invest in Awlaa Global?"</div></div>
            `;

        } catch (err) {
            console.error('Dashboard Fetch Error:', err);
        }
    }

    if (exitGodModeBtn) {
        exitGodModeBtn.addEventListener('click', () => {
            hackerDashboard.classList.remove('active');
            document.body.style.overflow = '';
            playSound('close');
        });
    }

    // ── SECURITY ──────────────────────────────────────────────────────
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG' || e.target.tagName === 'A' || e.target.closest('a')) e.preventDefault(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'F12') e.preventDefault();
        if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) e.preventDefault();
        if (e.ctrlKey && ['U', 'u'].includes(e.key)) e.preventDefault();
    });

});

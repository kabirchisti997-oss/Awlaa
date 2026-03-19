export const aiHTML = `
    <div class="panel-inner-content" style="height: 100%; display: flex; flex-direction: column; position: relative;">
        <div class="ai-flicker-overlay"></div>

        <!-- Slim Header -->
        <div class="ai-panel-header-slim">
            <button class="ai-header-back-btn" id="ai-back-btn" title="Back">
                <i class="fas fa-arrow-left"></i>
            </button>
            <div class="ai-header-center">
                <h2 class="ai-header-chat-name">AwlaaCore <span>AI</span></h2>
                <div class="ai-header-status-dot"></div>
            </div>
            <button class="ai-header-menu-btn" id="ai-header-menu-btn" title="Account Details">
                <i class="fas fa-ellipsis-v"></i>
            </button>
        </div>

        <!-- Account Details Popup (Glassmorphism) -->
        <div class="ai-account-popup" id="ai-account-popup">
            <div class="ai-popup-header">
                <h3>Account Intelligence</h3>
                <div class="ai-popup-line"></div>
            </div>
            
            <div class="ai-popup-user-section">
                <div class="ai-popup-avatar-wrap">
                    <div class="ai-popup-avatar" id="ai-popup-avatar">👤</div>
                    <div class="ai-popup-tier-ring" id="ai-tier-ring"></div>
                </div>
                <div class="ai-popup-user-meta">
                    <div class="ai-popup-name" id="ai-popup-name">Guest User</div>
                    <div class="ai-popup-tier-tag" id="ai-tier-badge">
                        <span id="ai-tier-icon">👤</span>
                        <span id="ai-tier-name">Guest</span>
                    </div>
                </div>
            </div>

            <div class="ai-popup-usage-section">
                <div class="ai-usage-info">
                    <span id="ai-usage-text">5 / 5 Chats Remaining</span>
                </div>
                <div class="ai-usage-track">
                    <div class="ai-usage-fill" id="ai-usage-fill" style="width:0%"></div>
                    <div class="ai-usage-liquid"></div>
                </div>
                <div class="ai-usage-reset" id="ai-usage-reset-text">Resets in 2h 30m</div>
            </div>

            <!-- Active Model Info (Moved here for slimness) -->
            <div class="ai-popup-model-info">
                <div class="ai-active-model-bar" id="ai-active-model-bar">
                    <span class="ai-active-model-dot" id="ai-active-model-dot"></span>
                    <span class="ai-active-model-name" id="ai-active-model-name">AwlaaGlobal AI</span>
                </div>
            </div>
        </div>

        <!-- SVG Filter for Liquid Effect -->
        <svg style="visibility: hidden; position: absolute;" width="0" height="0">
            <defs>
                <filter id="liquid-filter">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="liquid" />
                    <feComposite in="SourceGraphic" in2="liquid" operator="atop"/>
                </filter>
            </defs>
        </svg>

        <!-- CHAT BODY (scrollable area + input) -->
        <div class="chat-interface">
            <!-- Image Preview Area -->
            <div class="chat-img-preview-wrap" id="chat-img-preview-wrap" style="display:none;">
                <div class="chat-img-preview-inner">
                    <img id="chat-img-preview" src="" alt="Attached Image" />
                    <button class="chat-img-remove-btn" id="chat-img-remove-btn" title="Remove image">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <span class="chat-img-preview-label">Image attached — Ask AI about it</span>
            </div>


            <div class="chat-history" id="chat-history">
                <div class="chat-msg ai-msg">
                    <div class="msg-content">Hello. I am AwlaaCore AI. How may I assist you with our global infrastructure today?</div>
                </div>
            </div>
            
            <!-- Hidden file input -->
            <input type="file" id="chat-img-input" accept="image/*" style="display:none;" />

            <div class="gemini-input-container">
                <!-- ── CENTER/RIGHT: INPUT BAR ── -->
                <div class="gemini-input-bar" style="margin-left:0; padding-left:1rem;">
                    <input type="text" id="chat-input" placeholder="Message..." autocomplete="off" style="padding-left:0;" />
                    
                    <div class="gemini-input-actions-right">
                        <!-- Send icon (only visible when typing) -->
                        <button id="chat-send-btn" title="Send message" style="display:none;"><i class="fas fa-arrow-up"></i></button>
                    </div>
                </div>
            </div>
        </div>


        <!-- Mega Screen Event Planner -->
        <div id="event-plan-modal" class="ai-sub-modal mega-screen">
            <div class="ai-sub-modal-content mega-content">
                <button class="ai-sub-modal-close" id="close-event-modal">&times;</button>
                
                <!-- Step 1: Master Selector -->
                <div id="planner-step-1" class="planner-step active">
                    <div class="ai-sub-modal-header">
                        <div class="mega-icon-glow"><i class="fas fa-sparkles"></i></div>
                        <h3>The Mega Screen</h3>
                        <p>What are you planning with Awlaa Global today?</p>
                    </div>
                    
                    <div class="master-selector-grid">
                        <button class="selector-btn" data-category="Wedding">
                            <span class="btn-emoji">💍</span>
                            <span class="btn-label">Grand Wedding & Reception</span>
                        </button>
                        <button class="selector-btn" data-category="Birthday">
                            <span class="btn-emoji">🎂</span>
                            <span class="btn-label">Birthday / Anniversary Party</span>
                        </button>
                        <button class="selector-btn" data-category="Corporate">
                            <span class="btn-emoji">🏢</span>
                            <span class="btn-label">Corporate Event / Promotion</span>
                        </button>
                        <button class="selector-btn" data-category="SmartHome">
                            <span class="btn-emoji">🏠</span>
                            <span class="btn-label">Smart Home & Interior Setup</span>
                        </button>
                        <button class="selector-btn" data-category="Software">
                            <span class="btn-emoji">💻</span>
                            <span class="btn-label">Custom Software / App Project</span>
                        </button>
                        <button class="selector-btn" data-category="Legal">
                            <span class="btn-emoji">⚖️</span>
                            <span class="btn-label">Legal Kanuni Consultation & Filing</span>
                        </button>
                        <button class="selector-btn" data-category="Publishing">
                            <span class="btn-emoji">📚</span>
                            <span class="btn-label">Book Publishing Project</span>
                        </button>
                    </div>
                </div>

                <!-- Step 2: Magic Expansion (The Form) -->
                <div id="planner-step-2" class="planner-step">
                    <div class="ai-sub-modal-header mini">
                        <h3 id="selected-category-title">Grand Wedding & Reception</h3>
                        <button id="back-to-step-1" class="back-link"><i class="fas fa-arrow-left"></i> Change Category</button>
                    </div>

                    <form id="mega-plan-form" class="mega-form">
                        <input type="hidden" id="mega-category" name="category">
                        
                        <div class="form-sections-wrapper">
                            <!-- 📝 1. The Basics -->
                            <div class="mega-form-section">
                                <h4><i class="fas fa-info-circle"></i> 1. The Basics (Who & When)</h4>
                                <div class="mega-form-grid">
                                    <div class="form-group">
                                        <label>Client Name</label>
                                        <input type="text" id="mega-client-name" placeholder="Kiske naam se booking hai?" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Host / To & Who</label>
                                        <input type="text" id="mega-host-name" placeholder="Name of main person" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Date & Year</label>
                                        <input type="date" id="mega-date" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Time Schedule</label>
                                        <select id="mega-time">
                                            <option value="Morning">Morning Event</option>
                                            <option value="Evening" selected>Evening Event</option>
                                            <option value="FullDay">Full Day / Night</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Guest Count</label>
                                        <input type="number" id="mega-guests" placeholder="e.g. 500">
                                    </div>
                                </div>
                            </div>

                            <!-- 🎨 2. The Vision -->
                            <div class="mega-form-section">
                                <h4><i class="fas fa-paint-brush"></i> 2. The Vision (How it needs to look)</h4>
                                <div class="form-group">
                                    <label>Theme & Aesthetics</label>
                                    <textarea id="mega-theme" placeholder="Describe your vision (Royal, Neon, Vintage, etc.)"></textarea>
                                </div>
                                <div class="mega-form-grid">
                                    <div class="form-group">
                                        <label>Venue Type</label>
                                        <input type="text" id="mega-venue" placeholder="Indoor, Lawn, etc.">
                                    </div>
                                    <div class="form-group">
                                        <label>Catering Preference</label>
                                        <select id="mega-catering">
                                            <option value="Veg">Special Veg</option>
                                            <option value="NonVeg">Non-Veg</option>
                                            <option value="Live">Live Counters</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- 💰 3. The Budget -->
                            <div class="mega-form-section">
                                <h4><i class="fas fa-coins"></i> 3. The Budget (Low cost & Scale)</h4>
                                <div class="form-group">
                                    <label>Budget Category</label>
                                    <div class="budget-selector">
                                        <label class="budget-option">
                                            <input type="radio" name="budget_tier" value="Economy" checked>
                                            <div class="budget-card eco">
                                                <div class="dot"></div>
                                                <span>Economy</span>
                                            </div>
                                        </label>
                                        <label class="budget-option">
                                            <input type="radio" name="budget_tier" value="Standard">
                                            <div class="budget-card std">
                                                <div class="dot"></div>
                                                <span>Standard</span>
                                            </div>
                                        </label>
                                        <label class="budget-option">
                                            <input type="radio" name="budget_tier" value="Premium">
                                            <div class="budget-card prm">
                                                <div class="dot"></div>
                                                <span>Premium</span>
                                            </div>
                                        </label>
                                        <label class="budget-option">
                                            <input type="radio" name="budget_tier" value="Ultra">
                                            <div class="budget-card lux">
                                                <div class="dot"></div>
                                                <span>Ultra-Luxury</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Special Requirements</label>
                                    <textarea id="mega-requirements" placeholder="Anything else? (Drone, LED screen, etc.)"></textarea>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="mega-submit-btn">
                            <span class="btn-text">LOCK MASTER PLAN</span>
                            <i class="fas fa-shield-alt"></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>

    </div>
`;
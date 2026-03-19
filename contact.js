export const contactHTML = `
    <div class="panel-inner-content">
        <div class="panel-header-rich">
            <h2 class="panel-title-large">Direct Connect</h2>
            <div class="gold-divider-small"></div>
            <p class="panel-subtitle">Real-time communication channel.</p>
        </div>
        
        <div class="rich-map-wrapper">
            <div class="map-glow-border"></div>
            <iframe 
                src="https://www.google.com/maps?q=Hathiara+Beltala+More+Methopara,+Kolkata&output=embed" 
                width="100%" 
                height="100%" 
                style="border:0;" 
                allowfullscreen="" 
                loading="lazy"
                class="google-map-embed-dark">
            </iframe>
        </div>

        <div class="contact-actions-panel" style="display:flex; justify-content:center; gap:1.5rem; margin-top:1rem;">
            <a href="mailto:awlaaglobal@gmail.com" class="rich-call-btn" style="width:45px; height:45px; font-size:1.1rem;" title="Send Email">
                <div class="btn-icon-glow" style="animation-delay: 0.1s;"><i class="fas fa-envelope"></i></div>
            </a>
                <div class="expandable-call-wrapper">
                    <button class="rich-call-btn" style="width:45px; height:45px; font-size:1.1rem; cursor:pointer;" title="Initiate Voice Call">
                        <div class="btn-icon-glow" style="animation-delay: 0.2s;"><i class="fas fa-phone-volume"></i></div>
                    </button>
                    <div class="call-options-popup">
                        <a href="tel:+919831509834" class="call-option-btn">
                            <i class="fas fa-user-tie"></i>
                            <span>Company Director</span>
                        </a>
                        <a href="tel:+916291862585" class="call-option-btn">
                            <i class="fas fa-headset"></i>
                            <span>Customer Care</span>
                        </a>
                    </div>
                </div>
                <a href="https://wa.me/916291862585" class="rich-call-btn" style="width:45px; height:45px; font-size:1.1rem;" title="WhatsApp Message">
                <div class="btn-icon-glow" style="animation-delay: 0.3s;"><i class="fab fa-whatsapp"></i></div>
            </a>
        </div>
    </div>
`;

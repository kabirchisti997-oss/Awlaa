/**
 * web_voice.js
 * Browser-native "Free" Text-to-Speech engine for Awlaa Global Website.
 * Handles Category and Work narration across the frontend.
 */

let voices = [];

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
}

if (window.speechSynthesis) {
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
}

function getBestVoice(lang = 'en') {
    if (voices.length === 0) loadVoices();
    const langPrefix = lang.toLowerCase().split('-')[0];
    
    // Priority 1: High-fidelity "Natural" or "Neural" voices (Microsoft/Google)
    let best = voices.find(v => 
        v.lang.startsWith(langPrefix) && 
        (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Online'))
    );

    // Priority 2: Standard quality localized voices
    if (!best) best = voices.find(v => v.lang.startsWith(langPrefix) && v.name.includes('Microsoft'));
    if (!best) best = voices.find(v => v.lang.startsWith(langPrefix));
    
    return best || voices[0];
}

/**
 * speakWeb - Primary function for website-wide narration.
 */
export function speakWeb(text, lang = 'en-US', onEnd = null) {
    if (!window.speechSynthesis) return;

    // Clean HTML tags
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) {
        if (onEnd) onEnd();
        return;
    }

    window.speechSynthesis.cancel();

    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voice = getBestVoice(lang);

        if (voice) utterance.voice = voice;
        utterance.lang = lang;
        // Realistic settings: slightly lower pitch and slightly slower rate for a premium feel
        utterance.pitch = 1.0; 
        utterance.rate = 0.92;
        utterance.volume = 1.0;

        if (onEnd) {
            utterance.onend = onEnd;
            utterance.onerror = onEnd;
        }

        window.speechSynthesis.speak(utterance);
    }, 50);
}

// Global hooks for frontend activation
window.speakWeb = speakWeb;
window.speakItem = speakWeb;
window.speakMasterContent = speakWeb;

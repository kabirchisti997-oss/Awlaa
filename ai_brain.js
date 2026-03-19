/**
 * ai_brain.js
 * Central AI Hub for Awlaa Global.
 * Handles Text, Voice, Transcription, and Image Generation.
 */

// 🌐 MICROSERVICES ARCHITECTURE
const TEXT_WORKER_URL = 'https://awlaa-ai-core.kabirchisti997.workers.dev';
const VISUAL_WORKER_URL = 'https://awlaa-visual-engine.kabirchisti997.workers.dev';
const SONIC_ENGINE_URL = 'https://awlaa-sonic-engine.kabirchisti997.workers.dev/';

// 🔐 INTERNAL API KEYS (Consolidated from AwlaaCore)
const GROQ_API_KEY = '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';

/**
 * 🧠 AWLAACORE - TEXT ENGINE (Standard Chat)
 */
export async function fetchAIResponse(userMessage, modelType = 'high', history = []) {
    try {
        const response = await fetch(TEXT_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userMessage: userMessage,
                tier: modelType, 
                history: history
            })
        });
        if (!response.ok) throw new Error(`AwlaaCore Server Error: ${response.statusText}`);
        const data = await response.json();
        return data.reply || "I apologize, I couldn't process that request.";
    } catch (error) {
        console.error("AI Brain Error:", error);
        return "Connection to neural core failed.";
    }
}

/**
 * 🎙️ AWLAA SONIC - PREMIUM VOICE ENGINE (State Manager)
 */
let currentAwlaaAudio = null;
export let isAiVoiceEnabled = true; // Default to enabled

export function toggleAiVoice() {
    isAiVoiceEnabled = !isAiVoiceEnabled;
    if (!isAiVoiceEnabled && currentAwlaaAudio) {
        currentAwlaaAudio.pause();
    }
    return isAiVoiceEnabled;
}

export function getAiVoiceState() {
    return isAiVoiceEnabled;
}

/**
 * 🎙️ AWLAA SONIC - NEURAL VOICE ENGINE (Original Name, New Engine!)
 */
export async function speakAISonic(text, tier = "low", onEnd = null) {
    if (!isAiVoiceEnabled) {
        if (onEnd) onEnd();
        return;
    }

    if (currentAwlaaAudio) {
        currentAwlaaAudio.pause();
        currentAwlaaAudio.currentTime = 0;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel(); 

    try {
        const cleanText = text.replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}*_#]/gu, '').trim();
        if (!cleanText) {
            if (onEnd) onEnd();
            return;
        }

        console.log(`AwlaaCore AI: Waking up [${tier.toUpperCase()}] Neural Engine...`);

        // 🚀 THE MAGIC: Backend naya hai, par Frontend ko purana naam dikhega!
        const response = await fetch('https://awlaacore-engine.kabirchisti997.workers.dev/', {
            method: 'POST',
            body: JSON.stringify({ text: cleanText, tier: tier }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error("AwlaaCore Server overloaded or offline");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        currentAwlaaAudio = new Audio(url);

        if (onEnd) {
            currentAwlaaAudio.onended = onEnd;
            currentAwlaaAudio.onerror = onEnd;
        }

        await currentAwlaaAudio.play();

    } catch (error) {
        console.error("AwlaaCore AI Failed:", error);
        if (onEnd) onEnd();
    }
}

/**
 * 👂 AWLAA LISTENER - SPEECH-TO-TEXT (Whisper)
 */
export async function transcribeVoice(blob) {
    try {
        const formData = new FormData();
        formData.append('file', blob, 'audio.webm');
        formData.append('model', 'whisper-large-v3');

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
            body: formData
        });
        
        if (!response.ok) throw new Error("STT Failed");
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("Transcription Error:", error);
        return null;
    }
}

/**
 * 💭 LIVE AI THINKING - REAL-TIME LLM (Groq)
 */
export async function getLiveAIResponse(userText) {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are AwlaaCore, a premium humanoid AI. You are ultra-efficient and concise. Speak naturally but with professional authority. Response time is critical.' },
                    { role: 'user', content: userText }
                ]
            })
        });
        
        if (!response.ok) throw new Error("LLM Failed");
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Live AI Error:", error);
        return "I encountered a neural synchronization error.";
    }
}

/**
 * 🎨 AWLAA VISUAL ENGINE - IMAGE GENERATOR
 */
export async function generateAIImage(prompt) {
    try {
        const enhancedPrompt = prompt + ', masterpiece, highly detailed, realistic, 8k resolution';
        const response = await fetch(VISUAL_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: enhancedPrompt })
        });
        if (!response.ok) throw new Error("Visual Core failed.");
        const imageBlob = await response.blob();
        return URL.createObjectURL(imageBlob);
    } catch (error) {
        console.error("Awlaa Visual Error:", error);
        return "https://via.placeholder.com/1024x1024?text=Visual+Engine+Offline"; 
    }
}
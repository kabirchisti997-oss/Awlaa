/**
 * AwlaaCore.js
 * Modular Voice AI Live Mode component.
 * Integrated with Groq & Whisper (via AI Brain).
 */

import { transcribeVoice, getLiveAIResponse } from './ai_brain.js';

export const awlaaCoreHTML = `
<div id="awlaa-live-overlay" class="awlaa-live-overlay">
    <button class="close-live-btn" id="close-live-btn" title="Exit Live Mode">&times;</button>
    <button class="mute-btn" id="mute-live-btn" title="Mute Microphone">
        <i class="fas fa-microphone"></i>
    </button>
    <div class="void-gradient"></div>
    <div class="mode-indicator" id="live-state-label">IDLE</div>

    <div class="interface-container">
        <div class="orb-wrapper" id="live-orb-trigger">
            <div class="orb-ring" id="live-ring"></div>
            <canvas id="live-visualizer-canvas"></canvas>
            <div class="branding">AwlaaCore</div>
        </div>
    </div>

    <div class="controls">
        <button class="live-btn" id="live-toggle-mic">Start Live Mode</button>
    </div>
</div>
`;

class AwlaaCore {
    constructor() {
        this.overlay = null;
        this.canvas = null;
        this.ctx = null;
        this.stateLabel = null;
        this.micBtn = null;
        this.orbWrapper = null;
        this.orbRing = null;
        this.muteBtn = null;

        this.currentState = 'IDLE';
        this.audioCtx = null;
        this.analyser = null;
        this.dataArray = null;
        this.microphone = null;
        this.isActive = false;
        this.isMuted = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.speakingInterval = null;

        // Silence detection
        this.silenceStart = null;
        this.silenceThreshold = 0.01; // Sensitivity
        this.silenceDuration = 1000; // 1 second for faster response

        this.waves = [];
        this.numWaves = 4;
        this.time = 0;
        this.animationId = null;

        this.animationId = null;
    }

    init() {
        if (!document.getElementById('awlaa-live-overlay')) {
            document.body.insertAdjacentHTML('beforeend', awlaaCoreHTML);
        }

        this.overlay = document.getElementById('awlaa-live-overlay');
        this.canvas = document.getElementById('live-visualizer-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stateLabel = document.getElementById('live-state-label');
        this.micBtn = document.getElementById('live-toggle-mic');
        this.orbWrapper = document.getElementById('live-orb-trigger');
        this.orbRing = document.getElementById('live-ring');
        this.muteBtn = document.getElementById('mute-live-btn');
        const closeBtn = document.getElementById('close-live-btn');

        closeBtn.onclick = () => this.hide();
        this.micBtn.onclick = () => this.handleMicClick();
        this.muteBtn.onclick = () => this.toggleMute();

        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        if (!this.orbWrapper) return;
        const size = this.orbWrapper.offsetWidth;
        this.canvas.width = size;
        this.canvas.height = size;

        this.waves = [];
        for (let i = 0; i < this.numWaves; i++) {
            this.waves.push({
                y: this.canvas.height / 2,
                length: 0.01 + (i * 0.005),
                amplitude: 20 + (i * 10),
                speed: 0.02 + (i * 0.01),
                offset: i * Math.PI / 2
            });
        }
    }

    show() {
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.startAnimation();
        this.setState('IDLE');
    }

    hide() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.stopAudio();
        this.stopAnimation();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        this.isActive = false;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.muteBtn.classList.toggle('muted', this.isMuted);
        const icon = this.muteBtn.querySelector('i');
        icon.className = this.isMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone';
    }

    async handleMicClick() {
        if (this.currentState === 'IDLE') {
            await this.startAudio();
        } else {
            this.stopAudio();
            this.setState('IDLE');
            this.isActive = false;
        }
    }

    async startAudio() {
        if (this.currentState === 'SPEAKING' || this.currentState === 'THINKING') return;
        
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();

            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 256;
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.microphone = this.audioCtx.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            this.audioChunks = [];
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };
            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.audioChunks = [];
                if (audioBlob.size > 1000) { // Avoid processing tiny snippets
                    this.processVoice(audioBlob);
                } else if (this.isActive) {
                    this.startAudio(); // Restart if it was just a glitch
                }
            };

            this.isActive = true;
            this.silenceStart = null;
            this.setState('LISTENING');
            this.mediaRecorder.start();
        } catch (err) {
            console.error("Audio access denied", err);
            this.setState('IDLE');
        }
    }

    stopAudio() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }

    async processVoice(blob) {
        if (!this.isActive) return;
        this.setState('THINKING');

        try {
            const userText = await transcribeVoice(blob);

            if (!userText || userText.trim().length < 2) {
                this.startAudio(); 
                return;
            }

            const aiText = await getLiveAIResponse(userText);
            this.speak(aiText);

        } catch (err) {
            console.error("AwlaaCore Neural Error:", err);
            if (this.isActive) this.startAudio();
            else this.setState('IDLE');
        }
    }

    speak(text) {
        if (this.isMuted) return;

        if (window.speakAI) {
            window.speakAI(text, () => {
                this.stopSpeakingWaves();
                if (this.isActive) {
                    this.startAudio(); // CONTINUOUS LOOP: Restart listening
                } else {
                    this.setState('IDLE');
                }
            });

            this.setState('SPEAKING');
            this.startSpeakingWaves();
        } else {
            // Fallback if global speakAI is missing
            console.warn("AwlaaCore: window.speakAI not found. Falling back to IDLE.");
            this.setState('IDLE');
        }
    }

    startSpeakingWaves() {
        clearInterval(this.speakingInterval);
        this.speakingInterval = setInterval(() => {
            this.createRipple(0.4, true);
        }, 400);
    }

    stopSpeakingWaves() {
        clearInterval(this.speakingInterval);
    }

    setState(state) {
        this.currentState = state;
        if (this.stateLabel) this.stateLabel.innerText = state;
        
        // Visual Class Transitions for CSS Animations
        if (this.orbRing) {
            this.orbRing.className = 'orb-ring'; // Reset
            if (state === 'LISTENING') this.orbRing.classList.add('listening');
            if (state === 'THINKING') this.orbRing.classList.add('thinking');
        }

        if (this.micBtn) {
            if (state === 'LISTENING') this.micBtn.innerText = "Listening...";
            else if (state === 'IDLE') this.micBtn.innerText = "Start Live Mode";
            else if (state === 'SPEAKING') this.micBtn.innerText = "AwlaaCore is User Speaking";
            else this.micBtn.innerText = state + "...";
        }
    }

    createRipple(intensity, isSpeaking = false) {
        if (!this.orbWrapper) return;
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        const size = this.orbWrapper.offsetWidth;
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        
        if (isSpeaking) {
            ripple.style.borderColor = 'rgba(0, 255, 255, 0.8)';
            ripple.style.borderWidth = '4px';
            ripple.style.boxShadow = '0 0 30px #00FFFF';
        }

        this.orbWrapper.appendChild(ripple);

        const anim = ripple.animate([
            { transform: 'scale(1)', opacity: 0.8 },
            { transform: `scale(${isSpeaking ? 2.2 : 1.5 + intensity * 4})`, opacity: 0 }
        ], {
            duration: isSpeaking ? 1500 : 1000,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        });

        anim.onfinish = () => ripple.remove();
    }

    startAnimation() {
        if (this.animationId) return;
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            this.draw();
        };
        animate();
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    draw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let volume = 0;
        if (this.isActive && this.analyser && this.currentState === 'LISTENING') {
            this.analyser.getByteFrequencyData(this.dataArray);
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) sum += this.dataArray[i];
            volume = sum / this.dataArray.length / 255;

            // Mute Handling
            if (this.isMuted) volume = 0;

            // RIpple on User Voice
            if (volume > 0.1) this.createRipple(volume);

            // Silence Detection Logic
            if (volume < this.silenceThreshold) {
                if (!this.silenceStart) this.silenceStart = Date.now();
                else if (Date.now() - this.silenceStart > this.silenceDuration) {
                    this.stopAudio(); // Auto-stop and process
                    this.silenceStart = null;
                }
            } else {
                this.silenceStart = null;
            }
        }

        this.time += 0.05;
        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 + (this.currentState === 'SPEAKING' ? 0.4 : volume)})`;
        this.ctx.lineWidth = 2.5;

        if (this.currentState === 'THINKING') {
            // Advanced Digital Neural Stream Effect
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            
            // Rotating outer flare
            this.ctx.rotate(this.time * 2);
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + Math.sin(this.time * 5) * 0.2})`;
            for (let i = 0; i < 8; i++) {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 45 + i * 4, this.time + i, this.time + i + 0.5);
                this.ctx.stroke();
            }

            // Central Neural Streams
            this.ctx.setTransform(1, 0, 0, 1, this.canvas.width / 2, this.canvas.height / 2);
            for (let i = 0; i < 15; i++) {
                const angle = (i / 15) * Math.PI * 2 + this.time;
                const r = 20 + Math.random() * 60;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + Math.random() * 0.4})`;
                this.ctx.stroke();
            }

            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        } else {
            this.waves.forEach((wave, i) => {
                this.ctx.beginPath();
                let currentAmp = wave.amplitude;
                let currentSpeed = wave.speed;

                if (this.currentState === 'SPEAKING') {
                    currentAmp *= (3 + Math.sin(this.time * 2.5) * 2);
                    currentSpeed *= 5;
                } else if (this.currentState === 'LISTENING') {
                    currentAmp *= (0.5 + volume * 5);
                    currentSpeed *= (0.8 + volume * 2);
                }

                for (let x = 0; x < this.canvas.width; x++) {
                    const y = wave.y + Math.sin(x * wave.length + (this.time * currentSpeed) + wave.offset) * currentAmp;
                    if (x === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                this.ctx.stroke();
            });
        }

        const gradient = this.ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width/2);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export const initAwlaaCore = () => {
    const core = new AwlaaCore();
    core.init();
    return core;
};

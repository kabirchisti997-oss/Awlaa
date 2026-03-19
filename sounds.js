// =====================================================================
// sounds.js — UI Audio Feedback System (Procedural / Code-Generated)
// Generates sounds using Web Audio API (No MP3 files needed)
// =====================================================================

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

export const playSound = (type) => {
    // Resume context if suspended (browser requirement for user interaction)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    // Default cleanup to prevent memory leaks
    osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
    };

    switch (type) {
        case 'hover':
            // High-tech blip (Sine wave, short decay)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
            
            gain.gain.setValueAtTime(0.03, t); // Low volume for hover
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            
            osc.start(t);
            osc.stop(t + 0.05);
            break;

        case 'click':
            // Ultra-Premium UI Tick (Glassy Snap/Click)
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const clickGain = audioCtx.createGain();

            osc1.type = 'triangle';
            osc2.type = 'sine';
            
            // Sharp high transient
            osc1.frequency.setValueAtTime(1500, t);
            osc1.frequency.exponentialRampToValueAtTime(100, t + 0.04);
            
            // Warm mid-low body
            osc2.frequency.setValueAtTime(600, t);
            osc2.frequency.exponentialRampToValueAtTime(50, t + 0.05);

            osc1.connect(clickGain);
            osc2.connect(clickGain);
            clickGain.connect(audioCtx.destination);

            clickGain.gain.setValueAtTime(0.15, t); // Stronger initial hit
            clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            
            osc1.start(t); osc2.start(t);
            osc1.stop(t + 0.05); osc2.stop(t + 0.05);
            
            osc1.onended = () => { osc1.disconnect(); osc2.disconnect(); clickGain.disconnect(); };
            break;

        case 'open':
            // Sci-fi Interface Open (Sweep Up)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(1500, t + 0.3);
            
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);
            
            osc.start(t);
            osc.stop(t + 0.3);
            break;

        case 'close':
            // Sci-fi Interface Close (Sweep Down)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1500, t);
            osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
            
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.2);
            
            osc.start(t);
            osc.stop(t + 0.2);
            break;

        case 'success':
        case 'notification':
            // Positive Chime (Double Ping)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, t); // A5
            osc.frequency.setValueAtTime(1760, t + 0.15); // A6
            
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.linearRampToValueAtTime(0.001, t + 0.4);
            
            osc.start(t);
            osc.stop(t + 0.4);
            break;

        case 'error':
            // Denied Buzzer (Sawtooth)
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(100, t + 0.3);
            
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            
            osc.start(t);
            osc.stop(t + 0.3);
            break;

        case 'message_sent':
            // Outgoing 'Swoosh/Pop'
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.linearRampToValueAtTime(800, t + 0.1);
            
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0.001, t + 0.1);
            
            osc.start(t);
            osc.stop(t + 0.1);
            break;

        case 'message_received':
            // Incoming AI Data 'Chirp' (Frequency Jump)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.setValueAtTime(1200, t + 0.1); // Jump up
            
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.linearRampToValueAtTime(0.05, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            
            osc.start(t);
            osc.stop(t + 0.3);
            break;
    }
};
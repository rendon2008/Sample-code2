let audioContext = null;
let microphoneStream = null;
let analyser = null;
let dataArray = null;
let isListening = false;
let blowDetectionInterval = null;

// ===== State Variables =====
let candlesExtinguished = false;
let celebrationStarted = false;

// ===== Configuration =====
const BLOW_THRESHOLD = 35; // Volume threshold for blow detection (0-255)
const BLOW_DURATION = 200; // Minimum duration to consider as a blow (ms)
let blowStartTime = null;

// ===== DOM Elements =====
const permissionScreen = document.getElementById('permission-screen');
const birthdayScene = document.getElementById('birthday-scene');
const message = document.getElementById('message');
const relightBtn = document.getElementById('relight-btn');
const candles = document.querySelectorAll('.candle');
const confettiCanvas = document.getElementById('confetti-canvas');
const balloonsContainer = document.getElementById('balloons');
const poppers = document.querySelectorAll('.popper');

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    requestMicrophoneAccess();
    setupRelightButton();
});

// ===== Microphone Permission =====
async function requestMicrophoneAccess() {
    try {
        // Check for browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showError('Microphone access not supported in this browser');
            return;
        }

        // Request microphone access
        microphoneStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        // Initialize audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyser
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;
        
        // Connect microphone to analyser
        const microphone = audioContext.createMediaStreamSource(microphoneStream);
        microphone.connect(analyser);
        
        // Create data array for analysis
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        // Start blow detection
        isListening = true;
        startBlowDetection();
        
        // Transition to birthday scene
        transitionToBirthdayScene();
        
    } catch (error) {
        console.error('Microphone access denied:', error);
        // Keep requesting permission - retry after delay
        setTimeout(requestMicrophoneAccess, 2000);
    }
}

// ===== Transition to Birthday Scene =====
function transitionToBirthdayScene() {
    // Hide permission screen
    permissionScreen.classList.add('hidden');
    
    // Show birthday scene
    setTimeout(() => {
        birthdayScene.classList.remove('hidden');
        birthdayScene.classList.add('visible');
        
        // Start candle animations
        startCandleAnimations();
    }, 500);
}

// ===== Blow Detection System =====
function startBlowDetection() {
    blowDetectionInterval = setInterval(() => {
        if (!isListening || candlesExtinguished) return;
        
        // Get audio data
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Detect blow (high volume indicates blowing)
        if (average > BLOW_THRESHOLD) {
            if (blowStartTime === null) {
                blowStartTime = Date.now();
            } else if (Date.now() - blowStartTime > BLOW_DURATION) {
                // Blow detected!
                extinguishCandles();
            }
        } else {
            blowStartTime = null;
        }
        
    }, 50); // Check every 50ms
}

// ===== Candle Animations =====
function startCandleAnimations() {
    candles.forEach((candle, index) => {
        // Add slight random delay to each candle's flame for natural effect
        const flame = candle.querySelector('.flame');
        const glow = candle.querySelector('.flame-glow');
        
        if (flame && glow) {
            flame.style.animationDelay = `${Math.random() * 0.5}s`;
            glow.style.animationDelay = `${Math.random() * 0.3}s`;
        }
    });
}

// ===== Extinguish Candles =====
function extinguishCandles() {
    if (candlesExtinguished) return;
    
    candlesExtinguished = true;
    
    // Extinguish each candle with staggered timing
    candles.forEach((candle, index) => {
        setTimeout(() => {
            candle.classList.add('extinguished');
        }, index * 100);
    });
    
    // Start celebration after all candles are out
    setTimeout(() => {
        startCelebration();
    }, candles.length * 100 + 500);
}

// ===== Start Celebration =====
function startCelebration() {
    if (celebrationStarted) return;
    
    celebrationStarted = true;
    
    // Update message
    updateMessage();
    
    // Play sound effects
    playCelebrationSounds();
    
    // Launch balloons
    launchBalloons();
    
    // Fire party poppers
    firePartyPoppers();
    
    // Start confetti
    startConfetti();
    
    // Show relight button
setTimeout(() => {
    relightBtn.classList.remove('hidden');
    relightBtn.classList.add('visible');

    const messageBtn = document.getElementById('message-btn');
    messageBtn.classList.remove('hidden');
    messageBtn.classList.add('visible');
}, 2000);
}

// ===== Update Message =====
function updateMessage() {
    message.style.opacity = '0';
    message.style.transform = 'translateX(-50%) scale(0.8)';
    
    setTimeout(() => {
        message.innerHTML = 'HAPPIEST 17TH BIRTHDAY BABYY RIRI<br><span style="font-size: 0.7em;">I LOVE U 3000</span>';
        message.style.color = '#FF69B4';
        message.style.textShadow = `
            0 0 10px rgba(255, 105, 180, 0.8),
            0 0 20px rgba(255, 105, 180, 0.6),
            0 0 30px rgba(255, 182, 193, 0.5),
            2px 2px 4px rgba(0,0,0,0.1)
        `;
        message.style.opacity = '1';
        message.style.transform = 'translateX(-50%) scale(1)';
    }, 400);
}

// ===== Celebration Sounds =====
function playCelebrationSounds() {
    // Play party pop sound
    playPartyPopSound();
    
    // Play Happy Birthday melody after pop
    setTimeout(() => {
        playHappyBirthdayMelody();
    }, 500);
}

// ===== Party Pop Sound (Synthesized) =====
function playPartyPopSound() {
    const ctx = audioContext;
    const now = ctx.currentTime;
    
    // Create noise burst for pop
    const bufferSize = ctx.sampleRate * 0.3; // 300ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(now);
    
    // Add a tone for the "pop" effect
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
}

// ===== Happy Birthday Melody (Synthesized) =====
function playHappyBirthdayMelody() {
    const ctx = audioContext;
    const now = ctx.currentTime;
    
    // Happy Birthday notes (frequencies in Hz)
    const notes = [
        { freq: 264, duration: 0.25 }, // C4
        { freq: 264, duration: 0.25 }, // C4
        { freq: 297, duration: 0.5 },  // D4
        { freq: 264, duration: 0.5 },  // C4
        { freq: 352, duration: 0.5 },  // F4
        { freq: 330, duration: 1 },    // E4
        
        { freq: 264, duration: 0.25 }, // C4
        { freq: 264, duration: 0.25 }, // C4
        { freq: 297, duration: 0.5 },  // D4
        { freq: 264, duration: 0.5 },  // C4
        { freq: 396, duration: 0.5 },  // G4
        { freq: 352, duration: 1 },    // F4
        
        { freq: 264, duration: 0.25 }, // C4
        { freq: 264, duration: 0.25 }, // C4
        { freq: 523, duration: 0.5 },  // C5
        { freq: 440, duration: 0.5 },  // A4
        { freq: 352, duration: 0.5 },  // F4
        { freq: 330, duration: 0.5 },  // E4
        { freq: 297, duration: 0.75 }, // D4
        
        { freq: 466, duration: 0.25 }, // A#4
        { freq: 466, duration: 0.25 }, // A#4
        { freq: 440, duration: 0.5 },  // A4
        { freq: 352, duration: 0.5 },  // F4
        { freq: 396, duration: 0.5 },  // G4
        { freq: 352, duration: 1 }     // F4
    ];
    
    let currentTime = now;
    
    notes.forEach((note, index) => {
        // Create oscillator for note
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        
        // Create gain node for envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, currentTime);
        gain.gain.linearRampToValueAtTime(1.0, currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.8, currentTime + note.duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);
        
        // Add some harmonics for a richer sound
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = note.freq * 2;
        
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, currentTime);
        gain2.gain.linearRampToValueAtTime(0.04, currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);
        
        // Connect nodes
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        // Play note
        osc.start(currentTime);
        osc.stop(currentTime + note.duration);
        
        osc2.start(currentTime);
        osc2.stop(currentTime + note.duration);
        
        // Advance time
        currentTime += note.duration;
    });
}

// ===== Balloons =====
function launchBalloons() {
    const colors = ['pink', 'blue', 'yellow', 'green', 'purple'];
    const balloonCount = 15;
    
    for (let i = 0; i < balloonCount; i++) {
        setTimeout(() => {
            createBalloon(colors[Math.floor(Math.random() * colors.length)]);
        }, i * 300);
    }
    
    // Continue launching balloons
    setInterval(() => {
        if (celebrationStarted) {
            createBalloon(colors[Math.floor(Math.random() * colors.length)]);
        }
    }, 2000);
}

function createBalloon(color) {
    const balloon = document.createElement('div');
    balloon.className = `balloon ${color}`;
    balloon.style.left = `${Math.random() * 90 + 5}%`;
    balloon.style.animationDuration = `${6 + Math.random() * 4}s`;
    
    balloonsContainer.appendChild(balloon);
    
    // Remove balloon after animation
    setTimeout(() => {
        balloon.remove();
    }, 10000);
}

// ===== Party Poppers =====
function firePartyPoppers() {
    poppers.forEach((popper, index) => {
        setTimeout(() => {
            popper.classList.add('explode');
            
            // Reset after animation
            setTimeout(() => {
                popper.classList.remove('explode');
            }, 1000);
        }, index * 200);
    });
}

// ===== Confetti System =====
function startConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    const confetti = [];
    const colors = ['#FFB6C1', '#FF69B4', '#FFD700', '#87CEEB', '#98FB98', '#DDA0DD', '#FFA500'];
    
    // Create initial burst
    for (let i = 0; i < 150; i++) {
        confetti.push(createConfettiPiece(colors, true));
    }
    
    // Animation loop
    let animationId;
    
    function animate() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        
        confetti.forEach((piece, index) => {
            // Update position
            piece.x += piece.vx;
            piece.y += piece.vy;
            piece.rotation += piece.rotationSpeed;
            
            // Add gravity
            piece.vy += 0.1;
            
            // Add air resistance
            piece.vx *= 0.99;
            piece.vy *= 0.99;
            
            // Draw confetti
            ctx.save();
            ctx.translate(piece.x, piece.y);
            ctx.rotate(piece.rotation);
            ctx.fillStyle = piece.color;
            ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
            ctx.restore();
            
            // Remove if off screen
            if (piece.y > confettiCanvas.height + 50) {
                confetti.splice(index, 1);
            }
        });
        
        // Add new confetti occasionally
        if (celebrationStarted && Math.random() < 0.1) {
            confetti.push(createConfettiPiece(colors, false));
        }
        
        if (confetti.length > 0 || celebrationStarted) {
            animationId = requestAnimationFrame(animate);
        }
    }
    
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });
}

function createConfettiPiece(colors, isBurst) {
    const x = isBurst ? window.innerWidth / 2 + (Math.random() - 0.5) * 200 : Math.random() * window.innerWidth;
    const y = isBurst ? window.innerHeight / 2 : -20;
    
    return {
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * (isBurst ? 15 : 2),
        vy: isBurst ? (Math.random() - 1) * 15 : Math.random() * 2 + 1,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
    };
}

// ===== Relight Button =====
function setupRelightButton() {
    relightBtn.addEventListener('click', () => {
        relightCandles();
    });
}







// ===== Envelope / Letter Animation =====
const envOverlay = document.getElementById('envOverlay');
const envFlap = document.getElementById('envFlap');
const envLetter = document.getElementById('letter');
const heartSeal = document.getElementById('heartSeal');
let envelopeOpened = false;



document.getElementById('message-btn').addEventListener('click', () => {
    envOverlay.classList.add('show');
    envelopeOpened = false;
    envFlap.classList.remove('open');
    envLetter.classList.remove('risen');
    heartSeal.classList.remove('hidden');
});

document.getElementById('envWrapper').addEventListener('click', () => {
    if (!envelopeOpened) {
        heartSeal.classList.add('hidden');
        envFlap.classList.add('open');

        setTimeout(() => {
            envLetter.classList.add('risen');
        }, 700);

        setTimeout(() => {
            envLetter.classList.add('opened');
        }, 1400);

        setTimeout(() => {
            envelopeOpened = true;
        }, 1800);
    }
});

envOverlay.addEventListener('click', (e) => {
    if (e.target === envOverlay) {
        if (envelopeOpened) {
            envLetter.classList.remove('risen');
            envelopeOpened = false;

            setTimeout(() => {
                envFlap.classList.remove('open');
            }, 400);

            setTimeout(() => {
                heartSeal.classList.remove('hidden');
            }, 900);

            setTimeout(() => {
                envOverlay.classList.remove('show');
            }, 1200);
        } else {
            envOverlay.classList.remove('show');
        }
    }
});

envOverlay.addEventListener('click', () => {
    if (envelopeOpened) {
        envLetter.classList.remove('risen');
        envelopeOpened = false;

        setTimeout(() => {
            envFlap.classList.remove('open');
        }, 400);

        setTimeout(() => {
            heartSeal.classList.remove('hidden');
        }, 900);

        setTimeout(() => {
            envOverlay.classList.remove('show');
        }, 1200);
    }
});









function relightCandles() {
    // Reset state
    candlesExtinguished = false;
    celebrationStarted = false;
    blowStartTime = null;
    
    // Remove extinguished class from all candles
    candles.forEach(candle => {
        candle.classList.remove('extinguished');
    });
    
    // Reset message
    message.style.opacity = '0';
    message.style.transform = 'translateX(-50%) scale(0.8)';
    
    setTimeout(() => {
        message.innerHTML = 'BLOW THE CANDLES!!';
        message.style.color = '';
        message.style.textShadow = '';
        message.style.opacity = '1';
        message.style.transform = 'translateX(-50%) scale(1)';
    }, 400);
    
// Hide relight button
relightBtn.classList.remove('visible');
relightBtn.classList.add('hidden');

// Hide message button
const messageBtn = document.getElementById('message-btn');
messageBtn.classList.remove('visible');
messageBtn.classList.add('hidden');

// Clear balloons
balloonsContainer.innerHTML = '';

// Restart candle animations
startCandleAnimations();
    
    // Restart blow detection
    if (!blowDetectionInterval) {
        startBlowDetection();
    }
}

// ===== Error Handling =====
function showError(message) {
    console.error(message);
    // Could show a visual error message here
}

// ===== Cleanup on Page Unload =====
window.addEventListener('beforeunload', () => {
    if (blowDetectionInterval) {
        clearInterval(blowDetectionInterval);
    }
    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
        audioContext.close();
    }
});

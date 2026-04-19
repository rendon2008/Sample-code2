// =====================================================
// STATE VARIABLES
// =====================================================
// =====================================================
// PASSWORD SCREEN
// =====================================================


(function () {
    const screen   = document.getElementById('password-screen');
    const enterBtn = document.getElementById('enter-btn');
    const digits   = [0, 0, 0];
    const PASSWORD = '107';

    document.querySelectorAll('.digit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.index);
            if (btn.classList.contains('plus')) {
                digits[i] = (digits[i] + 1) % 10;
            } else {
                digits[i] = (digits[i] + 9) % 10;
            }
            document.querySelector(`.digit-display[data-index="${i}"]`).textContent = digits[i];
        });
    });

    enterBtn.addEventListener('click', () => {
        const entered = digits.join('');
        const padlock = document.querySelector('.padlock');
        
const heart = document.querySelector('.padlock-heart-wrapper');
        
if (entered === PASSWORD) {
    const shackle = document.querySelector('.padlock-shackle');

    heart.style.transition = 'filter 0.2s ease';
    heart.style.filter = 'drop-shadow(0 0 12px #00ff00) drop-shadow(0 0 28px #00cc00)';

    // Animate shackle opening after a short pause
    setTimeout(() => {
        shackle.classList.add('open');
    }, 300);

    setTimeout(() => {
        heart.style.filter = '';
        screen.style.transition = 'opacity 0.8s ease';
        screen.style.opacity = '0';
        setTimeout(() => screen.remove(), 800);
    }, 1000);

            
        } else {
            // Red glow on heart + shackle area only
// Vibrate on wrong answer
if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

// Red glow on heart + shackle area only
heart.style.transition = 'filter 0.05s ease';            
            heart.style.filter = 'drop-shadow(0 0 12px #ff0000) drop-shadow(0 0 24px #ff0000)';

            // Shake the padlock (shackle + heart), enter button is now outside so it won't move
            padlock.style.transition = 'transform 0.1s ease';
            padlock.style.transform = 'translateX(-8px)';
            setTimeout(() => padlock.style.transform = 'translateX(8px)',  100);
            setTimeout(() => padlock.style.transform = 'translateX(-6px)', 200);
            setTimeout(() => padlock.style.transform = 'translateX(6px)',  300);
            setTimeout(() => padlock.style.transform = 'translateX(0)',    400);

            // Remove red glow
            setTimeout(() => { heart.style.filter = ''; }, 500);
        }
    });
}());

let audioContext = null;
let microphoneStream = null;
let analyser = null;
let dataArray = null;
let isListening = false;
let blowDetectionInterval = null;

let candlesExtinguished = false;
let celebrationStarted = false;


// =====================================================
// CONFIGURATION
// =====================================================

const BLOW_THRESHOLD = 35;  // Volume threshold for blow detection (0–255)
const BLOW_DURATION  = 200; // Minimum blow duration in ms
let blowStartTime = null;


// =====================================================
// DOM ELEMENTS
// =====================================================

const permissionScreen   = document.getElementById('permission-screen');
const birthdayScene      = document.getElementById('birthday-scene');
const message            = document.getElementById('message');
const candles            = document.querySelectorAll('.candle');
const confettiCanvas     = document.getElementById('confetti-canvas');
const balloonsContainer  = document.getElementById('balloons');
const poppers            = document.querySelectorAll('.popper');


// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    
    const requestMicBtn = document.getElementById('request-mic-btn');
    console.log('Mic button found:', requestMicBtn); // Debug log
    
    if (requestMicBtn) {
        requestMicBtn.addEventListener('click', () => {
            console.log('Mic button clicked!'); // Debug log
            requestMicrophoneAccess();
        });
    } else {
        console.error('Mic button not found!'); // Debug log
    }
});

// =====================================================
// MICROPHONE PERMISSION
// =====================================================

async function requestMicrophoneAccess() {
    try {
        console.log('🔍 Requesting microphone access...');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('❌ getUserMedia not supported');
            showError('Microphone access not supported in this browser');
            return;
        }

        console.log('✅ Browser supports getUserMedia');
        console.log('📢 Calling getUserMedia...');
        
        microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        console.log('✅ Microphone access granted!');

        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;

        const microphone = audioContext.createMediaStreamSource(microphoneStream);
        microphone.connect(analyser);

        dataArray = new Uint8Array(analyser.frequencyBinCount);

        isListening = true;
        startBlowDetection();
        transitionToBirthdayScene();

    } catch (error) {
        console.error('❌ Error:', error.name, '-', error.message);
        
        if (error.name === 'NotAllowedError') {
            console.error('❌ Permission denied by user');
            alert('You denied microphone access. Please allow it and try again.');
        } else if (error.name === 'NotFoundError') {
            console.error('❌ No microphone found');
            alert('No microphone device found on this device');
        } else if (error.name === 'NotSupportedError') {
            console.error('❌ getUserMedia not supported');
            alert('Microphone access not supported on this browser');
        } else {
            console.error('❌ Unknown error:', error);
            alert('Error: ' + error.message);
        }
        
        console.log('⏳ Retrying in 2 seconds...');
        setTimeout(requestMicrophoneAccess, 2000);
    }
}


// =====================================================
// SCENE TRANSITION
// =====================================================

function transitionToBirthdayScene() {
    permissionScreen.classList.add('hidden');

    setTimeout(() => {
        birthdayScene.classList.remove('hidden');
        birthdayScene.classList.add('visible');
        startCandleAnimations();
    }, 500);
}


// =====================================================
// BLOW DETECTION
// =====================================================

function startBlowDetection() {
    blowDetectionInterval = setInterval(() => {
        if (!isListening || candlesExtinguished) return;

        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        if (average > BLOW_THRESHOLD) {
            if (blowStartTime === null) {
                blowStartTime = Date.now();
            } else if (Date.now() - blowStartTime > BLOW_DURATION) {
                extinguishCandles();
            }
        } else {
            blowStartTime = null;
        }
    }, 50);
}


// =====================================================
// CANDLE ANIMATIONS
// =====================================================

function startCandleAnimations() {
    candles.forEach((candle) => {
        const flame = candle.querySelector('.flame');
        const glow  = candle.querySelector('.flame-glow');
        if (flame && glow) {
            flame.style.animationDelay = `${Math.random() * 0.5}s`;
            glow.style.animationDelay  = `${Math.random() * 0.3}s`;
        }
    });
}


// =====================================================
// EXTINGUISH CANDLES
// =====================================================

function extinguishCandles() {
    if (candlesExtinguished) return;
    candlesExtinguished = true;

    candles.forEach((candle, index) => {
        setTimeout(() => {
            candle.classList.add('extinguished');
        }, index * 100);
    });

    setTimeout(() => {
        startCelebration();
    }, candles.length * 100 + 500);
}


// =====================================================
// CELEBRATION
// =====================================================

function startCelebration() {
    if (celebrationStarted) return;
    celebrationStarted = true;

    updateMessage();
    playCelebrationSounds();
    launchBalloons();
    firePartyPoppers();
    startConfetti();

    setTimeout(() => {
        const bottomBtns = document.getElementById('bottom-btns');
        bottomBtns.classList.remove('hidden');
        bottomBtns.classList.add('visible');
    }, 2000);
}

function updateMessage() {
    const micIndicator = document.getElementById('mic-indicator');
    message.style.opacity   = '0';
    message.style.transform = 'translateX(-50%) scale(0.8)';
    if (micIndicator) micIndicator.style.opacity = '0';

    setTimeout(() => {
        message.innerHTML = 'HAPPIEST 17TH BIRTHDAY BABYY RIRI<br><span style="font-size: 0.7em;">I LOVE U 3000</span>';
        message.style.color      = '#FF69B4';
        message.style.textShadow = `
            0 0 10px rgba(255, 105, 180, 0.8),
            0 0 20px rgba(255, 105, 180, 0.6),
            0 0 30px rgba(255, 182, 193, 0.5),
            2px 2px 4px rgba(0,0,0,0.1)
        `;
        message.style.opacity   = '1';
        message.style.transform = 'translateX(-50%) scale(1)';
        if (micIndicator) micIndicator.style.display = 'none';
    }, 400);
}

// =====================================================
// SOUNDS
// =====================================================

function playCelebrationSounds() {
    playPartyPopSound();
    setTimeout(() => {
        playHappyBirthdayMelody();
    }, 500);
}

function playPartyPopSound() {
    const ctx = audioContext;
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.3;
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }

    const noise       = ctx.createBufferSource();
    noise.buffer      = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type  = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain   = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    const osc = ctx.createOscillator();
    osc.type  = 'sine';
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

function playHappyBirthdayMelody() {
    const ctx = audioContext;
    const now = ctx.currentTime;

    const notes = [
        { freq: 792,  duration: 0.19 },
        { freq: 792,  duration: 0.19 },
        { freq: 891,  duration: 0.38 },
        { freq: 792,  duration: 0.38 },
        { freq: 1056, duration: 0.38 },
        { freq: 990,  duration: 0.77 },

        { freq: 792,  duration: 0.19 },
        { freq: 792,  duration: 0.19 },
        { freq: 891,  duration: 0.38 },
        { freq: 792,  duration: 0.38 },
        { freq: 1188, duration: 0.38 },
        { freq: 1056, duration: 0.77 },

        { freq: 792,  duration: 0.19 },
        { freq: 792,  duration: 0.19 },
        { freq: 1569, duration: 0.38 },
        { freq: 1320, duration: 0.38 },
        { freq: 1056, duration: 0.38 },
        { freq: 990,  duration: 0.38 },
        { freq: 891,  duration: 0.58 },

        { freq: 1398, duration: 0.19 },
        { freq: 1398, duration: 0.19 },
        { freq: 1320, duration: 0.38 },
        { freq: 1056, duration: 0.38 },
        { freq: 1188, duration: 0.38 },
        { freq: 1056, duration: 0.77 }
    ];

    let currentTime = now;

    notes.forEach((note) => {
        const osc  = ctx.createOscillator();
        osc.type   = 'sine';
        osc.frequency.value = note.freq;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, currentTime);
        gain.gain.linearRampToValueAtTime(1.0, currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.8, currentTime + note.duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

        const osc2  = ctx.createOscillator();
        osc2.type   = 'triangle';
        osc2.frequency.value = note.freq * 2;

        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, currentTime);
        gain2.gain.linearRampToValueAtTime(0.04, currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc.start(currentTime);
        osc.stop(currentTime + note.duration);
        osc2.start(currentTime);
        osc2.stop(currentTime + note.duration);

        currentTime += note.duration;
    });
}


// =====================================================
// BALLOONS
// =====================================================

function launchBalloons() {
    const colors       = ['pink', 'blue', 'yellow', 'green', 'purple'];
    const balloonCount = 15;

    for (let i = 0; i < balloonCount; i++) {
        setTimeout(() => {
            createBalloon(colors[Math.floor(Math.random() * colors.length)]);
        }, i * 300);
    }

    setInterval(() => {
        if (celebrationStarted) {
            createBalloon(colors[Math.floor(Math.random() * colors.length)]);
        }
    }, 2000);
}

function createBalloon(color) {
    const balloon = document.createElement('div');
    balloon.className = `balloon ${color}`;
    balloon.style.left            = `${Math.random() * 90 + 5}%`;
    balloon.style.animationDuration = `${6 + Math.random() * 4}s`;
    balloonsContainer.appendChild(balloon);
    setTimeout(() => balloon.remove(), 10000);
}


// =====================================================
// PARTY POPPERS
// =====================================================

function firePartyPoppers() {
    poppers.forEach((popper, index) => {
        setTimeout(() => {
            popper.classList.add('explode');
            setTimeout(() => popper.classList.remove('explode'), 1000);
        }, index * 200);
    });
}


// =====================================================
// CONFETTI
// =====================================================

function startConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const confetti = [];
    const colors   = ['#FFB6C1','#FF69B4','#FFD700','#87CEEB','#98FB98','#DDA0DD','#FFA500'];

    for (let i = 0; i < 150; i++) {
        confetti.push(createConfettiPiece(colors, true));
    }

    function animate() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        confetti.forEach((piece, index) => {
            piece.x        += piece.vx;
            piece.y        += piece.vy;
            piece.rotation += piece.rotationSpeed;
            piece.vy       += 0.1;
            piece.vx       *= 0.99;
            piece.vy       *= 0.99;

            ctx.save();
            ctx.translate(piece.x, piece.y);
            ctx.rotate(piece.rotation);
            ctx.fillStyle = piece.color;
            ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
            ctx.restore();

            if (piece.y > confettiCanvas.height + 50) {
                confetti.splice(index, 1);
            }
        });

        if (celebrationStarted && Math.random() < 0.1) {
            confetti.push(createConfettiPiece(colors, false));
        }

        if (confetti.length > 0 || celebrationStarted) {
            requestAnimationFrame(animate);
        }
    }

    animate();

    window.addEventListener('resize', () => {
        confettiCanvas.width  = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });
}

function createConfettiPiece(colors, isBurst) {
    const x = isBurst
        ? window.innerWidth / 2 + (Math.random() - 0.5) * 200
        : Math.random() * window.innerWidth;
    const y = isBurst ? window.innerHeight / 2 : -20;

    return {
        x, y,
        vx: (Math.random() - 0.5) * (isBurst ? 15 : 2),
        vy: isBurst ? (Math.random() - 1) * 15 : Math.random() * 2 + 1,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
    };
}


// =====================================================
// RELIGHT BUTTON
// =====================================================


// =====================================================
// ENVELOPE / LETTER ANIMATION
// =====================================================



// ── Envelope 1 (top) ─────────────────────────────────
const envOverlay  = document.getElementById('envOverlay');
const envFlap     = document.getElementById('envFlap');
const envLetter   = document.getElementById('letter');
const heartSeal   = document.getElementById('heartSeal');
let envelopeOpened = false;

document.getElementById('message-btn').addEventListener('click', () => {
    envOverlay.classList.add('show');
    envelopeOpened = false;
    envFlap.classList.remove('open');
    envLetter.classList.remove('risen', 'closing', 'opened');
    heartSeal.classList.remove('hidden');
});

document.getElementById('envWrapper').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!envelopeOpened) {
        heartSeal.classList.add('hidden');
        envFlap.classList.add('open');
        setTimeout(() => {
            envLetter.classList.remove('closing');
            envLetter.classList.add('risen');
            envelopeOpened = true;
        }, 700);
    }
});

document.getElementById('letter').addEventListener('click', (e) => {
    e.stopPropagation();
    envOverlay.click();
});

envOverlay.addEventListener('click', (e) => {
    if (e.target === envOverlay) {
        if (envelopeOpened) {
            envelopeOpened = false;
            envLetter.classList.remove('risen');
            envLetter.classList.add('closing');
            setTimeout(() => envFlap.classList.remove('open'), 700);
            setTimeout(() => heartSeal.classList.remove('hidden'), 1100);
            setTimeout(() => envOverlay.classList.remove('show'), 1400);
        } else {
            envOverlay.classList.remove('show');
        }
    }
});

// ── Envelope 2 (bottom) ──────────────────────────────
const envOverlay2  = document.getElementById('envOverlay2');
const envFlap2     = document.getElementById('envFlap2');
const envLetter2   = document.getElementById('letter2');
const heartSeal2   = document.getElementById('heartSeal2');
let envelopeOpened2 = false;

document.getElementById('message-btn-2').addEventListener('click', (e) => {
    e.stopPropagation();
    envOverlay2.classList.add('show');
    envelopeOpened2 = false;
    envFlap2.classList.remove('open');
    envLetter2.classList.remove('risen', 'closing', 'opened');
    heartSeal2.classList.remove('hidden');
});

document.getElementById('envWrapper2').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!envelopeOpened2) {
        heartSeal2.classList.add('hidden');
        envFlap2.classList.add('open');
        setTimeout(() => {
            envLetter2.classList.remove('closing');
            envLetter2.classList.add('risen');
            envelopeOpened2 = true;
        }, 700);
    }
});

document.getElementById('letter2').addEventListener('click', (e) => {
    e.stopPropagation();
    envOverlay2.click();
});

envOverlay2.addEventListener('click', (e) => {
    if (e.target === envOverlay2) {
        if (envelopeOpened2) {
            envelopeOpened2 = false;
            envLetter2.classList.remove('risen');
            envLetter2.classList.add('closing');
            setTimeout(() => envFlap2.classList.remove('open'), 700);
            setTimeout(() => heartSeal2.classList.remove('hidden'), 1100);
            setTimeout(() => envOverlay2.classList.remove('show'), 1400);
        } else {
            envOverlay2.classList.remove('show');
        }
    }
});


// =====================================================
// CARD SLIDER
// =====================================================

// =====================================================
// CARD SLIDER
// =====================================================
// Store random nudges for each card (generated once and reused)
// MUST be outside IIFE so it persists across multiple openings
// =====================================================
// CARD SLIDER - GLOBAL VARIABLES
// =====================================================

// Store random nudges for each card GLOBALLY (outside IIFE)
// This ensures nudges persist and feel natural/romantic
const cardNudges = {};

function getCardNudge(cardIndex) {
    // Generate and cache random nudge for this card if not exists
    if (!cardNudges[cardIndex]) {
        cardNudges[cardIndex] = {
            xRand: (Math.random() - 0.5) * 8,  // Random X between -4 and +4
            rotRand: (Math.random() - 0.5) * 3 // Random rotation between -1.5 and +1.5 deg
        };
    }
    return cardNudges[cardIndex];
}

// =====================================================
// CARD SLIDER - MAIN IIFE
// =====================================================

(function () {

const IMAGES = [
    '1.jpeg', '2.jpeg', '3.jpeg', '4.jpeg',
    '5.jpeg', '6.jpeg', '7.jpeg', '8.jpeg',
    '9.jpeg', '10.jpeg', '11.jpeg', '12.jpeg',
    '13.jpeg'
];

const FINAL_MESSAGE = "ur now 17 years old!! Just look at how much u've grown. I want u to know it saddens me seeing u grow, I keep looking at ur/our old photos and I cant believe how much uve grown, you've matured so much, u r no longer a baby (but will always be my baby in my eyes) u r so much more capable than u think u r. And please don't forget that even if uve grown up that doesn't mean u cant be young again. and I am proud to be one of the people to be a part of your journy in life and soon to be a whole and not just a part. And as u grow old baby I want u to know, eventually u'll come to realize how challenging life can be. I know ur still not an adult but I see how ur slowly turning into one. As u grow please know u r not alone, I am here with u till the end of the line. Despite ur fears, challenges, circumstances, and anxiety, u chose to move forward into this new and exciting chapter of ur life. As I'm still breathing I'll be with u to face all the mysteries u'll encounter. I LOVE U IN EVERY UNIVERSE....";

const FALLBACK_EMOJI = ['💖','🌸','✨','🎀','💝','🎉','🥰','🌺'];
const VISIBLE_CARDS  = 4;

const sliderOverlay = document.getElementById('sliderOverlay');
const cardStack     = document.getElementById('cardStack');
const sliderClose   = document.getElementById('sliderClose');
const sliderHint    = document.getElementById('sliderHint');
const openBtn       = document.getElementById('openSliderBtn');

let currentIndex = 0;
let isDragging   = false;
let startX = 0, startY = 0;
let currentX = 0, currentY = 0;
let topCard  = null;
let animating = false;
let hintTimer = null;
let hasReachedEnd = false;

// All cards live in the DOM permanently — never destroyed
const allCards = [];
// Final ILY card, also permanent
let finalCard = null;

// -------------------------------------------------------
// Position Card with random nudges
// -------------------------------------------------------
function positionCard(card, stackPos, animate) {
    const cardIndex = currentIndex + stackPos;
    const nudge = getCardNudge(cardIndex);
    
    const scale = 1 - stackPos * 0.045;
    const yOff  = stackPos * 12;
    const xOff  = stackPos * 3 + nudge.xRand;
    const rot   = stackPos * 1.5 + nudge.rotRand;

    if (animate) {
        card.style.transition = 'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.42s ease, box-shadow 0.42s ease';
    } else {
        card.style.transition = 'none';
    }
    
    card.style.transform  = `translateX(${xOff}px) translateY(${yOff}px) scale(${scale}) rotate(${rot}deg)`;
    card.style.zIndex     = String(IMAGES.length + VISIBLE_CARDS - stackPos);
    card.style.opacity    = '1';
    card.style.boxShadow  = stackPos === 0
        ? '0 12px 40px rgba(0,0,0,0.45)'
        : `0 ${4 + stackPos * 2}px ${12 + stackPos * 6}px rgba(0,0,0,0.25)`;
}

// -------------------------------------------------------
// Refresh Stack
// -------------------------------------------------------
function refreshStack(animate) {
    for (let offset = 0; offset < VISIBLE_CARDS; offset++) {
        const imgIdx = currentIndex + offset;
        if (imgIdx >= IMAGES.length) break;
        const card = allCards[imgIdx];
        positionCard(card, offset, animate);
    }
}

// -------------------------------------------------------
// Create Card
// -------------------------------------------------------
function createCard(imgIdx) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.dataset.imgIdx = imgIdx;

    const img = document.createElement('img');
    img.src = IMAGES[imgIdx];
    img.alt = '';
    img.draggable = false;
    img.onerror = function () {
        card.classList.add('placeholder');
        card.innerHTML = FALLBACK_EMOJI[imgIdx % FALLBACK_EMOJI.length];
    };
    card.appendChild(img);
    return card;
}

// -------------------------------------------------------
// Initialize All Cards
// -------------------------------------------------------
function initializeAllCards() {
    allCards.length = 0;
    cardStack.innerHTML = '';
    // DO NOT reset cardNudges - keep them persistent and random

    // Create the ILY final card first (lowest z-index, behind everything)
    finalCard = document.createElement('div');
    finalCard.style.cssText = `
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 12px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2);
        z-index: 0;
        opacity: 0;
        pointer-events: none;
        transition: transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.42s ease, box-shadow 0.42s ease;
    `;
    cardStack.appendChild(finalCard);

    // Create photo cards in reverse so card 0 ends up on top
    for (let i = IMAGES.length - 1; i >= 0; i--) {
        const card = createCard(i);
        // Pre-position all cards with RANDOM natural nudges
        const stackPos = i < VISIBLE_CARDS ? i : VISIBLE_CARDS - 1;
        const nudge = getCardNudge(i);
        
        const scale = 1 - stackPos * 0.045;
        const yOff  = stackPos * 12;
        const xOff  = stackPos * 3 + nudge.xRand;
        const rot   = stackPos * 1.5 + nudge.rotRand;
        
        card.style.transition = 'none';
        card.style.transform = `translateX(${xOff}px) translateY(${yOff}px) scale(${scale}) rotate(${rot}deg)`;
        card.style.zIndex = String(IMAGES.length + VISIBLE_CARDS - stackPos);
        card.style.opacity = '1';
        card.style.boxShadow = stackPos === 0
            ? '0 12px 40px rgba(0,0,0,0.45)'
            : `0 ${4 + stackPos * 2}px ${12 + stackPos * 6}px rgba(0,0,0,0.25)`;
        
        allCards[i] = card;
        cardStack.appendChild(card);
    }

    attachDragListeners(allCards[0]);
}

// -------------------------------------------------------
// Drag Listeners
// -------------------------------------------------------
function attachDragListeners(card) {
    card.removeEventListener('mousedown',  onDragStart);
    card.removeEventListener('touchstart', onDragStart);
    card.addEventListener('mousedown',  onDragStart, { passive: true });
    card.addEventListener('touchstart', onDragStart, { passive: true });
}

function onDragStart(e) {
    if (animating || hasReachedEnd) return;
    isDragging = true;
    topCard    = e.currentTarget;

    const pt = e.touches ? e.touches[0] : e;
    startX = pt.clientX;
    startY = pt.clientY;
    currentX = 0;
    currentY = 0;

    topCard.style.transition = 'none';
    topCard.style.cursor     = 'grabbing';

    document.addEventListener('mousemove',  onDragMove, { passive: true });
    document.addEventListener('touchmove',  onDragMove, { passive: true });
    document.addEventListener('mouseup',    onDragEnd);
    document.addEventListener('touchend',   onDragEnd);
}

    function onDragMove(e) {
    if (!isDragging || !topCard) return;
    const pt = e.touches ? e.touches[0] : e;
    currentX = pt.clientX - startX;
    currentY = pt.clientY - startY;

    // Move top card with finger
    const rot = currentX * 0.12;
    topCard.style.transform = `translateX(${currentX}px) translateY(${currentY}px) rotate(${rot}deg)`;

    // Background cards STAY IN PLACE - no movement during drag
    // They are already at their pre-nudged positions and stay there
    // Only the peek card fades in as progress increases
    const progress = Math.min(1, Math.sqrt(currentX * currentX + currentY * currentY) / 120);

    // Peek card - fade in as user drags
    const peekIdx = currentIndex + VISIBLE_CARDS;
    if (peekIdx < IMAGES.length) {
        const peekCard  = allCards[peekIdx];
        const peekNudge = getCardNudge(peekIdx);
        const lastScale = 1 - (VISIBLE_CARDS - 1) * 0.045;
        const lastY     = (VISIBLE_CARDS - 1) * 12;
        const lastX     = (VISIBLE_CARDS - 1) * 3 + peekNudge.xRand;
        const lastRot   = (VISIBLE_CARDS - 1) * 1.5 + peekNudge.rotRand;
        peekCard.style.transition = 'none';
        peekCard.style.transform  = `translateX(${lastX}px) translateY(${lastY}px) scale(${lastScale}) rotate(${lastRot}deg)`;
        peekCard.style.zIndex     = String(IMAGES.length);
        peekCard.style.opacity    = String(progress);
    }
}


    function onDragEnd() {
    document.removeEventListener('mousemove',  onDragMove);
    document.removeEventListener('touchmove',  onDragMove);
    document.removeEventListener('mouseup',    onDragEnd);
    document.removeEventListener('touchend',   onDragEnd);

    if (!isDragging || !topCard) { isDragging = false; return; }
    isDragging = false;

    const ABS_X = Math.abs(currentX);
    const ABS_Y = Math.abs(currentY);
    const SWIPE_THRESHOLD = 80;

    if (ABS_X > SWIPE_THRESHOLD || ABS_Y > SWIPE_THRESHOLD) {
        let flyX = 0, flyY = 0;
        if (ABS_X >= ABS_Y) {
            flyX = currentX > 0 ?  window.innerWidth  * 1.4 : -window.innerWidth  * 1.4;
            flyY = currentY * 2;
        } else {
            flyY = currentY > 0 ?  window.innerHeight * 1.4 : -window.innerHeight * 1.4;
            flyX = currentX * 2;
        }
        flyCard(flyX, flyY);
    } else {
        // Snap back — smooth animation, background cards stay completely still
        const TRANS = 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)';
        topCard.style.transition = TRANS;
        
        // Snap top card back to its pre-nudged position
        const topNudge = getCardNudge(currentIndex);
        const topX = 0 * 3 + topNudge.xRand;
        const topY = 0 * 12;
        const topRot = 0 * 1.5 + topNudge.rotRand;
        topCard.style.transform = `translateX(${topX}px) translateY(${topY}px) scale(1) rotate(${topRot}deg)`;
        topCard.style.cursor = 'grab';

        // Hide peek card - it stays in its pre-nudged position, just fade out
        const peekIdx = currentIndex + VISIBLE_CARDS;
        if (peekIdx < IMAGES.length) {
            allCards[peekIdx].style.transition = TRANS;
            allCards[peekIdx].style.opacity    = '0';
        }
    }
}

    function flyCard(flyX, flyY) {
    if (!topCard) return;
    animating = true;

    const rot    = flyX * 0.15;
    const FLY_MS = 420;
    const TRANS = `transform ${FLY_MS}ms cubic-bezier(0.25,0.46,0.45,0.94), opacity ${FLY_MS}ms ease, box-shadow ${FLY_MS}ms ease`;
    
    // Animate top card flying away
    topCard.style.transition = `transform ${FLY_MS}ms cubic-bezier(0.25,0.46,0.45,0.94), opacity ${FLY_MS * 0.8}ms ease`;
    topCard.style.transform  = `translateX(${flyX}px) translateY(${flyY}px) rotate(${rot}deg)`;
    topCard.style.opacity    = '0';

    // Animate ALL background cards moving forward smoothly
    for (let offset = 1; offset < VISIBLE_CARDS; offset++) {
        const imgIdx = currentIndex + offset;
        if (imgIdx >= IMAGES.length) break;
        
        const card = allCards[imgIdx];
        const nudge = getCardNudge(imgIdx);
        
        // New position when this card moves to offset-1
        const newScale = 1 - (offset - 1) * 0.045;
        const newY = (offset - 1) * 12;
        const newX = (offset - 1) * 3 + nudge.xRand;
        const newRot = (offset - 1) * 1.5 + nudge.rotRand;
        const newShadow = (offset - 1) === 0
            ? '0 12px 40px rgba(0,0,0,0.45)'
            : `0 ${4 + (offset - 1) * 2}px ${12 + (offset - 1) * 6}px rgba(0,0,0,0.25)`;
        
        card.style.transition = TRANS;
        card.style.transform = `translateX(${newX}px) translateY(${newY}px) scale(${newScale}) rotate(${newRot}deg)`;
        card.style.boxShadow = newShadow;
        card.style.zIndex = String(IMAGES.length + VISIBLE_CARDS - (offset - 1));
        card.style.opacity = '1';
    }

    // Animate peek card sliding in from behind
    const nextHiddenIdx = currentIndex + VISIBLE_CARDS;
    if (nextHiddenIdx < IMAGES.length) {
        const nextCard = allCards[nextHiddenIdx];
        const nextNudge = getCardNudge(nextHiddenIdx);
        const peekScale = 1 - (VISIBLE_CARDS - 1) * 0.045;
        const peekY = (VISIBLE_CARDS - 1) * 12;
        const peekX = (VISIBLE_CARDS - 1) * 3 + nextNudge.xRand;
        const peekRot = (VISIBLE_CARDS - 1) * 1.5 + nextNudge.rotRand;
        const peekShadow = `0 ${4 + (VISIBLE_CARDS - 1) * 2}px ${12 + (VISIBLE_CARDS - 1) * 6}px rgba(0,0,0,0.25)`;
        
        nextCard.style.transition = TRANS;
        nextCard.style.transform = `translateX(${peekX}px) translateY(${peekY}px) scale(${peekScale}) rotate(${peekRot}deg)`;
        nextCard.style.zIndex = String(IMAGES.length + VISIBLE_CARDS - (VISIBLE_CARDS - 1));
        nextCard.style.opacity = '1';
        nextCard.style.boxShadow = peekShadow;
    }

    const isLastCard = (currentIndex === IMAGES.length - 1);

    setTimeout(() => {
        topCard.style.transition = 'none';
        topCard.style.zIndex     = '0';

        if (isLastCard) {
            hasReachedEnd = true;
            showFinalMessage();
            counterDisplay.textContent = `${IMAGES.length + 1}/${IMAGES.length + 1}`;
        } else {
            currentIndex++;
            window.updateCounter();
            refreshStack(false);
            attachDragListeners(allCards[currentIndex]);
        }

        topCard   = null;
        animating = false;
    }, FLY_MS + 20);
}

    
// -------------------------------------------------------
// Show Final Message
// -------------------------------------------------------
function showFinalMessage() {
    // Load romantic font
    if (!document.getElementById('final-card-font')) {
        const link = document.createElement('link');
        link.id   = 'final-card-font';
        link.rel  = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap';
        document.head.appendChild(link);
    }

    // Inject styles once
    if (!document.getElementById('slider-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'slider-animation-styles';
        style.textContent = `
            @keyframes fadeInMessage {
                0%   { opacity: 0; transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
            }
            @keyframes blinkCursor {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0; }
            }
            .type-cursor {
                display: inline-block;
                width: 1.5px;
                height: 1em;
                background: #FF69B4;
                margin-left: 1px;
                vertical-align: text-bottom;
                animation: blinkCursor 1.1s ease-in-out infinite;
            }

            div::-webkit-scrollbar       { width: 0px; }
            div::-webkit-scrollbar-track { background: transparent; }
            div::-webkit-scrollbar-thumb { background: transparent; }
        `;
        document.head.appendChild(style);
    }

    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        position: absolute;
        inset: 0;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        background: linear-gradient(160deg, #141414 0%, #1e1e1e 60%, #2a1a20 100%);
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 12px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2);
        animation: fadeInMessage 0.7s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
    `;



    const textWrapper = document.createElement('div');
textWrapper.style.cssText = `
    width: 100%;
    height: 100%;
    padding: 30px 15px;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    scrollbar-width: none;
`;
textWrapper.style.setProperty('overflow-y', 'auto');
// Hide webkit scrollbar so it doesn't shift layout
const hideScrollStyle = document.createElement('style');
hideScrollStyle.textContent = `
    #msg-text-wrapper::-webkit-scrollbar { display: none; }
`;
document.head.appendChild(hideScrollStyle);
textWrapper.id = 'msg-text-wrapper';
    
    
    const FONT_FAMILY = "'Cormorant Garamond', 'Georgia', serif";
    const FONT_SIZE_PX = 25;
    const LETTER_SPACING = 0.3;



const linesContainer = document.createElement('div');
linesContainer.style.cssText = `
    font-size: ${FONT_SIZE_PX}px;
    font-weight: 400;
    font-style: italic;
    background: linear-gradient(135deg, #FF1493 0%, #FF69B4 55%, #FFB6C1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: ${LETTER_SPACING}px;
    line-height: 1.7;
    text-align: left;
    font-family: ${FONT_FAMILY};
    width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
    padding: 0;
`;

    const cursor = document.createElement('span');
    cursor.className = 'type-cursor';

    textWrapper.appendChild(linesContainer);
    messageContainer.appendChild(textWrapper);
    cardStack.appendChild(messageContainer);

    let isUserScrolling = false;
    let scrollTimeout;
    const onUserScroll = () => {
        isUserScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => { isUserScrolling = false; }, 1500);
    };
    textWrapper.addEventListener('wheel',     onUserScroll, { passive: true });
    textWrapper.addEventListener('touchmove', onUserScroll, { passive: true });

    // Conservative measurement: assume 90% of available width




    function buildLines() {
    // Let the browser do the wrapping — split into words only
    return FINAL_MESSAGE.split(' ');
}
    

  

    

const startTyping = () => {
        setTimeout(() => {
            typeWordsInline(FINAL_MESSAGE, linesContainer, cursor, textWrapper, () => isUserScrolling);
        }, 900);
    };

    if (document.fonts && document.fonts.load) {
        document.fonts.load(`italic 400 ${FONT_SIZE_PX}px 'Cormorant Garamond'`)
            .then(startTyping).catch(startTyping);
    } else {
        setTimeout(startTyping, 300);
    }
    
}



    function typeWordsInline(message, container, cursor, wrapper, getIsScrolling) {
    // Single flowing <span> — browser wraps naturally, no canvas guessing
    const textSpan = document.createElement('span');
    textSpan.style.cssText = `
        display: inline;
        white-space: pre-wrap;
        word-break: break-word;
    `;
    container.style.display = 'block';
    container.style.width = '100%';
    container.appendChild(textSpan);
    container.appendChild(cursor);

    const BASE_MS = 72;
    let charIdx = 0;

    function nextTick() {
        if (charIdx >= message.length) {
            if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
            return;
        }
        textSpan.textContent += message[charIdx];
        charIdx++;

        if (!getIsScrolling()) {
            wrapper.scrollTop = wrapper.scrollHeight;
        }

        const ch = message[charIdx - 1];
        const delay = /[,.]/.test(ch) ? BASE_MS * 6
                    : /[!?]/.test(ch)  ? BASE_MS * 4
                    : BASE_MS + (Math.random() * 28 - 10);
        setTimeout(nextTick, delay);
    }

    nextTick();
}
    

// -------------------------------------------------------
// Open / Close Slider
// -------------------------------------------------------

    // Update counter function - INSIDE IIFE so it has access to currentIndex
window.updateCounter = function() {
    counterDisplay.textContent = `${currentIndex + 1}/${IMAGES.length + 1}`;
};
    

    function openSlider() {
    currentIndex  = 0;
    hasReachedEnd = false;
    animating     = false;
    isDragging    = false;

    initializeAllCards();

    sliderOverlay.classList.add('active');
    counterDisplay.style.display = 'block';
    counterDisplay.textContent = `${currentIndex + 1}/${IMAGES.length + 1}`;

    clearTimeout(hintTimer);
    sliderHint.classList.remove('fade');
    hintTimer = setTimeout(() => sliderHint.classList.add('fade'), 3000);
}


    function closeSlider() {
    sliderOverlay.classList.remove('active');
    counterDisplay.style.display = 'none';
}

openBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openSlider();
});

    // Create counter display
// Create counter display OUTSIDE the IIFE
const counterDisplay = document.createElement('div');
counterDisplay.id = 'slider-counter';
counterDisplay.style.cssText = `
    position: fixed;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #FFB6C1;
    text-shadow: 0 2px 6px rgba(0,0,0,0.4);
    z-index: 1001;
    pointer-events: none;
    display: none;
`;
document.body.appendChild(counterDisplay);

openBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openSlider();
});
// Update counter after each card swipe (in flyCard after currentIndex++)
    

    

sliderClose.addEventListener('click', closeSlider);

sliderOverlay.addEventListener('click', (e) => {
    if (e.target === sliderOverlay) closeSlider();
});

// Initialize cards on load so images preload
initializeAllCards();

})();


// =====================================================
// ERROR HANDLING
// =====================================================

function showError(msg) {
    console.error(msg);
}



// =====================================================
// BOUQUET BUTTON — Launch flower scene
// =====================================================

(function () {
    const bouquetScene  = document.getElementById('bouquet-scene');
    // Keep a reference to the ORIGINAL flowers HTML so we can clone it fresh every open
    const flowersOriginalHTML = bouquetScene.querySelector('.flowers').outerHTML;

    const fadeEls = () => [
        document.querySelector('.cake-container'),
        document.getElementById('message'),
        document.getElementById('bottom-btns'),
        document.querySelector('.bg-gradient'),
        document.querySelector('.sparkles'),
        document.getElementById('balloons'),
        document.querySelector('.party-poppers'),
        document.getElementById('confetti-canvas')
    ].filter(Boolean);

    // 'idle' | 'opening' | 'open' | 'closing'
    let state      = 'idle';
    let poemSession = 0; // incremented on every close to kill in-flight timers

    // ── Poem overlay — sits in top 45% so it never covers the flowers ────
    const poemOverlay = document.createElement('div');
    poemOverlay.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 45%;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.8s ease;
    `;
    const poemText = document.createElement('div');
    poemOverlay.appendChild(poemText);
    document.body.appendChild(poemOverlay);

    // ── Hard-reset flowers: remove old node, clone fresh from original HTML ──
    function hardResetFlowers() {
        const old = bouquetScene.querySelector('.flowers');
        if (old) old.remove();

        // Parse the original HTML string back into a real DOM node
        const tmp = document.createElement('div');
        tmp.innerHTML = flowersOriginalHTML;
        const freshFlowers = tmp.firstElementChild;

        // Make sure it starts paused (not-loaded class)
        freshFlowers.classList.add('not-loaded');

        // Insert before the last child so it sits in the right z-order
        // (night div is first child, flowers goes after it)
        bouquetScene.appendChild(freshFlowers);
        return freshFlowers;
    }

    // ── Word-by-word blur typewriter ─────────────────────────────────────
    function typeBlurWords(text, msPerWord, blurPx, transTime, opacTime, session, onDone) {
        const words = text.split(' ');
        poemText.innerHTML = '';
        let i = 0;
        function next() {
            if (poemSession !== session) return;
            if (i >= words.length) {
                if (onDone) setTimeout(() => { if (poemSession === session) onDone(); }, 500);
                return;
            }
            const span = document.createElement('span');
            span.textContent = (i === 0 ? '' : ' ') + words[i];
            span.style.cssText = `
                display: inline;
                filter: blur(${blurPx});
                opacity: 0;
                transition: filter ${transTime} ease, opacity ${opacTime} ease;
            `;
            poemText.appendChild(span);
            requestAnimationFrame(() => requestAnimationFrame(() => {
                if (poemSession !== session) return;
                span.style.filter  = 'blur(0px)';
                span.style.opacity = '1';
            }));
            i++;
            setTimeout(next, msPerWord);
        }
        next();
    }

    // ── Fade poemText out, wipe it, then call cb ─────────────────────────
    function fadeOutThen(session, cb) {
        if (poemSession !== session) return;
        poemText.style.transition = 'opacity 0.4s ease';
        poemText.style.opacity    = '0';
        setTimeout(() => {
            if (poemSession !== session) return;
            poemText.innerHTML        = '';
            poemText.style.transition = '';
            poemText.style.opacity    = '1';
            cb();
        }, 450);
    }

    // ── Full poem sequence — always starts from phase 1 ──────────────────
    function startPoemSequence() {
        const session = ++poemSession;
        poemOverlay.style.opacity = '1';

        // Phase 1 — large romantic font
        poemText.style.cssText = `
            font-family: 'Cormorant Garamond', 'Georgia', serif;
            font-size: clamp(1.5rem, 5.5vw, 2.2rem);
            font-style: italic;
            color: #ffe0f0;
            text-align: center;
            letter-spacing: 0.06em;
            line-height: 1.8;
            text-shadow: 0 2px 18px rgba(255,100,180,0.55), 0 0 40px rgba(255,180,220,0.25);
            padding: 0 28px;
            max-width: 540px;
        `;
        typeBlurWords(
            'Like flowers, we bloom when the time is right.',
            480, '8px', '1.1s', '0.9s', session,
            () => {
                setTimeout(() => {
                    fadeOutThen(session, () => {

                        // Phase 2 — "even at night.." same large font
                        poemText.style.cssText = `
                            font-family: 'Cormorant Garamond', 'Georgia', serif;
                            font-size: clamp(1.5rem, 5.5vw, 2.2rem);
                            font-style: italic;
                            color: #ffe0f0;
                            text-align: center;
                            letter-spacing: 0.06em;
                            line-height: 1.8;
                            text-shadow: 0 2px 18px rgba(255,100,180,0.55), 0 0 40px rgba(255,180,220,0.25);
                            padding: 0 28px;
                            max-width: 540px;
                        `;
                        typeBlurWords(
                            'even at night..',
                            520, '8px', '1.1s', '0.9s', session,
                            () => {
                                setTimeout(() => {
                                    fadeOutThen(session, () => {

                                        // Phase 3 — paragraph, smaller font, fast typing
                                        poemText.style.cssText = `
                                            font-family: 'Cormorant Garamond', 'Georgia', serif;
                                            font-size: clamp(0.95rem, 3.4vw, 1.15rem);
                                            font-style: italic;
                                            color: #ffd6ec;
                                            text-align: center;
                                            line-height: 1.75;
                                            letter-spacing: 0.01em;
                                            padding: 0 20px;
                                            max-width: 520px;
                                            text-shadow: 0 1px 10px rgba(255,100,180,0.3);
                                        `;
                                        typeBlurWords(
                                            'Haii lovee, I apologize my flowers to u baby are virtual\uD83E\uDD79 as much as i wanna give u something real and special i am limited by budget and opportunities to get materials \uD83E\uDD79 so i made something that i can do for free and doesn\'t require the need to go outside. I hope u like itt, but no amount of flowers ever get to level ur beauty. I love u pretty baby.',
                                            120, '5px', '0.4s', '0.35s', session,
                                            null
                                        );
                                    });
                                }, 2200);
                            }
                        );
                    });
                }, 800);
            }
        );
    }

    // ── Open ─────────────────────────────────────────────────────────────
    document.getElementById('bouquet-btn').addEventListener('click', () => {
        if (state !== 'idle') return;
        state = 'opening';

        fadeEls().forEach(el => {
            el.style.transition    = 'opacity 0.9s ease';
            el.style.opacity       = '0';
            el.style.pointerEvents = 'none';
            el.style.zIndex        = '0';
        });

        setTimeout(() => {
            bouquetScene.classList.add('active');

            // Hard-reset: clone a brand-new flowers node every single open
            const freshFlowers = hardResetFlowers();

            setTimeout(() => {
                // Remove not-loaded to kick off all CSS animations fresh
                freshFlowers.classList.remove('not-loaded');
                state = 'open';
                // Wait for bloom (~4.5s) then start poem
                setTimeout(startPoemSequence, 4500);
            }, 1000);
        }, 1000);
    });

    // ── Close ─────────────────────────────────────────────────────────────
    bouquetScene.addEventListener('click', () => {
        if (state !== 'open') return;
        state = 'closing';

        // Kill poem immediately
        poemSession++;
        poemOverlay.style.opacity = '0';
        poemText.innerHTML        = '';

        // Fade bouquet scene out
        bouquetScene.style.transition = 'opacity 1s ease';
        bouquetScene.style.opacity    = '0';

        setTimeout(() => {
            bouquetScene.classList.remove('active');
            bouquetScene.style.opacity    = '';
            bouquetScene.style.transition = '';

            // Remove the current flowers node — next open will clone a fresh one
            const currentFlowers = bouquetScene.querySelector('.flowers');
            if (currentFlowers) currentFlowers.remove();

            fadeEls().forEach(el => {
                el.style.transition    = 'opacity 0.9s ease';
                el.style.opacity       = '1';
                el.style.pointerEvents = '';
                el.style.zIndex        = '';
            });

            state = 'idle';
        }, 1000);
    });
}());





// =====================================================
// CLEANUP
// =====================================================

window.addEventListener('beforeunload', () => {
    if (blowDetectionInterval) clearInterval(blowDetectionInterval);
    if (microphoneStream) microphoneStream.getTracks().forEach(track => track.stop());
    if (audioContext)     audioContext.close();
});

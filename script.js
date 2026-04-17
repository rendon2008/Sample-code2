// =====================================================
// STATE VARIABLES
// =====================================================

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
const relightBtn         = document.getElementById('relight-btn');
const candles            = document.querySelectorAll('.candle');
const confettiCanvas     = document.getElementById('confetti-canvas');
const balloonsContainer  = document.getElementById('balloons');
const poppers            = document.querySelectorAll('.popper');


// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    setupRelightButton();
    
    // Add click listener to request mic button
    const requestMicBtn = document.getElementById('request-mic-btn');
    if (requestMicBtn) {
        requestMicBtn.addEventListener('click', () => {
            requestMicrophoneAccess();
        });
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
        relightBtn.classList.remove('hidden');
        relightBtn.classList.add('visible');

        const bottomBtns = document.getElementById('bottom-btns');
        bottomBtns.classList.remove('hidden');
        bottomBtns.classList.add('visible');
    }, 2000);
}

function updateMessage() {
    message.style.opacity   = '0';
    message.style.transform = 'translateX(-50%) scale(0.8)';

    setTimeout(() => {
       message.innerHTML = '<span style="font-family: \'Cormorant Garamond\', Georgia, serif; font-style: italic; font-weight: 400;">HAPPIEST 17TH BIRTHDAY BABYY RIRI<br><span style="font-size: 0.7em;">I LOVE U 3000</span></span>';
        message.style.color      = '#FF69B4';
        message.style.textShadow = `
            0 0 10px rgba(255, 105, 180, 0.8),
            0 0 20px rgba(255, 105, 180, 0.6),
            0 0 30px rgba(255, 182, 193, 0.5),
            2px 2px 4px rgba(0,0,0,0.1)
        `;
        message.style.opacity   = '1';
        message.style.transform = 'translateX(-50%) scale(1)';
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

function setupRelightButton() {
    relightBtn.addEventListener('click', () => relightCandles());
}

function relightCandles() {
    candlesExtinguished = false;
    celebrationStarted  = false;
    blowStartTime       = null;

    candles.forEach(candle => candle.classList.remove('extinguished'));

    message.style.opacity   = '0';
    message.style.transform = 'translateX(-50%) scale(0.8)';

    setTimeout(() => {
        message.innerHTML        = 'BLOW THE CANDLES!!';
        message.style.color      = '';
        message.style.textShadow = '';
        message.style.opacity    = '1';
        message.style.transform  = 'translateX(-50%) scale(1)';
    }, 400);

    relightBtn.classList.remove('visible');
    relightBtn.classList.add('hidden');

    const bottomBtns = document.getElementById('bottom-btns');
    bottomBtns.classList.remove('visible');
    bottomBtns.classList.add('hidden');

    balloonsContainer.innerHTML = '';
    startCandleAnimations();

    if (!blowDetectionInterval) {
        startBlowDetection();
    }
}


// =====================================================
// ENVELOPE / LETTER ANIMATION
// =====================================================

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


// =====================================================
// CARD SLIDER
// =====================================================

// =====================================================
// CARD SLIDER
// =====================================================

(function () {

const IMAGES = [
    '1.jpeg', '2.jpeg', '3.jpeg', '4.jpeg',
    '5.jpeg', '6.jpeg', '7.jpeg', '8.jpeg',
    '9.jpeg', '10.jpeg', '11.jpeg', '12.jpeg',
    '13.jpeg'
];

const FINAL_MESSAGE = "Just look at how much u've grown🥹 I want u to know it saddens me seeing u grow, I keep looking at ur/our old photos and I cant believe how much uve grown, you've matured so much, u r no longer a baby (but will always be my baby in my eyes) and I am proud to be one of the person to be a part of your journy in life and soon to be a whole and not just a part..."; // EDIT THIS TEXT HERE

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
const cardNudges = [];
// Final ILY card, also permanent
let finalCard = null;

// -------------------------------------------------------
// Build all cards once and append them all to cardStack.
// Visibility is controlled purely via CSS transforms/opacity/zIndex.
// -------------------------------------------------------
function initializeAllCards() {
    allCards.length = 0;
    cardStack.innerHTML = '';

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
    `;
    cardStack.appendChild(finalCard);

    // Create photo cards in reverse so card 0 ends up on top
 for (let i = IMAGES.length - 1; i >= 0; i--) {
        const card = createCard(i);
        if (i >= VISIBLE_CARDS) {
            card.style.opacity   = '0';
            card.style.zIndex    = '0';
            card.style.pointerEvents = 'none';
        }

     cardNudges[i] = {
    x: (Math.random() - 0.5) * 22,
    rot: (Math.random() - 0.5) * 14
};
        allCards[i] = card;
        cardStack.appendChild(card);
    }
    // Set initial stack positions with no animation
    refreshStack(false);
    attachDragListeners(allCards[0]);
}

// -------------------------------------------------------
// Set each visible card to its correct stacked position.
// Cards beyond VISIBLE_CARDS stay hidden behind card[VISIBLE_CARDS-1].
// -------------------------------------------------------
function refreshStack(animate) {
    for (let offset = 0; offset < VISIBLE_CARDS; offset++) {
        const imgIdx = currentIndex + offset;
        if (imgIdx >= IMAGES.length) break;
        const card = allCards[imgIdx];
        positionCard(card, offset, animate);
    }
    // Ensure the peek card (just beyond visible window) is hidden and behind
    const peekIdx = currentIndex + VISIBLE_CARDS;
    if (peekIdx < IMAGES.length) {
        const peekCard = allCards[peekIdx];
        peekCard.style.transition = animate ? 'opacity 0.3s ease' : 'none';
        peekCard.style.opacity    = '0';
        peekCard.style.zIndex     = '1';
        peekCard.style.pointerEvents = 'none';
    }
    // Ensure all cards further back are also fully hidden
    for (let i = currentIndex + VISIBLE_CARDS + 1; i < IMAGES.length; i++) {
        allCards[i].style.opacity = '0';
        allCards[i].style.zIndex  = '0';
        allCards[i].style.pointerEvents = 'none';
    }
}

function positionCard(card, stackPos, animate) {
    const scale = 1 - stackPos * 0.045;
    const yOff  = stackPos * 12;
    const TRANS = 'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.42s ease, box-shadow 0.42s ease';

    card.style.transition = animate ? TRANS : 'none';
    const imgIdx = parseInt(card.dataset.imgIdx);
    const nudge = cardNudges[imgIdx] || { x: 0, rot: 0 };
    card.style.transform  = `translateX(${nudge.x}px) translateY(${yOff}px) rotate(${nudge.rot}deg) scale(${scale})`;
    card.style.boxShadow  = stackPos === 0
        ? '0 12px 40px rgba(0,0,0,0.45)'
        : `0 ${4 + stackPos * 2}px ${12 + stackPos * 6}px rgba(0,0,0,0.25)`;
    // z-index: top card gets highest, cards behind get lower — deterministic
    card.style.zIndex     = String(IMAGES.length + VISIBLE_CARDS - stackPos);
    card.style.opacity    = '1';
    card.style.pointerEvents = stackPos === 0 ? 'auto' : 'none';
}

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
// Drag
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

    // Animate background cards toward their next position proportionally
    const progress = Math.min(1, Math.sqrt(currentX * currentX + currentY * currentY) / 120);
    for (let offset = 1; offset < VISIBLE_CARDS; offset++) {
        const imgIdx = currentIndex + offset;
        if (imgIdx >= IMAGES.length) break;
        const card     = allCards[imgIdx];
        const fromScale = 1 - offset * 0.045;
        const toScale   = 1 - (offset - 1) * 0.045;
        const fromY     = offset * 12;
        const toY       = (offset - 1) * 12;
        const scale     = fromScale + (toScale - fromScale) * progress;
        const yOff      = fromY   + (toY   - fromY)   * progress;
        card.style.transition = 'none';
        const nudge = cardNudges[parseInt(card.dataset.imgIdx)] || { x: 0, rot: 0 };
        card.style.transform  = `translateX(${nudge.x}px) translateY(${yOff}px) rotate(${nudge.rot}deg) scale(${scale})`;    }

    // Also peek in the next card that's currently hidden
    const peekIdx = currentIndex + VISIBLE_CARDS;
    if (peekIdx < IMAGES.length) {
        const peekCard  = allCards[peekIdx];
        const lastScale = 1 - (VISIBLE_CARDS - 1) * 0.045;
        const lastY     = (VISIBLE_CARDS - 1) * 12;
        peekCard.style.transition = 'none';
        const peekNudge = cardNudges[parseInt(peekCard.dataset.imgIdx)] || { x: 0, rot: 0 };
        peekCard.style.transform  = `translateX(${peekNudge.x}px) translateY(${lastY}px) rotate(${peekNudge.rot}deg) scale(${lastScale})`;
        // Keep peek card behind all visible stack cards (stack bottom z-index = IMAGES.length + 1)
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
        // Snap back — restore background cards too
        const TRANS = 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)';
        topCard.style.transition = TRANS;
        const topNudge = cardNudges[parseInt(topCard.dataset.imgIdx)] || { x: 0, rot: 0 };
        topCard.style.transform  = `translateX(${topNudge.x}px) translateY(0px) rotate(${topNudge.rot}deg)`;        topCard.style.cursor     = 'grab';

        for (let offset = 1; offset < VISIBLE_CARDS; offset++) {
            const imgIdx = currentIndex + offset;
            if (imgIdx >= IMAGES.length) break;
            positionCard(allCards[imgIdx], offset, true);
        }
        // Hide the peek card again
        const peekIdx = currentIndex + VISIBLE_CARDS;
        if (peekIdx < IMAGES.length) {
            allCards[peekIdx].style.transition = TRANS;
            allCards[peekIdx].style.opacity    = '0';
            allCards[peekIdx].style.zIndex     = '1';
            allCards[peekIdx].style.pointerEvents = 'none';
        }
    }
}

function flyCard(flyX, flyY) {
    if (!topCard) return;
    animating = true;

    const rot    = flyX * 0.15;
    const FLY_MS = 420;
    topCard.style.transition = `transform ${FLY_MS}ms cubic-bezier(0.25,0.46,0.45,0.94), opacity ${FLY_MS * 0.8}ms ease`;
    topCard.style.transform  = `translateX(${flyX}px) translateY(${flyY}px) rotate(${rot}deg)`;
    topCard.style.opacity    = '0';

    // Slide background cards up immediately, in sync with the fly
    const SLIDE_TRANS = `transform ${FLY_MS}ms cubic-bezier(0.25,0.46,0.45,0.94), opacity ${FLY_MS}ms ease, box-shadow ${FLY_MS}ms ease`;
    for (let offset = 1; offset < VISIBLE_CARDS; offset++) {
        const imgIdx = currentIndex + offset;
        if (imgIdx >= IMAGES.length) break;
        const card = allCards[imgIdx];
        card.style.transition = SLIDE_TRANS;
        const scale  = 1 - (offset - 1) * 0.045;
        const yOff   = (offset - 1) * 12;
        const zIdx   = String(IMAGES.length + VISIBLE_CARDS - (offset - 1));
        const nudge = cardNudges[parseInt(card.dataset.imgIdx)] || { x: 0, rot: 0 };
        card.style.transform  = `translateX(${nudge.x}px) translateY(${yOff}px) rotate(${nudge.rot}deg) scale(${scale})`;    
        card.style.zIndex     = zIdx;        
        card.style.opacity    = '1';
        card.style.boxShadow  = (offset - 1) === 0
            ? '0 12px 40px rgba(0,0,0,0.45)'
            : `0 ${4 + (offset-1)*2}px ${12 + (offset-1)*6}px rgba(0,0,0,0.25)`;
    }

    // Slide in the next hidden card at the back of the stack
    const nextHiddenIdx = currentIndex + VISIBLE_CARDS;
    if (nextHiddenIdx < IMAGES.length) {
        const nextCard  = allCards[nextHiddenIdx];
        const backScale = 1 - (VISIBLE_CARDS - 1) * 0.045;
        const backY     = (VISIBLE_CARDS - 1) * 12;
        const nextNudge = cardNudges[parseInt(nextCard.dataset.imgIdx)] || { x: 0, rot: 0 };
        nextCard.style.transition = SLIDE_TRANS;
        nextCard.style.transform  = `translateX(${nextNudge.x}px) translateY(${backY}px) rotate(${nextNudge.rot}deg) scale(${backScale})`;
        // z-index: matches what positionCard would assign for stackPos = VISIBLE_CARDS-1 after index++
        nextCard.style.zIndex     = String(IMAGES.length + VISIBLE_CARDS - (VISIBLE_CARDS - 1));
        nextCard.style.opacity    = '1';
        nextCard.style.pointerEvents = 'none';
    }

    const isLastCard = (currentIndex === IMAGES.length - 1);

    setTimeout(() => {
        // Sink the swiped card fully out of sight
        topCard.style.transition    = 'none';
        topCard.style.zIndex        = '0';
        topCard.style.opacity       = '0';
        topCard.style.pointerEvents = 'none';

        if (isLastCard) {
            hasReachedEnd = true;
            showFinalMessage();
        } else {
            currentIndex++;
            // Sync everyone's z-index cleanly for the new order
            refreshStack(false);
            attachDragListeners(allCards[currentIndex]);
        }

        topCard   = null;
        animating = false;
    }, FLY_MS + 20);
}

// -------------------------------------------------------
// Final ILY card
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
            div::-webkit-scrollbar       { width: 6px; }
            div::-webkit-scrollbar-track { background: rgba(255,255,255,0.07); border-radius: 10px; }
            div::-webkit-scrollbar-thumb { background: rgba(255,105,180,0.45); border-radius: 10px; }
            div::-webkit-scrollbar-thumb:hover { background: rgba(255,105,180,0.75); }
        `;
        document.head.appendChild(style);
    }

    // ── Card shell — fades in immediately ──────────────────────────────
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
        padding: 36px 38px;
        overflow-y: auto;
        overflow-x: hidden;
        scroll-behavior: smooth;
    `;

    // Container for typed lines — each line is a <div>
    const FONT_FAMILY = "'Cormorant Garamond', 'Georgia', serif";
    const FONT_SIZE_PX = 26; // px — used for Canvas measurement too
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
        line-height: 2;
        text-align: left;
        font-family: ${FONT_FAMILY};
        min-height: 100%;
    `;

    // Blinking cursor element
    const cursor = document.createElement('span');
    cursor.className = 'type-cursor';

    textWrapper.appendChild(linesContainer);
    messageContainer.appendChild(textWrapper);
    cardStack.appendChild(messageContainer);

    // ── User-scroll detection ───────────────────────────────────────────
    let isUserScrolling = false;
    let scrollTimeout;
    const onUserScroll = () => {
        isUserScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => { isUserScrolling = false; }, 1500);
    };
    textWrapper.addEventListener('wheel',     onUserScroll, { passive: true });
    textWrapper.addEventListener('touchmove', onUserScroll, { passive: true });

    // ── Pre-measure with Canvas (pixel-perfect, no DOM reflow needed) ───
    // Wait for font to load (or up to 1.5 s), then measure.
        const PADDING_H = 76; // 38px padding on each side
        const SAFETY    = 16; // small safety buffer

    function buildLines(fontReady) {
        // Canvas measureText is the most reliable cross-browser measurement.
        const canvas = document.createElement('canvas');
        const ctx2d  = canvas.getContext('2d');
        // Use italic weight 400 to match linesContainer style
        ctx2d.font = `italic 400 ${FONT_SIZE_PX}px ${fontReady ? "'Cormorant Garamond'" : 'Georgia'}, serif`;

        // Available width = card width minus horizontal padding minus safety margin
        const cardWidth = cardStack.clientWidth || 320;
        const maxW = cardWidth - PADDING_H - SAFETY;

        const words = FINAL_MESSAGE.split(' ');
        const lines = [];
        let cur = '';

        for (let i = 0; i < words.length; i++) {
            const test = cur ? cur + ' ' + words[i] : words[i];
            // Add letter-spacing contribution (approximate: spacing × char count)
            const measured = ctx2d.measureText(test).width + (test.length * LETTER_SPACING);
            if (measured > maxW && cur !== '') {
                lines.push(cur);
                cur = words[i];
            } else {
                cur = test;
            }
        }
        if (cur) lines.push(cur);
        return lines;
    }

    // Attempt to wait for Google Font, fall back after timeout
    const startTyping = (lines) => {
        setTimeout(() => {
            typeLines(lines, linesContainer, cursor, textWrapper, () => isUserScrolling);
        }, 900); // card settles, then typing begins
    };

    if (document.fonts && document.fonts.load) {
        document.fonts.load(`italic 400 ${FONT_SIZE_PX}px 'Cormorant Garamond'`)
            .then(() => startTyping(buildLines(true)))
            .catch(()  => startTyping(buildLines(false)));
        // Hard timeout fallback in case fonts.load hangs
        setTimeout(() => {}, 1500);
    } else {
        // No fonts API — wait a beat then measure with Georgia as fallback
        setTimeout(() => startTyping(buildLines(false)), 300);
    }
}

// Typed line-by-line — no mid-word reflow ever happens
function typeLines(lines, container, cursor, wrapper, getIsScrolling) {
    let lineIdx      = 0;
    let charIdx      = 0;
    let currentLineEl = null;

    // Typing speed: base ms per character, with slight random variance for feel
    const BASE_MS = 40;

  function nextTick() {
        // All lines done
        if (lineIdx >= lines.length) {
            if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
            return;
        }

        // Start a new line div — reserve its height immediately so no layout jump
        if (charIdx === 0) {
            currentLineEl = document.createElement('div');
            currentLineEl.style.cssText = 'min-height: 2em; display: block;';
            container.appendChild(currentLineEl);
            currentLineEl.appendChild(cursor);
        }

        const line = lines[lineIdx];

        if (charIdx < line.length) {
            // Insert character text node before cursor
            const ch = line[charIdx];
            if (/\p{Emoji}/u.test(ch)) {
                const emojiSpan = document.createElement('span');
                emojiSpan.style.cssText = '-webkit-text-fill-color: initial; font-style: normal;';
                emojiSpan.textContent = ch;
                currentLineEl.insertBefore(emojiSpan, cursor);
            } else {
                currentLineEl.insertBefore(document.createTextNode(ch), cursor);
            }
            charIdx++;

            if (!getIsScrolling()) {
                wrapper.scrollTop = wrapper.scrollHeight;
            }

            // Slight pause after punctuation for a natural, romantic cadence
            const delay = /[,.]/.test(ch) ? BASE_MS * 6
                        : /[!?]/.test(ch)  ? BASE_MS * 4
                        : BASE_MS + (Math.random() * 28 - 10); // gentle variance
            setTimeout(nextTick, delay);
        } else {
            // Line finished — brief breath before next line
            lineIdx++;
            charIdx = 0;
            setTimeout(nextTick, BASE_MS * 3);
        }
    }

    nextTick();
}
    

    
// ---- Open / Close ----
function openSlider() {
    // Reset everything
    currentIndex  = 0;
    hasReachedEnd = false;
    animating     = false;
    isDragging    = false;

    // Re-init cards fresh
    initializeAllCards();

    sliderOverlay.classList.add('active');

    clearTimeout(hintTimer);
    sliderHint.classList.remove('fade');
    hintTimer = setTimeout(() => sliderHint.classList.add('fade'), 3000);
}

function closeSlider() {
    sliderOverlay.classList.remove('active');
}

openBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openSlider();
});

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
// CLEANUP
// =====================================================

window.addEventListener('beforeunload', () => {
    if (blowDetectionInterval) clearInterval(blowDetectionInterval);
    if (microphoneStream) microphoneStream.getTracks().forEach(track => track.stop());
    if (audioContext)     audioContext.close();
});

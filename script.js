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
        // Hide cards that won't be visible in the initial stack
        if (i > VISIBLE_CARDS - 1) {
            card.style.opacity   = '0';
            card.style.transform = `translateY(${(VISIBLE_CARDS - 1) * 12}px) scale(${1 - (VISIBLE_CARDS - 1) * 0.045})`;
            card.style.zIndex    = '0';
        }
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
}

function positionCard(card, stackPos, animate) {
    const scale = 1 - stackPos * 0.045;
    const yOff  = stackPos * 12;
    const TRANS = 'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.42s ease, box-shadow 0.42s ease';

    card.style.transition = animate ? TRANS : 'none';
    card.style.transform  = `translateY(${yOff}px) scale(${scale})`;
    card.style.zIndex     = String(IMAGES.length + VISIBLE_CARDS - stackPos);
    card.style.opacity    = '1';
    card.style.boxShadow  = stackPos === 0
        ? '0 12px 40px rgba(0,0,0,0.45)'
        : `0 ${4 + stackPos * 2}px ${12 + stackPos * 6}px rgba(0,0,0,0.25)`;
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
        card.style.transform  = `translateY(${yOff}px) scale(${scale})`;
    }

    // Also peek in the next card that's currently hidden
    const peekIdx = currentIndex + VISIBLE_CARDS;
    if (peekIdx < IMAGES.length) {
        const peekCard  = allCards[peekIdx];
        const lastScale = 1 - (VISIBLE_CARDS - 1) * 0.045;
        const lastY     = (VISIBLE_CARDS - 1) * 12;
        peekCard.style.transition = 'none';
        peekCard.style.transform  = `translateY(${lastY}px) scale(${lastScale})`;
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
        topCard.style.transform  = 'translateX(0) translateY(0) rotate(0deg)';
        topCard.style.cursor     = 'grab';

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
        card.style.transform  = `translateY(${yOff}px) scale(${scale})`;
        card.style.zIndex     = zIdx;
        card.style.opacity    = '1';
        card.style.boxShadow  = (offset - 1) === 0
            ? '0 12px 40px rgba(0,0,0,0.45)'
            : `0 ${4 + (offset-1)*2}px ${12 + (offset-1)*6}px rgba(0,0,0,0.25)`;
    }

    // Slide in the next hidden card at the back of the stack
    const nextHiddenIdx = currentIndex + VISIBLE_CARDS;
    if (nextHiddenIdx < IMAGES.length) {
        const nextCard = allCards[nextHiddenIdx];
        const backScale = 1 - (VISIBLE_CARDS - 1) * 0.045;
        const backY     = (VISIBLE_CARDS - 1) * 12;
        nextCard.style.transition = SLIDE_TRANS;
        nextCard.style.transform  = `translateY(${backY}px) scale(${backScale})`;
        nextCard.style.zIndex     = String(IMAGES.length);
        nextCard.style.opacity    = '1';
    }

    const isLastCard = (currentIndex === IMAGES.length - 1);

    setTimeout(() => {
        // Sink the swiped card fully out of sight
        topCard.style.transition = 'none';
        topCard.style.zIndex     = '0';

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
    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        position: absolute;
        inset: 0;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 12px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2);
        animation: fadeInMessage 0.6s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
    `;
    
    const textWrapper = document.createElement('div');
    textWrapper.style.cssText = `
        width: 100%;
        height: 100%;
        padding: 40px;
        overflow-y: auto;
        overflow-x: hidden;
        scroll-behavior: smooth;
    `;
    
    const textElement = document.createElement('div');
    textElement.style.cssText = `
        font-size: 1.2rem;
        font-weight: 500;
        background: linear-gradient(135deg, #FF1493 0%, #FF69B4 50%, #FFB6C1 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 0.5px;
        line-height: 1.8;
        white-space: normal;
        word-wrap: break-word;
        text-align: left;
        font-family: 'Georgia', serif;
        min-height: 100%;
    `;
    
    textWrapper.appendChild(textElement);
    messageContainer.appendChild(textWrapper);
    cardStack.appendChild(messageContainer);
    
    // Add animation keyframes
    if (!document.getElementById('slider-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'slider-animation-styles';
        style.textContent = `
            @keyframes fadeInMessage {
                0% {
                    opacity: 0;
                    transform: scale(0.95);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            /* Smooth scrollbar */
            div::-webkit-scrollbar {
                width: 8px;
            }
            
            div::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
            }
            
            div::-webkit-scrollbar-thumb {
                background: rgba(255, 105, 180, 0.5);
                border-radius: 10px;
            }
            
            div::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 105, 180, 0.8);
            }
        `;
        document.head.appendChild(style);
    }
    
    let isUserScrolling = false;
    let scrollTimeout;
    
    // Detect user scrolling
    textWrapper.addEventListener('wheel', () => {
        isUserScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isUserScrolling = false;
        }, 1500);
    }, { passive: true });
    
    textWrapper.addEventListener('touchmove', () => {
        isUserScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isUserScrolling = false;
        }, 1500);
    }, { passive: true });
    
    // Start typewriter animation after 1 second delay
    setTimeout(() => {
        typewriterAnimationWordByWord(textElement, textWrapper);
    }, 1000);
}

function typewriterAnimationWordByWord(textElement, textWrapper) {
    // Split message into words
    const words = FINAL_MESSAGE.split(' ');
    let wordIndex = 0;
    let currentText = '';
    let lastScrollHeight = 0;
    
    const typeInterval = setInterval(() => {
        if (wordIndex < words.length) {
            const word = words[wordIndex];
            const testText = currentText + (currentText ? ' ' : '') + word;
            
            // Set test text to check height
            textElement.textContent = testText;
            const newHeight = textElement.scrollHeight;
            
            // If height increased (wrapped to new line), auto-scroll if not user scrolling
            if (newHeight > lastScrollHeight && !isUserScrolling) {
                textWrapper.scrollTop = textWrapper.scrollHeight;
                lastScrollHeight = newHeight;
            }
            
            // Add word to current text
            currentText = testText;
            wordIndex++;
        } else {
            clearInterval(typeInterval);
        }
    }, 150); // 150ms per word
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

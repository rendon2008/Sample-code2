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
    requestMicrophoneAccess();
    setupRelightButton();
});


// =====================================================
// MICROPHONE PERMISSION
// =====================================================

async function requestMicrophoneAccess() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showError('Microphone access not supported in this browser');
            return;
        }

        microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

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
        console.error('Microphone access denied:', error);
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

        const messageBtn = document.getElementById('message-btn');
        messageBtn.classList.remove('hidden');
        messageBtn.classList.add('visible');
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

    const messageBtn = document.getElementById('message-btn');
    messageBtn.classList.remove('visible');
    messageBtn.classList.add('hidden');

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

(function () {

    // ---- Config: add/remove image filenames freely ----
    const IMAGES = [
        'image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg',
        'image5.jpg', 'image6.jpg', 'image7.jpg', 'image8.jpg'
    ];

    const FALLBACK_EMOJI  = ['💖','🌸','✨','🎀','💝','🎉','🥰','🌺'];
    const VISIBLE_CARDS   = 4;

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

    // ---- Build visual stack ----
    function buildStack() {
        cardStack.innerHTML = '';
        for (let i = VISIBLE_CARDS - 1; i >= 0; i--) {
            const imgIdx = (currentIndex + i) % IMAGES.length;
            const card   = createCard(imgIdx, i);
            cardStack.appendChild(card);
            positionCard(card, i, false);
        }
    }

    function createCard(imgIdx, stackPos) {
        const card       = document.createElement('div');
        card.className   = 'photo-card';
        card.dataset.stackPos = stackPos;
        card.dataset.imgIdx   = imgIdx;

        const img    = document.createElement('img');
        img.src      = IMAGES[imgIdx];
        img.alt      = '';
        img.draggable = false;
        img.onerror  = function () {
            card.classList.add('placeholder');
            card.innerHTML = FALLBACK_EMOJI[imgIdx % FALLBACK_EMOJI.length];
        };
        card.appendChild(img);

        // Add swipe indicators only to the top card
        if (stackPos === 0) {
            ['left','right','up','down'].forEach(dir => {
                const ind       = document.createElement('div');
                ind.className   = `swipe-indicator ${dir}`;
                ind.textContent = dir === 'left' ? 'NOPE' : dir === 'right' ? 'LOVE' : dir === 'up' ? 'WOW' : 'CUTE';
                card.appendChild(ind);
            });
            attachDragListeners(card);
        }

        return card;
    }

    function positionCard(card, stackPos, animate) {
        const scale = 1 - stackPos * 0.045;
        const yOff  = stackPos * 12;

        card.style.transition = animate
            ? 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.35s ease'
            : 'none';
        card.style.transform  = `translateY(${yOff}px) scale(${scale})`;
        card.style.zIndex     = VISIBLE_CARDS - stackPos;
        card.style.boxShadow  = stackPos === 0
            ? '0 12px 40px rgba(0,0,0,0.45)'
            : `0 ${4 + stackPos * 2}px ${12 + stackPos * 6}px rgba(0,0,0,0.25)`;
    }

    // ---- Drag listeners ----
    function attachDragListeners(card) {
        card.addEventListener('mousedown',  onDragStart, { passive: true });
        card.addEventListener('touchstart', onDragStart, { passive: true });
    }

    function onDragStart(e) {
        if (animating) return;
        isDragging = true;
        topCard    = e.currentTarget;

        const pt = e.touches ? e.touches[0] : e;
        startX   = pt.clientX;
        startY   = pt.clientY;
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
        const rot = currentX * 0.12;

        topCard.style.transform = `translateX(${currentX}px) translateY(${currentY}px) rotate(${rot}deg)`;
        showIndicator(currentX, currentY);
    }

    function showIndicator(dx, dy) {
        if (!topCard) return;
        const inds      = topCard.querySelectorAll('.swipe-indicator');
        const ABS_X     = Math.abs(dx);
        const ABS_Y     = Math.abs(dy);
        const threshold = 30;

        inds.forEach(ind => ind.style.opacity = '0');

        if (ABS_X > threshold || ABS_Y > threshold) {
            if (ABS_X >= ABS_Y) {
                const ind = topCard.querySelector(dx > 0 ? '.swipe-indicator.right' : '.swipe-indicator.left');
                if (ind) ind.style.opacity = Math.min(1, (ABS_X - threshold) / 60).toString();
            } else {
                const ind = topCard.querySelector(dy > 0 ? '.swipe-indicator.down' : '.swipe-indicator.up');
                if (ind) ind.style.opacity = Math.min(1, (ABS_Y - threshold) / 60).toString();
            }
        }
    }

    function onDragEnd() {
        document.removeEventListener('mousemove',  onDragMove);
        document.removeEventListener('touchmove',  onDragMove);
        document.removeEventListener('mouseup',    onDragEnd);
        document.removeEventListener('touchend',   onDragEnd);

        if (!isDragging || !topCard) { isDragging = false; return; }
        isDragging = false;

        const ABS_X          = Math.abs(currentX);
        const ABS_Y          = Math.abs(currentY);
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
            // Snap back
            topCard.style.transition = 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)';
            topCard.style.transform  = 'translateX(0) translateY(0) rotate(0deg)';
            topCard.querySelectorAll('.swipe-indicator').forEach(i => i.style.opacity = '0');
            topCard.style.cursor = 'grab';
        }
    }

    function flyCard(flyX, flyY) {
        if (!topCard) return;
        animating = true;

        const rot = flyX * 0.15;
        topCard.style.transition = 'transform 0.52s cubic-bezier(0.4,0,1,1), opacity 0.52s ease';
        topCard.style.transform  = `translateX(${flyX}px) translateY(${flyY}px) rotate(${rot}deg)`;
        topCard.style.opacity    = '0';
        topCard.querySelectorAll('.swipe-indicator').forEach(i => i.style.opacity = '0');

        shiftCardsForward();

        setTimeout(() => {
            currentIndex = (currentIndex + 1) % IMAGES.length;
            topCard      = null;
            buildStack();
            animating    = false;
        }, 520);
    }

    function shiftCardsForward() {
        const cards = [...cardStack.querySelectorAll('.photo-card')];
        cards.forEach(card => {
            const pos = parseInt(card.dataset.stackPos);
            if (pos > 0) positionCard(card, pos - 1, true);
        });
    }

    // ---- Open / Close ----
    function openSlider() {
        currentIndex = 0;
        buildStack();
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
        // Close the envelope first, then open slider
        const envOverlayEl = document.getElementById('envOverlay');
        envOverlayEl.classList.remove('show');
        setTimeout(openSlider, 350);
    });

    sliderClose.addEventListener('click', closeSlider);

    sliderOverlay.addEventListener('click', (e) => {
        if (e.target === sliderOverlay) closeSlider();
    });

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

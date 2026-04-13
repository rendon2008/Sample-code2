const scene = document.getElementById("scene");
const message = document.getElementById("message");
const relightBtn = document.getElementById("relightBtn");

let audioContext;
let analyser;
let dataArray;
let micStream;

let flames = [];
let blown = false;

/* ---------------- MIC SETUP ---------------- */
async function initMic() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(micStream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;

    source.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    startScene();
    detectBlow();

  } catch (err) {
    console.log("Mic denied, retrying...");
    setTimeout(initMic, 1500);
  }
}

/* ---------------- START SCENE ---------------- */
function startScene() {
  scene.classList.remove("hidden");
  createFlames();
}

/* ---------------- FLAMES ---------------- */
function createFlames() {
  document.querySelectorAll(".candle").forEach(candle => {
    const flame = document.createElement("div");
    flame.classList.add("flame");
    candle.appendChild(flame);
    flames.push(flame);
  });
}

/* ---------------- BLOW DETECTION ---------------- */
function detectBlow() {
  function loop() {
    analyser.getByteFrequencyData(dataArray);

    let volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

    if (volume > 45 && !blown) {
      blowOutCandles();
    }

    requestAnimationFrame(loop);
  }
  loop();
}

/* ---------------- BLOW OUT ---------------- */
function blowOutCandles() {
  blown = true;

  flames.forEach((flame, i) => {
    setTimeout(() => {
      flame.style.transition = "0.5s";
      flame.style.opacity = "0";
      flame.style.transform = "scale(0)";
    }, i * 100);
  });

  message.textContent = "HAPPIEST 17TH BIRTHDAY BABYY RIRI\nI LOVE U 3000";

  launchConfetti();
  launchBalloons();
}

/* ---------------- RELIGHT ---------------- */
relightBtn.onclick = () => {
  blown = false;
  flames.forEach(f => {
    f.style.opacity = "1";
    f.style.transform = "scale(1)";
  });

  message.textContent = "BLOW THE CANDLES!!";
};

/* ---------------- CONFETTI ---------------- */
const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

function launchConfetti() {
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: 0,
      r: Math.random() * 6 + 2,
      d: Math.random() * 5 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`
    });
  }
  animateConfetti();
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();

    p.y += p.d;
  });

  requestAnimationFrame(animateConfetti);
}

/* ---------------- BALLOONS ---------------- */
function launchBalloons() {
  for (let i = 0; i < 10; i++) {
    const b = document.createElement("div");
    b.className = "balloon";
    b.style.left = Math.random() * 100 + "vw";
    document.body.appendChild(b);

    setTimeout(() => b.remove(), 5000);
  }
}

/* ---------------- INIT ---------------- */
initMic();
const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
reveals.forEach((el) => observer.observe(el));

const musicBtn = document.getElementById("music-btn");
const musicIcon = document.getElementById("music-icon");
const musicLabel = document.getElementById("music-label");
const bgMusic = document.getElementById("bg-music");

let ambient = null;
let usingFile = false;
let playing = false;

const NOTES = [261.63, 329.63, 392.0, 493.88, 392.0, 329.63];

function startAmbient() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain();
  master.gain.value = 0.12;
  master.connect(ctx.destination);

  let step = 0;
  let timer = null;

  function playNote() {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = NOTES[step % NOTES.length];
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.8);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 2.9);
    step += 1;
  }

  playNote();
  timer = setInterval(playNote, 2400);

  return {
    ctx,
    stop() {
      clearInterval(timer);
      master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      setTimeout(() => ctx.close(), 500);
    },
  };
}

function setUi(isPlaying) {
  playing = isPlaying;
  musicBtn.classList.toggle("is-playing", isPlaying);
  musicIcon.textContent = isPlaying ? "♫" : "♪";
  musicLabel.textContent = isPlaying ? "暂停" : "音乐";
}

async function playMusic() {
  if (bgMusic) {
    try {
      bgMusic.volume = 0.35;
      await bgMusic.play();
      usingFile = true;
      setUi(true);
      return;
    } catch {
      usingFile = false;
    }
  }
  if (!ambient) ambient = startAmbient();
  if (ambient.ctx.state === "suspended") await ambient.ctx.resume();
  setUi(true);
}

function pauseMusic() {
  if (usingFile && bgMusic) {
    bgMusic.pause();
  }
  if (ambient) {
    ambient.stop();
    ambient = null;
  }
  usingFile = false;
  setUi(false);
}

musicBtn.addEventListener("click", async () => {
  if (playing) {
    pauseMusic();
    return;
  }
  await playMusic();
});

if (bgMusic) {
  bgMusic.addEventListener("error", () => {
    usingFile = false;
  });
  bgMusic.addEventListener("ended", () => setUi(false));
}

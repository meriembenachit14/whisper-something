/* -------------------
   DARK / LIGHT MODE
---------------------*/
const modeBtn = document.getElementById("modeToggle");
if (modeBtn) {
  modeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    modeBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });
}

/* -------------------
   BACKGROUND MUSIC
---------------------*/
const musicBtn = document.getElementById("musicToggle");
const bgm = document.getElementById("bgm");

if (musicBtn && bgm) {
  musicBtn.addEventListener("click", () => {
    if (bgm.paused) {
      bgm.play();
      musicBtn.textContent = "🔇";
    } else {
      bgm.pause();
      musicBtn.textContent = "🎵";
    }
  });
}

/* -------------------
   TYPING SOUND
---------------------*/
const typeSound = document.getElementById("typeSound");
const messageField = document.getElementById("message");

if (messageField && typeSound) {
  messageField.addEventListener("input", () => {
    typeSound.currentTime = 0;
    typeSound.play();
  });
}

/* -------------------
   SEND SOUND
---------------------*/
const sendSound = document.getElementById("sendSound");
const form = document.getElementById("whisperForm");

if (form && sendSound) {
  form.addEventListener("submit", () => {
    sendSound.currentTime = 0;
    sendSound.play();
  });
}

/* -------------------
   FLOATING HEARTS
   (Adjust heart spawn speed below)
---------------------*/
const heartsContainer = document.getElementById("hearts-container");

// SPAWN SPEED: smaller = faster
const heartSpawnRate = 800; // ms

function createHeart() {
  if (!heartsContainer) return;

  const img = document.createElement("img");
  img.src = "assets/heart.png";
  img.classList.add("heart");

  img.style.left = Math.random() * 100 + "%";
  img.style.animationDuration = 4 + Math.random() * 4 + "s";

  heartsContainer.appendChild(img);

  setTimeout(() => img.remove(), 7000);
}

setInterval(createHeart, heartSpawnRate);

/* -------------------
   ADMIN PANEL LOGIN
---------------------*/
function adminLogin() {
  const pass = document.getElementById("adminPass").value;
  if (pass === "bunbun") {
    document.getElementById("loginCard").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
  } else {
    alert("Wrong password!");
  }
}

function logoutAdmin() {
  location.reload();
}


// Timer
  let elapsed = 0;
  let interval = null;
  const display = document.getElementById('chrono-display');
  const toggleBtn = document.getElementById('chrono-toggle');

  function updateChrono() {
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    display.textContent = `${m}:${s}`;
  }

  function startChrono() {
    interval = setInterval(() => {
      elapsed++;
      updateChrono();
    }, 1000);
    toggleBtn.textContent = '❚❚ Pause';
  }

  function pauseChrono() {
    clearInterval(interval);
    interval = null;
    toggleBtn.textContent = '▶ Démarrer';
  }

  toggleBtn.onclick = () => {
    if (interval) {
      pauseChrono();
    } else {
      startChrono();
    }
  };

  document.getElementById('chrono-reset').onclick = () => {
    pauseChrono();
    elapsed = 0;
    updateChrono();
  };

  // Drag functionality
  const chrono = document.getElementById('chrono-container');
  let offsetX = 0, offsetY = 0;

  chrono.addEventListener('mousedown', (e) => {
    e.preventDefault();
    offsetX = e.clientX - chrono.offsetLeft;
    offsetY = e.clientY - chrono.offsetTop;

    function move(e) {
    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;

    newX = Math.max(0, Math.min(window.innerWidth - chrono.offsetWidth, newX));
    newY = Math.max(0, Math.min(window.innerHeight - chrono.offsetHeight, newY));

    chrono.style.left = newX + 'px';
    chrono.style.top = newY + 'px';
  }

    function stop() {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', stop);
  }

  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', stop);
  });
//--

// main
const questData = [
  { name: "Pompes", base: 10, description: "Position de planche, descendre poitrine proche du sol, puis remonter.", difficulty: "Facile" },
  { name: "Abdos", base: 20, description: "Allongé sur le dos, soulevez le buste vers les genoux.", difficulty: "Moyen" },
  { name: "Squats", base: 30, description: "Pieds écartés, fléchissez les jambes jusqu'à 90°.", difficulty: "Difficile" },
  { name: "Marche (m)", base: 500, description: "Marchez rapidement, idéal pour l’endurance.", difficulty: "Facile" },
  { name: "Planche (s)", base: 30, description: "Maintenez le corps droit sur les avant-bras et orteils.", difficulty: "Difficile" },
  { name: "Jumping Jacks", base: 20, description: "Sautez en écartant bras et jambes, puis retour.", difficulty: "Moyen" },
  { name: "Fentes", base: 15, description: "Avancez une jambe, descendez à 90°, puis revenez.", difficulty: "Facile" },
  { name: "Corde à sauter (s)", base: 30, description: "Sautez à la corde pendant le temps indiqué.", difficulty: "Moyen" }
];

let level = 0;
let xp = 0;
let xpNeeded = 100;
let cookiesAccepted = false;
let activeQuest = null;
let canStartQuest = true;

const startBtn = document.getElementById('start-btn');
const completeBtn = document.getElementById('complete-btn');
const abandonBtn = document.getElementById('abandon-btn');
const cookiePopup = document.getElementById('cookie-popup');

// --- Difficulté et couleurs ---
const difficultyColors = {
  "Facile": "#2ecc71",   // vert
  "Moyen": "#f1c40f",    // jaune
  "Difficile": "#e74c3c" // rouge
};

// Multiplicateur XP selon difficulté
function getDifficultyMultiplier(difficulty) {
  switch (difficulty) {
    case "Facile": return 1;
    case "Moyen": return 1.5;
    case "Difficile": return 2;
    default: return 1;
  }
}

// --- XP requis ---
function calculateXpNeeded(level) {
  return Math.floor(100 * Math.pow(1.1, level));
}

// Rangs avec seuils (tous les 50 niveaux)
const ranks = [
  { name: "No Grade", level: 0 },
  { name: "E", level: 50 },
  { name: "D", level: 100 },
  { name: "C", level: 150 },
  { name: "B", level: 200 },
  { name: "A", level: 250 },
  { name: "S", level: 300 },
];

function getGrade(level) {
  let grade = ranks[0].name;
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (level >= ranks[i].level) {
      grade = ranks[i].name;
      break;
    }
  }
  return grade;
}

function updateGradeColor(gradeName) {
  const gradeDisplay = document.getElementById('grade-display');
  gradeDisplay.className = "grade"; // reset
  gradeDisplay.classList.add(gradeName.replace(/\s/g, '')); // classe sans espace (ex: NoGrade)
}

function generateQuest() {
  let q;
  do {
    q = questData[Math.floor(Math.random() * questData.length)];
  } while (activeQuest && activeQuest.name === q.name);

  const quantity = Math.floor(q.base + (level * 0.1));
  return { ...q, quantity };
}

function updateUI() {
  const grade = getGrade(level);
  const gradeDisplay = document.getElementById('grade-display');
  const questDifficulty = document.getElementById('quest-difficulty');
const questDisplay = document.getElementById('quest-display');
const questDescription = document.getElementById('quest-desc');
  gradeDisplay.textContent = "Grade : " + grade;
  updateGradeColor(grade);

  document.getElementById('level-display').textContent = level;

  const percent = (xp / xpNeeded) * 100;
  document.getElementById('progress-fill').style.width = percent + "%";
  document.getElementById('xp-text').textContent = `XP : ${xp} / ${xpNeeded}`;

  if (activeQuest) {
    questDifficulty.style.display = 'block';
    questDifficulty.innerHTML = `Difficulté : <span style="color:${difficultyColors[activeQuest.difficulty]}">${activeQuest.difficulty}</span>`;

    questDisplay.innerHTML = `${activeQuest.name} : ${activeQuest.quantity} <br> XP: ${Math.floor(activeQuest.base * 10 * getDifficultyMultiplier(activeQuest.difficulty))}`;
    questDescription.innerText = activeQuest.description;
  } else {
  questDifficulty.style.display = 'none'; 
    questDisplay.innerText = 'Clique pour une nouvelle quête.';
    questDescription.innerText = '';
  }
}

// --- TimerQuest
function startCountdown(seconds) {
  canStartQuest = false;
  startBtn.disabled = true;

  let remaining = seconds;
  startBtn.textContent = `Veuillez patienter ${remaining} secondes.`;
  startBtn.style.backgroundColor = "#555"; // grisé

  const countdownInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      startBtn.textContent = `Veuillez patienter ${remaining} secondes...`;
    } else {
      clearInterval(countdownInterval);
      canStartQuest = true;
      startBtn.disabled = false;
      startBtn.textContent = "Démarrer la quête";
      startBtn.style.backgroundColor = "#7b32f2"; // couleur normale
      document.getElementById('quest-difficulty').textContent = "";
      if (!activeQuest) {
        document.getElementById('quest-display').textContent = "Clique pour une nouvelle quête !";
        document.getElementById('quest-desc').textContent = "";
      }
    }
  }, 1000);
}

// --- Gestion quêtes ---
function startQuest() {
  if (!canStartQuest) return; 

  activeQuest = generateQuest();

  startBtn.classList.add('hidden');
  completeBtn.classList.remove('hidden');
  abandonBtn.classList.remove('hidden');

  updateUI();
}

function completeQuest() {
  if (!activeQuest) return;

  const multiplier = getDifficultyMultiplier(activeQuest.difficulty);
  const gainedXp = Math.floor(activeQuest.base * 10 * multiplier);
  xp += gainedXp;

  while (xp >= xpNeeded) {
    xp -= xpNeeded;
    level++;
    xpNeeded = calculateXpNeeded(level);
  }

  updateUI();
  saveProgress();

  activeQuest = null;

  completeBtn.classList.add('hidden');
  abandonBtn.classList.add('hidden');
  startBtn.classList.remove('hidden');

  startCountdown(4);
}

function abandonQuest() {
  if (!activeQuest) return;

  showConfirmation(() => {
    activeQuest = null;

    completeBtn.classList.add('hidden');
    abandonBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');

    document.getElementById('quest-difficulty').textContent = "";
    document.getElementById('quest-desc').textContent = "";
    document.getElementById('quest-display').textContent = "Clique pour une nouvelle quête !";

    startCountdown(4);
  });
}

function showConfirmation(onConfirm) {
  if (!activeQuest) return;

  const overlay = document.getElementById('confirm-overlay');
  const yesBtn = document.getElementById('confirm-yes');
  const noBtn = document.getElementById('confirm-no');

  overlay.classList.remove('hidden');

  yesBtn.onclick = () => {
    overlay.classList.add('hidden');
    onConfirm();
  };

  noBtn.onclick = () => {
    overlay.classList.add('hidden');
  };
}

// --- Cookies ---
function saveProgress() {
  if (cookiesAccepted) {
    document.cookie = `level=${level}; path=/; max-age=31536000`;
    document.cookie = `xp=${xp}; path=/; max-age=31536000`;
    document.cookie = `xpNeeded=${xpNeeded}; path=/; max-age=31536000`;
  }
}

function loadProgress() {
  const cookies = document.cookie.split('; ');
  for (let c of cookies) {
    const [key, value] = c.split('=');
    if (key === 'level') level = parseInt(value);
    else if (key === 'xp') xp = parseInt(value);
    else if (key === 'xpNeeded') xpNeeded = parseInt(value);
    else if (key === 'cookiesAccepted') cookiesAccepted = (value === 'true');
  }
  if (isNaN(level)) level = 0;
  if (isNaN(xp)) xp = 0;
  if (isNaN(xpNeeded)) xpNeeded = calculateXpNeeded(level);
}

function getDifficulty(description) {
  const match = description.match(/\b(\d+)\b/);
  if (!match) return "Inconnue";

  const count = parseInt(match[1]);
  if (count <= 15) return "Facile";
  if (count <= 30) return "Moyen";
  return "Difficile";
}

function getDifficultyColor(level) {
  switch (level) {
    case "Facile": return "#6FCF97"; // Vert
    case "Moyen": return "#FFD93D"; // Jaune
    case "Difficile": return "#EB5757"; // Rouge
    default: return "#aaa";
  }
}

function getCookie(name) {
  const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? v[2] : null;
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days*24*60*60*1000));
  document.cookie = `${name}=${value};path=/;expires=${d.toUTCString()};SameSite=Lax`;
}

function acceptCookies() {
  cookiesAccepted = true;
  setCookie("cookiesAccepted", "true", 365);
  cookiePopup.style.display = "none";
  saveProgress();
}

function refuseCookies() {
  cookiesAccepted = false;
  cookiePopup.style.display = 'none';
  setCookie("cookiesAccepted", "false", 365);
}

// --- Initialisation ---
window.onload = function () {
  loadProgress();

  if (cookiesAccepted) {
    cookiePopup.style.display = 'none';
  } else {
    cookiePopup.style.display = 'block';
  }

  updateUI();
};
const grid = document.getElementById("data-grid");
const mainProgressText = document.getElementById("main-progress");

// ======================
// ESTADO DO SISTEMA
// ======================
let violationCount = 0;
const MAX_VIOLATIONS = 5;
let systemBroken = false;
let protocolFollowed = false;

const totalNumbers = 1200;

let isSelecting = false;
let startX = 0;
let startY = 0;
let ticking = false;

// ======================
// PROGRESSO POR CATEGORIA
// ======================
const progressData = {
  WO: 0,
  FE: 0,
  DR: 0,
  MA: 0,
};

function updateVisualProgress(type) {
  const fill = document.getElementById(`fill-${type}`);
  const val = document.getElementById(`val-${type}`);
  const pct = Math.floor(progressData[type]);

  if (fill) fill.style.width = pct + "%";
  if (val) val.innerText = pct + "%";

  const media =
    (progressData.WO + progressData.FE + progressData.DR + progressData.MA) / 4;

  if (mainProgressText) {
    mainProgressText.innerText = Math.floor(media) + "% Complete";
  }
}

// ======================
// GERAÇÃO DOS NÚMEROS
// ======================
function generateNumbers() {
  if (!grid || systemBroken) return;
  grid.innerHTML = "";

  for (let i = 0; i < totalNumbers; i++) {
    const div = document.createElement("div");
    div.className = "number floating";
    div.innerText = Math.floor(Math.random() * 10);

    const duration = 3 + Math.random() * 4;
    const delay = Math.random() * -5;
    div.style.animationDuration = `${duration}s`;
    div.style.animationDelay = `${delay}s`;

    const f = Math.random();
    if (f > 0.98) div.classList.add("flicker-fast");
    else if (f > 0.9) div.classList.add("flicker-slow");

    div.addEventListener("click", () => {
      if (systemBroken) return;

      div.classList.toggle("selected");
      toggleInstruction();

      if (!protocolFollowed) {
        registerViolation();
      }
    });

    grid.appendChild(div);
  }
}

if (grid) generateNumbers();

// ======================
// LENTE (MOUSE MOVE)
// ======================
document.addEventListener("mousemove", (e) => {
  if (ticking || systemBroken) return;

  ticking = true;
  requestAnimationFrame(() => {
    const x = e.clientX;
    const y = e.clientY;

    document.querySelectorAll(".number").forEach((div) => {
      const r = div.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(x - cx, y - cy);

      if (d <= 60) {
        div.style.transform = "scale(2.6)";
        div.style.opacity = "1";
      } else if (d <= 120) {
        div.style.transform = "scale(1.5)";
        div.style.opacity = "0.7";
      } else {
        div.style.transform = "scale(1)";
        div.style.opacity = "0.5";
      }
    });

    ticking = false;
  });
});

// ======================
// CAIXA DE SELEÇÃO
// ======================
const box = document.createElement("div");
box.id = "selection-box";
document.body.appendChild(box);

window.addEventListener("mousedown", (e) => {
  if (systemBroken) return;
  if (!e.target.closest("#data-grid")) return;

  isSelecting = true;
  startX = e.pageX;
  startY = e.pageY;
  box.style.display = "block";
});

window.addEventListener("mousemove", (e) => {
  if (!isSelecting || systemBroken) return;

  const w = Math.abs(e.pageX - startX);
  const h = Math.abs(e.pageY - startY);

  box.style.left = Math.min(e.pageX, startX) + "px";
  box.style.top = Math.min(e.pageY, startY) + "px";
  box.style.width = w + "px";
  box.style.height = h + "px";

  const br = box.getBoundingClientRect();

  document.querySelectorAll(".number").forEach((n) => {
    const nr = n.getBoundingClientRect();
    const inside = !(
      nr.right < br.left ||
      nr.left > br.right ||
      nr.bottom < br.top ||
      nr.top > br.bottom
    );
    n.classList.toggle("selected", inside);
  });

  toggleInstruction();
});

// ======================
// MOUSE UP (NUNCA REFINA)
// ======================
window.addEventListener("mouseup", () => {
  if (!isSelecting || systemBroken) return;

  isSelecting = false;
  box.style.display = "none";

  if (!protocolFollowed) {
    registerViolation();
  }
});

// ======================
// ENTER = ÚNICO REFINAMENTO
// ======================
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || systemBroken) return;

  protocolFollowed = true;
  closeAlert();

  const selected = document.querySelectorAll(".number.selected");
  if (selected.length === 0) return;

  const types = ["WO", "FE", "DR", "MA"];
  const chosenType = types[Math.floor(Math.random() * types.length)];

  const binElement = document.querySelector(
    `.bin-item[data-type="${chosenType}"]`
  );

  if (binElement) {
    binElement.classList.add("bin-open");
    setTimeout(() => binElement.classList.remove("bin-open"), 600);
  }

  progressData[chosenType] += selected.length * 0.4;
  if (progressData[chosenType] > 100) progressData[chosenType] = 100;

  updateVisualProgress(chosenType);

  selected.forEach((n) => {
    n.style.transform = "scale(0) rotate(90deg)";
    n.style.opacity = "0";
    setTimeout(() => n.remove(), 500);
  });

  document.body.classList.add("shake-effect");
  setTimeout(() => document.body.classList.remove("shake-effect"), 300);
});

// ======================
// INSTRUÇÃO VISUAL
// ======================
function toggleInstruction() {
  const inst = document.getElementById("refine-instruction");
  if (!inst) return;

  const count = document.querySelectorAll(".number.selected").length;
  inst.classList.toggle("show-instruction", count > 0);
}

// ======================
// ALERTA
// ======================
function showAlert() {
  const overlay = document.getElementById("alert-overlay");
  if (!overlay) return;

  overlay.classList.remove("hidden");
  overlay.classList.add("alert-pulse");
  setTimeout(() => overlay.classList.remove("alert-pulse"), 300);
}

function closeAlert() {
  const overlay = document.getElementById("alert-overlay");
  if (overlay) overlay.classList.add("hidden");
}

// ======================
// VIOLAÇÕES
// ======================
function registerViolation() {
  if (systemBroken) return;

  violationCount++;

  showAlert();

  document.body.classList.add("shake-effect");
  setTimeout(() => document.body.classList.remove("shake-effect"), 300);

  if (violationCount >= 3) {
    document.body.classList.add("system-unstable");
  }

  if (violationCount >= MAX_VIOLATIONS) {
    triggerSystemCollapse();
  }
}

// ======================
// COLAPSO TOTAL
// ======================
function triggerSystemCollapse() {
  systemBroken = true;

  const overlay = document.getElementById("alert-overlay");
  if (overlay) {
    overlay.innerHTML = `
      <div class="collapse-message">
        <h1>PROTOCOL FAILURE</h1>
        <p>SYSTEM INTEGRITY LOST</p>
        <p>RELOAD REQUIRED</p>
      </div>
    `;
    overlay.classList.remove("hidden");
  }

  document.body.classList.add("system-collapse");

  document.querySelectorAll(".number").forEach((n) => {
    n.style.animation = "none";
    n.style.opacity = "0.1";
    n.style.filter = "blur(2px)";
  });
}

// ======================
// FULLSCREEN
// ======================
const fsBtn = document.getElementById("fullscreen-btn");

if (fsBtn) {
  fsBtn.addEventListener("click", () => {
    if (systemBroken) return;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", () => {
    fsBtn.innerText = document.fullscreenElement
      ? "[ EXIT FULLSCREEN ]"
      : "[ ENTER FULLSCREEN ]";
  });
}

const logContainer = document.getElementById("log-entries");

function addLog(message, type = "info") {
  if (!logContainer) return;

  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;

  logContainer.prepend(entry);

  // Limita histórico
  if (logContainer.children.length > 6) {
    logContainer.removeChild(logContainer.lastChild);
  }
}

addLog("VIOLATION DETECTED IN SECTOR 04", "violation");
addLog("DATA REFINED SUCCESSFULLY", "success");
addLog("CRITICAL SYSTEM INTEGRITY FAILURE", "violation");
addLog("ESTABLISHING SECURE CONNECTION...", "info");
addLog("USER IDENTITY VERIFIED: REFINER", "info");
addLog("WAITING FOR DATA COMMIT PROTOCOL", "info");

